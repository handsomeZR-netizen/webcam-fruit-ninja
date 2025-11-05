/**
 * 性能监控系统
 * 需求: 7.1 - THE 游戏引擎 SHALL 以至少 30 帧每秒的速率渲染游戏画面
 * 
 * 监控游戏性能指标，包括 FPS、内存使用和性能瓶颈
 */

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  fps: number;                    // 当前帧率
  avgFps: number;                 // 平均帧率
  minFps: number;                 // 最低帧率
  maxFps: number;                 // 最高帧率
  frameTime: number;              // 帧时间（毫秒）
  memoryUsed: number;             // 已使用内存（MB）
  memoryLimit: number;            // 内存限制（MB）
  memoryUsagePercent: number;     // 内存使用百分比
  objectCount: number;            // 游戏对象数量
  particleCount: number;          // 粒子数量
  renderTime: number;             // 渲染时间（毫秒）
  updateTime: number;             // 更新时间（毫秒）
  isPerformanceGood: boolean;     // 性能是否良好（FPS >= 30）
}

/**
 * 性能瓶颈类型
 */
export enum BottleneckType {
  LOW_FPS = 'LOW_FPS',                    // 低帧率
  HIGH_MEMORY = 'HIGH_MEMORY',            // 高内存使用
  SLOW_RENDER = 'SLOW_RENDER',            // 渲染慢
  SLOW_UPDATE = 'SLOW_UPDATE',            // 更新慢
  TOO_MANY_OBJECTS = 'TOO_MANY_OBJECTS',  // 对象过多
  TOO_MANY_PARTICLES = 'TOO_MANY_PARTICLES' // 粒子过多
}

/**
 * 性能瓶颈信息
 */
export interface BottleneckInfo {
  type: BottleneckType;
  severity: 'low' | 'medium' | 'high';
  message: string;
  value: number;
  threshold: number;
}

/**
 * 性能监控配置
 */
export interface PerformanceMonitorConfig {
  enabled: boolean;               // 是否启用监控
  showOverlay: boolean;           // 是否显示性能叠加层
  fpsWarningThreshold: number;    // FPS 警告阈值
  memoryWarningThreshold: number; // 内存警告阈值（百分比）
  maxObjectCount: number;         // 最大对象数量
  maxParticleCount: number;       // 最大粒子数量
  sampleInterval: number;         // 采样间隔（毫秒）
}

/**
 * 性能监控系统类
 */
