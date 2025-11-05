/**
 * AudioManager - 音频管理器
 * 使用 Web Audio API 管理游戏音效和背景音乐
 */
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private musicGainNode: GainNode | null = null;
  private soundBuffers: Map<string, AudioBuffer> = new Map();
  private currentMusicSource: AudioBufferSourceNode | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 1.0;
  private musicVolume: number = 0.5;
  private soundVolume: number = 0.7;

  /**
   * 初始化音频上下文
   */
  private initializeAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 创建主音量节点
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.connect(this.audioContext.destination);
      this.masterGainNode.gain.value = this.masterVolume;

      // 创建音乐音量节点
      this.musicGainNode = this.audioContext.createGain();
      this.musicGainNode.connect(this.masterGainNode);
      this.musicGainNode.gain.value = this.musicVolume;
    }
  }

  /**
   * 加载音频资源
   * @param soundMap - 音频名称到URL的映射
   */
  async loadSounds(soundMap: Map<string, string>): Promise<void> {
    this.initializeAudioContext();

    if (!this.audioContext) {
      throw new Error('Failed to initialize audio context');
    }

    const loadPromises: Promise<void>[] = [];

    for (const [name, url] of soundMap.entries()) {
      const promise = fetch(url)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => this.audioContext!.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          this.soundBuffers.set(name, audioBuffer);
        })
        .catch(error => {
          console.warn(`Failed to load sound: ${name}`, error);
        });

      loadPromises.push(promise);
    }

    await Promise.all(loadPromises);
  }

  /**
   * 直接加载预生成的音频缓冲区
   * @param soundBuffers - 音频名称到 AudioBuffer 的映射
   */
  loadSoundBuffers(soundBuffers: Map<string, AudioBuffer>): void {
    this.initializeAudioContext();

    if (!this.audioContext) {
      throw new Error('Failed to initialize audio context');
    }

    for (const [name, buffer] of soundBuffers.entries()) {
      this.soundBuffers.set(name, buffer);
    }

    console.log(`Loaded ${soundBuffers.size} sound buffers`);
  }

  /**
   * 播放音效
   * @param soundName - 音效名称
   * @param volume - 音量（0-1），可选
   */
  playSound(soundName: string, volume: number = 1.0): void {
    if (this.isMuted || !this.audioContext || !this.masterGainNode) {
      return;
    }

    const buffer = this.soundBuffers.get(soundName);
    if (!buffer) {
      console.warn(`Sound not found: ${soundName}`);
      return;
    }

    // 恢复音频上下文（处理浏览器自动播放策略）
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // 创建音频源
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    // 创建音量节点
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume * this.soundVolume;

    // 连接节点
    source.connect(gainNode);
    gainNode.connect(this.masterGainNode);

    // 播放
    source.start(0);
  }

  /**
   * 播放背景音乐
   * @param musicName - 音乐名称
   * @param loop - 是否循环播放
   */
  playBackgroundMusic(musicName: string, loop: boolean = true): void {
    if (this.isMuted || !this.audioContext || !this.musicGainNode) {
      return;
    }

    // 停止当前音乐
    this.stopBackgroundMusic();

    const buffer = this.soundBuffers.get(musicName);
    if (!buffer) {
      console.warn(`Music not found: ${musicName}`);
      return;
    }

    // 恢复音频上下文
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // 创建音频源
    this.currentMusicSource = this.audioContext.createBufferSource();
    this.currentMusicSource.buffer = buffer;
    this.currentMusicSource.loop = loop;

    // 连接到音乐音量节点
    this.currentMusicSource.connect(this.musicGainNode);

    // 播放
    this.currentMusicSource.start(0);
  }

  /**
   * 停止背景音乐
   */
  stopBackgroundMusic(): void {
    if (this.currentMusicSource) {
      try {
        this.currentMusicSource.stop();
      } catch (error) {
        // 忽略已停止的音源错误
      }
      this.currentMusicSource.disconnect();
      this.currentMusicSource = null;
    }
  }

  /**
   * 设置主音量
   * @param volume - 音量值（0-1）
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    if (this.masterGainNode && !this.isMuted) {
      this.masterGainNode.gain.value = this.masterVolume;
    }
  }

  /**
   * 获取主音量
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * 设置音效音量
   * @param volume - 音量值（0-1）
   */
  setSoundVolume(volume: number): void {
    this.soundVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 获取音效音量
   */
  getSoundVolume(): number {
    return this.soundVolume;
  }

  /**
   * 设置音乐音量
   * @param volume - 音量值（0-1）
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.musicVolume;
    }
  }

  /**
   * 获取音乐音量
   */
  getMusicVolume(): number {
    return this.musicVolume;
  }

  /**
   * 切换静音状态
   */
  toggleMute(): void {
    this.isMuted = !this.isMuted;
    
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.isMuted ? 0 : this.masterVolume;
    }
  }

  /**
   * 设置静音状态
   * @param muted - 是否静音
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.isMuted ? 0 : this.masterVolume;
    }
  }

  /**
   * 获取静音状态
   */
  isMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * 检查音频是否已加载
   * @param soundName - 音效名称
   */
  isSoundLoaded(soundName: string): boolean {
    return this.soundBuffers.has(soundName);
  }

  /**
   * 获取已加载的音频数量
   */
  getLoadedSoundsCount(): number {
    return this.soundBuffers.size;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stopBackgroundMusic();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.soundBuffers.clear();
    this.masterGainNode = null;
    this.musicGainNode = null;
  }
}
