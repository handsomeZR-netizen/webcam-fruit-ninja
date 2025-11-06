/**
 * 游戏配置接口和默认值
 * 需求: 1.1, 1.2, 2.1, 5.1
 */

export interface GameConfig {
  // 游戏设置
  initialLives: number;              // 初始生命值
  fruitSpawnInterval: [number, number];  // 水果生成间隔 [最小, 最大] (毫秒)
  bombSpawnChance: number;           // 炸弹生成概率 (0-1)
  fruitScore: number;                // 切割水果得分
  
  // 物理参数
  gravity: number;                   // 重力加速度 (px/s²)
  minThrowVelocity: number;          // 最小抛出速度 (px/s)
  maxThrowVelocity: number;          // 最大抛出速度 (px/s)
  
  // 手势识别参数
  handTrailLength: number;           // 手部轨迹长度 (帧数)
  sliceVelocityThreshold: number;    // 切割速度阈值 (px/s)
  handTrailFadeTime: number;         // 轨迹淡出时间 (毫秒)
  
  // 渲染参数
  targetFPS: number;                 // 目标帧率
  canvasWidth: number;               // 画布宽度
  canvasHeight: number;              // 画布高度
  
  // 水果类型
  fruitTypes: string[];              // 支持的水果类型
  
  // 连击系统配置
  combo: {
    timeout: number;                 // 连击超时时间（毫秒），默认 2000
    threshold: number;               // 开始应用倍率的最小连击数，默认 3
    maxMultiplier: number;           // 最大分数倍率，默认 5.0
    multiplierIncrement: number;     // 每次连击增加的倍率，默认 0.1
  };
  
  // 特殊水果配置
  specialFruit: {
    spawnChance: number;             // 生成概率，默认 0.05 (5%)
    goldenScoreMultiplier: number;   // 黄金水果分数倍率，默认 2.0
    frozenDuration: number;          // 冰冻效果持续时间（毫秒），默认 3000
    frozenSpeedMultiplier: number;   // 冰冻速度倍率，默认 0.5
    frenzyDuration: number;          // 狂暴效果持续时间（毫秒），默认 5000
    frenzySpawnMultiplier: number;   // 狂暴生成倍率，默认 2.0
  };
  
  // 难度系统配置
  difficulty: {
    spawnRateThreshold: number;      // 生成速率提升的分数阈值，默认 100
    speedThreshold: number;          // 速度提升的分数阈值，默认 200
    spawnRateIncrement: number;      // 生成速率增幅，默认 0.1 (10%)
    speedIncrement: number;          // 速度增幅，默认 0.05 (5%)
    maxSpawnRateMultiplier: number;  // 最大生成速率倍率，默认 2.0
    maxSpeedMultiplier: number;      // 最大速度倍率，默认 1.5
  };
  
  // 视觉反馈配置
  visualFeedback: {
    floatingScoreLifetime: number;   // 浮动分数显示时长（毫秒），默认 1000
    floatingScoreRiseDistance: number; // 浮动分数上升距离（像素），默认 50
    maxFloatingScores: number;       // 最大浮动分数数量，默认 10
    comboMilestoneDuration: number;  // 连击里程碑动画时长（毫秒），默认 1500
    effectIndicatorSize: number;     // 效果指示器大小（像素），默认 80
  };
  
  // 成就系统配置
  achievements: {
    enabled: boolean;                // 是否启用成就系统，默认 true
    notificationDuration: number;    // 成就通知显示时长（毫秒），默认 3000
    checkInterval: number;           // 成就检查间隔（毫秒），默认 1000
  };
  
  // 性能优化配置
  performance: {
    enableAutoOptimization: boolean;  // 是否启用自动性能优化，默认 true
    targetFPS: number;                // 目标帧率，默认 30
    maxObjects: number;               // 最大游戏对象数量，默认 15
    maxParticles: number;             // 最大粒子数量，默认 200
    enablePerformanceMonitor: boolean; // 是否显示性能监控器，默认 true
  };
}

/**
 * 默认游戏配置
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  // 游戏设置
  initialLives: 3,
  fruitSpawnInterval: [500, 2000],
  bombSpawnChance: 0.2,
  fruitScore: 10,
  
  // 物理参数
  gravity: 980,
  minThrowVelocity: 800,
  maxThrowVelocity: 1200,
  
  // 手势识别参数
  handTrailLength: 10,
  sliceVelocityThreshold: 500,
  handTrailFadeTime: 300,
  
  // 渲染参数
  targetFPS: 60,
  canvasWidth: 1920,
  canvasHeight: 1080,
  
  // 水果类型
  fruitTypes: ['watermelon', 'apple', 'orange', 'banana', 'strawberry'],
  
  // 连击系统配置
  combo: {
    timeout: 2000,
    threshold: 3,
    maxMultiplier: 5.0,
    multiplierIncrement: 0.1
  },
  
  // 特殊水果配置
  specialFruit: {
    spawnChance: 0.05,
    goldenScoreMultiplier: 2.0,
    frozenDuration: 3000,
    frozenSpeedMultiplier: 0.5,
    frenzyDuration: 5000,
    frenzySpawnMultiplier: 2.0
  },
  
  // 难度系统配置
  difficulty: {
    spawnRateThreshold: 100,
    speedThreshold: 200,
    spawnRateIncrement: 0.1,
    speedIncrement: 0.05,
    maxSpawnRateMultiplier: 2.0,
    maxSpeedMultiplier: 1.5
  },
  
  // 视觉反馈配置
  visualFeedback: {
    floatingScoreLifetime: 1000,
    floatingScoreRiseDistance: 50,
    maxFloatingScores: 10,
    comboMilestoneDuration: 1500,
    effectIndicatorSize: 80
  },
  
  // 成就系统配置
  achievements: {
    enabled: true,
    notificationDuration: 3000,
    checkInterval: 1000
  },
  
  // 性能优化配置
  performance: {
    enableAutoOptimization: true,
    targetFPS: 30,
    maxObjects: 15,
    maxParticles: 200,
    enablePerformanceMonitor: true
  }
};

/**
 * 获取游戏配置（可以后续扩展为从本地存储加载自定义配置）
 */
export function getGameConfig(): GameConfig {
  return { ...DEFAULT_GAME_CONFIG };
}
