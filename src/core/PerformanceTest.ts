/**
 * 性能测试工具
 * 需求: 7.1 - 使用 PerformanceMonitor 监控新功能性能，确保帧率保持在 30+ FPS
 * 
 * 提供性能测试和基准测试功能
 */

import { PerformanceMonitor } from './PerformanceMonitor.js';
import { PerformanceOptimizer, PerformanceQuality } from './PerformanceOptimizer.js';

/**
 * 性能测试结果
 */
export interface PerformanceTestResult {
  testName: string;
  duration: number;           // 测试持续时间（毫秒）
  avgFPS: number;             // 平均帧率
  minFPS: number;             // 最低帧率
  maxFPS: number;             // 最高帧率
  avgFrameTime: number;       // 平均帧时间（毫秒）
  avgRenderTime: number;      // 平均渲染时间（毫秒）
  avgUpdateTime: number;      // 平均更新时间（毫秒）
  passed: boolean;            // 是否通过测试（FPS >= 30）
  qualityLevel: PerformanceQuality;  // 测试时的质量等级
}

/**
 * 性能基准测试配置
 */
export interface BenchmarkConfig {
  duration: number;           // 测试持续时间（毫秒）
  targetFPS: number;          // 目标帧率
  objectCount: number;        // 游戏对象数量
  particleCount: number;      // 粒子数量
}

/**
 * 性能测试工具类
 */
export class PerformanceTest {
  private performanceMonitor: PerformanceMonitor;
  private performanceOptimizer: PerformanceOptimizer | null;
  private testResults: PerformanceTestResult[];

  constructor(performanceMonitor: PerformanceMonitor, performanceOptimizer?: PerformanceOptimizer) {
    this.performanceMonitor = performanceMonitor;
    this.performanceOptimizer = performanceOptimizer || null;
    this.testResults = [];
  }

