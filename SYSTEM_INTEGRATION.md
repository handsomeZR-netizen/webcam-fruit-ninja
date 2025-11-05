# 系统集成文档

本文档描述了网页端水果忍者游戏中所有系统的连接和集成方式。

## 系统架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        主应用 (main.ts)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────────────────────┐
                              │                                 │
                    ┌─────────▼─────────┐           ┌──────────▼──────────┐
                    │   游戏循环         │           │   UI 系统           │
                    │  (GameLoop)        │◄──────────┤  (Renderer, HUD)    │
                    └─────────┬─────────┘           └─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌───────▼────────┐
│  手势识别系统   │   │   游戏状态系统   │   │   音频系统      │
│ (GestureTracker)│   │  (GameState)    │   │ (AudioManager) │
└───────┬────────┘   └────────┬────────┘   └───────┬────────┘
        │                     │                     │
        │            ┌────────▼────────┐            │
        │            │   物理系统       │            │
        │            │ (PhysicsSystem) │            │
        │            └────────┬────────┘            │
        │                     │                     │
        │            ┌────────▼────────┐            │
        └───────────►│   碰撞检测       │            │
                     │(CollisionDetector)│           │
                     └────────┬────────┘            │
                              │                     │
                     ┌────────▼────────┐            │
                     │   对象生成器     │            │
                     │ (ObjectSpawner) │            │
                     └────────┬────────┘            │
                              │                     │
                     ┌────────▼────────┐            │
                     │   教程系统       │◄───────────┘
                     │(TutorialSystem) │
                     └─────────────────┘
```

## 1. 手势识别 → 碰撞检测连接

**位置**: `src/game/GameLoop.ts` (update 方法)

**连接方式**:
```typescript
// 获取手部轨迹
const handTrail = this.gestureTracker.getHandTrail();

// 传递给碰撞检测系统
if (handTrail.length >= 2) {
  const slicedObjects = this.collisionDetector.checkSliceCollision(
    handTrail,
    this.gameState.getAliveObjects()
  );
  this.handleSlicedObjects(slicedObjects);
}
```

**降级模式支持**:
```typescript
// 检查是否使用鼠标降级模式
if (this.errorHandler && this.errorHandler.isFallbackMode()) {
  if (this.errorHandler.isSlicing()) {
    const mouseTrail = this.errorHandler.getMouseTrail(10);
    handTrail = mouseTrail.map((pos: any) => ({
      x: pos.x,
      y: pos.y,
      z: 0,
      timestamp: pos.timestamp
    }));
  }
}
```

**需求**: 1.4 - 手部轨迹与水果对象相交时触发切割动作

## 2. 游戏事件 → 音频播放连接

**位置**: `src/main.ts` (startGame 函数)

**连接方式**:
```typescript
const gameLoop = new GameLoop(
  canvas,
  gameState,
  physicsSystem,
  collisionDetector,
  objectSpawner,
  config,
  {
    onFruitSliced: (fruit, score) => {
      audioManager.playSound('slice', 0.8);
    },
    onBombSliced: () => {
      audioManager.playSound('explosion', 1.0);
    },
    onFruitMissed: (fruit, livesRemaining) => {
      audioManager.playSound('miss', 0.6);
    },
    onGameOver: (finalScore, highScore) => {
      audioManager.stopBackgroundMusic();
      audioManager.playSound('gameOver');
    }
  }
);
```

**UI 音效连接**:
```typescript
// 主菜单按钮音效
const mainMenu = new MainMenu(canvas, {
  onButtonHover: (buttonId) => {
    audioManager.playSound('hover');
  },
  onButtonClick: (buttonId) => {
    audioManager.playSound('click');
  }
});

// 摄像头预览界面音效
const cameraPreview = new CameraPreview(canvas, {
  onButtonHover: () => {
    audioManager.playSound('hover');
  },
  onButtonClick: () => {
    audioManager.playSound('click');
  }
});
```

**需求**: 6.1, 6.2, 6.3 - 播放切割、爆炸、错过音效

## 3. 游戏状态 → UI 更新连接

**位置**: `src/game/GameLoop.ts` (renderHUD 方法)

**连接方式**:
```typescript
private renderHUD(): void {
  // 更新 HUD 数据
  this.gameHUD.updateScore(this.gameState.score);
  this.gameHUD.updateLives(this.gameState.lives);
  this.gameHUD.updateHighScore(this.gameState.highScore);

  // 渲染 HUD
  this.gameHUD.render(this.ctx, this.canvas.width, this.canvas.height);
}
```

**游戏状态变化**:
```typescript
// 切割水果 → 增加分数
this.gameState.addScore(this.config.fruitScore);

// 错过水果 → 减少生命值
this.gameState.loseLife();

// 生命值为 0 → 游戏结束
if (this.gameState.isGameOver) {
  this.handleGameOver();
}
```

**需求**: 3.3 - 实时显示当前分数和剩余生命值

## 4. 教程系统 → 游戏流程集成

**位置**: `src/main.ts` 和 `src/game/GameLoop.ts`

### 4.1 教程系统初始化

```typescript
// 创建教程系统
const tutorialSystem = new TutorialSystem({
  onStepComplete: (stepId) => {
    console.log('教程步骤完成:', stepId);
    audioManager.playSound('click');
  },
  onTutorialComplete: () => {
    console.log('教程完成！');
    audioManager.playSound('gameStart');
    objectSpawner.disableTutorialMode();
  },
  onTutorialStart: () => {
    console.log('教程开始');
    audioManager.playSound('click');
  }
});

