/**
 * 本地存储数据接口
 */
export interface SaveData {
  highScore: number;
  tutorialCompleted: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  masterVolume: number;
}

/**
 * 本地存储管理器
 * 负责保存和加载游戏数据到 localStorage
 */
export class StorageManager {
  private static readonly STORAGE_KEY = 'webcam-fruit-ninja-save';
  private static readonly DEFAULT_DATA: SaveData = {
    highScore: 0,
    tutorialCompleted: false,
    soundEnabled: true,
    musicEnabled: true,
    masterVolume: 0.7,
  };

  /**
   * 加载保存的数据
   * 如果没有保存数据或数据损坏，返回默认值
   */
  public static load(): SaveData {
    try {
      const savedDataStr = localStorage.getItem(this.STORAGE_KEY);
      
      if (!savedDataStr) {
        return { ...this.DEFAULT_DATA };
      }

      const savedData = JSON.parse(savedDataStr) as Partial<SaveData>;
      
      // 合并保存的数据和默认数据，确保所有字段都存在
      return {
        ...this.DEFAULT_DATA,
        ...savedData,
      };
    } catch (error) {
      console.error('Failed to load save data:', error);
      return { ...this.DEFAULT_DATA };
    }
  }

  /**
   * 保存数据到本地存储
   */
  public static save(data: SaveData): void {
    try {
      const dataStr = JSON.stringify(data);
      localStorage.setItem(this.STORAGE_KEY, dataStr);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  /**
   * 获取最高分
   */
  public static getHighScore(): number {
    const data = this.load();
    return data.highScore;
  }

  /**
   * 保存最高分（仅当新分数更高时）
   */
  public static saveHighScore(score: number): void {
    const data = this.load();
    if (score > data.highScore) {
      data.highScore = score;
      this.save(data);
    }
  }

  /**
   * 获取教程完成状态
   */
  public static getTutorialCompleted(): boolean {
    const data = this.load();
    return data.tutorialCompleted;
  }

  /**
   * 保存教程完成状态
   */
  public static setTutorialCompleted(completed: boolean): void {
    const data = this.load();
    data.tutorialCompleted = completed;
    this.save(data);
  }

  /**
   * 获取音效启用状态
   */
  public static getSoundEnabled(): boolean {
    const data = this.load();
    return data.soundEnabled;
  }

  /**
   * 保存音效启用状态
   */
  public static setSoundEnabled(enabled: boolean): void {
    const data = this.load();
    data.soundEnabled = enabled;
    this.save(data);
  }

  /**
   * 获取音乐启用状态
   */
  public static getMusicEnabled(): boolean {
    const data = this.load();
    return data.musicEnabled;
  }

  /**
   * 保存音乐启用状态
   */
  public static setMusicEnabled(enabled: boolean): void {
    const data = this.load();
    data.musicEnabled = enabled;
    this.save(data);
  }

  /**
   * 获取主音量
   */
  public static getMasterVolume(): number {
    const data = this.load();
    return data.masterVolume;
  }

  /**
   * 保存主音量
   */
  public static setMasterVolume(volume: number): void {
    const data = this.load();
    data.masterVolume = Math.max(0, Math.min(1, volume)); // 限制在 0-1 范围
    this.save(data);
  }

  /**
   * 重置所有数据到默认值
   */
  public static reset(): void {
    this.save({ ...this.DEFAULT_DATA });
  }

  /**
   * 清除所有保存的数据
   */
  public static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear save data:', error);
    }
  }
}
