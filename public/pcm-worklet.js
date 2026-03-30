/**
 * AudioWorklet processor that converts Float32 audio to 16-bit PCM at 16kHz.
 * Runs in the audio rendering thread for low-latency processing.
 */
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufferSize = 0;
    // Accumulate samples for resampling — input is typically 48kHz, output 16kHz
    this._inputBuffer = new Float32Array(4800); // 100ms at 48kHz
    this._inputOffset = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0]; // mono or first channel

    // Accumulate into buffer
    for (let i = 0; i < channelData.length; i++) {
      this._inputBuffer[this._inputOffset++] = channelData[i];

      // When we have enough for a chunk, resample and send
      if (this._inputOffset >= this._inputBuffer.length) {
        this._flush();
      }
    }

    return true;
  }

  _flush() {
    const inputRate = sampleRate; // global in AudioWorklet scope
    const outputRate = 16000;
    const ratio = inputRate / outputRate;
    const outputLength = Math.floor(this._inputOffset / ratio);
    const pcm16 = new Int16Array(outputLength);

    // Simple linear interpolation downsampling
    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i * ratio;
      const srcFloor = Math.floor(srcIndex);
      const srcCeil = Math.min(srcFloor + 1, this._inputOffset - 1);
      const frac = srcIndex - srcFloor;

      const sample = this._inputBuffer[srcFloor] * (1 - frac) + this._inputBuffer[srcCeil] * frac;
      // Clamp and convert to 16-bit
      pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    }

    this.port.postMessage({ pcm: pcm16.buffer }, [pcm16.buffer]);
    this._inputOffset = 0;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
