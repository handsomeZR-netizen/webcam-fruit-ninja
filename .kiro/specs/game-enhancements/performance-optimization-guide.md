# 性能优化系统使用指南

## 概述

游戏现在包含了一个完整的性能监控和自动优化系统，可以确保在各种设备上都能流畅运行。

## 核心组件

### 1. PerformanceMonitor（性能监控器）
实时监控游戏性能指标。

**监控指标**:
- FPS（帧率）
- 帧时间
- 渲染时间
- 更新时间
- 内存使用
- 对象数量
- 粒子数量

**使用方法**:
```typescript
// 获取性能监控器
const perfMonitor = gameLoop.getPerformanceMonitor();

// 获取当前指标
const metrics = perfMonitor.getMetrics();
console.log(`当前 FPS: ${metrics.fps}`);

// 获取性能瓶颈
const bottlenecks = perfMonitor.getBottlenecks();
bottlenecks.forEach(b => {
  console.log(`瓶颈: ${b.message} (严重程度: ${b.severity})`);
});

// 显示/隐藏性能叠加层
perfMonitor.setShowOverlay(true);  // 显示
perfMonitor.setShowOverlay(false); // 隐藏
```

### 2. PerformanceOptimizer（性能优化器）
根据实时 FPS 自动调整游戏质量。

**质量等级**:
- `ULTRA`: 60+ FPS，最高质量
- `HIGH`: 50-60 FPS，高质量
- `MEDIUM`: 40-50 FPS，中等质量
- `LOW`: 30-40 FPS，低质量
- `MINIMAL`: < 30 FPS，最低质量

**使用方法**:
```typescript
// 获取性能优化器
const perfOptimizer = gameLoop.getPerformanceOptimizer();

// 获取当前质量等级
const quality = perfOptimizer.getCurrentQuality();
console.log(`当前质量: ${quality}`);

// 获取当前设置
const settings = perfOptimizer.getCurrentSettings();
console.log(`粒子质量: ${settings.particleQuality}`);
console.log(`最大粒子数: ${settings.maxParticles}`);

// 手动设置质量等级
perfOptimizer.setQualityLevel(PerformanceQuality.HIGH);

// 启用/禁用自动优化
perfOptimizer.setEnabled(true);  // 启用
perfOptimizer.setEnabled(false); // 禁用

// 获取性能建议
const recommendations = perfOptimizer.getPerformanceRecommendations();
recommendations.forEach(rec => console.log(rec));
```

### 3. PerformanceTest（性能测试工具）
运行自动化性能测试。

**使用方法**:
```typescript
// 创建测试工具
const perfTest = new PerformanceTest(performanceMonitor, performanceOptimizer);

// 运行单个测试
const result = await perfTest.runTest('我的测试', 5000, 30);
console.log(`测试结果: ${result.passed ? '通过' : '失败'}`);
console.log(`平均 FPS: ${result.avgFPS}`);

// 运行完整基准测试套件
const results = await perfTest.runBenchmarkSuite();

// 生成报告
const report = perfTest.generateReport();
console.log(report);

// 导出 JSON 结果
const json = perfTest.exportResultsJSON();
```

## 配置选项

### GameConfig 性能配置

在 `src/core/GameConfig.ts` 中配置：

```typescript
performance: {
  enableAutoOptimization: true,  // 启用自动优化
  targetFPS: 30,                 // 目标帧率
  maxObjects: 15,                // 最大对象数
  maxParticles: 200,             // 最大粒子数
  enablePerformanceMonitor: true // 显示监控器
}
```

### PerformanceMonitor 配置

```typescript
const perfMonitor = new PerformanceMonitor({
  enabled: true,                 // 启用监控
  showOverlay: true,             // 显示叠加层
  fpsWarningThreshold: 30,       // FPS 警告阈值
  memoryWarningThreshold: 80,    // 内存警告阈值（%）
  maxObjectCount: 50,            // 最大对象数
  maxParticleCount: 200,         // 最大粒子数
  sampleInterval: 1000           // 采样间隔（毫秒）
});
```

### PerformanceOptimizer 配置

```typescript
const perfOptimizer = new PerformanceOptimizer(performanceMonitor, {
  enabled: true,                 // 启用自动优化
  checkInterval: 2000,           // 检查间隔（毫秒）
  fpsThresholds: {
    ultra: 55,                   // ULTRA 阈值
    high: 45,                    // HIGH 阈值
    medium: 35,                  // MEDIUM 阈值
    low: 25                      // LOW 阈值
  },
  stabilizationFrames: 30        // 稳定帧数
});
```

