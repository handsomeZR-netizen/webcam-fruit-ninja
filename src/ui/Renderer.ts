/**
 * 渲染器类 - 负责所有游戏元素的渲染
 * 需求: 7.1
 */

import { GameObject } from '../game/GameObject.js';
import { GameConfig } from '../core/GameConfig.js';
import { ParticleEffect } from '../game/ParticleEffect.js';
import { SciFiTheme } from './SciFiTheme.js';

/**
 * 渲染器类
 */
export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  theme: SciFiTheme;
  private config: GameConfig;
  private backgroundGradient: CanvasGradient | null = null;
  
  // 性能优化：离屏 Canvas 预渲染背景
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private backgroundDirty: boolean = true;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('无法获取 Canvas 2D 上下文');
    }
    
    this.ctx = context;
    this.config = config;
    this.theme = new SciFiTheme();
    
    // 初始化画布尺寸
    this.initializeCanvas();
    
    // 预创建背景渐变
    this.createBackgroundGradient();
    
    // 初始化离屏 Canvas
    this.initializeOffscreenCanvas();
  }

  /**
   * 初始化画布尺寸
   */
  private initializeCanvas(): void {
    // 设置画布的实际尺寸
    this.canvas.width = this.config.canvasWidth;
    this.canvas.height = this.config.canvasHeight;
    
    // 启用图像平滑以获得更好的渲染质量
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /**
   * 初始化离屏 Canvas（性能优化）
   * 需求: 7.1 - 性能优化：预渲染静态背景
   */
  private initializeOffscreenCanvas(): void {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    
    if (!this.offscreenCtx) {
      console.warn('无法创建离屏 Canvas 上下文，将使用标准渲染');
      this.offscreenCanvas = null;
      return;
    }
    
    // 预渲染背景到离屏 Canvas
    this.prerenderBackground();
  }

  /**
   * 创建背景渐变（预渲染优化）
   */
  private createBackgroundGradient(): void {
    // 创建深色科幻风格背景渐变
    this.backgroundGradient = this.ctx.createLinearGradient(
      0, 0,
      0, this.canvas.height
    );
    
    // 深蓝到深紫的渐变
    this.backgroundGradient.addColorStop(0, '#0A0E27');
    this.backgroundGradient.addColorStop(0.5, '#0D1133');
    this.backgroundGradient.addColorStop(1, '#0A0E27');
    
    // 标记背景需要重新渲染
    this.backgroundDirty = true;
  }
  
  /**
   * 预渲染背景到离屏 Canvas（性能优化）
   * 需求: 7.1 - 实现离屏 Canvas 预渲染背景
   */
  private prerenderBackground(): void {
    if (!this.offscreenCanvas || !this.offscreenCtx) {
      return;
    }
    
    // 创建离屏渐变
    const gradient = this.offscreenCtx.createLinearGradient(
      0, 0,
      0, this.offscreenCanvas.height
    );
    gradient.addColorStop(0, '#0A0E27');
    gradient.addColorStop(0.5, '#0D1133');
    gradient.addColorStop(1, '#0A0E27');
    
    // 绘制背景
    this.offscreenCtx.fillStyle = gradient;
    this.offscreenCtx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    
    // 绘制星空效果
    const starCount = 50;
    this.offscreenCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    
    for (let i = 0; i < starCount; i++) {
      const x = (i * 137.508) % this.offscreenCanvas.width;
      const y = (i * 197.508) % this.offscreenCanvas.height;
      const size = (i % 3) + 1;
      
      this.offscreenCtx.beginPath();
      this.offscreenCtx.arc(x, y, size, 0, Math.PI * 2);
      this.offscreenCtx.fill();
    }
    
    // 标记背景已更新
    this.backgroundDirty = false;
  }

  /**
   * 清空画布
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 渲染背景（使用离屏 Canvas 优化）
   * 需求: 7.1 - 性能优化：使用预渲染的背景
   */
  renderBackground(): void {
    // 如果有离屏 Canvas，直接复制预渲染的背景
    if (this.offscreenCanvas && this.offscreenCtx) {
      // 如果背景需要更新，重新预渲染
      if (this.backgroundDirty) {
        this.prerenderBackground();
      }
      
      // 直接绘制离屏 Canvas（非常快）
      this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    } else {
      // 降级到标准渲染
      if (this.backgroundGradient) {
        this.ctx.fillStyle = this.backgroundGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
      
      // 添加星空效果
      this.renderStars();
    }
    
    // 添加科幻扫描线效果（动态效果，不能预渲染）
    this.theme.drawScanlines(this.ctx, this.canvas.width, this.canvas.height);
  }

  /**
   * 渲染星空效果
   */
  private renderStars(): void {
    const starCount = 50;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    
    // 使用固定种子生成星星位置（避免闪烁）
    for (let i = 0; i < starCount; i++) {
      // 使用简单的伪随机算法保持星星位置固定
      const x = (i * 137.508) % this.canvas.width;
      const y = (i * 197.508) % this.canvas.height;
      const size = (i % 3) + 1;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  /**
   * 渲染游戏对象列表
   * @param objects 游戏对象数组
   */
  renderGameObjects(objects: GameObject[]): void {
    // 按照 y 坐标排序，实现简单的深度效果
    const sortedObjects = [...objects].sort((a, b) => a.position.y - b.position.y);
    
    for (const obj of sortedObjects) {
      if (obj.isAlive) {
        obj.render(this.ctx);
      }
    }
  }

  /**
   * 渲染手部轨迹
   * 需求: 1.3 - WHEN 手势识别模块检测到手部移动时，THE 游戏系统 SHALL 在屏幕上显示手部轨迹的视觉反馈
   * 需求: 7.4 - THE 游戏系统 SHALL 在手部轨迹上显示拖尾效果，持续时间为 300 毫秒
   * @param trail 手部位置轨迹数组
   */
  renderHandTrail(trail: Array<{ x: number; y: number; timestamp: number }>): void {
    if (trail.length < 2) {
      return;
    }

    const now = Date.now();
    const fadeTime = this.config.handTrailFadeTime;

    // 保存当前上下文状态
    this.ctx.save();

    // 设置线条样式
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // 绘制多层轨迹以实现霓虹发光效果
    this.renderTrailLayer(trail, now, fadeTime, 12, 0.3);  // 外层发光
    this.renderTrailLayer(trail, now, fadeTime, 8, 0.6);   // 中层发光
    this.renderTrailLayer(trail, now, fadeTime, 4, 1.0);   // 核心轨迹

    // 恢复上下文状态
    this.ctx.restore();
  }

  /**
   * 渲染单层轨迹（用于创建发光效果）
   * @param trail 手部位置轨迹
   * @param now 当前时间戳
   * @param fadeTime 淡出时间
   * @param lineWidth 线条宽度
   * @param alphaMultiplier 透明度乘数
   */
  private renderTrailLayer(
    trail: Array<{ x: number; y: number; timestamp: number }>,
    now: number,
    fadeTime: number,
    lineWidth: number,
    alphaMultiplier: number
  ): void {
    // 绘制轨迹线段
    for (let i = 0; i < trail.length - 1; i++) {
      const current = trail[i];
      const next = trail[i + 1];

      // 计算淡出透明度（基于时间）
      const age = now - current.timestamp;
      const fadeProgress = Math.max(0, 1 - age / fadeTime);

      // 计算位置透明度（轨迹前端更亮）
      const positionProgress = (i + 1) / trail.length;

      // 综合透明度
      const alpha = fadeProgress * positionProgress * alphaMultiplier;

      if (alpha <= 0) {
        continue;
      }

      // 转换归一化坐标到画布坐标
      const x1 = current.x * this.canvas.width;
      const y1 = current.y * this.canvas.height;
      const x2 = next.x * this.canvas.width;
      const y2 = next.y * this.canvas.height;

      // 设置渐变色（霓虹青色到霓虹紫色）
      const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, `rgba(0, 255, 255, ${alpha})`);    // 霓虹青色
      gradient.addColorStop(0.5, `rgba(128, 0, 255, ${alpha})`);  // 青紫混合
      gradient.addColorStop(1, `rgba(255, 0, 255, ${alpha})`);    // 霓虹紫色

      // 绘制线段
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = lineWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }

    // 在轨迹末端绘制发光圆点
    if (trail.length > 0) {
      const lastPoint = trail[trail.length - 1];
      const age = now - lastPoint.timestamp;
      const fadeProgress = Math.max(0, 1 - age / fadeTime);
      const alpha = fadeProgress * alphaMultiplier;

      if (alpha > 0) {
        const x = lastPoint.x * this.canvas.width;
        const y = lastPoint.y * this.canvas.height;

        // 创建径向渐变实现发光效果
        const glowGradient = this.ctx.createRadialGradient(x, y, 0, x, y, lineWidth * 2);
        glowGradient.addColorStop(0, `rgba(255, 0, 255, ${alpha})`);
        glowGradient.addColorStop(0.5, `rgba(255, 0, 255, ${alpha * 0.5})`);
        glowGradient.addColorStop(1, `rgba(255, 0, 255, 0)`);

        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, lineWidth * 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  /**
   * 渲染粒子效果
   * 需求: 7.2 - WHEN 水果对象被切割时，THE 游戏引擎 SHALL 显示水果分裂成两半的动画效果
   * 需求: 7.3 - WHEN 水果对象被切割时，THE 游戏引擎 SHALL 显示果汁飞溅的粒子效果
   * @param particles 粒子效果数组
   */
  renderParticles(particles: ParticleEffect[]): void {
    for (const particle of particles) {
      if (particle.isAlive) {
        particle.render(this.ctx);
      }
    }
  }

  /**
   * 渲染摄像头预览（游戏中的小窗口）
   * @param videoElement 视频元素
   * @param x X 坐标
   * @param y Y 坐标
   * @param width 宽度
   * @param height 高度
   */
  renderCameraPreview(
    videoElement: HTMLVideoElement,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    if (!videoElement || videoElement.readyState < 2) {
      return;
    }

    this.ctx.save();

    // 绘制半透明背景
    this.ctx.fillStyle = 'rgba(10, 14, 39, 0.7)';
    this.ctx.fillRect(x - 2, y - 2, width + 4, height + 4);

    // 绘制霓虹边框
    this.theme.drawNeonBorder(
      this.ctx,
      x - 2,
      y - 2,
      width + 4,
      height + 4,
      this.theme.colors.primary,
      8
    );

    // 裁剪区域
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.ctx.clip();

    // 绘制镜像视频
    this.ctx.translate(x + width, y);
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(videoElement, 0, 0, width, height);

    this.ctx.restore();

    // 绘制标签（优化：移除阴影）
    this.ctx.font = '12px "Share Tech Mono"';
    this.ctx.fillStyle = this.theme.colors.primary;
    this.ctx.fillText('摄像头', x + 5, y - 8);
  }

  /**
   * 获取画布尺寸
   */
  getCanvasSize(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  /**
   * 调整画布尺寸（响应式）
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    
    // 重新创建背景渐变
    this.createBackgroundGradient();
    
    // 调整离屏 Canvas 尺寸并重新预渲染
    if (this.offscreenCanvas && this.offscreenCtx) {
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
      this.backgroundDirty = true;
      this.prerenderBackground();
    }
  }
}
