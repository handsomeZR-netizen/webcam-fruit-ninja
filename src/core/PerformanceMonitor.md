# 性能监控系统 (PerformanceMonitor)

## 概述

性能监控系统用于实时监控游戏的性能指标，包括 FPS、内存使用、渲染时间、更新时间等，并能自动检测性能瓶颈。

**需求**: 7.1 - THE 游戏引擎 SHALL 以至少 30 帧每秒的速率渲染游戏画面

## 功能特性

### 1. FPS 监控
- 实时 FPS 计数
- 平均 FPS 计算
- 最低/最高 FPS 追踪
- 帧时间测量

### 2. 内存监控
- 已使用内存（MB）
- 内存限制（MB）
- 内存使用百分比
- 自动警告高内存使用

### 3. 性能计时
- 更新时间（Update Time）
- 渲染时间（Render Time）
- 帧时间（Frame Time）

### 4. 对象计数
- 游戏对象数量
- 粒子效果数量
- 自动警告对象过多

### 5. 瓶颈检测
自动检测以下性能瓶颈：
- **LOW_FPS**: 帧率过低（< 30 FPS）
- **HIGH_MEMORY**: 内存使用过高（> 80%）
- **SLOW_RENDER**: 渲染时间过长
- **SLOW_UPDATE**: 更新时间过长
- **TOO_MANY_OBJECTS**: 游戏对象过多（> 50）
- **TOO_MANY_PARTICLES**: 粒子数量过多（> 200）

### 6. 可视化叠加层
- 实时性能指标显示
- 性能瓶颈警告
- 科幻风格 UI

## 使用方法

### 基本使用

```typescript
import { PerformanceMonitor } from './core/PerformanceMonitor';

// 创建性能监控器
const monitor = new PerformanceMonitor({
  enabled: true,
  showOverlay: true,
  fpsWarningThreshold: 30,
  memoryWarningThreshold: 80,
  maxObjectCount: 50,
  maxParticleCount: 200,
  sampleInterval: 1000
});

// 在游戏循环中使用
function gameLoop() {
  // 开始帧监控
  monitor.startFrame();
  
  // 更新游戏逻辑
  monitor.startUpdate();
  updateGame();
  monitor.endUpdate();
  
  // 渲染游戏
  monitor.startRender();
  renderGame();
  monitor.endRender();
  
  // 更新 FPS
  monitor.updateFPS();
  
  // 更新对象计数
  monitor.updateObjectCounts(gameObjects.length, particles.length);
  
  // 更新内存
  monitor.updateMemory();
  
  // 检测瓶颈
  monitor.detectBottlenecks();
  
  // 渲染性能叠加层
  monitor.renderOverlay(ctx, 10, 10);
  
  // 渲染瓶颈警告
  const bottlenecks = monitor.getBottlenecks();
  if (bottlenecks.length > 0) {
    monitor.renderBottlenecks(ctx, 10, 200);
  }
  
  requestAnimationFrame(gameLoop);
}
```

### 获取性能指标

```typescript
const metrics = monitor.getMetrics();
console.log('FPS:', metrics.fps);
console.log('平均 FPS:', metrics.avgFps);
console.log('帧时间:', metrics.frameTime);
console.log('内存使用:', metrics.memoryUsed, 'MB');
console.log('对象数量:', metrics.objectCount);
console.log('性能状态:', metrics.isPerformanceGood ? '良好' : '较差');
```

### 获取性能瓶颈

```typescript
const bottlenecks = monitor.getBottlenecks();
bottlenecks.forEach(bottleneck => {
  console.log(`[${bottleneck.severity}] ${bottleneck.message}`);
  console.log(`  类型: ${bottleneck.type}`);
  console.log(`  当前值: ${bottleneck.value}`);
  console.log(`  阈值: ${bottleneck.threshold}`);
});
```

### 配置管理

```typescript
// 更新配置
monitor.updateConfig({
  fpsWarningThreshold: 60,
  showOverlay: false
});

// 启用/禁用监控
monitor.setEnabled(false);
monitor.setEnabled(true);

// 显示/隐藏叠加层
monitor.setShowOverlay(false);
monitor.setShowOverlay(true);

// 重置统计数据
monitor.reset();
```

## 配置选项

```typescript
interface PerformanceMonitorConfig {
  enabled: boolean;               // 是否启用监控（默认: true）
  showOverlay: boolean;           // 是否显示性能叠加层（默认: true）
  fpsWarningThreshold: number;    // FPS 警告阈值（默认: 30）
  memoryWarningThreshold: number; // 内存警告阈值百分比（默认: 80）
  maxObjectCount: number;         // 最大对象数量（默认: 50）
  maxParticleCount: number;       // 最大粒子数量（默认: 200）
  sampleInterval: number;         // 采样间隔毫秒（默认: 1000）
}
```

