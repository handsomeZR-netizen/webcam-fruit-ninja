/**
 * 性能优化器
 * 需求: 7.1 - 确保帧率保持在 30+ FPS，实现性能降级策略
 * 
 * 根据当前性能自动调整游戏质量设置
 */

import { PerformanceMonitor, BottleneckType } from './PerformanceMonitor.js';

/**
 * 性能质量等级
 */
export enum PerformanceQuality {
  ULTRA = 'ultra',    // 超高质量 (60+ FPS)
  HIGH = 'high',      // 高质量 (50-60 FPS)
  MEDIUM = 'medium',  // 中等质量 (40-50 FPS)
  LOW = 'low',        // 低质量 (30-40 FPS)
  MINIMAL = 'minimal' // 最低质量 (< 30 FPS)
}

/**
 * 性能优化设置
 */
export interface PerformanceSettings {
  particleQuality: number;        // 粒子质量 (0.5-1.0)
  maxParticles: number;           // 最大粒子数量
  maxFloatingScores: number;      // 最大浮动分数数量
  enableMilestoneAnimations: boolean;  // 启用里程碑动画
  enableEffectIndicators: boolean;     // 启用效果指示器
  enableSpecialEffects: boolean;       // 启用特殊效果
  shadowQuality: number;          // 阴影质量 (0-1)
  trailQuality: number;           // 轨迹质量 (0-1)
}

/**
 * 性能优化器配置
 */
export interface PerformanceOptimizerConfig {
  enabled: boolean;               // 是否启用自动优化
  checkInterval: number;          // 检查间隔（毫秒）
  fpsThresholds: {
    ultra: number;                // 超高质量阈值
    high: number;                 // 高质量阈值
    medium: number;               // 中等质量阈值
    low: number;                  // 低质量阈值
  };
  stabilizationFrames: number;    // 稳定帧数（避免频繁切换）
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: PerformanceOptimizerConfig = {
  enabled: true,
  checkInterval: 2000,
  fpsThresholds: {
    ultra: 55,
    high: 45,
    medium: 35,
    low: 25
  },
  stabilizationFrames: 30
};

/**
 * 质量预设
 */
const QUALITY_PRESETS: Record<PerformanceQuality, PerformanceSettings> = {
  [PerformanceQuality.ULTRA]: {
    particleQuality: 1.0,
    maxParticles: 200,
    maxFloatingScores: 10,
    enableMilestoneAnimations: true,
    enableEffectIndicators: true,
    enableSpecialEffects: true,
    shadowQuality: 1.0,
    trailQuality: 1.0
  },
  [PerformanceQuality.HIGH]: {
    particleQuality: 0.85,
    maxParticles: 150,
    maxFloatingScores: 8,
    enableMilestoneAnimations: true,
    enableEffectIndicators: true,
    enableSpecialEffects: true,
    shadowQuality: 0.8,
    trailQuality: 0.9
  },
  [PerformanceQuality.MEDIUM]: {
    particleQuality: 0.7,
    maxParticles: 100,
    maxFloatingScores: 6,
    enableMilestoneAnimations: true,
    enableEffectIndicators: true,
    enableSpecialEffects: true,
    shadowQuality: 0.6,
    trailQuality: 0.7
  },
  [PerformanceQuality.LOW]: {
    particleQuality: 0.5,
    maxParticles: 50,
    maxFloatingScores: 4,
    enableMilestoneAnimations: false,
    enableEffectIndicators: true,
    enableSpecialEffects: false,
    shadowQuality: 0.3,
    trailQuality: 0.5
  },
  [PerformanceQuality.MINIMAL]: {
    particleQuality: 0.3,
    maxParticles: 30,
    maxFloatingScores: 2,
    enableMilestoneAnimations: false,
    enableEffectIndicators: false,
    enableSpecialEffects: false,
    shadowQuality: 0,
    trailQuality: 0.3
  }
};

/**
 * 性能优化器类
 */
export class PerformanceOptimizer {
  private config: PerformanceOptimizerConfig;
  private performanceMonitor: PerformanceMonitor;
  private currentQuality: PerformanceQuality;
  private currentSettings: PerformanceSettings;
  private lastCheckTime: number;
  private fpsHistory: number[];
  private qualityChangeCallbacks: Array<(quality: PerformanceQuality, settings: PerformanceSettings) => void>;

  constructor(
    performanceMonitor: PerformanceMonitor,
    config: Partial<PerformanceOptimizerConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.performanceMonitor = performanceMonitor;
    this.currentQuality = PerformanceQuality.ULTRA;
    this.currentSettings = { ...QUALITY_PRESETS[PerformanceQuality.ULTRA] };
    this.lastCheckTime = 0;
    this.fpsHistory = [];
    this.qualityChangeCallbacks = [];
  }

