/**
 * 动态难度管理器
 * 需求: 3.1, 3.2, 3.3, 3.4
 * 
 * 根据玩家分数动态调整游戏难度参数
 */

/**
 * 难度配置接口
 */
export interface DifficultyConfig {
  scoreThresholdForSpawnRate: number;    // 生成速率提升的分数阈值，默认 100
  scoreThresholdForSpeed: number;        // 速度提升的分数阈值，默认 200
  spawnRateIncrement: number;            // 生成速率增幅百分比，默认 0.1 (10%)
  speedIncrement: number;                // 速度增幅百分比，默认 0.05 (5%)
  maxSpawnRateMultiplier: number;        // 最大生成速率倍率，默认 2.0 (200%)
  maxSpeedMultiplier: number;            // 最大速度倍率，默认 1.5 (150%)
}

/**
 * 默认难度配置
 */
const DEFAULT_DIFFICULTY_CONFIG: DifficultyConfig = {
  scoreThresholdForSpawnRate: 100,
  scoreThresholdForSpeed: 200,
  spawnRateIncrement: 0.1,
  speedIncrement: 0.05,
  maxSpawnRateMultiplier: 2.0,
  maxSpeedMultiplier: 1.5
};

/**
 * 动态难度管理器类
 * 
 * 职责：
 * - 根据玩家分数动态调整游戏难度参数
 * - 计算生成速率倍率（每 100 分提升 10%，上限 200%）
 * - 计算速度倍率（每 200 分提升 5%，上限 150%）
 * - 追踪当前难度等级
 */
export class DifficultyManager {
  private config: DifficultyConfig;
  private currentLevel: number;
  private lastLevelUpScore: number;
  private currentSpawnRateMultiplier: number;
  private currentSpeedMultiplier: number;

  /**
   * 构造函数
   * @param config 难度配置（可选）
   */
  constructor(config?: Partial<DifficultyConfig>) {
    this.config = { ...DEFAULT_DIFFICULTY_CONFIG, ...config };
    this.currentLevel = 0;
    this.lastLevelUpScore = 0;
    this.currentSpawnRateMultiplier = 1.0;
    this.currentSpeedMultiplier = 1.0;
  }

  /**
   * 根据当前分数更新难度
   * 需求: 3.1 - 每增加100分提升生成速率
   * 需求: 3.2 - 每增加200分提升速度
   * 
   * @param currentScore 当前分数
   * @returns 是否升级了难度等级
   */
  update(currentScore: number): boolean {
    const previousLevel = this.currentLevel;

    // 计算生成速率倍率
    // 需求: 3.1 - 每 100 分提升 10%
    const spawnRateLevels = Math.floor(currentScore / this.config.scoreThresholdForSpawnRate);
    this.currentSpawnRateMultiplier = 1.0 + (spawnRateLevels * this.config.spawnRateIncrement);
    // 需求: 3.3 - 上限 200%
    this.currentSpawnRateMultiplier = Math.min(
      this.currentSpawnRateMultiplier,
      this.config.maxSpawnRateMultiplier
    );

    // 计算速度倍率
    // 需求: 3.2 - 每 200 分提升 5%
    const speedLevels = Math.floor(currentScore / this.config.scoreThresholdForSpeed);
    this.currentSpeedMultiplier = 1.0 + (speedLevels * this.config.speedIncrement);
    // 需求: 3.4 - 上限 150%
    this.currentSpeedMultiplier = Math.min(
      this.currentSpeedMultiplier,
      this.config.maxSpeedMultiplier
    );

    // 难度等级（用于显示）
    this.currentLevel = Math.max(spawnRateLevels, speedLevels);

    // 检查是否升级
    const hasLeveledUp = this.currentLevel > previousLevel;
    if (hasLeveledUp) {
      this.lastLevelUpScore = currentScore;
    }

    return hasLeveledUp;
  }

  /**
   * 获取生成速率倍率
   * 需求: 3.1 - 生成速率随分数提升
   * 
   * @returns 生成速率倍率（1.0 = 100%，2.0 = 200%）
   */
  getSpawnRateMultiplier(): number {
    return this.currentSpawnRateMultiplier;
  }

  /**
   * 获取速度倍率
   * 需求: 3.2 - 速度随分数提升
   * 
   * @returns 速度倍率（1.0 = 100%，1.5 = 150%）
   */
  getSpeedMultiplier(): number {
    return this.currentSpeedMultiplier;
  }

  /**
   * 获取当前难度等级
   * 
   * @returns 当前难度等级
   */
  getDifficultyLevel(): number {
    return this.currentLevel;
  }

  /**
   * 获取上次升级时的分数
   * 
   * @returns 上次升级时的分数
   */
  getLastLevelUpScore(): number {
    return this.lastLevelUpScore;
  }

  /**
   * 重置难度
   * 需求: 3.4 - 游戏重置时重置难度
   */
  reset(): void {
    this.currentLevel = 0;
    this.lastLevelUpScore = 0;
    this.currentSpawnRateMultiplier = 1.0;
    this.currentSpeedMultiplier = 1.0;
  }

  /**
   * 获取难度统计信息
   * 
   * @returns 难度统计信息
   */
  getStats(): {
    level: number;
    spawnRateMultiplier: number;
    speedMultiplier: number;
    lastLevelUpScore: number;
  } {
    return {
      level: this.currentLevel,
      spawnRateMultiplier: this.currentSpawnRateMultiplier,
      speedMultiplier: this.currentSpeedMultiplier,
      lastLevelUpScore: this.lastLevelUpScore
    };
  }
}
