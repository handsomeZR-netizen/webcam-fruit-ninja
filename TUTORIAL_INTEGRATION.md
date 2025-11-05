# 教程系统集成文档

## 概述

本文档描述了任务 8.3"集成教程到游戏流程"的实现细节。

## 实现的功能

### 1. 教程模式对象生成 (ObjectSpawner)

**文件**: `src/game/ObjectSpawner.ts`

**新增功能**:
- 添加了 `tutorialMode` 和 `tutorialSpawnType` 属性来控制教程模式
- `enableTutorialMode(spawnType)`: 启用教程模式，指定生成水果或炸弹
- `disableTutorialMode()`: 禁用教程模式
- `isTutorialMode()`: 检查是否处于教程模式
- 修改 `spawnObject()` 方法，在教程模式下根据指定类型生成对象

**需求满足**: 8.3 - 在教程模式下生成特定的水果和炸弹

### 2. 游戏循环教程集成 (GameLoop)

**文件**: `src/game/GameLoop.ts`

**新增功能**:
- 添加 `tutorialSystem` 属性和 `lastFruitSliced` 标志
- `setTutorialSystem(tutorialSystem)`: 设置教程系统实例
- `updateTutorialMode(deltaTime)`: 教程模式专用更新逻辑
  - 根据当前教程步骤配置对象生成器
  - 手势识别步骤：不生成对象
  - 切割水果步骤：只生成水果
  - 避免炸弹步骤：只生成炸弹
- `handleSlicedObjectsTutorial(slicedObjects)`: 教程模式切割处理
  - 不计分，但触发粒子效果
  - 切到炸弹会停止教程但不结束游戏
- `handleOutOfBoundsObjectsTutorial()`: 教程模式边界处理
  - 对象离开屏幕不减少生命值
  - 炸弹离开屏幕时通知教程系统（成功避开）
- 修改 `update()` 方法，检测教程模式并调用专用逻辑
- 修改 `render()` 方法，渲染教程UI
- 修改 `reset()` 方法，重置时禁用教程模式

**需求满足**: 8.3 - 暂停正常游戏逻辑，等待玩家完成教程动作

### 3. 主应用教程流程 (main.ts)

**文件**: `src/main.ts`

**新增功能**:
- 导入 `TutorialSystem`
- 在 `startGame()` 中初始化教程系统，配置回调：
  - `onStepComplete`: 步骤完成时播放音效
  - `onTutorialComplete`: 教程完成时禁用教程模式，开始正常游戏
  - `onTutorialStart`: 教程开始时播放音效
- 设置教程系统到游戏循环
- 检查首次访问或手动启动教程
- 修改主菜单回调：
  - `onShowTutorial`: 启动教程模式而不是显示占位符
  - 添加 `shouldStartTutorial` 标志控制教程启动

**需求满足**: 
- 8.1 - 首次访问自动启动教程
- 8.3 - 教程完成后保存状态到本地存储（通过 TutorialSystem 实现）
- 8.4 - 步骤完成提供正向反馈
- 8.5 - 主菜单提供重新观看教程选项

## 教程流程

### 步骤 1: 手势识别
- 不生成任何对象
- 等待玩家将手放在摄像头前
- 检测到手部后持续2秒完成

### 步骤 2: 切割水果
- 只生成水果对象
- 玩家需要切割3个水果
- 每次切割触发粒子效果和音效
- 不计分，不减少生命值

### 步骤 3: 避免炸弹
- 只生成炸弹对象
- 玩家需要避开2个炸弹（让它们自然落下）
- 切到炸弹会停止教程
- 炸弹离开屏幕计为成功避开

### 教程完成
- 保存完成状态到 localStorage
- 禁用教程模式
- 继续正常游戏流程

## 技术细节

### 教程模式与正常模式的区别

| 特性 | 正常模式 | 教程模式 |
|------|---------|---------|
| 对象生成 | 随机水果和炸弹 | 根据步骤指定类型 |
| 切割水果 | 增加分数 | 不计分 |
| 错过水果 | 减少生命值 | 不减少生命值 |
| 切到炸弹 | 游戏结束 | 停止教程 |
| 炸弹离开屏幕 | 无影响 | 计为成功避开 |

### 状态管理

- 教程完成状态存储在 `localStorage` 的 `fruitNinja_tutorialCompleted` 键
- 通过 `TutorialSystem.isFirstVisit()` 检查是否首次访问
- 通过 `TutorialSystem.resetTutorialProgress()` 可重置教程状态

## 测试建议

1. **首次访问测试**: 清除 localStorage，刷新页面，验证教程自动启动
2. **步骤完成测试**: 完成每个教程步骤，验证正向反馈和自动进入下一步
3. **教程重新观看**: 从主菜单选择教程选项，验证可以重新观看
4. **教程完成保存**: 完成教程后刷新页面，验证不再自动启动教程
5. **切到炸弹测试**: 在避免炸弹步骤切到炸弹，验证教程停止但游戏继续

## 相关文件

- `src/game/ObjectSpawner.ts` - 对象生成器教程模式
- `src/game/GameLoop.ts` - 游戏循环教程集成
- `src/main.ts` - 主应用教程流程
- `src/tutorial/TutorialSystem.ts` - 教程系统核心
- `src/tutorial/HandDetectionStep.ts` - 手势识别步骤
- `src/tutorial/SliceFruitStep.ts` - 切割水果步骤
- `src/tutorial/AvoidBombStep.ts` - 避免炸弹步骤
