/**
 * Dual-stream audio capture service.
 * Captures microphone ("you") and system audio ("them") as separate streams,
 * converting both to 16-bit PCM at 16kHz via AudioWorklet.
 */

export type AudioSource = 'mic' | 'system';

export interface PCMHandler {
  (source: AudioSource, pcmBuffer: ArrayBuffer): void;
}

interface StreamState {
  stream: MediaStream;
  audioContext: AudioContext;
  workletNode: AudioWorkletNode;
}

export class AudioCaptureService {
  private micState: StreamState | null = null;
  private systemState: StreamState | null = null;
  private onPCM: PCMHandler | null = null;

  setHandler(handler: PCMHandler) {
    this.onPCM = handler;
  }

  async startMic(deviceId?: string): Promise<void> {
    await this.stopMic();

    const constraints: MediaStreamConstraints = {
      audio: {
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.micState = await this.connectWorklet(stream, 'mic');
  }

  async startSystemAudio(): Promise<void> {
    await this.stopSystemAudio();

    // Use the electron-audio-loopback manual mode via preload bridge
    await window.callCoach.enableLoopbackAudio();

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Remove video tracks — we only need audio
      for (const track of stream.getVideoTracks()) {
        track.stop();
        stream.removeTrack(track);
      }

      this.systemState = await this.connectWorklet(stream, 'system');
    } finally {
      await window.callCoach.disableLoopbackAudio();
    }
  }

  async stopMic(): Promise<void> {
    if (this.micState) {
      this.teardown(this.micState);
      this.micState = null;
    }
  }

  async stopSystemAudio(): Promise<void> {
    if (this.systemState) {
      this.teardown(this.systemState);
      this.systemState = null;
    }
  }

  async stopAll(): Promise<void> {
    await this.stopMic();
    await this.stopSystemAudio();
  }

  get isMicActive(): boolean {
    return this.micState !== null;
  }

  get isSystemActive(): boolean {
    return this.systemState !== null;
  }

  private async connectWorklet(
    stream: MediaStream,
    source: AudioSource
  ): Promise<StreamState> {
    const audioContext = new AudioContext({ sampleRate: 48000 });
    await audioContext.audioWorklet.addModule('/pcm-worklet.js');

    const sourceNode = audioContext.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');

    workletNode.port.onmessage = (event: MessageEvent) => {
      if (event.data.pcm && this.onPCM) {
        this.onPCM(source, event.data.pcm);
      }
    };

    sourceNode.connect(workletNode);
    // Don't connect to destination — we don't want to play back the audio
    // workletNode needs to be connected to keep it alive
    workletNode.connect(audioContext.destination);

    return { stream, audioContext, workletNode };
  }

  private teardown(state: StreamState): void {
    state.workletNode.disconnect();
    for (const track of state.stream.getTracks()) {
      track.stop();
    }
    state.audioContext.close();
  }
}

// Singleton
export const audioCaptureService = new AudioCaptureService();