export class PerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private metrics: PerformanceMetrics;
  
  // FPS 监控
  private frameCount: number;
  private fpsUpdateTime: number;
  private fpsSamples: number[];
  private maxFpsSamples: number;
  
  // 时间监控
  private lastFrameTime: number;
  private renderStartTime: number;
  private updateStartTime: number;
  
  // 内存监控
  private memoryCheckInterval: number;
  private lastMemoryCheck: number;
  
  // 瓶颈检测
  private bottlenecks: BottleneckInfo[];
  private bottleneckCheckInterval: number;
  private lastBottleneckCheck: number;

  constructor(config: Partial<PerformanceMonitorConfig> = {}) {
    this.config = {
      enabled: true,
      showOverlay: true,
      fpsWarningThreshold: 30,
      memoryWarningThreshold: 80,
      maxObjectCount: 50,
      maxParticleCount: 200,
      sampleInterval: 1000,
      ...config
    };

    this.metrics = {
      fps: 0,
      avgFps: 0,
      minFps: Infinity,
      maxFps: 0,
      frameTime: 0,
      memoryUsed: 0,
      memoryLimit: 0,
      memoryUsagePercent: 0,
      objectCount: 0,
      particleCount: 0,
      renderTime: 0,
      updateTime: 0,
      isPerformanceGood: true
    };

    this.frameCount = 0;
    this.fpsUpdateTime = 0;
    this.fpsSamples = [];
    this.maxFpsSamples = 60;
    
    this.lastFrameTime = 0;
    this.renderStartTime = 0;
    this.updateStartTime = 0;
    
    this.memoryCheckInterval = 500;
    this.lastMemoryCheck = 0;
    
    this.bottlenecks = [];
    this.bottleneckCheckInterval = 2000;
    this.lastBottleneckCheck = 0;
  }

  /**
   * 开始帧监控
   */
  startFrame(): void {
    if (!this.config.enabled) return;
    
    const now = performance.now();
    
    if (this.lastFrameTime > 0) {
      this.metrics.frameTime = now - this.lastFrameTime;
    }
    
    this.lastFrameTime = now;
  }

  /**
   * 开始更新时间监控
   */
  startUpdate(): void {
    if (!this.config.enabled) return;
    this.updateStartTime = performance.now();
  }

  /**
   * 结束更新时间监控
   */
  endUpdate(): void {
    if (!this.config.enabled) return;
    this.metrics.updateTime = performance.now() - this.updateStartTime;
  }

  /**
   * 开始渲染时间监控
   */
  startRender(): void {
    if (!this.config.enabled) return;
    this.renderStartTime = performance.now();
  }

  /**
   * 结束渲染时间监控
   */
  endRender(): void {
    if (!this.config.enabled) return;
    this.metrics.renderTime = performance.now() - this.renderStartTime;
  }

  /**
   * 更新 FPS
   */
  updateFPS(): void {
    if (!this.config.enabled) return;
    
    this.frameCount++;
    const now = performance.now();
    
    if (this.fpsUpdateTime === 0) {
      this.fpsUpdateTime = now;
      return;
    }
    
    const elapsed = now - this.fpsUpdateTime;
    
    if (elapsed >= this.config.sampleInterval) {
      // 计算当前 FPS
      const currentFps = Math.round((this.frameCount * 1000) / elapsed);
      this.metrics.fps = currentFps;
      
      // 添加到样本
      this.fpsSamples.push(currentFps);
      if (this.fpsSamples.length > this.maxFpsSamples) {
        this.fpsSamples.shift();
      }
      
      // 计算统计数据
      this.metrics.avgFps = Math.round(
        this.fpsSamples.reduce((sum, fps) => sum + fps, 0) / this.fpsSamples.length
      );
      this.metrics.minFps = Math.min(...this.fpsSamples);
      this.metrics.maxFps = Math.max(...this.fpsSamples);
      
      // 检查性能
      this.metrics.isPerformanceGood = this.metrics.fps >= this.config.fpsWarningThreshold;
      
      // 重置计数器
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }
  }

  /**
   * 更新内存使用情况
   */
  updateMemory(): void {
    if (!this.config.enabled) return;
    
    const now = performance.now();
    if (now - this.lastMemoryCheck < this.memoryCheckInterval) {
      return;
    }
    
    this.lastMemoryCheck = now;
    
    // 检查是否支持 performance.memory API
    const perfMemory = (performance as any).memory;
    if (perfMemory) {
      this.metrics.memoryUsed = Math.round(perfMemory.usedJSHeapSize / 1048576); // 转换为 MB
      this.metrics.memoryLimit = Math.round(perfMemory.jsHeapSizeLimit / 1048576);
      this.metrics.memoryUsagePercent = Math.round(
        (perfMemory.usedJSHeapSize / perfMemory.jsHeapSizeLimit) * 100
      );
    }
  }

  /**
   * 更新游戏对象计数
   * @param objectCount 游戏对象数量
   * @param particleCount 粒子数量
   */
  updateObjectCounts(objectCount: number, particleCount: number): void {
    if (!this.config.enabled) return;
    
    this.metrics.objectCount = objectCount;
    this.metrics.particleCount = particleCount;
  }

  /**
   * 检测性能瓶颈
   */
  detectBottlenecks(): void {
    if (!this.config.enabled) return;
    
    const now = performance.now();
    if (now - this.lastBottleneckCheck < this.bottleneckCheckInterval) {
      return;
    }
    
    this.lastBottleneckCheck = now;
    this.bottlenecks = [];
    
    // 检查低 FPS
    if (this.metrics.fps < this.config.fpsWarningThreshold && this.metrics.fps > 0) {
      const severity = this.metrics.fps < 20 ? 'high' : this.metrics.fps < 25 ? 'medium' : 'low';
      this.bottlenecks.push({
        type: BottleneckType.LOW_FPS,
        severity,
        message: `帧率过低: ${this.metrics.fps} FPS (目标: ${this.config.fpsWarningThreshold}+)`,
        value: this.metrics.fps,
        threshold: this.config.fpsWarningThreshold
      });
    }
    
    // 检查高内存使用
    if (this.metrics.memoryUsagePercent > this.config.memoryWarningThreshold) {
      const severity = this.metrics.memoryUsagePercent > 90 ? 'high' : 
                      this.metrics.memoryUsagePercent > 85 ? 'medium' : 'low';
      this.bottlenecks.push({
        type: BottleneckType.HIGH_MEMORY,
        severity,
        message: `内存使用过高: ${this.metrics.memoryUsagePercent}% (${this.metrics.memoryUsed}MB / ${this.metrics.memoryLimit}MB)`,
        value: this.metrics.memoryUsagePercent,
        threshold: this.config.memoryWarningThreshold
      });
    }
    
    // 检查渲染时间
    const targetFrameTime = 1000 / 60; // 60 FPS 目标
    if (this.metrics.renderTime > targetFrameTime * 0.7) {
      const severity = this.metrics.renderTime > targetFrameTime ? 'high' : 'medium';
      this.bottlenecks.push({
        type: BottleneckType.SLOW_RENDER,
        severity,
        message: `渲染时间过长: ${this.metrics.renderTime.toFixed(2)}ms (目标: <${(targetFrameTime * 0.7).toFixed(2)}ms)`,
        value: this.metrics.renderTime,
        threshold: targetFrameTime * 0.7
      });
    }
    
    // 检查更新时间
    if (this.metrics.updateTime > targetFrameTime * 0.5) {
      const severity = this.metrics.updateTime > targetFrameTime * 0.7 ? 'high' : 'medium';
      this.bottlenecks.push({
        type: BottleneckType.SLOW_UPDATE,
        severity,
        message: `更新时间过长: ${this.metrics.updateTime.toFixed(2)}ms (目标: <${(targetFrameTime * 0.5).toFixed(2)}ms)`,
        value: this.metrics.updateTime,
        threshold: targetFrameTime * 0.5
      });
    }
    
    // 检查对象数量
    if (this.metrics.objectCount > this.config.maxObjectCount) {
      const severity = this.metrics.objectCount > this.config.maxObjectCount * 1.5 ? 'high' : 'medium';
      this.bottlenecks.push({
        type: BottleneckType.TOO_MANY_OBJECTS,
        severity,
        message: `游戏对象过多: ${this.metrics.objectCount} (建议: <${this.config.maxObjectCount})`,
        value: this.metrics.objectCount,
        threshold: this.config.maxObjectCount
      });
    }
    
    // 检查粒子数量
    if (this.metrics.particleCount > this.config.maxParticleCount) {
      const severity = this.metrics.particleCount > this.config.maxParticleCount * 1.5 ? 'high' : 'medium';
      this.bottlenecks.push({
        type: BottleneckType.TOO_MANY_PARTICLES,
        severity,
        message: `粒子数量过多: ${this.metrics.particleCount} (建议: <${this.config.maxParticleCount})`,
        value: this.metrics.particleCount,
        threshold: this.config.maxParticleCount
      });
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取性能瓶颈
   */
  getBottlenecks(): BottleneckInfo[] {
    return [...this.bottlenecks];
  }

  /**
   * 渲染性能叠加层
   * @param ctx 渲染上下文
   * @param x X 坐标
   * @param y Y 坐标
   */
  renderOverlay(ctx: CanvasRenderingContext2D, x: number = 10, y: number = 10): void {
    if (!this.config.enabled || !this.config.showOverlay) return;
    
    ctx.save();
    
    // 背景
    const padding = 15;
    const lineHeight = 22;
    const lines = 8;
    const width = 280;
    const height = padding * 2 + lineHeight * lines;
    
    ctx.fillStyle = 'rgba(10, 14, 39, 0.85)';
    ctx.fillRect(x, y, width, height);
    
    // 边框
    ctx.strokeStyle = this.metrics.isPerformanceGood ? '#00FFFF' : '#FF0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // 文字样式
    ctx.font = '14px Share Tech Mono';
    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;
    
    let currentY = y + padding + 16;
    
    // FPS
    ctx.fillStyle = this.metrics.fps >= this.config.fpsWarningThreshold ? '#00FF00' : '#FF0000';
    ctx.fillText(`FPS: ${this.metrics.fps} (Avg: ${this.metrics.avgFps})`, x + padding, currentY);
    currentY += lineHeight;
    
    // 帧时间
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Frame: ${this.metrics.frameTime.toFixed(2)}ms`, x + padding, currentY);
    currentY += lineHeight;
    
    // 更新时间
    ctx.fillStyle = this.metrics.updateTime > 10 ? '#FFAA00' : '#FFFFFF';
    ctx.fillText(`Update: ${this.metrics.updateTime.toFixed(2)}ms`, x + padding, currentY);
    currentY += lineHeight;
    
    // 渲染时间
    ctx.fillStyle = this.metrics.renderTime > 10 ? '#FFAA00' : '#FFFFFF';
    ctx.fillText(`Render: ${this.metrics.renderTime.toFixed(2)}ms`, x + padding, currentY);
    currentY += lineHeight;
    
    // 内存
    if (this.metrics.memoryLimit > 0) {
      ctx.fillStyle = this.metrics.memoryUsagePercent > this.config.memoryWarningThreshold ? '#FF0000' : '#FFFFFF';
      ctx.fillText(
        `Memory: ${this.metrics.memoryUsed}MB (${this.metrics.memoryUsagePercent}%)`,
        x + padding,
        currentY
      );
      currentY += lineHeight;
    }
    
    // 对象数量
    ctx.fillStyle = this.metrics.objectCount > this.config.maxObjectCount ? '#FFAA00' : '#FFFFFF';
    ctx.fillText(`Objects: ${this.metrics.objectCount}`, x + padding, currentY);
    currentY += lineHeight;
    
    // 粒子数量
    ctx.fillStyle = this.metrics.particleCount > this.config.maxParticleCount ? '#FFAA00' : '#FFFFFF';
    ctx.fillText(`Particles: ${this.metrics.particleCount}`, x + padding, currentY);
    currentY += lineHeight;
    
    // 性能状态
    ctx.fillStyle = this.metrics.isPerformanceGood ? '#00FF00' : '#FF0000';
    ctx.fillText(
      `Status: ${this.metrics.isPerformanceGood ? 'GOOD' : 'POOR'}`,
      x + padding,
      currentY
    );
    
    ctx.restore();
  }

  /**
   * 渲染性能瓶颈警告
   * @param ctx 渲染上下文
   * @param x X 坐标
   * @param y Y 坐标
   */
  renderBottlenecks(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    if (!this.config.enabled || this.bottlenecks.length === 0) return;
    
    ctx.save();
    
    const padding = 10;
    const lineHeight = 20;
    const width = 400;
    const height = padding * 2 + lineHeight * this.bottlenecks.length;
    
    // 背景
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.fillRect(x, y, width, height);
    
    // 边框
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // 文字
    ctx.font = '12px Share Tech Mono';
    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;
    
    let currentY = y + padding + 14;
    
    for (const bottleneck of this.bottlenecks) {
      // 根据严重程度设置颜色
      switch (bottleneck.severity) {
        case 'high':
          ctx.fillStyle = '#FF0000';
          break;
        case 'medium':
          ctx.fillStyle = '#FFAA00';
          break;
        case 'low':
          ctx.fillStyle = '#FFFF00';
          break;
      }
      
      ctx.fillText(`⚠ ${bottleneck.message}`, x + padding, currentY);
      currentY += lineHeight;
    }
    
    ctx.restore();
  }

  /**
   * 重置统计数据
   */
  reset(): void {
    this.fpsSamples = [];
    this.metrics.minFps = Infinity;
    this.metrics.maxFps = 0;
    this.bottlenecks = [];
  }

  /**
   * 启用/禁用监控
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * 显示/隐藏叠加层
   */
  setShowOverlay(show: boolean): void {
    this.config.showOverlay = show;
  }

  /**
   * 获取配置
   */
  getConfig(): PerformanceMonitorConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PerformanceMonitorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取粒子质量乘数（基于当前 FPS）
   * 需求: 7.1 - 性能优化：根据帧率动态调整粒子数量
   * @returns 质量乘数 (0.5-1.0)
   */
  getParticleQualityMultiplier(): number {
    const fps = this.metrics.fps;
    
    // 如果 FPS 未初始化，返回最高质量
    if (fps === 0) {
      return 1.0;
    }
    
    // FPS >= 50: 最高质量 (1.0)
    if (fps >= 50) {
      return 1.0;
    }
    
    // FPS 40-50: 高质量 (0.85)
    if (fps >= 40) {
      return 0.85;
    }
    
    // FPS 30-40: 中等质量 (0.7)
    if (fps >= 30) {
      return 0.7;
    }
    
    // FPS 20-30: 低质量 (0.6)
    if (fps >= 20) {
      return 0.6;
    }
    
    // FPS < 20: 最低质量 (0.5)
    return 0.5;
  }
}
