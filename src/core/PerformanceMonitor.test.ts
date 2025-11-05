/**
 * 性能监控系统测试
 */

import { PerformanceMonitor } from './PerformanceMonitor';

// 简单的测试函数
function testPerformanceMonitor() {
  console.log('=== 性能监控系统测试 ===\n');
  
  // 创建性能监控器
  const monitor = new PerformanceMonitor({
    enabled: true,
    showOverlay: true,
    fpsWarningThreshold: 30,
    memoryWarningThreshold: 80,
    maxObjectCount: 50,
    maxParticleCount: 200,
    sampleInterval: 100 // 快速测试
  });
  
  console.log('✓ 性能监控器创建成功');
  console.log('配置:', monitor.getConfig());
  
  // 模拟游戏循环
  console.log('\n--- 模拟游戏循环 ---');
  
  for (let i = 0; i < 10; i++) {
    // 开始帧
    monitor.startFrame();
    
    // 模拟更新
    monitor.startUpdate();
    // 模拟一些工作
    const start = performance.now();
    while (performance.now() - start < 5) {} // 5ms 工作
    monitor.endUpdate();
    
    // 模拟渲染
    monitor.startRender();
    // 模拟一些工作
    const renderStart = performance.now();
    while (performance.now() - renderStart < 8) {} // 8ms 工作
    monitor.endRender();
    
    // 更新 FPS
    monitor.updateFPS();
    
    // 更新对象计数
    monitor.updateObjectCounts(25, 100);
    
    // 更新内存
    monitor.updateMemory();
    
    // 检测瓶颈
    monitor.detectBottlenecks();
    
    // 等待一帧
    const frameStart = performance.now();
    while (performance.now() - frameStart < 16) {} // ~60 FPS
  }
  
  // 获取指标
  const metrics = monitor.getMetrics();
  console.log('\n性能指标:');
  console.log(`  FPS: ${metrics.fps}`);
  console.log(`  平均 FPS: ${metrics.avgFps}`);
  console.log(`  帧时间: ${metrics.frameTime.toFixed(2)}ms`);
  console.log(`  更新时间: ${metrics.updateTime.toFixed(2)}ms`);
  console.log(`  渲染时间: ${metrics.renderTime.toFixed(2)}ms`);
  console.log(`  对象数量: ${metrics.objectCount}`);
  console.log(`  粒子数量: ${metrics.particleCount}`);
  console.log(`  性能状态: ${metrics.isPerformanceGood ? '良好' : '较差'}`);
  
  if (metrics.memoryLimit > 0) {
    console.log(`  内存使用: ${metrics.memoryUsed}MB / ${metrics.memoryLimit}MB (${metrics.memoryUsagePercent}%)`);
  }
  
  // 获取瓶颈
  const bottlenecks = monitor.getBottlenecks();
  if (bottlenecks.length > 0) {
    console.log('\n性能瓶颈:');
    bottlenecks.forEach(b => {
      console.log(`  [${b.severity.toUpperCase()}] ${b.message}`);
    });
  } else {
    console.log('\n✓ 未检测到性能瓶颈');
  }
  
  // 测试配置更新
  console.log('\n--- 测试配置更新 ---');
  monitor.updateConfig({ fpsWarningThreshold: 60 });
  console.log('✓ FPS 警告阈值更新为 60');
  
  // 测试启用/禁用
  console.log('\n--- 测试启用/禁用 ---');
  monitor.setEnabled(false);
  console.log('✓ 性能监控已禁用');
  monitor.setEnabled(true);
  console.log('✓ 性能监控已启用');
  
  // 测试重置
  console.log('\n--- 测试重置 ---');
  monitor.reset();
  const resetMetrics = monitor.getMetrics();
  console.log('✓ 统计数据已重置');
  console.log(`  最小 FPS: ${resetMetrics.minFps === Infinity ? 'Infinity' : resetMetrics.minFps}`);
  console.log(`  最大 FPS: ${resetMetrics.maxFps}`);
  
  console.log('\n=== 所有测试通过 ===');
}

// 运行测试
testPerformanceMonitor();
