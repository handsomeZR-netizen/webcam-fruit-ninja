# 游戏功能增强设计文档

## 概述

本设计文档详细说明了水果忍者游戏的五个核心功能增强：连击系统、特殊水果类型、动态难度递增、增强视觉反馈和成就系统基础。这些增强功能将集成到现有的游戏架构中，利用已有的 GameState、GameLoop、ObjectSpawner 和渲染系统。

设计目标：
- 最小化对现有代码的侵入性修改
- 保持游戏性能（维持 30+ FPS）
- 提供清晰的视觉反馈
- 确保数据持久化和状态管理的可靠性

## 架构

### 系统集成概览

新功能将通过以下方式集成到现有架构：

```
GameLoop (主循环)
├── GameState (游戏状态) + ComboSystem (新增)
├── ObjectSpawner (对象生成器) + SpecialFruitFactory (新增)
├── DifficultyManager (新增)
├── AchievementTracker (新增)
└── Renderer + EnhancedVisualFeedback (新增)
```

### 设计原则

1. **模块化**: 每个新功能作为独立模块，可单独启用/禁用
2. **性能优先**: 所有新功能必须在性能预算内（不影响 30 FPS 目标）
3. **向后兼容**: 不破坏现有游戏功能
4. **可测试性**: 每个模块提供清晰的接口用于测试

## 组件和接口

### 1. 连击系统 (ComboSystem)

**职责**: 追踪玩家连续切割水果的次数，计算分数倍率，管理连击超时

**位置**: `src/game/ComboSystem.ts`

**接口设计**:

```typescript
interface ComboSystemConfig {
  comboTimeout: number;        // 连击超时时间（毫秒），默认 2000
  comboThreshold: number;      // 开始应用倍率的最小连击数，默认 3
  maxMultiplier: number;       // 最大分数倍率，默认 5.0
}

class ComboSystem {
  private comboCount: number;
  private lastSliceTime: number;
  private config: ComboSystemConfig;
  
  constructor(config: ComboSystemConfig);
  
  // 记录一次成功切割
  recordSlice(): void;
  
  // 重置连击计数
  resetCombo(): void;
  
  // 更新连击状态（检查超时）
  update(currentTime: number): void;
  
  // 获取当前连击数
  getComboCount(): number;
  
  // 获取当前分数倍率
  getScoreMultiplier(): number;
  
  // 检查是否达到里程碑
  checkMilestone(): number | null; // 返回 5, 10, 20 或 null
}
```

**集成点**:
- 在 `GameState` 中添加 `comboSystem: ComboSystem` 属性
- 在 `GameLoop.handleSlicedObjects()` 中调用 `comboSystem.recordSlice()`
- 在 `GameLoop.update()` 中调用 `comboSystem.update()`
- 切割炸弹或错过水果时调用 `comboSystem.resetCombo()`

**分数倍率计算逻辑**:
```
multiplier = 1.0 + (comboCount - comboThreshold) * 0.1
multiplier = min(multiplier, maxMultiplier)
```

例如：
- 3 连击: 1.0x
- 5 连击: 1.2x
- 10 连击: 1.7x
- 20+ 连击: 2.7x (上限 5.0x)


### 2. 特殊水果系统 (SpecialFruitSystem)

**职责**: 定义特殊水果类型，管理特殊效果的激活和持续时间

**位置**: 
- `src/game/SpecialFruit.ts` (特殊水果类)
- `src/game/SpecialFruitEffect.ts` (效果管理器)

**特殊水果类型**:

1. **黄金水果 (Golden Fruit)**
   - 视觉: 金色光泽，闪烁效果
   - 效果: 切割时获得 2x 分数
   - 颜色代码: `#FFD700`

2. **冰冻水果 (Frozen Fruit)**
   - 视觉: 蓝色冰晶外观
   - 效果: 所有水果速度降低 50%，持续 3 秒
   - 颜色代码: `#00BFFF`

3. **狂暴水果 (Frenzy Fruit)**
   - 视觉: 红色火焰效果
   - 效果: 水果生成频率提高 100%，持续 5 秒
   - 颜色代码: `#FF4500`

**接口设计**:

```typescript
enum SpecialFruitType {
  GOLDEN = 'golden',
  FROZEN = 'frozen',
  FRENZY = 'frenzy'
}

interface SpecialFruitEffect {
  type: SpecialFruitType;
  duration: number;      // 效果持续时间（毫秒）
  startTime: number;     // 效果开始时间
  isActive: boolean;
}

class SpecialFruit extends Fruit {
  specialType: SpecialFruitType;
  
  constructor(type: SpecialFruitType);
  
  // 重写切割方法以触发特殊效果
  onSliced(qualityMultiplier: number): void;
}

class SpecialFruitEffectManager {
  private activeEffects: Map<SpecialFruitType, SpecialFruitEffect>;
  
  // 激活特殊效果
  activateEffect(type: SpecialFruitType, duration: number): void;
  
  // 更新效果状态
  update(currentTime: number): void;
  
  // 检查效果是否激活
  isEffectActive(type: SpecialFruitType): boolean;
  
  // 获取效果剩余时间
  getRemainingTime(type: SpecialFruitType): number;
  
  // 获取所有激活的效果
  getActiveEffects(): SpecialFruitEffect[];
}
```

