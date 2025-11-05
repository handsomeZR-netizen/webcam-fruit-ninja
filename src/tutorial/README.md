# 教程系统 (Tutorial System)

教程系统提供了一个交互式的三步教程，引导新玩家学习游戏操作。

## 功能特性

- **自动检测首次访问**: 首次访问时自动启动教程
- **三步教程流程**: 手势识别 → 切割水果 → 避免炸弹
- **正向反馈**: 完成每个步骤时显示成功动画
- **进度指示器**: 显示当前步骤和总体进度
- **本地存储**: 保存教程完成状态
- **重新观看**: 支持从主菜单重新观看教程

## 使用示例

```typescript
import { TutorialSystem } from './tutorial';
import { GameState } from './game/GameState';

// 创建教程系统
const tutorialSystem = new TutorialSystem({
  onStepComplete: (stepId) => {
    console.log(`步骤完成: ${stepId}`);
    // 播放成功音效
    audioManager.playSound('step_complete');
  },
  onTutorialComplete: () => {
    console.log('教程完成！');
    // 返回主菜单或开始游戏
    showMainMenu();
  },
  onTutorialStart: () => {
    console.log('教程开始');
    // 初始化教程模式的游戏状态
  }
});

// 检查是否首次访问
if (tutorialSystem.isFirstVisit()) {
  tutorialSystem.start();
}

// 在游戏循环中更新教程
function gameLoop() {
  // ... 其他游戏逻辑
  
  if (tutorialSystem.isActiveTutorial()) {
    // 更新教程状态
    tutorialSystem.update(
      gameState,
      handDetected,  // 是否检测到手部
      fruitSliced    // 是否刚刚切割了水果
    );
    
    // 渲染教程UI
    tutorialSystem.render(ctx, canvas.width, canvas.height);
  }
}

// 从主菜单重新观看教程
function onTutorialButtonClick() {
  tutorialSystem.resetTutorialProgress();
  tutorialSystem.start();
}
```

## 教程步骤

### 步骤 1: 手势识别 (HandDetectionStep)
- **目标**: 让玩家将手放在摄像头前
- **完成条件**: 持续检测到手部 2 秒
- **提示**: 显示手部图标和检测进度条

### 步骤 2: 切割水果 (SliceFruitStep)
- **目标**: 教导玩家如何切割水果
- **完成条件**: 成功切割 3 个水果
- **提示**: 显示切割动作示意和进度

### 步骤 3: 避免炸弹 (AvoidBombStep)
- **目标**: 教导玩家避免切割炸弹
- **完成条件**: 成功避开 2 个炸弹
- **提示**: 显示炸弹警告和禁止符号

## API 参考

### TutorialSystem

#### 构造函数
```typescript
constructor(callbacks?: TutorialSystemCallbacks)
```

#### 方法

- `start()`: 启动教程
- `stop()`: 停止教程
- `update(gameState, handDetected?, fruitSliced?)`: 更新教程状态
- `render(ctx, canvasWidth, canvasHeight)`: 渲染教程UI
- `isActiveTutorial()`: 检查教程是否激活
- `isFirstVisit()`: 检查是否首次访问
- `isTutorialCompleted()`: 检查教程是否已完成
- `resetTutorialProgress()`: 重置教程进度（用于重新观看）
- `getCurrentStep()`: 获取当前步骤
- `getCurrentStepIndex()`: 获取当前步骤索引
- `getTotalSteps()`: 获取总步骤数

### TutorialSystemCallbacks

```typescript
interface TutorialSystemCallbacks {
  onStepComplete?: (stepId: string) => void;
  onTutorialComplete?: () => void;
  onTutorialStart?: () => void;
}
```

## 集成到游戏流程

教程系统设计为与游戏主循环无缝集成：

1. **初始化阶段**: 创建 TutorialSystem 实例
2. **启动检查**: 检查 `isFirstVisit()` 决定是否自动启动
3. **游戏循环**: 在每帧调用 `update()` 和 `render()`
4. **教程模式**: 在教程激活时，可以调整游戏生成逻辑（如只生成水果，不生成炸弹等）
5. **完成处理**: 在 `onTutorialComplete` 回调中处理教程完成后的逻辑

## 本地存储

教程系统使用 localStorage 保存完成状态：

- **键名**: `fruitNinja_tutorialCompleted`
- **值**: `'true'` 或不存在
- **用途**: 检测是否首次访问

## 注意事项

1. 教程系统依赖 GameState 来检查游戏状态
2. 需要在游戏循环中传递手势检测和切割事件
3. 教程完成反馈动画持续 2 秒
4. 所有步骤都使用 SciFiTheme 进行渲染
