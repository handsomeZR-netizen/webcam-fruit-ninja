# 游戏功能增强实现任务

## 第一批任务（P0 - 最重要，立即实现）

- [x] 1. 实现连击系统核心逻辑





  - 创建 `src/game/ComboSystem.ts` 文件
  - 实现连击计数器（comboCount）和超时逻辑（2秒超时）
  - 实现分数倍率计算方法 `getScoreMultiplier()`
  - 实现 `recordSlice()` 方法记录成功切割
  - 实现 `resetCombo()` 方法重置连击
  - 实现 `update()` 方法检查超时
  - 实现 `checkMilestone()` 方法检测里程碑（5/10/20连击）
  - _需求: 1.1, 1.2, 1.3, 1.4, 1.5_
-

- [x] 2. 集成连击系统到游戏循环




  - 在 `GameState` 中添加 `comboSystem: ComboSystem` 属性
  - 在 `GameState` 构造函数中初始化连击系统
  - 在 `GameState.reset()` 中重置连击系统
  - 在 `GameLoop.handleSlicedObjects()` 中调用 `comboSystem.recordSlice()`
  - 在 `GameLoop.handleSlicedObjects()` 中应用分数倍率到水果分数
  - 在 `GameLoop.update()` 中调用 `comboSystem.update()`
  - 在切割炸弹时调用 `comboSystem.resetCombo()`
  - 在错过水果时调用 `comboSystem.resetCombo()`
  - _需求: 1.1, 1.2, 1.3, 1.4_
- [ ] 3. 实现连击 HUD 显示






- [ ] 3. 实现连击 HUD 显示

  - 创建 `src/ui/ComboCounterHUD.ts` 文件
  - 实现 `render()` 方法在屏幕顶部中央显示连击数
  - 实现颜色渐变逻辑：3-5连击绿色、6-10蓝色、11-19紫色、20+金色
  - 显示格式："连击 x{count} | {multiplier}x"
  - 仅在连击数 >= 3 时显示
  - 在 `GameLoop.render()` 中调用 `comboCounterHUD.render()`
  - _需求: 1.5_

- [x] 4. 实现黄金水果（最简单的特殊水果）





  - 创建 `src/game/SpecialFruit.ts` 文件
  - 定义 `SpecialFruitType` 枚举（golden, frozen, frenzy）
  - 实现 `SpecialFruit` 类继承自 `Fruit`
  - 重写 `onSliced()` 方法处理特殊效果
  - 为黄金水果添加金色视觉标识（颜色 #FFD700）
  - 在 `ObjectPool` 中添加特殊水果对象池
  - 在 `ObjectSpawner.spawnFruit()` 中以 5% 概率生成黄金水果
  - 在 `GameLoop.handleSlicedObjects()` 中处理黄金水果双倍分数
  - _需求: 2.1, 2.2, 2.6_

## 第二批任务（P1 - 重要，尽快实现）

- [x] 5. 实现浮动分数文本





  - 创建 `src/ui/FloatingScoreManager.ts` 文件
  - 定义 `FloatingScoreText` 接口（分数、位置、透明度、生命周期）
  - 实现 `createFloatingScore()` 方法创建浮动文本
  - 实现 `update()` 方法更新所有浮动文本（上浮动画、透明度渐变）
  - 实现 `render()` 方法渲染所有浮动文本
  - 限制最多 10 个浮动文本（使用对象池）
  - 在 `GameLoop.handleSlicedObjects()` 中创建浮动分数
  - 在 `GameLoop.render()` 中调用 `floatingScoreManager.render()`
  - _需求: 4.1_


- [x] 6. 实现特殊水果效果管理器




  - 创建 `src/game/SpecialFruitEffectManager.ts` 文件
  - 定义 `SpecialFruitEffect` 接口（类型、持续时间、开始时间、是否激活）
  - 实现 `activateEffect()` 方法激活特殊效果
  - 实现 `update()` 方法更新效果状态和检查过期
  - 实现 `isEffectActive()` 方法检查效果是否激活
  - 实现 `getRemainingTime()` 方法获取剩余时间
  - 在 `GameState` 中添加 `specialFruitEffectManager` 属性
  - _需求: 2.3, 2.4_
-

- [x] 7. 实现冰冻水果




  - 在 `SpecialFruit` 中添加冰冻水果类型
  - 为冰冻水果添加蓝色冰晶视觉效果（颜色 #00BFFF）
  - 在 `ObjectSpawner.spawnFruit()` 中添加冰冻水果生成逻辑
  - 在 `SpecialFruit.onSliced()` 中激活冰冻效果（持续 3 秒）
  - 在 `PhysicsSystem.update()` 中检查冰冻效果并降低速度 50%
  - 在 `GameLoop.update()` 中调用 `specialFruitEffectManager.update()`
  - _需求: 2.1, 2.3, 2.6_
-

- [x] 8. 实现狂暴水果




  - 在 `SpecialFruit` 中添加狂暴水果类型
  - 为狂暴水果添加红色火焰视觉效果（颜色 #FF4500）
  - 在 `ObjectSpawner.spawnFruit()` 中添加狂暴水果生成逻辑
  - 在 `SpecialFruit.onSliced()` 中激活狂暴效果（持续 5 秒）
  - 在 `ObjectSpawner.getRandomSpawnInterval()` 中检查狂暴效果并提高生成频率 100%
  - _需求: 2.1, 2.4, 2.6_

## 第三批任务（P1-P2 - 有时间再做）

