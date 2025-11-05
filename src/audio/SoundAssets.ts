/**
 * 音频资源管理
 * 需求: 6.1, 6.2, 6.3, 6.4, 4.3, 9.6
 * 
 * 使用 Web Audio API 生成科幻风格的音效
 */

export class SoundAssets {
  /**
   * 生成切割水果音效
   * 需求: 6.1 - WHEN 切割动作成功切割水果对象时，THE 游戏系统 SHALL 播放切割音效
   */
  static generateSliceSound(audioContext: AudioContext): AudioBuffer {
    const sampleRate = audioContext.sampleRate;
    const duration = 0.15; // 150ms
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // 生成快速下降的"嗖"声
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 20); // 快速衰减
      const frequency = 800 - t * 600; // 频率从800Hz降到200Hz
      const value = Math.sin(2 * Math.PI * frequency * t) * envelope;
      data[i] = value * 0.3;
    }

    return buffer;
  }

  /**
   * 生成炸弹爆炸音效
   * 需求: 6.2 - WHEN 炸弹对象被切割时，THE 游戏系统 SHALL 播放爆炸音效
   */
  static generateExplosionSound(audioContext: AudioContext): AudioBuffer {
    const sampleRate = audioContext.sampleRate;
    const duration = 0.8; // 800ms
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // 生成低频爆炸声
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3); // 衰减
      
      // 混合多个频率创造爆炸效果
      const bass = Math.sin(2 * Math.PI * 60 * t) * 0.5;
      const mid = Math.sin(2 * Math.PI * 120 * t) * 0.3;
      const noise = (Math.random() * 2 - 1) * 0.2; // 白噪声
      
      const value = (bass + mid + noise) * envelope;
      data[i] = value * 0.5;
    }

    return buffer;
  }

  /**
   * 生成UI按钮悬停音效（科幻风格）
   * 需求: 9.6 - WHEN 玩家与UI元素交互时，THE 游戏系统 SHALL 播放科幻音效
   */
  static generateHoverSound(audioContext: AudioContext): AudioBuffer {
    const sampleRate = audioContext.sampleRate;
    const duration = 0.08; // 80ms
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // 生成短促的高频"哔"声
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 30);
      const frequency = 1200;
      const value = Math.sin(2 * Math.PI * frequency * t) * envelope;
      data[i] = value * 0.15;
    }

    return buffer;
  }

  /**
   * 生成UI按钮点击音效（科幻风格）
   * 需求: 9.6 - WHEN 玩家与UI元素交互时，THE 游戏系统 SHALL 播放科幻音效和视觉反馈动画
   */
  static generateClickSound(audioContext: AudioContext): AudioBuffer {
    const sampleRate = audioContext.sampleRate;
    const duration = 0.12; // 120ms
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // 生成双音调"哔哔"声
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 20);
      
      // 第一个音调
      const freq1 = 1000;
      const tone1 = Math.sin(2 * Math.PI * freq1 * t);
      
      // 第二个音调（稍高）
      const freq2 = 1400;
      const tone2 = Math.sin(2 * Math.PI * freq2 * (t - 0.04)) * (t > 0.04 ? 1 : 0);
      
      const value = (tone1 * 0.5 + tone2 * 0.5) * envelope;
      data[i] = value * 0.2;
    }

    return buffer;
  }

  /**
   * 生成游戏开始音效
   */
  static generateGameStartSound(audioContext: AudioContext): AudioBuffer {
    const sampleRate = audioContext.sampleRate;
    const duration = 0.5; // 500ms
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // 生成上升音调
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.min(1, t * 5) * Math.exp(-(t - 0.2) * 3);
      const frequency = 400 + t * 800; // 从400Hz升到1200Hz
      const value = Math.sin(2 * Math.PI * frequency * t) * envelope;
      data[i] = value * 0.25;
    }

    return buffer;
  }

  /**
   * 生成游戏结束音效
   */
  static generateGameOverSound(audioContext: AudioContext): AudioBuffer {
    const sampleRate = audioContext.sampleRate;
    const duration = 1.0; // 1000ms
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // 生成下降音调（悲伤效果）
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2);
      const frequency = 600 - t * 400; // 从600Hz降到200Hz
      const value = Math.sin(2 * Math.PI * frequency * t) * envelope;
      data[i] = value * 0.3;
    }

    return buffer;
  }

  /**
   * 生成错过水果音效
   */
  static generateMissSound(audioContext: AudioContext): AudioBuffer {
    const sampleRate = audioContext.sampleRate;
    const duration = 0.2; // 200ms
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // 生成低沉的"咚"声
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 15);
      const frequency = 200;
      const value = Math.sin(2 * Math.PI * frequency * t) * envelope;
      data[i] = value * 0.25;
    }

    return buffer;
  }

  /**
   * 生成简单的背景音乐循环
   * 需求: 6.3 - WHILE 游戏会话处于活动状态时，THE 游戏系统 SHALL 播放背景音乐
   */
  static generateBackgroundMusic(audioContext: AudioContext): AudioBuffer {
    const sampleRate = audioContext.sampleRate;
    const duration = 8.0; // 8秒循环
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // 生成简单的科幻氛围音乐
    // 使用C小调五声音阶: C, D, Eb, G, Bb
    const notes = [261.63, 293.66, 311.13, 392.00, 466.16]; // Hz
    const noteDuration = duration / notes.length;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t / noteDuration) % notes.length;
      const noteTime = t % noteDuration;
      const frequency = notes[noteIndex];
      
      // 音符包络
      const attack = 0.1;
      const release = 0.3;
      let envelope = 1;
      if (noteTime < attack) {
        envelope = noteTime / attack;
      } else if (noteTime > noteDuration - release) {
        envelope = (noteDuration - noteTime) / release;
      }
      
      // 主音调
      const mainTone = Math.sin(2 * Math.PI * frequency * t);
      // 和声（五度）
      const harmony = Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.3;
      
      const value = (mainTone * 0.7 + harmony) * envelope;
      data[i] = value * 0.08; // 背景音乐音量较低
    }

    return buffer;
  }

  /**
   * 初始化所有音效
   * @param audioContext Web Audio API 上下文
   * @returns 音效名称到 AudioBuffer 的映射
   */
  static async initializeAllSounds(audioContext: AudioContext): Promise<Map<string, AudioBuffer>> {
    const soundMap = new Map<string, AudioBuffer>();

    // 生成所有音效
    soundMap.set('slice', this.generateSliceSound(audioContext));
    soundMap.set('explosion', this.generateExplosionSound(audioContext));
    soundMap.set('hover', this.generateHoverSound(audioContext));
    soundMap.set('click', this.generateClickSound(audioContext));
    soundMap.set('gameStart', this.generateGameStartSound(audioContext));
    soundMap.set('gameOver', this.generateGameOverSound(audioContext));
    soundMap.set('miss', this.generateMissSound(audioContext));
    soundMap.set('bgMusic', this.generateBackgroundMusic(audioContext));

    return soundMap;
  }
}