**集成点**:
- 在 `ObjectPool` 中添加特殊水果对象池
- 在 `ObjectSpawner.spawnFruit()` 中以 5% 概率生成特殊水果
- 在 `GameState` 中添加 `specialFruitEffectManager: SpecialFruitEffectManager`
- 在 `GameLoop.handleSlicedObjects()` 中处理特殊水果效果
- 在 `PhysicsSystem.update()` 中应用冰冻效果（速度调整）
- 在 `ObjectSpawner.getRandomSpawnInterval()` 中应用狂暴效果（生成频率调整）

**生成逻辑**:
```typescript
// 在 ObjectSpawner.spawnFruit() 中
const shouldSpawnSpecial = Math.random() < 0.05; // 5% 概率
if (shouldSpawnSpecial) {
  const specialTypes = [SpecialFruitType.GOLDEN, SpecialFruitType.FROZEN, SpecialFruitType.FRENZY];
  const randomType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
  return this.objectPool.getSpecialFruit(randomType);
}
```


### 3. 动态难度系统 (DifficultyManager)

**职责**: 根据玩家分数动态调整游戏难度参数

**位置**: `src/game/DifficultyManager.ts`

**接口设计**:

```typescript
interface DifficultyConfig {
  scoreThresholdForSpawnRate: number;    // 生成速率提升的分数阈值，默认 100
  scoreThresholdForSpeed: number;        // 速度提升的分数阈值，默认 200
  spawnRateIncrement: number;            // 生成速率增幅百分比，默认 0.1 (10%)
  speedIncrement: number;                // 速度增幅百分比，默认 0.05 (5%)
  maxSpawnRateMultiplier: number;        // 最大生成速率倍率，默认 2.0 (200%)
  maxSpeedMultiplier: number;            // 最大速度倍率，默认 1.5 (150%)
}

class DifficultyManager {
  private config: DifficultyConfig;
  private currentLevel: number;
  private lastLevelUpScore: number;
  
  constructor(config: DifficultyConfig);
  
  // 根据当前分数更新难度
  update(currentScore: number): boolean; // 返回是否升级
  
  // 获取生成速率倍率
  getSpawnRateMultiplier(): number;
  
  // 获取速度倍率
  getSpeedMultiplier(): number;
  
  // 获取当前难度等级
  getDifficultyLevel(): number;
  
  // 重置难度
  reset(): void;
}
```

**难度计算逻辑**:

```typescript
// 生成速率倍率
const spawnRateLevels = Math.floor(currentScore / scoreThresholdForSpawnRate);
spawnRateMultiplier = 1.0 + (spawnRateLevels * spawnRateIncrement);
spawnRateMultiplier = Math.min(spawnRateMultiplier, maxSpawnRateMultiplier);

// 速度倍率
const speedLevels = Math.floor(currentScore / scoreThresholdForSpeed);
speedMultiplier = 1.0 + (speedLevels * speedIncrement);
speedMultiplier = Math.min(speedMultiplier, maxSpeedMultiplier);

// 难度等级（用于显示）
difficultyLevel = Math.max(spawnRateLevels, speedLevels);
```

**集成点**:
- 在 `GameState` 中添加 `difficultyManager: DifficultyManager`
- 在 `GameLoop.update()` 中调用 `difficultyManager.update(gameState.score)`
- 在 `ObjectSpawner.getRandomSpawnInterval()` 中应用生成速率倍率
- 在 `PhysicsSystem.generateThrowParams()` 中应用速度倍率
- 难度升级时触发视觉通知

**示例难度进程**:
- 0-99 分: 等级 0，无加成
- 100-199 分: 等级 1，生成速率 +10%
- 200-299 分: 等级 2，生成速率 +20%，速度 +5%
- 400-499 分: 等级 4，生成速率 +40%，速度 +10%
- 1000+ 分: 等级 10，生成速率 +100% (上限 200%)，速度 +25% (上限 150%)


### 4. 增强视觉反馈系统 (EnhancedVisualFeedback)

**职责**: 提供丰富的视觉反馈，包括浮动分数、连击动画、效果指示器

**位置**: `src/ui/EnhancedVisualFeedback.ts`

**组件**:

#### 4.1 浮动分数文本 (FloatingScoreText)

```typescript
interface FloatingScoreText {
  score: number;
  x: number;
  y: number;
  opacity: number;
  lifetime: number;      // 显示时长（毫秒），默认 1000
  startTime: number;
  color: string;
  isAlive: boolean;
}

class FloatingScoreManager {
  private floatingTexts: FloatingScoreText[];
  
  // 创建浮动分数文本
  createFloatingScore(score: number, x: number, y: number, color?: string): void;
  
  // 更新所有浮动文本
  update(deltaTime: number): void;
  
  // 渲染所有浮动文本
  render(ctx: CanvasRenderingContext2D): void;
}
```

**动画效果**:
- 文本从切割位置向上漂浮 50 像素
- 透明度从 1.0 渐变到 0.0
- 字体大小根据分数值缩放（基础 24px，高分 36px）

#### 4.2 连击里程碑动画 (ComboMilestoneAnimation)

```typescript
interface ComboMilestone {
  comboCount: number;
  animationType: 'pulse' | 'explosion' | 'rainbow';
  duration: number;
  startTime: number;
}

class ComboMilestoneAnimator {
  private currentAnimation: ComboMilestone | null;
  
  // 触发里程碑动画
  triggerMilestone(comboCount: number): void;
  
  // 更新动画
  update(deltaTime: number): void;
  
  // 渲染动画
  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void;
}
```

