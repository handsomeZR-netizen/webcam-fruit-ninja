/**
 * 特殊效果指示器渲染器
 * 需求: 4.3 - WHEN 玩家激活特殊水果效果时，THE 视觉反馈系统 SHALL 在屏幕边缘显示效果指示器
 */

import { SpecialFruitEffect } from '../game/SpecialFruitEffectManager.js';
import { SpecialFruitType } from '../game/SpecialFruit.js';

/**
 * 效果指示器接口
 */
export interface EffectIndicator {
  type: SpecialFruitType;
  remainingTime: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  color: string;
  icon: string;
}

/**
 * 效果指示器配置
 */
interface EffectIndicatorConfig {
  size: number;              // 指示器大小（像素）
  padding: number;           // 距离屏幕边缘的间距
  borderWidth: number;       // 边框宽度
  iconSize: number;          // 图标大小
  fontSize: number;          // 字体大小
}

/**
 * 效果指示器渲染器类
 * 在屏幕边缘显示激活的特殊水果效果和剩余时间
 */
export class EffectIndicatorRenderer {
  private config: EffectIndicatorConfig;

  constructor(config?: Partial<EffectIndicatorConfig>) {
    this.config = {
      size: 80,
      padding: 20,
      borderWidth: 3,
      iconSize: 32,
      fontSize: 14,
      ...config
    };
  }

  /**
   * 渲染所有激活的效果指示器
   * 需求: 4.3 - 显示效果图标和剩余时间倒计时
   * @param ctx Canvas 渲染上下文
   * @param activeEffects 激活的效果数组
   * @param canvasWidth 画布宽度
   * @param canvasHeight 画布高度
   */
  renderIndicators(
    ctx: CanvasRenderingContext2D,
    activeEffects: SpecialFruitEffect[],
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (activeEffects.length === 0) {
      return;
    }

    ctx.save();

    for (const effect of activeEffects) {
      // 跳过黄金水果（不需要持续效果指示器）
      if (effect.type === SpecialFruitType.GOLDEN) {
        continue;
      }

      const indicator = this.createIndicator(effect);
      const position = this.getIndicatorPosition(
        indicator.position,
        canvasWidth,
        canvasHeight
      );

      this.renderIndicator(ctx, indicator, position.x, position.y);
    }

    ctx.restore();
  }

  /**
   * 创建效果指示器
   * @param effect 特殊水果效果
   * @returns 效果指示器对象
   */
  private createIndicator(effect: SpecialFruitEffect): EffectIndicator {
    const currentTime = Date.now();
    const elapsed = currentTime - effect.startTime;
    const remainingTime = Math.max(0, effect.duration - elapsed);

    let position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    let color: string;
    let icon: string;

    switch (effect.type) {
      case SpecialFruitType.FROZEN:
        // 需求: 4.3 - 冰冻效果：左上角，蓝色边框，雪花图标
        position = 'top-left';
        color = '#00BFFF';
        icon = '❄️';
        break;

      case SpecialFruitType.FRENZY:
        // 需求: 4.3 - 狂暴效果：右上角，红色边框，火焰图标
        position = 'top-right';
        color = '#FF4500';
        icon = '🔥';
        break;

      default:
        position = 'top-left';
        color = '#FFFFFF';
        icon = '?';
    }

    return {
      type: effect.type,
      remainingTime,
      position,
      color,
      icon
    };
  }

  /**
   * 获取指示器在画布上的位置
   * @param position 位置标识
   * @param canvasWidth 画布宽度
   * @param canvasHeight 画布高度
   * @returns 坐标 {x, y}
   */
  private getIndicatorPosition(
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
    canvasWidth: number,
    canvasHeight: number
  ): { x: number; y: number } {
    const { size, padding } = this.config;

    switch (position) {
      case 'top-left':
        return { x: padding, y: padding };

      case 'top-right':
        return { x: canvasWidth - size - padding, y: padding };

      case 'bottom-left':
        return { x: padding, y: canvasHeight - size - padding };

      case 'bottom-right':
        return { x: canvasWidth - size - padding, y: canvasHeight - size - padding };
    }
  }

  /**
   * 渲染单个效果指示器
   * @param ctx Canvas 渲染上下文
   * @param indicator 效果指示器
   * @param x X 坐标
   * @param y Y 坐标
   */
  private renderIndicator(
    ctx: CanvasRenderingContext2D,
    indicator: EffectIndicator,
    x: number,
    y: number
  ): void {
    const { size, borderWidth } = this.config;

    ctx.save();

    // 绘制背景（半透明黑色）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, size, size);

    // 绘制彩色边框
    ctx.strokeStyle = indicator.color;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(x, y, size, size);

    // 绘制图标（使用 emoji 或自定义图标）
    this.renderIcon(ctx, indicator, x + size / 2, y + size / 3);

    // 绘制剩余时间
    this.renderRemainingTime(ctx, indicator, x + size / 2, y + size * 0.75);

    ctx.restore();
  }

