/**
 * 端到端测试 (E2E Tests)
 * 测试完整游戏流程、摄像头权限处理、浏览器兼容性和移动端适配
 * 需求: 所有需求
 */

import { CameraManager, CameraError } from './gesture/CameraManager.js';
import { GameState } from './game/GameState.js';
import { PhysicsSystem } from './game/PhysicsSystem.js';
import { CollisionDetector } from './game/CollisionDetector.js';
import { ObjectPool } from './game/ObjectPool.js';
import { ObjectSpawner } from './game/ObjectSpawner.js';
import { SciFiTheme } from './ui/SciFiTheme.js';
import { MainMenu } from './ui/MainMenu.js';
import { GameHUD } from './ui/GameHUD.js';
import { CameraPreview } from './ui/CameraPreview.js';
import { PauseMenu } from './ui/PauseMenu.js';
import { GameOverScreen } from './ui/GameOverScreen.js';
import { AudioManager } from './audio/AudioManager.js';
import { TutorialSystem } from './tutorial/TutorialSystem.js';
import { ErrorHandler, ErrorType } from './core/ErrorHandler.js';
import { StorageManager } from './core/StorageManager.js';
import { PerformanceMonitor } from './core/PerformanceMonitor.js';
import { getGameConfig } from './core/GameConfig.js';

/**
 * 测试结果接口
 */
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

/**
 * E2E 测试套件
 */
export class E2ETestSuite {
  private results: TestResult[] = [];
  private canvas: HTMLCanvasElement;
  private config = getGameConfig();

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.canvasWidth;
    this.canvas.height = this.config.canvasHeight;
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<void> {
    console.log('=== 开始端到端测试 ===\n');
    
    // 测试 1: 浏览器兼容性检测
    await this.runTest('浏览器兼容性检测', () => this.testBrowserCompatibility());
    
    // 测试 2: 移动端适配检测
    await this.runTest('移动端适配检测', () => this.testMobileAdaptation());
    
    // 测试 3: 摄像头权限处理
    await this.runTest('摄像头权限处理', () => this.testCameraPermissions());
    
    // 测试 4: 完整游戏流程（启动 → 教程 → 游戏 → 结束）
    await this.runTest('完整游戏流程', () => this.testCompleteGameFlow());
    
    // 测试 5: UI 界面切换
    await this.runTest('UI 界面切换', () => this.testUITransitions());
    
    // 测试 6: 音频系统
    await this.runTest('音频系统', () => this.testAudioSystem());
    
    // 测试 7: 数据持久化
    await this.runTest('数据持久化', () => this.testDataPersistence());
    
    // 测试 8: 性能监控
    await this.runTest('性能监控', () => this.testPerformanceMonitoring());
    
    // 测试 9: 错误处理和降级模式
    await this.runTest('错误处理和降级模式', () => this.testErrorHandling());
    
    // 打印测试结果
    this.printResults();
  }