**里程碑定义**:
- 5 连击: 脉冲动画，绿色光环
- 10 连击: 爆炸动画，蓝色粒子
- 20 连击: 彩虹动画，全屏闪烁

#### 4.3 特殊效果指示器 (EffectIndicator)

```typescript
interface EffectIndicator {
  type: SpecialFruitType;
  remainingTime: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  color: string;
  icon: string;
}

class EffectIndicatorRenderer {
  // 渲染所有激活的效果指示器
  renderIndicators(
    ctx: CanvasRenderingContext2D,
    activeEffects: SpecialFruitEffect[],
    canvasWidth: number,
    canvasHeight: number
  ): void;
}
```

**指示器布局**:
- 冰冻效果: 左上角，蓝色边框，雪花图标
- 狂暴效果: 右上角，红色边框，火焰图标
- 显示剩余时间倒计时

#### 4.4 连击计数器 HUD (ComboCounterHUD)

```typescript
class ComboCounterHUD {
  // 渲染连击计数器
  render(
    ctx: CanvasRenderingContext2D,
    comboCount: number,
    multiplier: number,
    canvasWidth: number
  ): void;
}
```

**显示规则**:
- 位置: 屏幕顶部中央
- 颜色渐变:
  - 3-5 连击: 绿色 (#00FF00)
  - 6-10 连击: 蓝色 (#00BFFF)
  - 11-19 连击: 紫色 (#9370DB)
  - 20+ 连击: 金色 (#FFD700)
- 显示格式: "连击 x{count} | {multiplier}x"
- 仅在连击数 >= 3 时显示

**集成点**:
- 在 `GameLoop.render()` 中调用各个渲染器
- 在 `GameLoop.handleSlicedObjects()` 中创建浮动分数
- 连击里程碑达成时触发动画
- 特殊效果激活时显示指示器


### 5. 成就系统 (AchievementSystem)

**职责**: 追踪玩家统计数据，管理成就解锁，提供持久化存储

**位置**: 
- `src/game/AchievementTracker.ts` (成就追踪器)
- `src/game/AchievementDefinitions.ts` (成就定义)

**接口设计**:

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: PlayerStats) => boolean;
  unlocked: boolean;
  unlockedAt?: number; // 时间戳
}

interface PlayerStats {
  totalFruitsSliced: number;
  totalBombsHit: number;
  maxCombo: number;
  totalPlayTime: number;        // 毫秒
  gamesPlayed: number;
  perfectGames: number;          // 无失误游戏次数
  fastestTwentySlices: number;  // 切割 20 个水果的最快时间（毫秒）
}

class AchievementTracker {
  private stats: PlayerStats;
  private achievements: Map<string, Achievement>;
  private newlyUnlocked: Achievement[];
  
  constructor();
  
  // 更新统计数据
  recordFruitSliced(): void;
  recordBombHit(): void;
  updateMaxCombo(combo: number): void;
  updatePlayTime(deltaTime: number): void;
  recordGameStart(): void;
  recordPerfectGame(): void;
  updateFastestTwentySlices(time: number): void;
  
  // 检查成就解锁
  checkAchievements(): Achievement[];
  
  // 获取所有成就
  getAllAchievements(): Achievement[];
  
  // 获取统计数据
  getStats(): PlayerStats;
  
  // 保存到本地存储
  save(): void;
  
  // 从本地存储加载
  load(): void;
  
  // 重置统计（用于测试）
  reset(): void;
}
```

**成就定义**:

```typescript
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_slice',
    name: '首次切割',
    description: '切割你的第一个水果',
    icon: '🍉',
    condition: (stats) => stats.totalFruitsSliced >= 1,
    unlocked: false
  },
  {
    id: 'combo_master',
    name: '连击大师',
    description: '达到 10 连击',
    icon: '⚡',
    condition: (stats) => stats.maxCombo >= 10,
    unlocked: false
  },
  {
    id: 'fruit_killer',
    name: '水果杀手',
    description: '累计切割 100 个水果',
    icon: '🔪',
    condition: (stats) => stats.totalFruitsSliced >= 100,
    unlocked: false
  },
  {
    id: 'perfectionist',
    name: '完美主义者',
    description: '完成一局游戏不失误（不错过水果，不切炸弹）',
    icon: '💎',
    condition: (stats) => stats.perfectGames >= 1,
    unlocked: false
  },
  {
    id: 'speed_king',
    name: '速度之王',
    description: '在 30 秒内切割 20 个水果',
    icon: '👑',
    condition: (stats) => stats.fastestTwentySlices > 0 && stats.fastestTwentySlices <= 30000,
    unlocked: false
  }
];
```

**成就通知 UI**:

```typescript
interface AchievementNotification {
  achievement: Achievement;
  displayTime: number;
  startTime: number;
  isVisible: boolean;
}

class AchievementNotificationRenderer {
  private notifications: AchievementNotification[];
  
  // 显示成就通知
  showNotification(achievement: Achievement): void;
  
  // 更新通知状态
  update(deltaTime: number): void;
  
