/**
 * 连击系统
 * 需求: 1.1, 1.2, 1.3, 1.4, 1.5
 * 
 * 追踪玩家连续切割水果的次数，计算分数倍率，管理连击超时
 */

/**
 * 连击系统配置接口
 */
export interface ComboSystemConfig {
  comboTimeout: number;        // 连击超时时间（毫秒），默认 2000
  comboThreshold: number;      // 开始应用倍率的最小连击数，默认 3
  maxMultiplier: number;       // 最大分数倍率，默认 5.0
  multiplierIncrement: number; // 每次连击增加的倍率，默认 0.1
}

/**
 * 默认连击系统配置
 */
const DEFAULT_COMBO_CONFIG: ComboSystemConfig = {
  comboTimeout: 2000,
  comboThreshold: 3,
  maxMultiplier: 5.0,
  multiplierIncrement: 0.1
};

/**
 * 连击系统类
 * 管理连击计数、分数倍率和超时逻辑
 */
export class ComboSystem {
  private comboCount: number;
  private lastSliceTime: number;
  private config: ComboSystemConfig;
  private cachedMultiplier: number | null;

  /**
   * 构造函数
   * @param config 连击系统配置
   */
  constructor(config: Partial<ComboSystemConfig> = {}) {
    this.config = { ...DEFAULT_COMBO_CONFIG, ...config };
    this.comboCount = 0;
    this.lastSliceTime = 0;
    this.cachedMultiplier = null;
  }

  /**
   * 记录一次成功切割
   * 需求: 1.1 - WHEN 玩家在2秒内连续切割水果时，THE 连击系统 SHALL 增加连击计数器
   */
  recordSlice(): void {
    const currentTime = Date.now();
    
    // 检查是否超时
    if (this.lastSliceTime > 0 && 
        currentTime - this.lastSliceTime > this.config.comboTimeout) {
      // 超时，重置连击
      this.comboCount = 0;
    }
    
    // 增加连击计数
    this.comboCount++;
    this.lastSliceTime = currentTime;
    
    // 清除缓存的倍率，需要重新计算
    this.cachedMultiplier = null;
  }

  /**
   * 重置连击计数
   * 需求: 1.3 - WHEN 玩家在2秒内未切割任何水果时，THE 连击系统 SHALL 重置连击计数器为零
   * 需求: 1.4 - WHEN 玩家切割炸弹时，THE 连击系统 SHALL 立即重置连击计数器为零
   */
  resetCombo(): void {
    this.comboCount = 0;
    this.lastSliceTime = 0;
    this.cachedMultiplier = null;
  }

  /**
   * 更新连击状态（检查超时）
   * 需求: 1.3 - WHEN 玩家在2秒内未切割任何水果时，THE 连击系统 SHALL 重置连击计数器为零
   * @param currentTime 当前时间戳（毫秒）
   */
  update(currentTime: number): void {
    // 如果没有连击，无需检查
    if (this.comboCount === 0 || this.lastSliceTime === 0) {
      return;
    }
    
    // 检查是否超时
    const timeSinceLastSlice = currentTime - this.lastSliceTime;
    if (timeSinceLastSlice > this.config.comboTimeout) {
      this.resetCombo();
    }
  }

  /**
   * 获取当前连击数
   * @returns 当前连击数
   */
  getComboCount(): number {
    return this.comboCount;
  }

  /**
   * 获取当前分数倍率
   * 需求: 1.2 - WHEN 玩家的连击数达到3次或更多时，THE 游戏系统 SHALL 应用分数倍率到后续切割的水果
   * @returns 分数倍率（1.0 表示无倍率）
   */
  getScoreMultiplier(): number {
    // 如果连击数小于阈值，返回 1.0（无倍率）
    if (this.comboCount < this.config.comboThreshold) {
      return 1.0;
    }
    
    // 使用缓存的倍率（如果可用）
    if (this.cachedMultiplier !== null) {
      return this.cachedMultiplier;
    }
    
    // 计算倍率
    // multiplier = 1.0 + (comboCount - comboThreshold) * multiplierIncrement
    const multiplier = 1.0 + 
      (this.comboCount - this.config.comboThreshold) * this.config.multiplierIncrement;
    
    // 应用最大倍率限制
    this.cachedMultiplier = Math.min(multiplier, this.config.maxMultiplier);
    
    return this.cachedMultiplier;
  }

  /**
   * 检查是否达到里程碑
   * 需求: 1.5 - THE 视觉反馈系统 SHALL 在屏幕上显示当前连击数和分数倍率
   * @returns 里程碑连击数（5, 10, 20）或 null
   */
  checkMilestone(): number | null {
    // 定义里程碑
    const milestones = [5, 10, 20];
    
    // 检查当前连击数是否恰好达到里程碑
    if (milestones.includes(this.comboCount)) {
      return this.comboCount;
    }
    
    return null;
  }

  /**
   * 获取连击是否激活（连击数 >= 阈值）
   * @returns 连击是否激活
   */
  isActive(): boolean {
    return this.comboCount >= this.config.comboThreshold;
  }

  /**
   * 获取距离超时的剩余时间
   * @param currentTime 当前时间戳（毫秒）
   * @returns 剩余时间（毫秒），如果没有连击则返回 0
   */
  getRemainingTime(currentTime: number): number {
    if (this.comboCount === 0 || this.lastSliceTime === 0) {
      return 0;
    }
    
    const elapsed = currentTime - this.lastSliceTime;
    const remaining = this.config.comboTimeout - elapsed;
    
    return Math.max(0, remaining);
  }

  /**
   * 获取配置
   * @returns 连击系统配置
   */
  getConfig(): ComboSystemConfig {
    return { ...this.config };
  }

  /**
   * 重置系统（用于游戏重新开始）
   */
  reset(): void {
    this.resetCombo();
  }
}
