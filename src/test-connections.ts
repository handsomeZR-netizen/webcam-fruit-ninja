/**
 * 系统连接测试
 * 验证所有系统是否正确连接
 * 需求: 所有需求
 */

import { GameState } from './game/GameState.js';
import { PhysicsSystem } from './game/PhysicsSystem.js';
import { CollisionDetector } from './game/CollisionDetector.js';
import { ObjectPool } from './game/ObjectPool.js';
import { ObjectSpawner } from './game/ObjectSpawner.js';
import { GameLoop } from './game/GameLoop.js';
import { GestureTracker } from './gesture/GestureTracker.js';
import { AudioManager } from './audio/AudioManager.js';
import { TutorialSystem } from './tutorial/TutorialSystem.js';
import { ErrorHandler } from './core/ErrorHandler.js';
import { getGameConfig } from './core/GameConfig.js';

/**
 * 测试所有系统连接
 */
export async function testSystemConnections(): Promise<void> {
  console.log('=== 开始测试系统连接 ===\n');

  const config = getGameConfig();
  const canvas = document.createElement('canvas');
  canvas.width = config.canvasWidth;
  canvas.height = config.canvasHeight;

  let testsPassed = 0;
  let testsFailed = 0;

  // 测试 1: 手势识别 → 碰撞检测连接
  console.log('测试 1: 手势识别 → 碰撞检测连接');
  try {
    const collisionDetector = new CollisionDetector(config);
    
    // 模拟手部轨迹（类似 GestureTracker 返回的格式）
    const mockTrail = [
      { x: 0.3, y: 0.5, z: 0, timestamp: Date.now() },
      { x: 0.7, y: 0.5, z: 0, timestamp: Date.now() + 100 }
    ];
    
    // 测试碰撞检测可以接收手势轨迹
    const result = collisionDetector.checkSliceCollision(mockTrail, []);
    
    if (Array.isArray(result)) {
      console.log('✓ 手势识别 → 碰撞检测连接正常\n');
      testsPassed++;
    } else {
      throw new Error('碰撞检测返回值类型错误');
    }
  } catch (error) {
    console.error('✗ 手势识别 → 碰撞检测连接失败:', error);
    testsFailed++;
  }

  // 测试 2: 游戏事件 → 音频播放连接
  console.log('测试 2: 游戏事件 → 音频播放连接');
  try {
    const audioManager = new AudioManager();
    
    // 测试音频管理器方法存在
    if (
      typeof audioManager.playSound === 'function' &&
      typeof audioManager.playBackgroundMusic === 'function' &&
      typeof audioManager.stopBackgroundMusic === 'function'
    ) {
      console.log('✓ 游戏事件 → 音频播放连接正常\n');
      testsPassed++;
    } else {
      throw new Error('音频管理器缺少必要方法');
    }
  } catch (error) {
    console.error('✗ 游戏事件 → 音频播放连接失败:', error);
    testsFailed++;
  }

  // 测试 3: 游戏状态 → UI 更新连接
  console.log('测试 3: 游戏状态 → UI 更新连接');
  try {
    const gameState = new GameState(config);
    
    // 测试游戏状态变化
    const initialScore = gameState.score;
    gameState.addScore(10);
    const newScore = gameState.score;
    
    const initialLives = gameState.lives;
    gameState.loseLife();
    const newLives = gameState.lives;
    
    if (newScore === initialScore + 10 && newLives === initialLives - 1) {
      console.log('✓ 游戏状态 → UI 更新连接正常\n');
      testsPassed++;
    } else {
      throw new Error('游戏状态更新异常');
    }
  } catch (error) {
    console.error('✗ 游戏状态 → UI 更新连接失败:', error);
    testsFailed++;
  }

  // 测试 4: 教程系统 → 游戏流程集成
  console.log('测试 4: 教程系统 → 游戏流程集成');
  try {
    const tutorialSystem = new TutorialSystem({
      onStepComplete: (stepId) => {
        console.log(`  - 教程步骤完成: ${stepId}`);
      },
      onTutorialComplete: () => {
        console.log('  - 教程完成');
      }
    });
    
    // 测试教程系统方法
    if (
      typeof tutorialSystem.start === 'function' &&
      typeof tutorialSystem.update === 'function' &&
      typeof tutorialSystem.getCurrentStep === 'function' &&
      typeof tutorialSystem.isActiveTutorial === 'function'
    ) {
      console.log('✓ 教程系统 → 游戏流程集成正常\n');
      testsPassed++;
    } else {
      throw new Error('教程系统缺少必要方法');
    }
  } catch (error) {
    console.error('✗ 教程系统 → 游戏流程集成失败:', error);
    testsFailed++;
  }

  // 测试 5: 游戏循环集成所有系统
  console.log('测试 5: 游戏循环集成所有系统');
  try {
    const gameState = new GameState(config);
    const physicsSystem = new PhysicsSystem(config);
    const collisionDetector = new CollisionDetector(config);
    const objectPool = new ObjectPool(config.fruitTypes as any);
    const objectSpawner = new ObjectSpawner(objectPool, physicsSystem, config);
    
    const gameLoop = new GameLoop(
      canvas,
      gameState,
      physicsSystem,
      collisionDetector,
      objectSpawner,
      config,
      {
        onFruitSliced: (fruit, score) => {
          console.log(`  - 水果被切割: ${fruit.fruitType}, +${score}`);
        },
        onBombSliced: () => {
          console.log('  - 炸弹被切割');
        },
        onFruitMissed: (fruit, lives) => {
          console.log(`  - 错过水果: ${fruit.fruitType}, 剩余生命: ${lives}`);
        },
        onGameOver: (score, highScore) => {
          console.log(`  - 游戏结束: 分数=${score}, 最高分=${highScore}`);
        }
      }
    );
    
    // 测试设置各个系统
    const gestureTracker = new GestureTracker();
    const tutorialSystem = new TutorialSystem();
    const errorHandler = new ErrorHandler(canvas);
    
    gameLoop.setGestureTracker(gestureTracker);
    gameLoop.setTutorialSystem(tutorialSystem);
    gameLoop.setErrorHandler(errorHandler);
    
    console.log('✓ 游戏循环集成所有系统正常\n');
    testsPassed++;
  } catch (error) {
    console.error('✗ 游戏循环集成所有系统失败:', error);
    testsFailed++;
  }

  // 测试 6: 错误处理器 → 降级模式连接
  console.log('测试 6: 错误处理器 → 降级模式连接');
  try {
    const errorHandler = new ErrorHandler(canvas);
    
    // 测试降级模式
    errorHandler.enableFallbackMode();
    const isFallback = errorHandler.isFallbackMode();
    
    if (isFallback) {
      // 测试鼠标轨迹获取
      const trail = errorHandler.getMouseTrail(10);
      if (Array.isArray(trail)) {
        console.log('✓ 错误处理器 → 降级模式连接正常\n');
        testsPassed++;
      } else {
        throw new Error('鼠标轨迹获取失败');
      }
    } else {
      throw new Error('降级模式启用失败');
    }
  } catch (error) {
    console.error('✗ 错误处理器 → 降级模式连接失败:', error);
    testsFailed++;
  }

  // 测试 7: 教程模式 → 对象生成器连接
  console.log('测试 7: 教程模式 → 对象生成器连接');
  try {
    const physicsSystem = new PhysicsSystem(config);
    const objectPool = new ObjectPool(config.fruitTypes as any);
    const objectSpawner = new ObjectSpawner(objectPool, physicsSystem, config);
    
    // 测试教程模式
    objectSpawner.enableTutorialMode('fruit');
    const isTutorialMode = objectSpawner.isTutorialMode();
    
    if (isTutorialMode) {
      objectSpawner.disableTutorialMode();
      const isDisabled = !objectSpawner.isTutorialMode();
      
      if (isDisabled) {
        console.log('✓ 教程模式 → 对象生成器连接正常\n');
        testsPassed++;
      } else {
        throw new Error('教程模式禁用失败');
      }
    } else {
      throw new Error('教程模式启用失败');
    }
  } catch (error) {
    console.error('✗ 教程模式 → 对象生成器连接失败:', error);
    testsFailed++;
  }

  // 测试总结
  console.log('\n=== 测试总结 ===');
  console.log(`通过: ${testsPassed}`);
  console.log(`失败: ${testsFailed}`);
  console.log(`总计: ${testsPassed + testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n✓ 所有系统连接测试通过！');
  } else {
    console.log(`\n✗ ${testsFailed} 个测试失败`);
  }
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testSystemConnections().catch(console.error);
}