  // 渲染通知
  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void;
}
```

**通知样式**:
- 位置: 屏幕右下角
- 显示时长: 3 秒
- 动画: 从右侧滑入，停留，淡出
- 内容: 成就图标 + 名称 + 描述

**集成点**:
- 在 `GameState` 中添加 `achievementTracker: AchievementTracker`
- 在 `GameLoop.handleSlicedObjects()` 中记录水果切割
- 在 `GameLoop.update()` 中更新游戏时长
- 在 `ComboSystem` 中更新最大连击
- 游戏开始时调用 `recordGameStart()`
- 游戏结束时检查是否为完美游戏
- 每帧调用 `checkAchievements()` 检查新解锁

**本地存储格式**:
```json
{
  "stats": {
    "totalFruitsSliced": 150,
    "totalBombsHit": 5,
    "maxCombo": 15,
    "totalPlayTime": 3600000,
    "gamesPlayed": 10,
    "perfectGames": 2,
    "fastestTwentySlices": 25000
  },
  "achievements": {
    "first_slice": { "unlocked": true, "unlockedAt": 1699123456789 },
    "combo_master": { "unlocked": true, "unlockedAt": 1699123567890 },
    "fruit_killer": { "unlocked": true, "unlockedAt": 1699124567890 },
    "perfectionist": { "unlocked": false },
    "speed_king": { "unlocked": false }
  }
}
```

存储键: `fruitNinja_achievements`


## 数据模型

### ComboSystem 状态

```typescript
{
  comboCount: number;           // 当前连击数
  lastSliceTime: number;        // 上次切割时间戳
  currentMultiplier: number;    // 当前分数倍率
  isActive: boolean;            // 连击是否激活
}
```

### SpecialFruitEffect 状态

```typescript
{
  type: 'golden' | 'frozen' | 'frenzy';
  duration: number;             // 效果持续时间（毫秒）
  startTime: number;            // 效果开始时间戳
  isActive: boolean;            // 效果是否激活
  remainingTime: number;        // 剩余时间（毫秒）
}
```

### DifficultyManager 状态

```typescript
{
  currentLevel: number;         // 当前难度等级
  spawnRateMultiplier: number;  // 生成速率倍率
  speedMultiplier: number;      // 速度倍率
  lastLevelUpScore: number;     // 上次升级时的分数
}
```

### PlayerStats 数据模型

```typescript
{
  totalFruitsSliced: number;
  totalBombsHit: number;
  maxCombo: number;
  totalPlayTime: number;
  gamesPlayed: number;
  perfectGames: number;
  fastestTwentySlices: number;
}
```

### Achievement 数据模型

```typescript
{
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}
```

## 错误处理

### 1. 本地存储失败

**场景**: 浏览器禁用本地存储或存储空间已满

**处理策略**:
- 捕获 `localStorage` 异常
- 降级到内存存储（仅当前会话有效）
- 向用户显示警告消息
- 记录错误日志

```typescript
try {
  localStorage.setItem('fruitNinja_achievements', JSON.stringify(data));
} catch (error) {
  console.warn('Failed to save achievements:', error);
  // 使用内存存储作为后备
  this.memoryStorage = data;
}
```

### 2. 性能降级

**场景**: 帧率低于 30 FPS

**处理策略**:
- 禁用部分视觉效果（浮动分数、粒子效果）
- 降低特殊水果生成概率
- 简化连击动画
- 通过 `PerformanceMonitor` 自动调整

```typescript
if (performanceMonitor.getCurrentFPS() < 30) {
  // 禁用浮动分数
  floatingScoreManager.disable();
  // 降低粒子质量
  particleQuality = 0.5;
}
```

### 3. 数据验证

**场景**: 从本地存储加载的数据损坏或格式错误

**处理策略**:
- 验证数据结构和类型
- 使用默认值替换无效数据
- 记录验证错误

```typescript
function validatePlayerStats(data: any): PlayerStats {
  return {
    totalFruitsSliced: typeof data.totalFruitsSliced === 'number' ? data.totalFruitsSliced : 0,
    totalBombsHit: typeof data.totalBombsHit === 'number' ? data.totalBombsHit : 0,
    maxCombo: typeof data.maxCombo === 'number' ? data.maxCombo : 0,
    totalPlayTime: typeof data.totalPlayTime === 'number' ? data.totalPlayTime : 0,
    gamesPlayed: typeof data.gamesPlayed === 'number' ? data.gamesPlayed : 0,
    perfectGames: typeof data.perfectGames === 'number' ? data.perfectGames : 0,
    fastestTwentySlices: typeof data.fastestTwentySlices === 'number' ? data.fastestTwentySlices : 0
  };
}
```

### 4. 连击超时边界情况

**场景**: 游戏暂停或标签页失焦导致时间跳跃

**处理策略**:
- 限制 `deltaTime` 最大值
- 暂停时冻结连击计时器
- 恢复时重置连击状态

```typescript
update(currentTime: number): void {
  if (this.isPaused) return;
  
  const timeSinceLastSlice = currentTime - this.lastSliceTime;
  if (timeSinceLastSlice > this.config.comboTimeout) {
    this.resetCombo();
  }
}
```


## 测试策略

### 单元测试

**ComboSystem 测试**:
- 测试连击计数递增
- 测试连击超时重置
- 测试分数倍率计算
- 测试里程碑检测

**SpecialFruitEffectManager 测试**:
- 测试效果激活和过期
- 测试多个效果同时激活
- 测试效果剩余时间计算

**DifficultyManager 测试**:
- 测试难度等级计算
- 测试倍率上限
- 测试难度重置

**AchievementTracker 测试**:
- 测试统计数据更新
- 测试成就解锁条件
- 测试本地存储保存/加载
- 测试数据验证

### 集成测试

**游戏流程测试**:
1. 启动游戏 → 切割水果 → 验证连击系统激活
2. 连续切割 → 验证分数倍率应用
3. 切割特殊水果 → 验证效果激活和视觉反馈
4. 达到分数阈值 → 验证难度提升
5. 解锁成就 → 验证通知显示和数据保存

**性能测试**:
- 同时激活所有效果时的帧率
- 大量浮动分数文本时的性能
- 连击动画播放时的性能
- 本地存储读写性能

### 手动测试场景

1. **连击系统**:
   - 连续快速切割 5 个水果，验证连击计数和倍率
   - 停止切割 2 秒，验证连击重置
   - 切割炸弹，验证连击立即重置

2. **特殊水果**:
   - 切割黄金水果，验证双倍分数
   - 切割冰冻水果，验证所有水果减速
   - 切割狂暴水果，验证生成频率提高

3. **难度递增**:
   - 达到 100 分，验证水果生成加快
   - 达到 200 分，验证水果速度提高
   - 达到 1000 分，验证难度上限

4. **视觉反馈**:
   - 切割水果，验证浮动分数显示
   - 达到 5/10/20 连击，验证里程碑动画
   - 激活特殊效果，验证效果指示器

5. **成就系统**:
   - 切割第一个水果，验证"首次切割"解锁
   - 达到 10 连击，验证"连击大师"解锁
   - 刷新页面，验证成就数据持久化

### 边界条件测试

- 连击数达到极大值（100+）
- 同时激活所有特殊效果
- 难度等级达到上限
- 本地存储已满
- 浏览器禁用本地存储
- 游戏暂停/恢复时的状态保持


## 性能考虑

### 性能预算

基于现有游戏的性能目标（30+ FPS），为新功能分配性能预算：

| 功能 | 每帧预算 | 优化策略 |
|------|---------|---------|
| ComboSystem.update() | < 0.5ms | 简单计算，无复杂逻辑 |
| SpecialFruitEffectManager.update() | < 0.5ms | 最多 3 个激活效果 |
| DifficultyManager.update() | < 0.2ms | 仅在分数变化时计算 |
| FloatingScoreManager.render() | < 2ms | 限制最多 10 个浮动文本 |
| ComboMilestoneAnimator.render() | < 3ms | 使用简单几何图形，避免复杂路径 |
| EffectIndicatorRenderer.render() | < 1ms | 最多 3 个指示器 |
| AchievementTracker.checkAchievements() | < 1ms | 仅检查未解锁成就 |

**总计**: < 8.2ms/帧（约占 33ms 帧预算的 25%）

### 优化策略

#### 1. 对象池化

```typescript
// 复用浮动分数对象
class FloatingScorePool {
  private pool: FloatingScoreText[] = [];
  