## 性能指标说明

### FPS 相关
- **fps**: 当前帧率（每秒帧数）
- **avgFps**: 平均帧率（基于最近 60 个样本）
- **minFps**: 最低帧率
- **maxFps**: 最高帧率
- **frameTime**: 帧时间（毫秒）

### 时间相关
- **updateTime**: 游戏逻辑更新时间（毫秒）
- **renderTime**: 渲染时间（毫秒）

### 内存相关
- **memoryUsed**: 已使用内存（MB）
- **memoryLimit**: 内存限制（MB）
- **memoryUsagePercent**: 内存使用百分比

### 对象相关
- **objectCount**: 游戏对象数量
- **particleCount**: 粒子数量

### 状态
- **isPerformanceGood**: 性能是否良好（FPS >= 阈值）

## 瓶颈严重程度

每个检测到的瓶颈都有一个严重程度级别：

- **low**: 轻微影响，可以忽略
- **medium**: 中等影响，建议优化
- **high**: 严重影响，需要立即优化

## 性能优化建议

根据检测到的瓶颈类型，可以采取以下优化措施：

### LOW_FPS（低帧率）
- 减少游戏对象数量
- 减少粒子效果
- 优化渲染逻辑
- 使用对象池

### HIGH_MEMORY（高内存）
- 清理未使用的对象
- 使用对象池复用对象
- 减少纹理和资源大小

### SLOW_RENDER（渲染慢）
- 使用离屏 Canvas
- 减少绘制调用
- 优化粒子效果
- 使用脏矩形技术

### SLOW_UPDATE（更新慢）
- 优化碰撞检测算法
- 使用空间分区
- 减少物理计算复杂度

### TOO_MANY_OBJECTS（对象过多）
- 限制同时存在的对象数量
- 及时清理离屏对象
- 使用对象池

### TOO_MANY_PARTICLES（粒子过多）
- 减少粒子生成数量
- 缩短粒子生命周期
- 根据性能动态调整粒子数量

## 浏览器兼容性

### Memory API
内存监控依赖于 `performance.memory` API，该 API 仅在以下浏览器中可用：
- Chrome/Edge（需要启用 `--enable-precise-memory-info` 标志）
- 其他浏览器可能不支持

如果不支持，内存相关指标将显示为 0。

## 集成到 GameLoop

性能监控器已集成到 `GameLoop` 类中：

```typescript
// 在 GameLoop 中访问性能监控器
const perfMonitor = gameLoop.getPerformanceMonitor();

// 获取当前 FPS
const fps = gameLoop.getCurrentFPS();

// 获取完整指标
const metrics = perfMonitor.getMetrics();
```

## 调试技巧

### 1. 临时禁用叠加层
```typescript
monitor.setShowOverlay(false);
```

### 2. 只在开发环境启用
```typescript
const monitor = new PerformanceMonitor({
  enabled: process.env.NODE_ENV === 'development'
});
```

### 3. 记录性能日志
```typescript
setInterval(() => {
  const metrics = monitor.getMetrics();
  console.log('Performance:', {
    fps: metrics.fps,
    memory: metrics.memoryUsagePercent,
    objects: metrics.objectCount
  });
}, 5000);
```

### 4. 性能分析
```typescript
const bottlenecks = monitor.getBottlenecks();
if (bottlenecks.length > 0) {
  console.warn('Performance bottlenecks detected:', bottlenecks);
}
```

## 示例输出

### 控制台输出
```
FPS: 60 (Avg: 58)
Frame: 16.67ms
Update: 3.45ms
Render: 8.23ms
Memory: 45MB (23%)
Objects: 25
Particles: 100
Status: GOOD
```

### 瓶颈警告
```
⚠ [MEDIUM] 帧率过低: 28 FPS (目标: 30+)
⚠ [LOW] 渲染时间过长: 12.34ms (目标: <11.67ms)
```

## 注意事项

1. 性能监控本身会消耗少量性能，建议在生产环境中禁用叠加层
2. 内存监控在某些浏览器中可能不可用
3. FPS 计算基于采样，可能存在轻微延迟
4. 瓶颈检测每 2 秒执行一次，避免频繁警告

## 相关文件

- `src/core/PerformanceMonitor.ts` - 性能监控器实现
- `src/core/PerformanceMonitor.test.ts` - 单元测试
- `src/game/GameLoop.ts` - 游戏循环集成