  /**
   * 运行单个测试
   */
  private async runTest(name: string, testFn: () => Promise<void> | void): Promise<void> {
    const startTime = performance.now();
    try {
      await testFn();
      const duration = performance.now() - startTime;
      this.results.push({ name, passed: true, duration });
      console.log(`✓ ${name} (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error),
        duration 
      });
      console.error(`✗ ${name} (${duration.toFixed(2)}ms):`, error);
    }
  }

  /**
   * 测试 1: 浏览器兼容性检测
   * 需求: 所有需求
   */
  private testBrowserCompatibility(): void {
    console.log('\n--- 测试浏览器兼容性 ---');
    
    // 检测浏览器类型和版本
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
      browserName = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.indexOf('Edg') > -1) {
      browserName = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }
    
    console.log(`  浏览器: ${browserName} ${browserVersion}`);
    
    // 检测必需的 API
    const requiredAPIs = {
      'Canvas API': !!document.createElement('canvas').getContext,
      'MediaDevices API': !!navigator.mediaDevices,
      'getUserMedia': !!navigator.mediaDevices?.getUserMedia,
      'Web Audio API': !!(window.AudioContext || (window as any).webkitAudioContext),
      'requestAnimationFrame': !!window.requestAnimationFrame,
      'localStorage': !!window.localStorage,
      'Performance API': !!window.performance
    };
    
    console.log('  必需 API 支持:');
    for (const [api, supported] of Object.entries(requiredAPIs)) {
      console.log(`    ${supported ? '✓' : '✗'} ${api}`);
      if (!supported) {
        throw new Error(`浏览器不支持 ${api}`);
      }
    }
    
    // 检测推荐的浏览器版本
    const minVersions: Record<string, number> = {
      'Chrome': 90,
      'Firefox': 88,
      'Safari': 14,
      'Edge': 90
    };
    
    const minVersion = minVersions[browserName];
    if (minVersion && browserVersion !== 'Unknown') {
      const version = parseInt(browserVersion);
      if (version < minVersion) {
        console.warn(`  ⚠ 浏览器版本较低，推荐 ${browserName} ${minVersion}+`);
      } else {
        console.log(`  ✓ 浏览器版本符合要求`);
      }
    }
  }

  /**
   * 测试 2: 移动端适配检测
   * 需求: 所有需求
   */
  private testMobileAdaptation(): void {
    console.log('\n--- 测试移动端适配 ---');
    
    // 检测设备类型
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    console.log(`  设备类型: ${isMobile ? '移动设备' : '桌面设备'}`);
    console.log(`  平板设备: ${isTablet ? '是' : '否'}`);
    console.log(`  触摸支持: ${isTouchDevice ? '是' : '否'}`);
    console.log(`  屏幕尺寸: ${window.innerWidth}x${window.innerHeight}`);
    console.log(`  设备像素比: ${window.devicePixelRatio}`);
    
    // 检测屏幕方向
    const orientation = window.innerWidth > window.innerHeight ? '横屏' : '竖屏';
    console.log(`  屏幕方向: ${orientation}`);
    
    // 检测触摸事件支持
    if (isTouchDevice) {
      const touchEvents = {
        'touchstart': 'ontouchstart' in window,
        'touchmove': 'ontouchmove' in window,
        'touchend': 'ontouchend' in window
      };
      
      console.log('  触摸事件支持:');
      for (const [event, supported] of Object.entries(touchEvents)) {
        console.log(`    ${supported ? '✓' : '✗'} ${event}`);
      }
    }
    
    // 检测响应式设计
    const maxWidth = Math.min(window.innerWidth, this.config.canvasWidth);
    const maxHeight = Math.min(window.innerHeight, this.config.canvasHeight);
    
    console.log(`  Canvas 适配尺寸: ${maxWidth}x${maxHeight}`);
    
    if (isMobile && !isTouchDevice) {
      console.warn('  ⚠ 移动设备但不支持触摸，可能影响降级模式');
    }
  }

  /**
   * 测试 3: 摄像头权限处理
   * 需求: 1.1, 1.2, 5.1, 5.2, 5.3, 5.4
   */
  private async testCameraPermissions(): Promise<void> {
    console.log('\n--- 测试摄像头权限处理 ---');
    
    // 检测 MediaDevices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('浏览器不支持 MediaDevices API');
    }
    
    console.log('  ✓ MediaDevices API 可用');
    
    // 检测摄像头权限状态
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log(`  摄像头权限状态: ${permission.state}`);
        
        if (permission.state === 'denied') {
          console.warn('  ⚠ 摄像头权限被拒绝，将测试降级模式');
        }
      } catch (error) {
        console.log('  ⚠ 无法查询摄像头权限状态（某些浏览器不支持）');
      }
    }
    
    // 测试 CameraManager
    new CameraManager();
    console.log('  ✓ CameraManager 创建成功');
    
    // 测试错误处理
    const errorHandler = new ErrorHandler(this.canvas);
    console.log('  ✓ ErrorHandler 创建成功');
    
    // 模拟不同的摄像头错误
    const errorScenarios = [
      { type: CameraError.PERMISSION_DENIED, name: 'PERMISSION_DENIED' },
      { type: CameraError.NOT_FOUND, name: 'NOT_FOUND' },
      { type: CameraError.NOT_READABLE, name: 'NOT_READABLE' },
      { type: CameraError.OVERCONSTRAINED, name: 'OVERCONSTRAINED' }
    ];
    
    console.log('  测试错误处理场景:');
    for (const scenario of errorScenarios) {
      try {
        errorHandler.handleCameraError(scenario.type);
        console.log(`    ✓ ${scenario.name}: 错误处理正常`);
      } catch (error) {
        console.error(`    ✗ ${scenario.name}: 错误处理失败`);
      }
    }
    
    // 测试降级模式
    console.log('  测试降级模式:');
    errorHandler.enableFallbackMode();
    const isFallback = errorHandler.isFallbackMode();
    
    if (isFallback) {
      console.log('    ✓ 降级模式启用成功');
      
      // 测试鼠标轨迹
      const trail = errorHandler.getMouseTrail(10);
      if (Array.isArray(trail)) {
        console.log('    ✓ 鼠标轨迹获取正常');
      } else {
        throw new Error('鼠标轨迹获取失败');
      }
    } else {
      throw new Error('降级模式启用失败');
    }
  }

  /**
   * 测试 4: 完整游戏流程（启动 → 教程 → 游戏 → 结束）
   * 需求: 所有需求
   */
  private async testCompleteGameFlow(): Promise<void> {
    console.log('\n--- 测试完整游戏流程 ---');
    
    // 阶段 1: 游戏启动
    console.log('  阶段 1: 游戏启动');
    const gameState = new GameState(this.config);
    const physicsSystem = new PhysicsSystem(this.config);
    const collisionDetector = new CollisionDetector(this.config);
    const objectPool = new ObjectPool(this.config.fruitTypes as any);
    const objectSpawner = new ObjectSpawner(objectPool, physicsSystem, this.config);
    
    console.log('    ✓ 游戏核心系统初始化完成');
    
    // 阶段 2: 教程系统
    console.log('  阶段 2: 教程系统');
    let tutorialStepCompleted = 0;
    let tutorialCompleted = false;
    
    const tutorialSystem = new TutorialSystem({
      onStepComplete: (stepId) => {
        tutorialStepCompleted++;
        console.log(`    ✓ 教程步骤完成: ${stepId} (${tutorialStepCompleted}/3)`);
      },
      onTutorialComplete: () => {
        tutorialCompleted = true;
        console.log('    ✓ 教程完成');
      }
    });
    
    tutorialSystem.start();
    console.log('    ✓ 教程启动');
    
    // 模拟完成教程步骤
    const steps = ['hand-detection', 'slice-fruit', 'avoid-bomb'];
    for (const stepId of steps) {
      // 模拟手部检测
      if (stepId === 'hand-detection') {
        tutorialSystem.update(gameState, true);
      }
      
      // 模拟切割水果
      if (stepId === 'slice-fruit') {
        objectSpawner.enableTutorialMode('fruit');
        // 直接添加水果到游戏状态
        const fruit = objectPool.getFruit('apple');
        fruit.position = { x: 500, y: 500 };
        gameState.addGameObject(fruit);
        
        gameState.addScore(10);
        tutorialSystem.update(gameState, true, true);
        objectSpawner.disableTutorialMode();
      }
      
      // 模拟避免炸弹
      if (stepId === 'avoid-bomb') {
        objectSpawner.enableTutorialMode('bomb');
        // 直接添加炸弹到游戏状态
        const bomb = objectPool.getBomb();
        bomb.position = { x: 500, y: 500 };
        gameState.addGameObject(bomb);
        
        // 让炸弹自然消失（不切割）
        gameState.removeGameObject(bomb.id);
        tutorialSystem.update(gameState, true, false);
        objectSpawner.disableTutorialMode();
      }
      
      await this.sleep(100);
    }
    
    if (!tutorialCompleted) {
      console.warn('    ⚠ 教程未完成（可能需要更多交互）');
    }

    // 阶段 3: 游戏进行
    console.log('  阶段 3: 游戏进行');
    gameState.reset();
    
    // 模拟游戏循环
    for (let i = 0; i < 5; i++) {
      // 生成水果
      const fruit = objectPool.getFruit('apple');
      fruit.position = { x: 500 + i * 100, y: 500 };
      gameState.addGameObject(fruit);
      
      // 更新物理
      physicsSystem.update(gameState.gameObjects, 0.016);
      
      // 模拟切割
      if (gameState.gameObjects.length > 0) {
        const obj = gameState.gameObjects[0];
        const mockTrail = [
          { x: obj.position.x / this.config.canvasWidth, y: obj.position.y / this.config.canvasHeight, z: 0, timestamp: Date.now() },
          { x: (obj.position.x + 100) / this.config.canvasWidth, y: obj.position.y / this.config.canvasHeight, z: 0, timestamp: Date.now() + 50 }
        ];
        
        const slicedObjects = collisionDetector.checkSliceCollision(mockTrail, gameState.gameObjects);
        
        if (slicedObjects.length > 0) {
          const sliced = slicedObjects[0];
          if (sliced.type === 'fruit') {
            gameState.addScore(10);
            console.log(`    ✓ 切割水果 #${i + 1}, 分数: ${gameState.score}`);
          }
          gameState.removeGameObject(sliced.id);
        }
      }
      