  acquire(): FloatingScoreText {
    return this.pool.pop() || this.createNew();
  }
  
  release(text: FloatingScoreText): void {
    text.isAlive = false;
    this.pool.push(text);
  }
}
```

#### 2. 延迟计算

```typescript
// 仅在需要时计算分数倍率
getScoreMultiplier(): number {
  if (this.comboCount < this.config.comboThreshold) {
    return 1.0;
  }
  // 缓存计算结果
  if (this.cachedMultiplier === null) {
    this.cachedMultiplier = this.calculateMultiplier();
  }
  return this.cachedMultiplier;
}
```

#### 3. 批量渲染

```typescript
// 批量渲染所有浮动分数，减少状态切换
render(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.font = '24px Orbitron';
  ctx.textAlign = 'center';
  
  for (const text of this.floatingTexts) {
    if (!text.isAlive) continue;
    ctx.globalAlpha = text.opacity;
    ctx.fillStyle = text.color;
    ctx.fillText(`+${text.score}`, text.x, text.y);
  }
  
  ctx.restore();
}
```

#### 4. 限制更新频率

```typescript
// 成就检查每秒一次而非每帧
private lastCheckTime: number = 0;
private checkInterval: number = 1000; // 1 秒

update(currentTime: number): void {
  if (currentTime - this.lastCheckTime < this.checkInterval) {
    return;
  }
  this.lastCheckTime = currentTime;
  this.checkAchievements();
}
```

#### 5. 条件渲染

```typescript
// 仅在连击激活时渲染连击 HUD
render(ctx: CanvasRenderingContext2D): void {
  if (this.comboCount < 3) {
    return; // 不渲染
  }
  // 渲染连击 HUD
}
```

### 内存管理

**预期内存占用**:
- ComboSystem: ~100 bytes
- SpecialFruitEffectManager: ~500 bytes
- DifficultyManager: ~200 bytes
- FloatingScoreManager: ~2KB (10 个浮动文本)
- AchievementTracker: ~5KB (统计数据 + 成就定义)
- 本地存储: ~10KB

**总计**: ~18KB（可忽略不计）

### 渲染优化

**Canvas 优化技巧**:
1. 使用 `requestAnimationFrame` 而非 `setInterval`
2. 最小化 `save()`/`restore()` 调用
3. 批量设置相同的绘图状态
4. 避免频繁改变 `globalAlpha`
5. 使用整数坐标避免子像素渲染

**示例**:
```typescript
// 优化前
for (const text of texts) {
  ctx.save();
  ctx.globalAlpha = text.opacity;
  ctx.fillStyle = text.color;
  ctx.fillText(text.content, text.x, text.y);
  ctx.restore();
}

