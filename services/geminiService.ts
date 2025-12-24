
// Decoding helpers
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * 智能解码音频数据。
 * 首先尝试浏览器原生解码（针对 MP3、WAV 等），
 * 失败后回退到自定义原始 PCM 解码。
 */
export async function smartDecodeAudio(
  base64: string,
  ctx: AudioContext
): Promise<AudioBuffer> {
  const bytes = decode(base64);
  try {
    // 尝试对标准格式进行原生解码
    return await ctx.decodeAudioData(bytes.buffer.slice(0));
  } catch (e) {
    // 回退到 PCM 解码器 (假设为 24kHz 单声道)
    return await decodeAudioData(bytes, ctx, 24000, 1);
  }
}