  /**
   * 运行性能测试
   * @param testName 测试名称
   * @param duration 测试持续时间（毫秒）
   * @param targetFPS 目标帧率
   * @returns 测试结果
   */
  async runTest(testName: string, duration: number, targetFPS: number = 30): Promise<PerformanceTestResult> {
    console.log(`开始性能测试: ${testName}`);
    
    const startTime = performance.now();
    const fpsSamples: number[] = [];
    const frameTimeSamples: number[] = [];
    const renderTimeSamples: number[] = [];
    const updateTimeSamples: number[] = [];
    
    // 重置性能监控器
    this.performanceMonitor.reset();
    
    // 等待测试持续时间
    await new Promise<void>(resolve => {
      const checkInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        
        // 收集性能指标
        const metrics = this.performanceMonitor.getMetrics();
        if (metrics.fps > 0) {
          fpsSamples.push(metrics.fps);
          frameTimeSamples.push(metrics.frameTime);
          renderTimeSamples.push(metrics.renderTime);
          updateTimeSamples.push(metrics.updateTime);
        }
        
        // 检查是否完成
        if (elapsed >= duration) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
    
    // 计算统计数据
    const avgFPS = fpsSamples.reduce((sum, fps) => sum + fps, 0) / fpsSamples.length;
    const minFPS = Math.min(...fpsSamples);
    const maxFPS = Math.max(...fpsSamples);
    const avgFrameTime = frameTimeSamples.reduce((sum, t) => sum + t, 0) / frameTimeSamples.length;
    const avgRenderTime = renderTimeSamples.reduce((sum, t) => sum + t, 0) / renderTimeSamples.length;
    const avgUpdateTime = updateTimeSamples.reduce((sum, t) => sum + t, 0) / updateTimeSamples.length;
    
    // 获取当前质量等级
    const qualityLevel = this.performanceOptimizer 
      ? this.performanceOptimizer.getCurrentQuality() 
      : PerformanceQuality.ULTRA;
    
    const result: PerformanceTestResult = {
      testName,
      duration,
      avgFPS: Math.round(avgFPS),
      minFPS: Math.round(minFPS),
      maxFPS: Math.round(maxFPS),
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      avgRenderTime: Math.round(avgRenderTime * 100) / 100,
      avgUpdateTime: Math.round(avgUpdateTime * 100) / 100,
      passed: avgFPS >= targetFPS,
      qualityLevel
    };
    
    this.testResults.push(result);
    
    console.log(`测试完成: ${testName}`);
    console.log(`  平均 FPS: ${result.avgFPS} (最小: ${result.minFPS}, 最大: ${result.maxFPS})`);
    console.log(`  平均帧时间: ${result.avgFrameTime}ms`);
    console.log(`  平均渲染时间: ${result.avgRenderTime}ms`);
    console.log(`  平均更新时间: ${result.avgUpdateTime}ms`);
    console.log(`  质量等级: ${result.qualityLevel}`);
    console.log(`  测试结果: ${result.passed ? '通过' : '失败'}`);
    
    return result;
  }

  /**
   * 运行基准测试套件
   * @returns 所有测试结果
   */
  async runBenchmarkSuite(): Promise<PerformanceTestResult[]> {
    console.log('开始运行性能基准测试套件...');
    
    const tests: Array<{ name: string; duration: number; targetFPS: number }> = [
      { name: '基础性能测试', duration: 5000, targetFPS: 30 },
      { name: '高负载测试（多对象）', duration: 5000, targetFPS: 30 },
      { name: '粒子效果测试', duration: 5000, targetFPS: 30 },
      { name: '连击动画测试', duration: 5000, targetFPS: 30 },
      { name: '综合压力测试', duration: 10000, targetFPS: 30 }
    ];
    
    const results: PerformanceTestResult[] = [];
    
    for (const test of tests) {
      const result = await this.runTest(test.name, test.duration, test.targetFPS);
      results.push(result);
      
      // 测试之间等待 1 秒
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n基准测试套件完成！');
    this.printSummary(results);
    
    return results;
  }

  /**
   * 打印测试摘要
   */
  private printSummary(results: PerformanceTestResult[]): void {
    console.log('\n=== 性能测试摘要 ===');
    console.log(`总测试数: ${results.length}`);
    console.log(`通过: ${results.filter(r => r.passed).length}`);
    console.log(`失败: ${results.filter(r => !r.passed).length}`);
    
    const avgFPS = results.reduce((sum, r) => sum + r.avgFPS, 0) / results.length;
    console.log(`平均 FPS: ${Math.round(avgFPS)}`);
    
    const avgRenderTime = results.reduce((sum, r) => sum + r.avgRenderTime, 0) / results.length;
    console.log(`平均渲染时间: ${Math.round(avgRenderTime * 100) / 100}ms`);
    
    const avgUpdateTime = results.reduce((sum, r) => sum + r.avgUpdateTime, 0) / results.length;
    console.log(`平均更新时间: ${Math.round(avgUpdateTime * 100) / 100}ms`);
    
    console.log('\n详细结果:');
    results.forEach(result => {
      const status = result.passed ? '✓' : '✗';
      console.log(`  ${status} ${result.testName}: ${result.avgFPS} FPS (${result.qualityLevel})`);
    });
  }

  /**
   * 获取所有测试结果
   */
  getTestResults(): PerformanceTestResult[] {
    return [...this.testResults];
  }

  /**
   * 清除测试结果
   */
  clearResults(): void {
    this.testResults = [];
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    let report = '# 性能测试报告\n\n';
    report += `生成时间: ${new Date().toLocaleString()}\n\n`;
    
    if (this.testResults.length === 0) {
      report += '没有测试结果。\n';
      return report;
    }
    
    report += '## 测试摘要\n\n';
    report += `- 总测试数: ${this.testResults.length}\n`;
    report += `- 通过: ${this.testResults.filter(r => r.passed).length}\n`;
    report += `- 失败: ${this.testResults.filter(r => !r.passed).length}\n\n`;
    
    const avgFPS = this.testResults.reduce((sum, r) => sum + r.avgFPS, 0) / this.testResults.length;
    report += `- 平均 FPS: ${Math.round(avgFPS)}\n`;
    
    const avgRenderTime = this.testResults.reduce((sum, r) => sum + r.avgRenderTime, 0) / this.testResults.length;
    report += `- 平均渲染时间: ${Math.round(avgRenderTime * 100) / 100}ms\n`;
    
    const avgUpdateTime = this.testResults.reduce((sum, r) => sum + r.avgUpdateTime, 0) / this.testResults.length;
    report += `- 平均更新时间: ${Math.round(avgUpdateTime * 100) / 100}ms\n\n`;
    
    report += '## 详细结果\n\n';
    report += '| 测试名称 | 平均FPS | 最小FPS | 最大FPS | 渲染时间 | 更新时间 | 质量等级 | 结果 |\n';
    report += '|---------|---------|---------|---------|----------|----------|----------|------|\n';
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✓' : '✗';
      report += `| ${result.testName} | ${result.avgFPS} | ${result.minFPS} | ${result.maxFPS} | ${result.avgRenderTime}ms | ${result.avgUpdateTime}ms | ${result.qualityLevel} | ${status} |\n`;
    });
    
    report += '\n## 性能建议\n\n';
    if (this.performanceOptimizer) {
      const recommendations = this.performanceOptimizer.getPerformanceRecommendations();
      if (recommendations.length > 0) {
        recommendations.forEach(rec => {
          report += `- ${rec}\n`;
        });
      } else {
        report += '- 性能良好，无需优化。\n';
      }
    }
    
    return report;
  }

  /**
   * 导出测试结果为 JSON
   */
  exportResultsJSON(): string {
    return JSON.stringify(this.testResults, null, 2);
  }
}