  /**
   * 渲染效果图标
   * @param ctx Canvas 渲染上下文
   * @param indicator 效果指示器
   * @param centerX 中心 X 坐标
   * @param centerY 中心 Y 坐标
   */
  private renderIcon(
    ctx: CanvasRenderingContext2D,
    indicator: EffectIndicator,
    centerX: number,
    centerY: number
  ): void {
    ctx.save();
    ctx.translate(centerX, centerY);

    // 根据效果类型绘制不同的图标
    switch (indicator.type) {
      case SpecialFruitType.FROZEN:
        this.drawSnowflakeIcon(ctx, this.config.iconSize, indicator.color);
        break;

      case SpecialFruitType.FRENZY:
        this.drawFlameIcon(ctx, this.config.iconSize, indicator.color);
        break;
    }

    ctx.restore();
  }

  /**
   * 绘制雪花图标
   * @param ctx Canvas 渲染上下文
   * @param size 图标大小
   * @param color 颜色
   */
  private drawSnowflakeIcon(ctx: CanvasRenderingContext2D, size: number, color: string): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const radius = size / 2;

    // 绘制六条主线
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.stroke();

      // 绘制分支
      const branchLength = radius * 0.3;
      const branchAngle1 = angle - Math.PI / 6;
      const branchAngle2 = angle + Math.PI / 6;

      ctx.beginPath();
      ctx.moveTo(x * 0.7, y * 0.7);
      ctx.lineTo(
        x * 0.7 + Math.cos(branchAngle1) * branchLength,
        y * 0.7 + Math.sin(branchAngle1) * branchLength
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x * 0.7, y * 0.7);
      ctx.lineTo(
        x * 0.7 + Math.cos(branchAngle2) * branchLength,
        y * 0.7 + Math.sin(branchAngle2) * branchLength
      );
      ctx.stroke();
    }
  }

  /**
   * 绘制火焰图标
   * @param ctx Canvas 渲染上下文
   * @param size 图标大小
   * @param color 颜色
   */
  private drawFlameIcon(ctx: CanvasRenderingContext2D, size: number, color: string): void {
    const width = size * 0.8;
    const height = size;

    // 创建渐变
    const gradient = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
    gradient.addColorStop(0, '#FFD700'); // 金色顶部
    gradient.addColorStop(0.5, color);   // 主色
    gradient.addColorStop(1, '#8B0000'); // 深红底部

    ctx.fillStyle = gradient;

    // 绘制火焰形状
    ctx.beginPath();
    ctx.moveTo(0, -height / 2);
    
    // 右侧曲线
    ctx.bezierCurveTo(
      width / 2, -height / 3,
      width / 2, height / 6,
      width / 4, height / 2
    );
    
    // 底部中心
    ctx.quadraticCurveTo(0, height / 3, -width / 4, height / 2);
    
    // 左侧曲线
    ctx.bezierCurveTo(
      -width / 2, height / 6,
      -width / 2, -height / 3,
      0, -height / 2
    );
    
    ctx.closePath();
    ctx.fill();

    // 添加内部高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, -height / 3);
    ctx.quadraticCurveTo(width / 6, -height / 6, width / 8, height / 6);
    ctx.quadraticCurveTo(0, 0, -width / 8, height / 6);
    ctx.quadraticCurveTo(-width / 6, -height / 6, 0, -height / 3);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 渲染剩余时间倒计时
   * 需求: 4.3 - 显示剩余时间倒计时
   * @param ctx Canvas 渲染上下文
   * @param indicator 效果指示器
   * @param centerX 中心 X 坐标
   * @param centerY 中心 Y 坐标
   */
  private renderRemainingTime(
    ctx: CanvasRenderingContext2D,
    indicator: EffectIndicator,
    centerX: number,
    centerY: number
  ): void {
    const seconds = Math.ceil(indicator.remainingTime / 1000);

    ctx.font = `bold ${this.config.fontSize}px Orbitron, monospace`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 显示秒数
    ctx.fillText(`${seconds}s`, centerX, centerY);

    // 绘制进度条
    const barWidth = this.config.size * 0.7;
    const barHeight = 4;
    const barX = centerX - barWidth / 2;
    const barY = centerY + this.config.fontSize;

    // 背景条
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // 进度条
    const progress = indicator.remainingTime / this.getEffectDuration(indicator.type);
    ctx.fillStyle = indicator.color;
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
  }

  /**
   * 获取效果的总持续时间
   * @param type 特殊水果类型
   * @returns 持续时间（毫秒）
   */
  private getEffectDuration(type: SpecialFruitType): number {
    switch (type) {
      case SpecialFruitType.FROZEN:
        return 3000; // 3秒
      case SpecialFruitType.FRENZY:
        return 5000; // 5秒
      default:
        return 1000;
    }
  }

  /**
   * 更新配置
   * @param config 新的配置
   */
  updateConfig(config: Partial<EffectIndicatorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
