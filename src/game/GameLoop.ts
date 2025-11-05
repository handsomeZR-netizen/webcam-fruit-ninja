/**
 * 游戏主循环
 * 需求: 1.4, 2.3, 3.1, 3.2, 7.1
 * 
 * 负责协调所有游戏系统的更新和渲染
 */

import { GameState } from './GameState.js';
import { PhysicsSystem } from './PhysicsSystem.js';
import { CollisionDetector } from './CollisionDetector.js';
import { ObjectSpawner } from './ObjectSpawner.js';
import { GestureTracker } from '../gesture/GestureTracker.js';
import { GameConfig } from '../core/GameConfig.js';
import { PerformanceMonitor } from '../core/PerformanceMonitor.js';
import { GameObject } from './GameObject.js';
import { Fruit } from './Fruit.js';
import { Bomb } from './Bomb.js';
import { Renderer } from '../ui/Renderer.js';
import { GameHUD } from '../ui/GameHUD.js';
import { ComboCounterHUD } from '../ui/ComboCounterHUD.js';
import { TutorialSystem } from '../tutorial/TutorialSystem.js';
import { SpecialFruit } from './SpecialFruit.js';

/**
 * 游戏循环回调接口
 */
export interface GameLoopCallbacks {
  onFruitSliced?: (fruit: Fruit, score: number) => void;
  onBombSliced?: (bomb: Bomb) => void;
  onFruitMissed?: (fruit: Fruit, livesRemaining: number) => void;
  onGameOver?: (finalScore: number, highScore: number) => void;
  onRender?: (ctx: CanvasRenderingContext2D, deltaTime: number) => void;
}

/**
 * 游戏主循环类
 */
export class GameLoop {
  private gameState: GameState;
  private physicsSystem: PhysicsSystem;
  private collisionDetector: CollisionDetector;
  private objectSpawner: ObjectSpawner;
  private gestureTracker: GestureTracker | null;
  private config: GameConfig;
  private callbacks: GameLoopCallbacks;
  
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: Renderer;
  private gameHUD: GameHUD;
  private comboCounterHUD: ComboCounterHUD;
  
  private isRunning: boolean;
  private animationFrameId: number | null;
  private lastFrameTime: number;
  
  // 性能监控
  private performanceMonitor: PerformanceMonitor;
  
  // 教程系统
  private tutorialSystem: TutorialSystem | null;
  private lastFruitSliced: boolean;
  
  // 错误处理器（用于鼠标降级模式）
  private errorHandler: any | null;

  constructor(
    canvas: HTMLCanvasElement,
    gameState: GameState,
    physicsSystem: PhysicsSystem,
    collisionDetector: CollisionDetector,
    objectSpawner: ObjectSpawner,
    config: GameConfig,
    callbacks: GameLoopCallbacks = {}
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取 Canvas 2D 上下文');
    }
    this.ctx = ctx;
    
    // 初始化渲染器
    this.renderer = new Renderer(canvas, config);
    
    // 初始化游戏 HUD
    this.gameHUD = new GameHUD(this.renderer.theme);
    
    // 初始化连击计数器 HUD
    this.comboCounterHUD = new ComboCounterHUD();
    
    this.gameState = gameState;
    this.physicsSystem = physicsSystem;
    this.collisionDetector = collisionDetector;
    this.objectSpawner = objectSpawner;
    this.gestureTracker = null;
    this.config = config;
    this.callbacks = callbacks;
    
    this.isRunning = false;
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    
    // 初始化性能监控器
    this.performanceMonitor = new PerformanceMonitor({
      enabled: true,
      showOverlay: true,
      fpsWarningThreshold: 30,
      memoryWarningThreshold: 80,
      maxObjectCount: 50,
      maxParticleCount: 200,
      sampleInterval: 1000
    });
    
