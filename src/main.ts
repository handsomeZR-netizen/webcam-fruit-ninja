/**
 * 主应用入口
 * 需求: 1.1, 1.2, 2.1, 5.1
 */

import { getGameConfig } from './core/GameConfig.js';
import { GameState } from './game/GameState.js';
import { PhysicsSystem } from './game/PhysicsSystem.js';
import { CollisionDetector } from './game/CollisionDetector.js';
import { ObjectPool } from './game/ObjectPool.js';
import { ObjectSpawner } from './game/ObjectSpawner.js';
import { GameLoop } from './game/GameLoop.js';
import { MainMenu } from './ui/MainMenu.js';
import { Renderer } from './ui/Renderer.js';
import { CameraPreview } from './ui/CameraPreview.js';
import { CameraManager } from './gesture/CameraManager.js';
import { GestureTracker } from './gesture/GestureTracker.js';
import { AudioManager } from './audio/AudioManager.js';
import { SoundAssets } from './audio/SoundAssets.js';
import { TutorialSystem } from './tutorial/TutorialSystem.js';
import { ErrorHandler } from './core/ErrorHandler.js';

/**
 * 应用初始化
 */
async function init() {
  console.log('网页端水果忍者游戏启动中...');
  
  // 获取游戏配置
  const config = getGameConfig();
  console.log('游戏配置:', config);
  
  // 获取 Canvas 元素
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('无法找到 Canvas 元素');
    return;
  }
  
  // 设置 Canvas 尺寸
  canvas.width = config.canvasWidth;
  canvas.height = config.canvasHeight;
  
  // 获取渲染上下文
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('无法获取 Canvas 2D 上下文');
    return;
  }
  
  // 隐藏加载屏幕
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
  
  // 创建渲染器
  const renderer = new Renderer(canvas, config);
  
  // 创建错误处理器
  const errorHandler = new ErrorHandler(canvas);
  
  // 创建音频管理器
  const audioManager = new AudioManager();
  
  // 初始化音频系统
  console.log('正在加载音效...');
  try {
    // 创建临时音频上下文来生成音效
    const tempAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const soundBuffers = await SoundAssets.initializeAllSounds(tempAudioContext);
    audioManager.loadSoundBuffers(soundBuffers);
    console.log('音效加载完成');
  } catch (error) {
    console.warn('音效加载失败，游戏将在静音模式下运行:', error);
  }
  
  // 创建摄像头管理器和手势追踪器
  const cameraManager = new CameraManager();
  const gestureTracker = new GestureTracker();
  
  // 设置错误处理器回调
  errorHandler.setCallbacks({
    onRetry: () => {
      console.log('用户点击重试，重新初始化摄像头');
      audioManager.playSound('click');
      // 重新显示摄像头预览
      currentScreen = 'cameraPreview';
      renderCameraPreview();
      cameraPreview.initializeCamera(cameraManager, gestureTracker);
    },
    onUseFallback: () => {
      console.log('用户选择使用鼠标模式');
      audioManager.playSound('click');
      // 启动游戏（使用鼠标输入）
      currentScreen = 'game';
      startGame();
    },
    onDismiss: () => {
      console.log('用户关闭错误提示');
      audioManager.playSound('click');
      // 返回主菜单
      currentScreen = 'menu';
      cameraManager.stop();
      gestureTracker.stopTracking();
      renderMenu();
    }
  });
  
  // 创建摄像头预览界面
  const cameraPreview = new CameraPreview(canvas, {
    onStartGame: () => {
      console.log('从摄像头预览开始游戏');
      currentScreen = 'game';
      startGame();
    },
    onBackToMenu: () => {
      console.log('返回主菜单');
      currentScreen = 'menu';
      // 停止摄像头
      cameraManager.stop();
      gestureTracker.stopTracking();
      renderMenu();
    },
    onCameraReady: () => {
      console.log('摄像头已就绪，开始手势追踪');
      // 初始化手势追踪
      gestureTracker.initialize(cameraManager.getVideoElement(), config)
        .then(() => {
          gestureTracker.startTracking();
          console.log('手势追踪已启动');
        })
        .catch(error => {
          console.error('手势追踪初始化失败:', error);
        });
    },
    onCameraError: (error) => {
      console.error('摄像头错误:', error);
    },
    onButtonHover: () => {
      audioManager.playSound('hover');
    },
    onButtonClick: () => {
      audioManager.playSound('click');
    }
  });
  
  // 创建主菜单
  let currentScreen: 'menu' | 'cameraPreview' | 'game' | 'gameOver' = 'menu';
  let shouldStartTutorial = false;
  
  const mainMenu = new MainMenu(canvas, {
    onStartGame: () => {
      console.log('显示摄像头预览');
      audioManager.playSound('click');
      currentScreen = 'cameraPreview';
      shouldStartTutorial = false;
      renderCameraPreview();
      // 初始化摄像头
      cameraPreview.initializeCamera(cameraManager, gestureTracker);
    },
    onShowTutorial: () => {
      console.log('启动教程模式');
      audioManager.playSound('click');
      currentScreen = 'cameraPreview';
      shouldStartTutorial = true;
      renderCameraPreview();
      // 初始化摄像头
      cameraPreview.initializeCamera(cameraManager, gestureTracker);
    },
    onShowSettings: () => {
      console.log('显示设置');
      audioManager.playSound('click');
      // 设置功能暂时禁用
      console.log('设置功能即将推出');
    },
    onButtonHover: (buttonId) => {
      console.log('悬停按钮:', buttonId);
      audioManager.playSound('hover');
    },
    onButtonClick: (buttonId) => {
      console.log('点击按钮:', buttonId);
      audioManager.playSound('click');
    }
  });
  
  // 主菜单渲染循环
  function renderMenu() {
    if (currentScreen !== 'menu' || !ctx) {
      return;
    }
    
    // 清空并渲染背景
    renderer.clear();
    renderer.renderBackground();
    
    // 更新和渲染主菜单
    mainMenu.update();
    mainMenu.render(ctx);
    
    // 渲染错误处理器（如果有错误）
    errorHandler.update();
    errorHandler.render(ctx);
    
    // 继续渲染
    requestAnimationFrame(renderMenu);
  }
  
  // 摄像头预览渲染循环
  function renderCameraPreview() {
    if (currentScreen !== 'cameraPreview' || !ctx) {
      return;
    }
    
    // 清空并渲染背景
    renderer.clear();
    renderer.renderBackground();
    
    // 更新和渲染摄像头预览
    cameraPreview.update();
    cameraPreview.render(ctx);
    
    // 渲染错误处理器（如果有错误）
    errorHandler.update();
    errorHandler.render(ctx);
    
    // 继续渲染
    requestAnimationFrame(renderCameraPreview);
  }
  
  // 启动主菜单渲染
  renderMenu();
  
  console.log('主菜单已加载');
  
  // 游戏启动函数
  function startGame() {
    console.log('初始化游戏系统...');
    
    // 播放游戏开始音效
    audioManager.playSound('gameStart');
    
    // 开始播放背景音乐
    audioManager.playBackgroundMusic('bgMusic', true);
    
    // 初始化游戏系统
    const gameState = new GameState(config);
    const physicsSystem = new PhysicsSystem(config);
    const collisionDetector = new CollisionDetector(config);
    const objectPool = new ObjectPool(config.fruitTypes as any);
    const objectSpawner = new ObjectSpawner(objectPool, physicsSystem, config, {
      onObjectSpawned: (obj) => {
        console.log('生成对象:', obj.type, obj.id);
      }
    });
    
    // 设置特殊水果效果管理器到物理系统
    // 需求: 2.3 - 物理系统需要访问效果管理器以应用冰冻效果
    physicsSystem.setSpecialFruitEffectManager(gameState.specialFruitEffectManager);
    
    // 设置特殊水果效果管理器到对象生成器
    // 需求: 2.4 - 对象生成器需要访问效果管理器以应用狂暴效果
    objectSpawner.setSpecialFruitEffectManager(gameState.specialFruitEffectManager);
    
    // 设置难度管理器到物理系统
    // 需求: 3.2 - 物理系统需要访问难度管理器以应用速度倍率
    physicsSystem.setDifficultyManager(gameState.difficultyManager);
    
    // 设置难度管理器到对象生成器
    // 需求: 3.1 - 对象生成器需要访问难度管理器以应用生成速率倍率
    objectSpawner.setDifficultyManager(gameState.difficultyManager);
    
    // 初始化教程系统
    // 需求: 8.1, 8.3, 8.4 - 教程系统集成
    const tutorialSystem = new TutorialSystem({
      onStepComplete: (stepId) => {
        console.log('教程步骤完成:', stepId);
        audioManager.playSound('click');
      },
      onTutorialComplete: () => {
        console.log('教程完成！');
        audioManager.playSound('gameStart');
        // 教程完成后，禁用教程模式，开始正常游戏
        objectSpawner.disableTutorialMode();
      },
      onTutorialStart: () => {
        console.log('教程开始');
        audioManager.playSound('click');
      }
    });
    
    // 创建游戏循环
    const gameLoop = new GameLoop(
      canvas,
      gameState,
      physicsSystem,
      collisionDetector,
      objectSpawner,
      config,
      {
        onFruitSliced: (fruit, score) => {
          console.log('切割水果:', fruit.fruitType, '+' + score);
          // 播放切割音效
          audioManager.playSound('slice', 0.8);
        },
        onBombSliced: () => {
          console.log('切割炸弹！游戏结束');
          // 播放爆炸音效
          audioManager.playSound('explosion', 1.0);
          
          // 如果在教程模式，停止教程
          if (tutorialSystem.isActiveTutorial()) {
            tutorialSystem.stop();
          }
        },
        onFruitMissed: (fruit, livesRemaining) => {
          console.log('错过水果:', fruit.fruitType, '剩余生命:', livesRemaining);
          // 播放错过音效
          audioManager.playSound('miss', 0.6);
        },
        onGameOver: (finalScore, highScore) => {
          console.log('游戏结束！最终分数:', finalScore, '最高分:', highScore);
          
          // 停止背景音乐并播放游戏结束音效
          audioManager.stopBackgroundMusic();
          audioManager.playSound('gameOver');
          
          // 切换到游戏结束屏幕
          currentScreen = 'gameOver';
          
          // 渲染游戏结束界面
          const renderGameOver = () => {
            if (currentScreen !== 'gameOver' || !ctx) {
              return;
            }
            
            // 清空画布
            renderer.clear();
            renderer.renderBackground();
            
            // 显示游戏结束信息
            ctx.fillStyle = 'rgba(10, 14, 39, 0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = '64px Orbitron';
            ctx.fillStyle = '#FF0000';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 30;
            ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 80);
            
            ctx.font = '36px Orbitron';
            ctx.fillStyle = '#00FFFF';
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 20;
            ctx.fillText(`最终分数: ${finalScore}`, canvas.width / 2, canvas.height / 2);
            
            ctx.font = '28px Share Tech Mono';
            ctx.fillStyle = '#FF00FF';
            ctx.shadowColor = '#FF00FF';
            ctx.fillText(`最高分: ${highScore}`, canvas.width / 2, canvas.height / 2 + 50);
            
            ctx.font = '20px Share Tech Mono';
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowBlur = 10;
            ctx.fillText('按 ESC 返回主菜单', canvas.width / 2, canvas.height / 2 + 120);
            
            // 继续渲染
            requestAnimationFrame(renderGameOver);
          };
          
          // 开始渲染游戏结束界面
          renderGameOver();
          
          // 监听返回主菜单
          const returnToMenu = (e: KeyboardEvent) => {
            if (e.code === 'Escape') {
              audioManager.playSound('click');
              currentScreen = 'menu';
              gameLoop.stop();
              document.removeEventListener('keydown', returnToMenu);
              document.removeEventListener('keydown', gameControls);
              renderMenu();
            }
          };
          document.addEventListener('keydown', returnToMenu);
        }
      }
    );
    
    // 键盘控制
    const gameControls = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (gameState.isGameOver) {
          // 重新开始游戏
          audioManager.playSound('gameStart');
          audioManager.playBackgroundMusic('bgMusic', true);
          gameLoop.reset();
          gameLoop.start();
          console.log('游戏重新开始！');
        } else if (gameState.isPaused) {
          // 恢复游戏
          audioManager.playSound('click');
          gameLoop.resume();
        } else {
          // 暂停游戏
          audioManager.playSound('click');
          gameLoop.pause();
        }
      } else if (e.code === 'Escape' && !gameState.isGameOver) {
        // 返回主菜单
        audioManager.playSound('click');
        audioManager.stopBackgroundMusic();
        currentScreen = 'menu';
        gameLoop.stop();
        document.removeEventListener('keydown', gameControls);
        renderMenu();
      }
    };
    document.addEventListener('keydown', gameControls);
    
    // 设置手势追踪器、教程系统和错误处理器
    gameLoop.setGestureTracker(gestureTracker);
    gameLoop.setTutorialSystem(tutorialSystem);
    gameLoop.setErrorHandler(errorHandler);
    
    // 检查是否需要启动教程
    // 需求: 8.1 - WHEN 玩家首次访问游戏时，THE 教学系统 SHALL 自动启动交互式教程
    // 需求: 8.5 - THE 游戏系统 SHALL 在主菜单提供重新观看教程的选项
    if (shouldStartTutorial || tutorialSystem.isFirstVisit()) {
      console.log('启动教程...');
      tutorialSystem.start();
    }
    
    // 开始游戏
    gameLoop.start();
    console.log('游戏已启动！按空格键暂停/恢复，按 ESC 返回主菜单');
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