// 优化后
ctx.save();
for (const text of texts) {
  ctx.globalAlpha = text.opacity;
  ctx.fillStyle = text.color;
  ctx.fillText(text.content, Math.round(text.x), Math.round(text.y));
}
ctx.restore();
```


## 实现顺序和依赖关系

### 优先级说明

**P0 (最高优先级)**: 核心玩法增强，直接影响游戏体验
**P1 (高优先级)**: 重要的视觉反馈，提升用户体验
**P2 (中优先级)**: 锦上添花的功能
**P3 (低优先级)**: 可选功能，不影响核心体验

### 阶段 1: 连击系统 (P0 - 最重要)

**为什么优先**: 连击系统是最核心的玩法增强，直接提升游戏趣味性和挑战性

**模块 1.1: ComboSystem 核心逻辑**
- 实现连击计数和超时逻辑
- 实现分数倍率计算
- 添加到 GameState
- **不包含**: UI 显示

**模块 1.2: ComboSystem 集成**
- 在 GameLoop.handleSlicedObjects() 中记录切割
- 在 GameLoop.update() 中更新连击状态
- 应用分数倍率到切割分数
- 处理连击重置（炸弹、错过水果）

**模块 1.3: 连击 HUD 显示 (P1)**
- 实现 ComboCounterHUD 类
- 在屏幕顶部显示连击数和倍率
- 实现颜色渐变（绿→蓝→紫→金）
- 集成到 GameLoop.render()

**模块 1.4: 浮动分数文本 (P1)**
- 实现 FloatingScoreManager 类
- 在切割位置显示分数
- 实现上浮和淡出动画
- 集成到 GameLoop.render()

### 阶段 2: 特殊水果系统 (P0 - 重要)

**为什么优先**: 增加游戏多样性，与连击系统配合效果好

**模块 2.1: 黄金水果 (最简单，先实现)**
- 定义 SpecialFruitType 枚举
- 实现 SpecialFruit 类（仅黄金水果）
- 修改 ObjectPool 支持特殊水果
- 修改 ObjectSpawner 生成逻辑（5% 概率）
- 实现双倍分数效果

**模块 2.2: 冰冻水果**
- 实现 SpecialFruitEffectManager 类
- 添加冰冻水果类型
- 实现冰冻效果（速度降低 50%）
- 在 PhysicsSystem.update() 中应用效果
- 添加效果过期逻辑

**模块 2.3: 狂暴水果**
- 添加狂暴水果类型
- 实现狂暴效果（生成频率提高）
- 在 ObjectSpawner.getRandomSpawnInterval() 中应用效果

**模块 2.4: 特殊水果视觉效果 (P1)**
- 为每种特殊水果添加独特视觉标识
- 实现闪烁/光晕效果
- 优化渲染性能

**模块 2.5: 效果指示器 (P2)**
- 实现 EffectIndicatorRenderer 类
- 在屏幕边缘显示激活的效果
- 显示剩余时间倒计时

### 阶段 3: 动态难度系统 (P1 - 重要但不紧急)

**为什么这个优先级**: 提升长期可玩性，但不影响初期体验

**模块 3.1: DifficultyManager 核心**
- 实现难度等级计算
- 实现生成速率倍率计算
- 实现速度倍率计算
- 添加到 GameState

**模块 3.2: 难度集成**
- 在 ObjectSpawner 中应用生成速率倍率
- 在 PhysicsSystem 中应用速度倍率
- 在 GameLoop.update() 中更新难度

**模块 3.3: 难度提升通知 (P2)**
- 实现难度提升视觉通知
- 显示当前难度等级

### 阶段 4: 连击里程碑动画 (P2 - 锦上添花)

**为什么这个优先级**: 视觉效果很酷，但不影响核心玩法

**模块 4.1: ComboMilestoneAnimator**
- 实现里程碑检测（5/10/20 连击）
- 实现脉冲动画（5 连击）
- 实现爆炸动画（10 连击）
- 实现彩虹动画（20 连击）
- 集成到 GameLoop.render()

### 阶段 5: 成就系统 (P3 - 可选)

**为什么最后**: 长期目标，不影响单局游戏体验

**模块 5.1: AchievementTracker 核心**
- 定义 PlayerStats 接口
- 定义 Achievement 接口
- 实现统计数据追踪
- 实现成就解锁逻辑

**模块 5.2: 成就持久化**
- 实现本地存储保存
- 实现本地存储加载
- 实现数据验证

**模块 5.3: 成就集成**
- 在 GameLoop 中记录统计数据
- 定期检查成就解锁
- 添加到 GameState

**模块 5.4: 成就通知 UI (P3)**
- 实现 AchievementNotificationRenderer 类
- 实现滑入动画
- 显示成就图标和描述

### 推荐实现顺序

**第一批（最重要，立即实现）**:
1. 模块 1.1 + 1.2: ComboSystem 核心和集成
2. 模块 1.3: 连击 HUD 显示
3. 模块 2.1: 黄金水果

**第二批（重要，尽快实现）**:
4. 模块 1.4: 浮动分数文本
5. 模块 2.2: 冰冻水果
6. 模块 2.3: 狂暴水果

**第三批（有时间再做）**:
7. 模块 3.1 + 3.2: 动态难度系统
8. 模块 2.4: 特殊水果视觉效果
9. 模块 4.1: 连击里程碑动画

**第四批（可选，不着急）**:
10. 模块 2.5: 效果指示器
11. 模块 3.3: 难度提升通知
12. 模块 5.1 + 5.2 + 5.3: 成就系统
13. 模块 5.4: 成就通知 UI

### 依赖关系图

```
GameLoop
├── GameState
│   ├── ComboSystem (阶段 1)
│   ├── DifficultyManager (阶段 1)
│   ├── SpecialFruitEffectManager (阶段 1)
│   └── AchievementTracker (阶段 3)
│
├── ObjectSpawner
│   └── SpecialFruit (阶段 1)
│
└── Renderer
    ├── FloatingScoreManager (阶段 2)
    ├── ComboCounterHUD (阶段 2)
    ├── EffectIndicatorRenderer (阶段 2)
    ├── ComboMilestoneAnimator (阶段 2)
    └── AchievementNotificationRenderer (阶段 3)