    this.tutorialSystem = null;
    this.errorHandler = null;
    this.lastFruitSliced = false;
  }

  /**
   * 设置手势追踪器
   * @param gestureTracker 手势追踪器实例
   */
  setGestureTracker(gestureTracker: GestureTracker): void {
    this.gestureTracker = gestureTracker;
  }

  /**
   * 设置教程系统
   * 需求: 8.3 - 集成教程到游戏流程
   * @param tutorialSystem 教程系统实例
   */
  setTutorialSystem(tutorialSystem: TutorialSystem): void {
    this.tutorialSystem = tutorialSystem;
  }

  /**
   * 设置错误处理器（用于鼠标降级模式）
   * 需求: 1.1 - 实现降级模式（使用鼠标代替手势）
   * @param errorHandler 错误处理器实例
   */
  setErrorHandler(errorHandler: any): void {
    this.errorHandler = errorHandler;
  }

  /**
   * 启动游戏循环
   * 需求: 7.1 - THE 游戏引擎 SHALL 以至少 30 帧每秒的速率渲染游戏画面
   */
  start(): void {
    if (this.isRunning) {
      console.warn('游戏循环已在运行中');
      return;
    }

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    
    // 重置性能监控器
    this.performanceMonitor.reset();
    
    // 启动对象生成器
    this.objectSpawner.start();
    
    // 启动游戏状态
    this.gameState.startGame();
    
    // 开始循环
    this.loop();
    
    console.log('游戏主循环已启动');
  }

  /**
   * 停止游戏循环
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // 停止对象生成器
    this.objectSpawner.stop();
    
    console.log('游戏主循环已停止');
  }

  /**
   * 暂停游戏循环
   */
  pause(): void {
    if (!this.isRunning || this.gameState.isPaused) {
      return;
    }

    this.gameState.pauseGame();
    this.objectSpawner.stop();
    console.log('游戏已暂停');
  }

  /**
   * 恢复游戏循环
   */
  resume(): void {
    if (!this.isRunning || !this.gameState.isPaused) {
      return;
    }

    this.gameState.resumeGame();
    this.objectSpawner.start();
    this.lastFrameTime = performance.now();
    console.log('游戏已恢复');
  }

  /**
   * 主游戏循环
   * 需求: 1.4, 2.3, 3.1, 3.2 - 使用 requestAnimationFrame 创建游戏循环
   */
  private loop = (): void => {
    if (!this.isRunning) {
      return;
    }

    // 开始帧监控
    this.performanceMonitor.startFrame();

    // 请求下一帧
    this.animationFrameId = requestAnimationFrame(this.loop);

    // 计算 deltaTime
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // 转换为秒
    this.lastFrameTime = currentTime;

    // 限制 deltaTime，避免大的时间跳跃
    const clampedDeltaTime = Math.min(deltaTime, 0.1);

    // 更新 FPS
    this.performanceMonitor.updateFPS();

    // 如果游戏暂停，只渲染不更新
    if (this.gameState.isPaused) {
      this.render(clampedDeltaTime);
      return;
    }

    // 更新游戏逻辑
    this.update(clampedDeltaTime);

    // 渲染游戏
    this.render(clampedDeltaTime);
    
    // 更新内存监控
    this.performanceMonitor.updateMemory();
    
    // 检测性能瓶颈
    this.performanceMonitor.detectBottlenecks();
  };

  /**
   * 更新游戏逻辑
   * @param deltaTime 时间增量（秒）
   */
  private update(deltaTime: number): void {
    // 开始更新时间监控
    this.performanceMonitor.startUpdate();
    
    // 如果游戏已结束，停止更新
    if (this.gameState.isGameOver) {
      this.performanceMonitor.endUpdate();
      return;
    }
    
    // 更新连击系统（检查超时）
    // 需求: 1.3 - WHEN 玩家在2秒内未切割任何水果时，THE 连击系统 SHALL 重置连击计数器为零
    this.gameState.comboSystem.update(Date.now());
    
    // 重置水果切割标志
    this.lastFruitSliced = false;
    
    // 如果教程系统激活，更新教程逻辑
    // 需求: 8.3 - 暂停正常游戏逻辑，等待玩家完成教程动作
    if (this.tutorialSystem && this.tutorialSystem.isActiveTutorial()) {
      this.updateTutorialMode(deltaTime);
      this.performanceMonitor.endUpdate();
      return;
    }

    // 正常游戏逻辑
    // 1. 更新对象生成器
    // 需求: 2.1 - WHEN 游戏会话处于活动状态时，THE 游戏引擎 SHALL 每隔 0.5 到 2 秒随机生成一个水果对象
    // 需求: 7.1 - 性能优化：限制同时存在的游戏对象数量
    const maxObjects = 15; // 最大对象数量限制
    const currentObjectCount = this.gameState.getAliveObjects().length;
    
    if (currentObjectCount < maxObjects) {
      const newObjects = this.objectSpawner.update(deltaTime);
      newObjects.forEach(obj => this.gameState.addGameObject(obj));
    }

    // 2. 调用物理系统更新所有对象
    // 需求: 2.2, 2.3 - 应用重力和抛物线运动
    this.physicsSystem.update(this.gameState.gameObjects, deltaTime);

    // 3. 更新粒子效果
    // 需求: 7.2, 7.3 - 更新水果切割和炸弹爆炸粒子效果
    for (const particle of this.gameState.particleEffects) {
      particle.update(deltaTime);
    }

    // 4. 调用碰撞检测系统
    // 需求: 1.4 - WHEN 手部轨迹与水果对象相交时，THE 游戏引擎 SHALL 触发切割动作
    // 需求: 1.1 - 支持鼠标降级模式
    let handTrail: any[] = [];
    
    // 检查是否使用鼠标降级模式
    if (this.errorHandler && this.errorHandler.isFallbackMode()) {
      // 使用鼠标轨迹
      if (this.errorHandler.isSlicing()) {
        const mouseTrail = this.errorHandler.getMouseTrail(10);
        handTrail = mouseTrail.map((pos: any) => ({
          x: pos.x,
          y: pos.y,
          z: 0,
          timestamp: pos.timestamp
        }));
      }
    } else if (this.gestureTracker) {
      // 使用手势追踪
      handTrail = this.gestureTracker.getHandTrail();
    }
    
    if (handTrail.length >= 2) {
      const slicedObjects = this.collisionDetector.checkSliceCollision(
        handTrail,
        this.gameState.getAliveObjects()
      );

      // 5. 处理切割事件
      this.handleSlicedObjects(slicedObjects);
    }

    // 6. 移除离开屏幕的对象（减少生命值）
    // 需求: 3.2 - WHEN 水果对象未被切割而离开屏幕时，THE 游戏系统 SHALL 减少一条生命值
    this.handleOutOfBoundsObjects();

    // 7. 移除所有死亡的对象和粒子效果
    this.gameState.removeDeadObjects();
    this.gameState.removeDeadParticles();

    // 8. 检查游戏是否结束
    if (this.gameState.isGameOver) {
      this.handleGameOver();
    }
    
    // 结束更新时间监控
    this.performanceMonitor.endUpdate();
    
    // 更新对象计数
    this.performanceMonitor.updateObjectCounts(
      this.gameState.gameObjects.length,
      this.gameState.particleEffects.length
    );
  }

  /**
   * 更新教程模式
   * 需求: 8.3 - 在教程模式下生成特定的水果和炸弹，暂停正常游戏逻辑
   * @param deltaTime 时间增量（秒）
   */
  private updateTutorialMode(deltaTime: number): void {
    if (!this.tutorialSystem) {
      return;
    }

    const currentStep = this.tutorialSystem.getCurrentStep();
    if (!currentStep) {
      return;
    }

    // 根据当前教程步骤配置对象生成器
    if (currentStep.targetAction === 'slice_fruit') {
      // 切割水果步骤：只生成水果
      this.objectSpawner.enableTutorialMode('fruit');
      if (!this.objectSpawner.isSpawnerActive()) {
        this.objectSpawner.start();
      }
    } else if (currentStep.targetAction === 'avoid_bomb') {
      // 避免炸弹步骤：只生成炸弹
      this.objectSpawner.enableTutorialMode('bomb');
      if (!this.objectSpawner.isSpawnerActive()) {
        this.objectSpawner.start();
      }
    } else {
      // 手势识别步骤：不生成对象
      this.objectSpawner.stop();
    }

    // 更新对象生成器
    const newObjects = this.objectSpawner.update(deltaTime);
    newObjects.forEach(obj => this.gameState.addGameObject(obj));

    // 更新物理系统
    this.physicsSystem.update(this.gameState.gameObjects, deltaTime);

    // 更新粒子效果
    for (const particle of this.gameState.particleEffects) {
      particle.update(deltaTime);
    }

    // 碰撞检测
    if (this.gestureTracker) {
      const handTrail = this.gestureTracker.getHandTrail();
      if (handTrail.length >= 2) {
        const slicedObjects = this.collisionDetector.checkSliceCollision(
          handTrail,
          this.gameState.getAliveObjects()
        );

        // 处理切割事件（教程模式）
        this.handleSlicedObjectsTutorial(slicedObjects);
      }
    }

    // 移除离开屏幕的对象（教程模式不减少生命值）
    this.handleOutOfBoundsObjectsTutorial();

    // 移除死亡的对象和粒子
    this.gameState.removeDeadObjects();
    this.gameState.removeDeadParticles();

    // 更新教程系统
    const handDetected = this.gestureTracker ? this.gestureTracker.getCurrentHandPosition() !== null : false;
    this.tutorialSystem.update(this.gameState, handDetected, this.lastFruitSliced);
  }

  /**
   * 处理被切割的对象（教程模式）
   * 需求: 7.1 - 性能优化：根据帧率动态调整粒子质量
   * @param slicedObjects 被切割的对象数组
   */
  private handleSlicedObjectsTutorial(slicedObjects: GameObject[]): void {
    // 获取粒子质量乘数（基于当前 FPS）
    const qualityMultiplier = this.performanceMonitor.getParticleQualityMultiplier();
    
    for (const obj of slicedObjects) {
      if (!obj.isAlive) {
        continue;
      }

      obj.onSliced(qualityMultiplier);

      if (obj.type === 'fruit') {
        const fruit = obj as Fruit;
        
        // 标记水果被切割（用于教程系统）
        this.lastFruitSliced = true;
        
        // 添加粒子效果
        if (fruit.sliceEffect) {
          this.gameState.addParticleEffect(fruit.sliceEffect);
        }
        
        // 触发回调
        if (this.callbacks.onFruitSliced) {
          this.callbacks.onFruitSliced(fruit, 0); // 教程模式不计分
        }

        setTimeout(() => {
          obj.destroy();
        }, 100);

      } else if (obj.type === 'bomb') {
        const bomb = obj as Bomb;
        
        // 添加爆炸效果
        if (bomb.explosionEffect) {
          this.gameState.addParticleEffect(bomb.explosionEffect);
        }
        
        // 触发回调
        if (this.callbacks.onBombSliced) {
          this.callbacks.onBombSliced(bomb);
        }

        // 教程模式：切到炸弹不结束游戏，但结束教程
        if (this.tutorialSystem) {
          this.tutorialSystem.stop();
        }
      }
    }
  }

  /**
   * 处理超出边界的对象（教程模式）
   */
  private handleOutOfBoundsObjectsTutorial(): void {
    const outOfBoundsObjects = this.physicsSystem.removeOutOfBoundsObjects(
      this.gameState.gameObjects
    );

    // 教程模式：对象离开屏幕不减少生命值
    // 但需要通知教程系统（用于避免炸弹步骤）
    for (const obj of outOfBoundsObjects) {
      if (obj.type === 'bomb' && this.tutorialSystem) {
        const currentStep = this.tutorialSystem.getCurrentStep();
        if (currentStep && currentStep.targetAction === 'avoid_bomb') {
          // 通知教程系统炸弹被成功避开
          const avoidBombStep = currentStep as any;
          if (avoidBombStep.notifyBombAvoided) {
            avoidBombStep.notifyBombAvoided();
          }
        }
      }
    }
  }

  /**
   * 处理被切割的对象
   * 需求: 3.1 - WHEN 切割动作成功切割水果对象时，THE 游戏系统 SHALL 增加玩家分数 10 分
   * 需求: 4.2 - WHEN 切割动作触碰到炸弹对象时，THE 游戏系统 SHALL 立即结束游戏会话
   * 需求: 7.2, 7.3 - 显示水果切割粒子效果和炸弹爆炸效果
   * 需求: 7.1 - 性能优化：根据帧率动态调整粒子质量
   * 
   * @param slicedObjects 被切割的对象数组
   */
  private handleSlicedObjects(slicedObjects: GameObject[]): void {
    // 获取粒子质量乘数（基于当前 FPS）
    const qualityMultiplier = this.performanceMonitor.getParticleQualityMultiplier();
    
    for (const obj of slicedObjects) {
      if (!obj.isAlive) {
        continue;
      }

      // 调用对象的 onSliced 方法（会创建粒子效果）
      obj.onSliced(qualityMultiplier);

      if (obj.type === 'fruit') {
        // 切割水果：记录连击并应用分数倍率
        const fruit = obj as Fruit;
        
        // 记录连击
        // 需求: 1.1 - WHEN 玩家在2秒内连续切割水果时，THE 连击系统 SHALL 增加连击计数器
        this.gameState.comboSystem.recordSlice();
        
        // 获取连击分数倍率
        // 需求: 1.2 - WHEN 玩家的连击数达到3次或更多时，THE 游戏系统 SHALL 应用分数倍率到后续切割的水果
        const comboMultiplier = this.gameState.comboSystem.getScoreMultiplier();
        
        // 获取特殊水果分数倍率
        // 需求: 2.2 - WHEN 玩家切割黄金水果时，THE 游戏系统 SHALL 给予玩家双倍分数奖励
        let specialMultiplier = 1.0;
        if (fruit instanceof SpecialFruit) {
          specialMultiplier = fruit.getScoreMultiplier();
        }
        
        // 计算最终分数（基础分数 * 连击倍率 * 特殊水果倍率）
        const finalScore = Math.round(this.config.fruitScore * comboMultiplier * specialMultiplier);
        
        // 增加分数
        this.gameState.addScore(finalScore);
        
        // 添加水果切割粒子效果到游戏状态
        if (fruit.sliceEffect) {
          this.gameState.addParticleEffect(fruit.sliceEffect);
        }
        
        // 触发回调
        if (this.callbacks.onFruitSliced) {
          this.callbacks.onFruitSliced(fruit, finalScore);
        }

        // 标记为死亡（将在下一帧移除）
        // 注意：这里不立即销毁，让渲染器有机会显示切割效果
        setTimeout(() => {
          obj.destroy();
        }, 100);

      } else if (obj.type === 'bomb') {
        // 切割炸弹：重置连击并结束游戏
        const bomb = obj as Bomb;
        
        // 重置连击
        // 需求: 1.4 - WHEN 玩家切割炸弹时，THE 连击系统 SHALL 立即重置连击计数器为零
        this.gameState.comboSystem.resetCombo();
        
        // 添加炸弹爆炸粒子效果到游戏状态
        if (bomb.explosionEffect) {
          this.gameState.addParticleEffect(bomb.explosionEffect);
        }
        
        // 触发炸弹切割回调
        if (this.callbacks.onBombSliced) {
          this.callbacks.onBombSliced(bomb);
        }
        
        // 标记炸弹为死亡
        bomb.destroy();
        
        // 结束游戏
        this.gameState.endGame();
        
        // 停止对象生成器
        this.objectSpawner.stop();
        
        // 触发游戏结束处理
        this.handleGameOver();
      }
    }
  }

  /**
   * 处理超出边界的对象
   * 需求: 2.3 - WHEN 水果对象到达屏幕顶部或底部边界时，THE 游戏引擎 SHALL 移除该水果对象
   * 需求: 3.2 - WHEN 水果对象未被切割而离开屏幕时，THE 游戏系统 SHALL 减少一条生命值
   */
  private handleOutOfBoundsObjects(): void {
    const outOfBoundsObjects = this.physicsSystem.removeOutOfBoundsObjects(
      this.gameState.gameObjects
    );

    for (const obj of outOfBoundsObjects) {
      // 只有未被切割的水果才减少生命值
      if (obj.type === 'fruit') {
        const fruit = obj as Fruit;
        if (!fruit.isSliced) {
          this.gameState.loseLife();
          
          // 重置连击（错过水果）
          // 需求: 1.4 - 错过水果时重置连击
          this.gameState.comboSystem.resetCombo();
          
          // 触发回调
          if (this.callbacks.onFruitMissed) {
            this.callbacks.onFruitMissed(fruit, this.gameState.lives);
          }
        }
      }
    }
  }

  /**
   * 处理游戏结束
   * 需求: 3.4 - WHEN 玩家生命值降至 0 时，THE 游戏系统 SHALL 结束游戏会话并显示最终分数
   */
  private handleGameOver(): void {
    // 防止重复调用
    if (this.gameState.isGameOver && !this.isRunning) {
      return;
    }
    
    this.stop();
    
    // 触发回调
    if (this.callbacks.onGameOver) {
      this.callbacks.onGameOver(this.gameState.score, this.gameState.highScore);
    }
    
    console.log('游戏结束！最终分数:', this.gameState.score);
  }

  /**
   * 渲染游戏
   * @param deltaTime 时间增量（秒）
   */
  private render(deltaTime: number): void {
    // 开始渲染时间监控
    this.performanceMonitor.startRender();
    
    // 使用渲染器清空画布和渲染背景
    this.renderer.clear();
    this.renderer.renderBackground();

    // 使用渲染器渲染所有游戏对象
    this.renderer.renderGameObjects(this.gameState.gameObjects);

    // 渲染粒子效果
    // 需求: 7.2, 7.3 - 显示水果切割和炸弹爆炸粒子效果
    this.renderer.renderParticles(this.gameState.particleEffects);

    // 渲染手部轨迹
    if (this.gestureTracker) {
      this.renderHandTrail();
    }

    // 渲染 HUD（分数、生命值）
    this.renderHUD();

    // 渲染连击计数器 HUD
    // 需求: 1.5 - THE 视觉反馈系统 SHALL 在屏幕上显示当前连击数和分数倍率
    this.renderComboCounter();

    // 渲染摄像头预览（右上角小窗口）
    this.renderCameraPreview();

    // 渲染教程系统
    // 需求: 8.3 - 显示文字提示和视觉指引
    if (this.tutorialSystem && this.tutorialSystem.isActiveTutorial()) {
      this.tutorialSystem.render(this.ctx, this.canvas.width, this.canvas.height);
    }

    // 渲染性能监控叠加层
    // 需求: 7.1 - 监控帧率和性能
    this.performanceMonitor.renderOverlay(this.ctx, 10, 10);
    
    // 渲染性能瓶颈警告
    const bottlenecks = this.performanceMonitor.getBottlenecks();
    if (bottlenecks.length > 0) {
      this.performanceMonitor.renderBottlenecks(this.ctx, 10, 200);
    }

    // 触发自定义渲染回调
    if (this.callbacks.onRender) {
      this.callbacks.onRender(this.ctx, deltaTime);
    }
    
    // 结束渲染时间监控
    this.performanceMonitor.endRender();
  }

  /**
   * 渲染手部轨迹
   * 需求: 1.3 - WHEN 手势识别模块检测到手部移动时，THE 游戏系统 SHALL 在屏幕上显示手部轨迹的视觉反馈
   * 需求: 7.4 - THE 游戏系统 SHALL 在手部轨迹上显示拖尾效果，持续时间为 300 毫秒
   */
  private renderHandTrail(): void {
    let handTrail: any[] = [];
    
    // 检查是否使用鼠标降级模式
    // 需求: 1.1 - 支持鼠标降级模式
    if (this.errorHandler && this.errorHandler.isFallbackMode()) {
      // 使用鼠标轨迹
      const mouseTrail = this.errorHandler.getMouseTrail(10);
      handTrail = mouseTrail.map((pos: any) => ({
        x: pos.x,
        y: pos.y,
        z: 0,
        timestamp: pos.timestamp
      }));
    } else if (this.gestureTracker) {
      // 使用手势追踪
      handTrail = this.gestureTracker.getHandTrail();
    }
    
    // 使用渲染器的手部轨迹渲染方法
    if (handTrail.length > 0) {
      this.renderer.renderHandTrail(handTrail);
    }
  }

  /**
   * 渲染 HUD（分数和生命值）
   * 需求: 3.3 - THE 游戏系统 SHALL 在屏幕上实时显示当前分数和剩余生命值
   */
  private renderHUD(): void {
    // 更新 HUD 数据
    this.gameHUD.updateScore(this.gameState.score);
    this.gameHUD.updateLives(this.gameState.lives);
    this.gameHUD.updateHighScore(this.gameState.highScore);

    // 渲染 HUD
    this.gameHUD.render(this.ctx, this.canvas.width, this.canvas.height);
  }

  /**
   * 渲染连击计数器 HUD
   * 需求: 1.5 - THE 视觉反馈系统 SHALL 在屏幕上显示当前连击数和分数倍率
   */
  private renderComboCounter(): void {
    const comboCount = this.gameState.comboSystem.getComboCount();
    const multiplier = this.gameState.comboSystem.getScoreMultiplier();
    
    this.comboCounterHUD.render(
      this.ctx,
      comboCount,
      multiplier,
      this.canvas.width
    );
  }

  /**
   * 渲染摄像头预览（右上角小窗口）
   */
  private renderCameraPreview(): void {
    // 只在非降级模式下显示摄像头预览
    if (this.errorHandler && this.errorHandler.isFallbackMode()) {
      return;
    }

    // 检查手势追踪器是否存在
    if (!this.gestureTracker) {
      return;
    }

    // 获取视频元素
    try {
      const videoElement = this.gestureTracker.getVideoElement();
      if (!videoElement) {
        return;
      }

      // 在右上角渲染小窗口
      const previewWidth = 200;
      const previewHeight = 150;
      const padding = 20;
      const x = this.canvas.width - previewWidth - padding;
      const y = padding;

      this.renderer.renderCameraPreview(
        videoElement,
        x,
        y,
        previewWidth,
        previewHeight
      );
    } catch (error) {
      // 静默处理错误，不影响游戏
      console.warn('摄像头预览渲染失败:', error);
    }
  }

  /**
   * 获取性能监控器
   */
  getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  /**
   * 获取当前 FPS
   */
  getCurrentFPS(): number {
    return this.performanceMonitor.getMetrics().fps;
  }

  /**
   * 检查游戏循环是否正在运行
   */
  isLoopRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 重置游戏
   */
  reset(): void {
    this.stop();
    this.gameState.reset();
    this.objectSpawner.reset();
    this.objectSpawner.disableTutorialMode();
    this.gameHUD.reset();
    
    if (this.gestureTracker) {
      this.gestureTracker.clearTrail();
    }
  }

  /**
   * 获取教程系统
   */
  getTutorialSystem(): TutorialSystem | null {
    return this.tutorialSystem;
  }
}