  /**
   * 更新性能优化器
   */
  update(): void {
    if (!this.config.enabled) {
      return;
    }

    const now = performance.now();
    if (now - this.lastCheckTime < this.config.checkInterval) {
      return;
    }

    this.lastCheckTime = now;

    // 获取当前 FPS
    const metrics = this.performanceMonitor.getMetrics();
    const currentFPS = metrics.fps;

    // 添加到历史记录
    this.fpsHistory.push(currentFPS);
    if (this.fpsHistory.length > this.config.stabilizationFrames) {
      this.fpsHistory.shift();
    }

    // 需要足够的历史数据才能做决策
    if (this.fpsHistory.length < this.config.stabilizationFrames) {
      return;
    }

    // 计算平均 FPS
    const avgFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;

    // 根据平均 FPS 确定目标质量等级
    const targetQuality = this.determineQualityLevel(avgFPS);

    // 如果质量等级改变，应用新设置
    if (targetQuality !== this.currentQuality) {
      this.applyQualityLevel(targetQuality);
    }
  }

  /**
   * 根据 FPS 确定质量等级
   */
  private determineQualityLevel(fps: number): PerformanceQuality {
    const thresholds = this.config.fpsThresholds;

    if (fps >= thresholds.ultra) {
      return PerformanceQuality.ULTRA;
    } else if (fps >= thresholds.high) {
      return PerformanceQuality.HIGH;
    } else if (fps >= thresholds.medium) {
      return PerformanceQuality.MEDIUM;
    } else if (fps >= thresholds.low) {
      return PerformanceQuality.LOW;
    } else {
      return PerformanceQuality.MINIMAL;
    }
  }

  /**
   * 应用质量等级
   */
  private applyQualityLevel(quality: PerformanceQuality): void {
    console.log(`性能优化: 切换质量等级从 ${this.currentQuality} 到 ${quality}`);

    this.currentQuality = quality;
    this.currentSettings = { ...QUALITY_PRESETS[quality] };

    // 通知所有回调
    this.qualityChangeCallbacks.forEach(callback => {
      callback(quality, this.currentSettings);
    });

    // 清空 FPS 历史，避免立即再次切换
    this.fpsHistory = [];
  }

  /**
   * 注册质量变化回调
   */
  onQualityChange(callback: (quality: PerformanceQuality, settings: PerformanceSettings) => void): void {
    this.qualityChangeCallbacks.push(callback);
  }

  /**
   * 获取当前质量等级
   */
  getCurrentQuality(): PerformanceQuality {
    return this.currentQuality;
  }

  /**
   * 获取当前设置
   */
  getCurrentSettings(): PerformanceSettings {
    return { ...this.currentSettings };
  }

  /**
   * 手动设置质量等级
   */
  setQualityLevel(quality: PerformanceQuality): void {
    this.applyQualityLevel(quality);
  }

  /**
   * 启用/禁用自动优化
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * 重置优化器
   */
  reset(): void {
    this.fpsHistory = [];
    this.currentQuality = PerformanceQuality.ULTRA;
    this.currentSettings = { ...QUALITY_PRESETS[PerformanceQuality.ULTRA] };
  }

  /**
   * 获取性能建议
   */
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const bottlenecks = this.performanceMonitor.getBottlenecks();

    // 基于瓶颈提供建议
    for (const bottleneck of bottlenecks) {
      switch (bottleneck.type) {
        case BottleneckType.LOW_FPS:
          recommendations.push('降低游戏质量设置以提高帧率');
          break;
        case BottleneckType.HIGH_MEMORY:
          recommendations.push('减少同时存在的游戏对象数量');
          break;
        case BottleneckType.SLOW_RENDER:
          recommendations.push('禁用部分视觉效果以加快渲染');
          break;
        case BottleneckType.SLOW_UPDATE:
          recommendations.push('优化游戏逻辑更新');
          break;
        case BottleneckType.TOO_MANY_OBJECTS:
          recommendations.push('限制游戏对象生成频率');
          break;
        case BottleneckType.TOO_MANY_PARTICLES:
          recommendations.push('降低粒子效果质量');
          break;
      }
    }

    // 基于当前质量等级提供建议
    if (this.currentQuality === PerformanceQuality.MINIMAL) {
      recommendations.push('当前已使用最低质量设置，考虑关闭浏览器其他标签页');
    } else if (this.currentQuality === PerformanceQuality.LOW) {
      recommendations.push('性能较低，建议关闭后台应用程序');
    }

    return recommendations;
  }
}