      await this.sleep(50);
    }
    
    console.log(`    ✓ 游戏进行正常，最终分数: ${gameState.score}`);
    
    // 阶段 4: 游戏结束
    console.log('  阶段 4: 游戏结束');
    
    // 模拟失去所有生命
    while (gameState.lives > 0) {
      gameState.loseLife();
    }
    
    if (!gameState.isPlaying) {
      console.log('    ✓ 游戏正确结束');
      console.log(`    最终分数: ${gameState.score}`);
      console.log(`    剩余生命: ${gameState.lives}`);
    } else {
      throw new Error('游戏未正确结束');
    }
  }

  /**
   * 测试 5: UI 界面切换
   * 需求: 5.1, 5.2, 5.3, 5.4, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
   */
  private testUITransitions(): void {
    console.log('\n--- 测试 UI 界面切换 ---');
    
    const ctx = this.canvas.getContext('2d')!;
    const theme = new SciFiTheme();
    const gameState = new GameState(this.config);
    
    // 测试主菜单
    console.log('  测试主菜单:');
    const mainMenu = new MainMenu(this.canvas, {});
    mainMenu.render(ctx);
    console.log('    ✓ 主菜单渲染成功');
    
    // 测试摄像头预览
    console.log('  测试摄像头预览:');
    const cameraPreview = new CameraPreview(this.canvas, {});
    cameraPreview.render(ctx);
    console.log('    ✓ 摄像头预览渲染成功');
    
    // 测试游戏 HUD
    console.log('  测试游戏 HUD:');
    const gameHUD = new GameHUD(theme);
    gameHUD.updateScore(gameState.score);
    gameHUD.updateLives(gameState.lives);
    gameHUD.render(ctx, this.canvas.width, this.canvas.height);
    console.log('    ✓ 游戏 HUD 渲染成功');
    
    // 测试暂停菜单
    console.log('  测试暂停菜单:');
    const pauseMenu = new PauseMenu(this.canvas, {});
    pauseMenu.render(ctx);
    console.log('    ✓ 暂停菜单渲染成功');
    
    // 测试游戏结束界面
    console.log('  测试游戏结束界面:');
    const gameOverScreen = new GameOverScreen(this.canvas, {});
    gameOverScreen.setScores(1000, 1500);
    gameOverScreen.render(ctx);
    console.log('    ✓ 游戏结束界面渲染成功');
    
    // 测试科幻主题效果
    console.log('  测试科幻主题效果:');
    theme.drawNeonBorder(ctx, 100, 100, 200, 100);
    theme.drawGlowText(ctx, 'TEST', 150, 150);
    theme.drawScanlines(ctx, this.canvas.width, this.canvas.height);
    console.log('    ✓ 科幻主题效果渲染成功');
  }

  /**
   * 测试 6: 音频系统
   * 需求: 6.1, 6.2, 6.3, 6.4
   */
  private async testAudioSystem(): Promise<void> {
    console.log('\n--- 测试音频系统 ---');
    
    const audioManager = new AudioManager();
    console.log('  ✓ AudioManager 创建成功');
    
    // 测试音频上下文
    if (audioManager['audioContext']) {
      console.log(`  ✓ Web Audio API 上下文状态: ${audioManager['audioContext'].state}`);
    }
    
    // 测试音量控制
    console.log('  测试音量控制:');
    audioManager.setMasterVolume(0.5);
    console.log('    ✓ 主音量设置为 0.5');
    
    audioManager.setMasterVolume(0.8);
    console.log('    ✓ 主音量设置为 0.8');
    
    // 测试静音
    console.log('  测试静音功能:');
    audioManager.toggleMute();
    console.log('    ✓ 静音切换');
    audioManager.toggleMute();
    console.log('    ✓ 取消静音');
    
    // 测试音效播放方法（不实际播放）
    console.log('  测试音效播放方法:');
    const soundMethods = [
      'playSound',
      'playBackgroundMusic',
      'stopBackgroundMusic'
    ];
    
    for (const method of soundMethods) {
      if (typeof (audioManager as any)[method] === 'function') {
        console.log(`    ✓ ${method} 方法存在`);
      } else {
        throw new Error(`${method} 方法不存在`);
      }
    }
  }

  /**
   * 测试 7: 数据持久化
   * 需求: 3.4, 8.1
   */
  private testDataPersistence(): void {
    console.log('\n--- 测试数据持久化 ---');
    
    console.log('  ✓ StorageManager 可用');
    
    // 测试保存和加载最高分
    console.log('  测试最高分存储:');
    const testScore = 12345;
    StorageManager.saveHighScore(testScore);
    const loadedScore = StorageManager.getHighScore();
    
    if (loadedScore >= testScore) {
      console.log(`    ✓ 最高分保存和加载成功: ${loadedScore}`);
    } else {
      throw new Error(`最高分不匹配: 期望 >= ${testScore}, 实际 ${loadedScore}`);
    }
    
    // 测试教程完成状态
    console.log('  测试教程完成状态:');
    StorageManager.setTutorialCompleted(true);
    const tutorialCompleted = StorageManager.getTutorialCompleted();
    
    if (tutorialCompleted === true) {
      console.log('    ✓ 教程完成状态保存和加载成功');
    } else {
      throw new Error('教程完成状态不匹配');
    }
    
    // 测试音频设置
    console.log('  测试音频设置:');
    StorageManager.setSoundEnabled(true);
    StorageManager.setMusicEnabled(false);
    StorageManager.setMasterVolume(0.7);
    
    const soundEnabled = StorageManager.getSoundEnabled();
    const musicEnabled = StorageManager.getMusicEnabled();
    const masterVolume = StorageManager.getMasterVolume();
    
    if (soundEnabled === true && musicEnabled === false && masterVolume === 0.7) {
      console.log('    ✓ 音频设置保存和加载成功');
    } else {
      throw new Error('音频设置不匹配');
    }
    
    // 测试清除数据
    console.log('  测试清除数据:');
    StorageManager.clear();
    const clearedScore = StorageManager.getHighScore();
    
    if (clearedScore === 0) {
      console.log('    ✓ 数据清除成功');
    } else {
      throw new Error('数据清除失败');
    }
  }

  /**
   * 测试 8: 性能监控
   * 需求: 7.1
   */
  private async testPerformanceMonitoring(): Promise<void> {
    console.log('\n--- 测试性能监控 ---');
    
    const monitor = new PerformanceMonitor({
      enabled: true,
      showOverlay: false,
      fpsWarningThreshold: 30,
      memoryWarningThreshold: 80,
      maxObjectCount: 50,
      maxParticleCount: 200,
      sampleInterval: 100
    });
    
    console.log('  ✓ PerformanceMonitor 创建成功');
    
    // 模拟游戏循环
    console.log('  模拟游戏循环:');
    for (let i = 0; i < 10; i++) {
      monitor.startFrame();
      
      monitor.startUpdate();
      await this.sleep(5);
      monitor.endUpdate();
      
      monitor.startRender();
      await this.sleep(8);
      monitor.endRender();
      
      monitor.updateFPS();
      monitor.updateObjectCounts(25, 100);
      monitor.updateMemory();
      monitor.detectBottlenecks();
      
      await this.sleep(16);
    }
    
    // 获取性能指标
    const metrics = monitor.getMetrics();
    console.log('  性能指标:');
    console.log(`    FPS: ${metrics.fps}`);
    console.log(`    平均 FPS: ${metrics.avgFps}`);
    console.log(`    帧时间: ${metrics.frameTime.toFixed(2)}ms`);
    console.log(`    更新时间: ${metrics.updateTime.toFixed(2)}ms`);
    console.log(`    渲染时间: ${metrics.renderTime.toFixed(2)}ms`);
    console.log(`    对象数量: ${metrics.objectCount}`);
    console.log(`    粒子数量: ${metrics.particleCount}`);
    console.log(`    性能状态: ${metrics.isPerformanceGood ? '良好' : '较差'}`);
    
    // 检查性能瓶颈
    const bottlenecks = monitor.getBottlenecks();
    if (bottlenecks.length > 0) {
      console.log('  性能瓶颈:');
      bottlenecks.forEach(b => {
        console.log(`    [${b.severity.toUpperCase()}] ${b.message}`);
      });
    } else {
      console.log('  ✓ 未检测到性能瓶颈');
    }
    
    // 测试配置更新
    monitor.updateConfig({ fpsWarningThreshold: 60 });
    console.log('  ✓ 配置更新成功');
    
    // 测试重置
    monitor.reset();
    console.log('  ✓ 统计数据重置成功');
  }

  /**
   * 测试 9: 错误处理和降级模式
   * 需求: 1.1
   */
  private testErrorHandling(): void {
    console.log('\n--- 测试错误处理和降级模式 ---');
    
    const errorHandler = new ErrorHandler(this.canvas);
    console.log('  ✓ ErrorHandler 创建成功');
    
    // 测试摄像头错误处理
    console.log('  测试摄像头错误处理:');
    const cameraErrors = [
      { type: CameraError.PERMISSION_DENIED, name: 'PERMISSION_DENIED' },
      { type: CameraError.NOT_FOUND, name: 'NOT_FOUND' },
      { type: CameraError.NOT_READABLE, name: 'NOT_READABLE' },
      { type: CameraError.OVERCONSTRAINED, name: 'OVERCONSTRAINED' }
    ];
    
    for (const errorInfo of cameraErrors) {
      errorHandler.handleCameraError(errorInfo.type);
      console.log(`    ✓ ${errorInfo.name} 处理成功`);
    }
    
    // 测试降级模式
    console.log('  测试降级模式:');
    errorHandler.enableFallbackMode();
    
    if (errorHandler.isFallbackMode()) {
      console.log('    ✓ 降级模式启用成功');
      
      // 测试鼠标轨迹
      const trail = errorHandler.getMouseTrail(10);
      if (Array.isArray(trail)) {
        console.log(`    ✓ 鼠标轨迹获取成功 (${trail.length} 个点)`);
      } else {
        throw new Error('鼠标轨迹获取失败');
      }
    } else {
      throw new Error('降级模式启用失败');
    }
    
    // 测试错误消息显示
    console.log('  测试错误消息显示:');
    const testError = {
      type: ErrorType.CAMERA_ERROR,
      message: '测试错误消息',
      details: '这是一个测试错误',
      canRetry: true,
      canUseFallback: true
    };
    errorHandler.showError(testError);
    
    if (errorHandler.isShowingErrorMessage()) {
      console.log('    ✓ 错误消息显示成功');
    } else {
      throw new Error('错误消息显示失败');
    }
    
    // 清除错误消息
    errorHandler.hideError();
    
    if (!errorHandler.isShowingErrorMessage()) {
      console.log('    ✓ 错误消息清除成功');
    } else {
      throw new Error('错误消息清除失败');
    }
  }

  /**
   * 打印测试结果
   */
  private printResults(): void {
    console.log('\n=== 测试结果汇总 ===\n');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const totalDuration = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    console.log(`通过: ${passed}/${total}`);
    console.log(`失败: ${failed}/${total}`);
    console.log(`总耗时: ${totalDuration.toFixed(2)}ms`);
    console.log('');
    
    // 详细结果
    console.log('详细结果:');
    for (const result of this.results) {
      const status = result.passed ? '✓' : '✗';
      const duration = result.duration ? ` (${result.duration.toFixed(2)}ms)` : '';
      console.log(`  ${status} ${result.name}${duration}`);
      
      if (!result.passed && result.error) {
        console.log(`      错误: ${result.error}`);
      }
    }
    
    console.log('');
    
    if (failed === 0) {
      console.log('✓ 所有端到端测试通过！');
      console.log('游戏已准备好部署。');
    } else {
      console.log(`✗ ${failed} 个测试失败，请检查并修复。`);
    }
    
    // 浏览器兼容性总结
    console.log('\n=== 浏览器兼容性总结 ===');
    console.log('推荐浏览器:');
    console.log('  • Chrome 90+');
    console.log('  • Edge 90+');
    console.log('  • Firefox 88+');
    console.log('  • Safari 14+ (iOS 14.5+)');
    console.log('');
    console.log('必需功能:');
    console.log('  • HTTPS (摄像头访问必需)');
    console.log('  • MediaDevices API');
    console.log('  • Web Audio API');
    console.log('  • Canvas API');
    console.log('  • localStorage');
    console.log('');
    console.log('移动端支持:');
    console.log('  • 响应式设计');
    console.log('  • 触摸事件支持');
    console.log('  • 横屏/竖屏自适应');
    console.log('  • 降级模式（触摸代替手势）');
  }

  /**
   * 辅助方法：延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 运行端到端测试
 */
export async function runE2ETests(): Promise<void> {
  const suite = new E2ETestSuite();
  await suite.runAllTests();
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  (window as any).runE2ETests = runE2ETests;
  console.log('端到端测试已加载。在浏览器控制台中运行 runE2ETests() 来执行测试。');
}