```

### 集成检查清单

**GameState 修改**:
- [ ] 添加 `comboSystem: ComboSystem`
- [ ] 添加 `difficultyManager: DifficultyManager`
- [ ] 添加 `specialFruitEffectManager: SpecialFruitEffectManager`
- [ ] 添加 `achievementTracker: AchievementTracker`
- [ ] 在构造函数中初始化所有新系统
- [ ] 在 `reset()` 方法中重置所有新系统

**GameLoop 修改**:
- [ ] 在 `update()` 中调用 `comboSystem.update()`
- [ ] 在 `update()` 中调用 `difficultyManager.update()`
- [ ] 在 `update()` 中调用 `specialFruitEffectManager.update()`
- [ ] 在 `update()` 中调用 `achievementTracker.update()`
- [ ] 在 `handleSlicedObjects()` 中调用 `comboSystem.recordSlice()`
- [ ] 在 `handleSlicedObjects()` 中应用分数倍率
- [ ] 在 `handleSlicedObjects()` 中处理特殊水果效果
- [ ] 在 `handleSlicedObjects()` 中创建浮动分数
- [ ] 在 `render()` 中渲染所有视觉反馈组件

**ObjectSpawner 修改**:
- [ ] 在 `spawnFruit()` 中添加特殊水果生成逻辑
- [ ] 在 `getRandomSpawnInterval()` 中应用难度倍率
- [ ] 在 `getRandomSpawnInterval()` 中应用狂暴效果

**PhysicsSystem 修改**:
- [ ] 在 `generateThrowParams()` 中应用难度速度倍率
- [ ] 在 `update()` 中应用冰冻效果速度调整

**ObjectPool 修改**:
- [ ] 添加特殊水果对象池
- [ ] 实现 `getSpecialFruit(type: SpecialFruitType)` 方法


## 配置和可调参数

所有新功能的参数应该可配置，以便于调试和平衡游戏难度。

### 游戏配置扩展

在 `src/core/GameConfig.ts` 中添加新的配置项：

```typescript
interface GameConfig {
  // ... 现有配置 ...
  
  // 连击系统配置
  combo: {
    timeout: number;              // 连击超时时间（毫秒），默认 2000
    threshold: number;            // 开始应用倍率的最小连击数，默认 3
    maxMultiplier: number;        // 最大分数倍率，默认 5.0
    multiplierIncrement: number;  // 每次连击增加的倍率，默认 0.1
  };
  
  // 特殊水果配置
  specialFruit: {
    spawnChance: number;          // 生成概率，默认 0.05 (5%)
    goldenScoreMultiplier: number; // 黄金水果分数倍率，默认 2.0
    frozenDuration: number;       // 冰冻效果持续时间（毫秒），默认 3000
    frozenSpeedMultiplier: number; // 冰冻速度倍率，默认 0.5
    frenzyDuration: number;       // 狂暴效果持续时间（毫秒），默认 5000
    frenzySpawnMultiplier: number; // 狂暴生成倍率，默认 2.0
  };
  
  // 难度系统配置
  difficulty: {
    spawnRateThreshold: number;   // 生成速率提升的分数阈值，默认 100
    speedThreshold: number;       // 速度提升的分数阈值，默认 200
    spawnRateIncrement: number;   // 生成速率增幅，默认 0.1 (10%)
    speedIncrement: number;       // 速度增幅，默认 0.05 (5%)
    maxSpawnRateMultiplier: number; // 最大生成速率倍率，默认 2.0
    maxSpeedMultiplier: number;   // 最大速度倍率，默认 1.5
  };
  
  // 视觉反馈配置
  visualFeedback: {
    floatingScoreLifetime: number; // 浮动分数显示时长（毫秒），默认 1000
    floatingScoreRiseDistance: number; // 浮动分数上升距离（像素），默认 50
    maxFloatingScores: number;    // 最大浮动分数数量，默认 10
    comboMilestoneDuration: number; // 连击里程碑动画时长（毫秒），默认 1500
    effectIndicatorSize: number;  // 效果指示器大小（像素），默认 80
  };
  