// 设置到游戏循环
gameLoop.setTutorialSystem(tutorialSystem);
```

### 4.2 教程模式游戏逻辑

**位置**: `src/game/GameLoop.ts` (updateTutorialMode 方法)

```typescript
private updateTutorialMode(deltaTime: number): void {
  const currentStep = this.tutorialSystem.getCurrentStep();
  
  // 根据当前教程步骤配置对象生成器
  if (currentStep.targetAction === 'slice_fruit') {
    this.objectSpawner.enableTutorialMode('fruit');
  } else if (currentStep.targetAction === 'avoid_bomb') {
    this.objectSpawner.enableTutorialMode('bomb');
  } else {
    this.objectSpawner.stop();
  }
  
  // 更新教程系统
  const handDetected = this.gestureTracker ? 
    this.gestureTracker.getCurrentHandPosition() !== null : false;
  this.tutorialSystem.update(this.gameState, handDetected, this.lastFruitSliced);
}
```

### 4.3 教程启动逻辑

```typescript
// 检查是否需要启动教程
if (shouldStartTutorial || tutorialSystem.isFirstVisit()) {
  console.log('启动教程...');
  tutorialSystem.start();
}
```

**需求**: 8.1, 8.3, 8.4 - 教程系统集成到游戏流程

## 5. 教程系统 → 对象生成器连接

**位置**: `src/game/ObjectSpawner.ts`

**连接方式**:
```typescript
// 启用教程模式
enableTutorialMode(spawnType: 'fruit' | 'bomb'): void {
  this.tutorialMode = true;
  this.tutorialSpawnType = spawnType;
}

// 在生成对象时检查教程模式
private spawnObject(): GameObject {
  if (this.tutorialMode && this.tutorialSpawnType) {
    if (this.tutorialSpawnType === 'bomb') {
      return this.spawnBomb();
    } else {
      return this.spawnFruit();
    }
  }
  // 正常模式逻辑...
}
```

**需求**: 8.3 - 在教程模式下生成特定的水果和炸弹

## 6. 错误处理器 → 降级模式连接

**位置**: `src/core/ErrorHandler.ts` 和 `src/game/GameLoop.ts`

### 6.1 错误处理器设置

```typescript
// 设置错误处理器回调
errorHandler.setCallbacks({
  onRetry: () => {
    console.log('用户点击重试，重新初始化摄像头');
    audioManager.playSound('click');
    cameraPreview.initializeCamera(cameraManager, gestureTracker);
  },
  onUseFallback: () => {
    console.log('用户选择使用鼠标模式');
    audioManager.playSound('click');
    currentScreen = 'game';
    startGame();
  },
  onDismiss: () => {
    console.log('用户关闭错误提示');
    audioManager.playSound('click');
    currentScreen = 'menu';
    renderMenu();
  }
});

// 设置到游戏循环
gameLoop.setErrorHandler(errorHandler);
```

### 6.2 鼠标降级模式

```typescript
// 启用降级模式
enableFallbackMode(): void {
  this.mouseFallback.isActive = true;
  this.hideError();
}

// 获取鼠标轨迹
getMouseTrail(frames: number = 10): Array<{ x: number; y: number; timestamp: number }> {
  return this.mouseFallback.trail.slice(-frames);
}

// 检查是否正在切割
isSlicing(): boolean {
  return this.mouseFallback.isSlicing;
}
```

### 6.3 游戏循环中使用降级模式

```typescript
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
```

**需求**: 1.1 - 实现降级模式（使用鼠标代替手势）

## 7. 完整游戏流程测试

**测试文件**: `src/test-connections.ts`

测试覆盖:
1. ✓ 手势识别 → 碰撞检测连接
2. ✓ 游戏事件 → 音频播放连接
3. ✓ 游戏状态 → UI 更新连接
4. ✓ 教程系统 → 游戏流程集成
5. ✓ 游戏循环集成所有系统
6. ✓ 错误处理器 → 降级模式连接
7. ✓ 教程模式 → 对象生成器连接

## 8. 系统连接验证清单

- [x] 手势识别事件连接到碰撞检测
- [x] 游戏事件连接到音频播放
- [x] 游戏状态连接到 UI 更新
- [x] 教程系统集成到游戏流程
- [x] 教程系统控制对象生成器
- [x] 错误处理器提供降级模式
- [x] 降级模式集成到游戏循环
- [x] 所有回调函数正确设置
- [x] 音效在所有交互点播放
- [x] UI 实时反映游戏状态变化

## 9. 关键集成点

### 9.1 主应用入口 (src/main.ts)
- 初始化所有系统
- 设置系统间的回调连接
- 管理游戏流程状态

### 9.2 游戏循环 (src/game/GameLoop.ts)
- 协调所有系统的更新
- 处理正常模式和教程模式
- 支持手势和鼠标降级模式

### 9.3 教程系统 (src/tutorial/TutorialSystem.ts)
- 管理教程步骤
- 控制对象生成
- 提供视觉指引

### 9.4 错误处理器 (src/core/ErrorHandler.ts)
- 处理摄像头错误
- 提供鼠标降级模式
- 显示用户友好的错误消息

## 10. 性能优化

所有系统连接都经过优化:
- 使用事件回调避免轮询
- 最小化系统间的耦合
- 支持降级模式确保可用性
- 教程模式独立于正常游戏逻辑

## 总结

所有系统已成功连接并集成到完整的游戏流程中。每个系统都通过明确的接口和回调机制进行通信，确保了代码的可维护性和可扩展性。
