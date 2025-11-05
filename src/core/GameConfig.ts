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
  fruitTypes: ['watermelon', 'apple', 'orange', 'banana', 'strawberry']
};

/**
 * 获取游戏配置（可以后续扩展为从本地存储加载自定义配置）
 */
export function getGameConfig(): GameConfig {
  return { ...DEFAULT_GAME_CONFIG };
}