## 性能优化最佳实践

### 1. 开发阶段
- 始终启用性能监控器
- 定期检查性能瓶颈
- 在低端设备上测试
- 运行基准测试验证优化效果

### 2. 调试性能问题
```typescript
// 1. 检查当前 FPS
const fps = gameLoop.getCurrentFPS();
if (fps < 30) {
  console.log('性能不佳，检查瓶颈...');
  
  // 2. 获取瓶颈信息
  const bottlenecks = perfMonitor.getBottlenecks();
  bottlenecks.forEach(b => {
    console.log(`${b.type}: ${b.message}`);
  });
  
  // 3. 获取优化建议
  const recommendations = gameLoop.getPerformanceRecommendations();
  recommendations.forEach(rec => console.log(rec));
  
  // 4. 手动降低质量
  perfOptimizer.setQualityLevel(PerformanceQuality.LOW);
}
```

### 3. 性能测试流程
```typescript
// 1. 创建测试工具
const perfTest = new PerformanceTest(perfMonitor, perfOptimizer);

// 2. 运行基准测试
const results = await perfTest.runBenchmarkSuite();

// 3. 检查结果
const failedTests = results.filter(r => !r.passed);
if (failedTests.length > 0) {
  console.log('以下测试失败:');
  failedTests.forEach(t => {
    console.log(`- ${t.testName}: ${t.avgFPS} FPS`);
  });
}

// 4. 生成报告
const report = perfTest.generateReport();
console.log(report);

// 5. 保存结果
const json = perfTest.exportResultsJSON();
// 保存到文件或发送到服务器
```

## 性能指标解读

### FPS（帧率）
- **60+ FPS**: 优秀，非常流畅
- **45-60 FPS**: 良好，流畅
- **30-45 FPS**: 可接受，基本流畅
- **< 30 FPS**: 不佳，需要优化

### 帧时间
- **< 16.7ms**: 优秀（60 FPS）
- **16.7-22ms**: 良好（45-60 FPS）
- **22-33ms**: 可接受（30-45 FPS）
- **> 33ms**: 不佳（< 30 FPS）

### 渲染时间
- **< 10ms**: 优秀
- **10-15ms**: 良好
- **15-20ms**: 可接受
- **> 20ms**: 需要优化

### 更新时间
- **< 5ms**: 优秀
- **5-10ms**: 良好
- **10-15ms**: 可接受
- **> 15ms**: 需要优化

## 常见问题

### Q: 如何禁用自动优化？
```typescript
perfOptimizer.setEnabled(false);
```

### Q: 如何手动设置质量等级？
```typescript
perfOptimizer.setQualityLevel(PerformanceQuality.HIGH);
```

### Q: 如何隐藏性能监控器？
```typescript
perfMonitor.setShowOverlay(false);
```

### Q: 如何获取当前性能状态？
```typescript
const metrics = perfMonitor.getMetrics();
console.log(`FPS: ${metrics.fps}`);
console.log(`性能良好: ${metrics.isPerformanceGood}`);
```

### Q: 如何运行性能测试？
```typescript
const perfTest = new PerformanceTest(perfMonitor, perfOptimizer);
const result = await perfTest.runTest('测试名称', 5000, 30);
```

### Q: 性能降级后如何恢复？
自动优化会在 FPS 提升后自动恢复质量等级。如果需要手动恢复：
```typescript
perfOptimizer.setQualityLevel(PerformanceQuality.ULTRA);
```

## 性能优化检查清单

开发时检查：
- [ ] 性能监控器已启用
- [ ] 自动优化已启用
- [ ] FPS 保持在 30+ 
- [ ] 无性能瓶颈警告
- [ ] 内存使用正常（< 80%）
- [ ] 对象数量在限制内
- [ ] 粒子数量在限制内

发布前检查：
- [ ] 运行完整基准测试套件
- [ ] 所有测试通过
- [ ] 在低端设备上测试
- [ ] 验证自动降级工作正常
- [ ] 生成性能报告
- [ ] 记录性能指标

## 总结

性能优化系统提供了：
- ✅ 实时性能监控
- ✅ 自动质量调整
- ✅ 性能瓶颈检测
- ✅ 优化建议生成
- ✅ 自动化测试工具
- ✅ 详细性能报告

使用这些工具可以确保游戏在各种设备上都能流畅运行，为玩家提供最佳体验。