  // 成就系统配置
  achievements: {
    enabled: boolean;             // 是否启用成就系统，默认 true
    notificationDuration: number; // 成就通知显示时长（毫秒），默认 3000
    checkInterval: number;        // 成就检查间隔（毫秒），默认 1000
  };
}
```

### 默认配置值

```typescript
export const DEFAULT_GAME_CONFIG: GameConfig = {
  // ... 现有配置 ...
  
  combo: {
    timeout: 2000,
    threshold: 3,
    maxMultiplier: 5.0,
    multiplierIncrement: 0.1
  },
  
  specialFruit: {
    spawnChance: 0.05,
    goldenScoreMultiplier: 2.0,
    frozenDuration: 3000,
    frozenSpeedMultiplier: 0.5,
    frenzyDuration: 5000,
    frenzySpawnMultiplier: 2.0
  },
  
  difficulty: {
    spawnRateThreshold: 100,
    speedThreshold: 200,
    spawnRateIncrement: 0.1,
    speedIncrement: 0.05,
    maxSpawnRateMultiplier: 2.0,
    maxSpeedMultiplier: 1.5
  },
  
  visualFeedback: {
    floatingScoreLifetime: 1000,
    floatingScoreRiseDistance: 50,
    maxFloatingScores: 10,
    comboMilestoneDuration: 1500,
    effectIndicatorSize: 80
  },
  
  achievements: {
    enabled: true,
    notificationDuration: 3000,
    checkInterval: 1000
  }
};
```

### 调试模式

添加调试配置以便于开发和测试：

```typescript
interface DebugConfig {
  enableComboSystem: boolean;
  enableSpecialFruits: boolean;
  enableDifficulty: boolean;
  enableVisualFeedback: boolean;
  enableAchievements: boolean;
  forceSpecialFruitType?: SpecialFruitType; // 强制生成特定类型
  unlockAllAchievements: boolean;
}

const DEBUG_CONFIG: DebugConfig = {
  enableComboSystem: true,
  enableSpecialFruits: true,
  enableDifficulty: true,
  enableVisualFeedback: true,
  enableAchievements: true,
  forceSpecialFruitType: undefined,
  unlockAllAchievements: false
};
```

## 设计决策和理由

### 1. 为什么使用独立的管理器类而非扩展现有类？

**决策**: 创建独立的 ComboSystem、DifficultyManager 等类

**理由**:
- 保持单一职责原则
- 便于单元测试
- 降低对现有代码的侵入性
- 易于启用/禁用功能

### 2. 为什么特殊水果继承自 Fruit 类？

**决策**: SpecialFruit extends Fruit

**理由**:
- 复用现有的物理和渲染逻辑
- 仅需重写 `onSliced()` 方法
- 与现有对象池系统兼容
- 减少代码重复

### 3. 为什么成就检查不是每帧执行？

**决策**: 每秒检查一次成就解锁

**理由**:
- 成就解锁不需要实时响应
- 减少性能开销
- 1 秒延迟对用户体验无影响

### 4. 为什么使用本地存储而非服务器？

**决策**: 使用 localStorage 保存成就和统计数据

**理由**:
- 游戏是单机版，无需服务器
- 简化实现
- 即时保存和加载
- 无网络依赖

### 5. 为什么连击超时是 2 秒？

**决策**: 连击超时时间为 2000 毫秒

**理由**:
- 基于水果生成间隔（0.5-2 秒）
- 给玩家足够的反应时间
- 平衡挑战性和可达成性
- 可通过配置调整

### 6. 为什么特殊水果生成概率是 5%？

**决策**: 特殊水果生成概率为 5%

**理由**:
- 保持稀有性和特殊感
- 避免过于频繁影响游戏平衡
- 平均每 20 个水果出现 1 个特殊水果
- 可通过配置调整

### 7. 为什么难度上限是生成速率 200%、速度 150%？

**决策**: 设置难度上限

**理由**:
- 防止游戏变得不可玩
- 保持长期游戏的可玩性
- 基于人类反应速度的限制
- 可通过配置调整

### 8. 为什么浮动分数限制为 10 个？

**决策**: 最多同时显示 10 个浮动分数

**理由**:
- 防止屏幕过于拥挤
- 控制渲染性能
- 10 个足以覆盖正常游戏场景
- 使用对象池复用

## 未来扩展可能性

虽然不在当前需求范围内，但设计考虑了以下扩展可能：

1. **更多特殊水果类型**
   - 炸弹免疫水果
   - 生命恢复水果
   - 多倍连击水果

2. **更多成就**
   - 基于时间的成就
   - 基于特殊水果的成就
   - 隐藏成就

3. **排行榜系统**
   - 本地排行榜
   - 在线排行榜（需要后端）

4. **游戏模式**
   - 限时模式
   - 无限生命模式
   - 挑战模式

5. **自定义皮肤**
   - 水果皮肤
   - 刀光效果
   - 背景主题

6. **音效增强**
   - 连击音效
   - 特殊水果音效
   - 成就解锁音效

## 总结

本设计文档详细说明了五个游戏增强功能的实现方案，包括：

1. **连击系统**: 追踪连续切割，提供分数倍率奖励
2. **特殊水果**: 三种特殊水果类型，提供独特效果
3. **动态难度**: 根据分数自动调整游戏难度
4. **增强视觉反馈**: 浮动分数、连击动画、效果指示器
5. **成就系统**: 追踪统计数据，解锁成就

所有功能都设计为模块化、可配置、高性能，并与现有游戏架构无缝集成。实现将分三个阶段进行，确保每个阶段都可以独立测试和验证。