- [x] 9. 实现动态难度系统核心




  - 创建 `src/game/DifficultyManager.ts` 文件
  - 定义 `DifficultyConfig` 接口
  - 实现难度等级计算逻辑（基于分数阈值）
  - 实现 `getSpawnRateMultiplier()` 方法（每 100 分提升 10%，上限 200%）
  - 实现 `getSpeedMultiplier()` 方法（每 200 分提升 5%，上限 150%）
  - 实现 `update()` 方法根据当前分数更新难度
  - 实现 `reset()` 方法重置难度
  - 在 `GameState` 中添加 `difficultyManager` 属性
  - _需求: 3.1, 3.2, 3.3, 3.4_

- [x] 10. 集成动态难度系统




  - 在 `GameLoop.update()` 中调用 `difficultyManager.update(gameState.score)`
  - 在 `ObjectSpawner.getRandomSpawnInterval()` 中应用生成速率倍率
  - 在 `PhysicsSystem.generateThrowParams()` 中应用速度倍率
  - 在难度升级时触发视觉通知（可选）
  - _需求: 3.1, 3.2_


- [x] 11. 优化特殊水果视觉效果




  - 为黄金水果添加闪烁效果
  - 为冰冻水果添加冰晶粒子效果
  - 为狂暴水果添加火焰粒子效果
  - 优化渲染性能（使用简单几何图形）
  - _需求: 2.6_

- [x] 12. 实现连击里程碑动画





  - 创建 `src/ui/ComboMilestoneAnimator.ts` 文件
  - 定义 `ComboMilestone` 接口
  - 实现 5 连击脉冲动画（绿色光环）
  - 实现 10 连击爆炸动画（蓝色粒子）
  - 实现 20 连击彩虹动画（全屏闪烁）
  - 在 `GameLoop.update()` 中检测里程碑并触发动画
  - 在 `GameLoop.render()` 中渲染动画
  - _需求: 4.2_

## 第四批任务（P2-P3 - 可选，不着急）


- [x] 13. 实现特殊效果指示器




  - 创建 `src/ui/EffectIndicatorRenderer.ts` 文件
  - 定义 `EffectIndicator` 接口
  - 实现效果指示器渲染（屏幕边缘显示）
  - 显示效果图标和剩余时间倒计时
  - 冰冻效果：左上角，蓝色边框，雪花图标
  - 狂暴效果：右上角，红色边框，火焰图标
  - 在 `GameLoop.render()` 中调用渲染器
  - _需求: 4.3_

- [x] 14. 实现难度提升通知





  - 创建难度提升视觉通知组件
  - 在难度等级提升时显示通知消息
  - 显示当前难度等级
  - 实现淡入淡出动画
  - _需求: 3.5_
-

- [x] 15. 实现成就系统核心





  - 创建 `src/game/AchievementTracker.ts` 文件
  - 定义 `PlayerStats` 接口（总切割数、最高连击、游戏时长等）
  - 定义 `Achievement` 接口（ID、名称、描述、解锁条件）
  - 创建 `src/game/AchievementDefinitions.ts` 定义 5 个成就
  - 实现统计数据追踪方法（recordFruitSliced、updateMaxCombo 等）
  - 实现 `checkAchievements()` 方法检查解锁条件
  - 实现 `save()` 和 `load()` 方法（本地存储）
  - 实现数据验证逻辑
  - _需求: 5.1, 5.2, 5.3, 5.5_

- [x] 16. 集成成就系统






  - 在 `GameState` 中添加 `achievementTracker` 属性
  - 在 `GameLoop.handleSlicedObjects()` 中记录水果切割
  - 在 `GameLoop.update()` 中更新游戏时长
  - 在 `ComboSystem` 中更新最高连击
  - 游戏开始时调用 `recordGameStart()`
  - 游戏结束时检查是否为完美游戏
  - 定期调用 `checkAchievements()` 检查新解锁
  - _需求: 5.1, 5.2_
-

- [x] 17. 实现成就通知 UI





  - 创建 `src/ui/AchievementNotificationRenderer.ts` 文件
  - 定义 `AchievementNotification` 接口
  - 实现成就通知显示（右下角）
  - 实现滑入动画（从右侧滑入）
  - 显示成就图标、名称和描述
  - 显示时长 3 秒后淡出
  - 在 `GameLoop.render()` 中渲染通知
  - _需求: 5.4_

## 配置任务（贯穿所有阶段）

- [x] 18. 扩展游戏配置






  - 在 `src/core/GameConfig.ts` 中添加新配置项
  - 添加 `combo` 配置（超时时间、阈值、最大倍率）
  - 添加 `specialFruit` 配置（生成概率、效果参数）
  - 添加 `difficulty` 配置（阈值、增幅、上限）
  - 添加 `visualFeedback` 配置（动画时长、显示参数）
  - 添加 `achievements` 配置（启用开关、检查间隔）
  - 设置所有默认值
  - _需求: 所有需求_

## 测试任务（可选）

-

- [ ] 19. 编写单元测试





  - 为 ComboSystem 编写单元测试
  - 为 SpecialFruitEffectManager 编写单元测试
  - 为 DifficultyManager 编写单元测试
  - 为 AchievementTracker 编写单元测试
  - 测试边界条件和错误处理

- [x] 20. 性能测试和优化








  - 使用 PerformanceMonitor 监控新功能性能
  - 确保帧率保持在 30+ FPS
  - 优化浮动分数渲染
  - 优化粒子效果
  - 实现性能降级策略
