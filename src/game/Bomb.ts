/**
 * 炸弹对象类
 * 需求: 2.4, 4.4
 */

import { GameObject, Vector2D, Bounds } from './GameObject.js';
import { ParticleEffect } from './ParticleEffect.js';

/**
 * 炸弹类
 */
export class Bomb extends GameObject {
  radius: number;
  isExploding: boolean;
  explosionProgress: number; // 0-1，爆炸动画进度
  explosionDuration: number; // 爆炸动画持续时间（秒）
  explosionEffect: ParticleEffect | null; // 爆炸粒子效果

  constructor(
    id: string,
    position: Vector2D,
    velocity: Vector2D,
    rotation: number = 0,
    scale: number = 1
  ) {
    super(id, 'bomb', position, velocity, rotation, scale);
    this.radius = 45;
    this.isExploding = false;
    this.explosionProgress = 0;
    this.explosionDuration = 0.5; // 0.5秒爆炸动画
    this.explosionEffect = null;
  }

  /**
   * 更新炸弹状态
   */
  update(deltaTime: number): void {
    if (this.isExploding) {
      // 更新爆炸动画
      this.explosionProgress += deltaTime / this.explosionDuration;
      if (this.explosionProgress >= 1) {
        this.destroy();
      }
    } else {
      // 正常物理更新
      this.updatePhysics(deltaTime);
    }
  }

  /**
   * 渲染炸弹
   */
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    if (this.isExploding) {
      this.renderExplosion(ctx);
    } else {
      ctx.rotate(this.rotation);
      ctx.scale(this.scale, this.scale);
      this.renderBomb(ctx);
    }

    ctx.restore();
  }

  /**
   * 渲染炸弹本体
   */
  private renderBomb(ctx: CanvasRenderingContext2D): void {
    // 绘制炸弹 Emoji（优化：移除阴影以提升性能）
    ctx.font = `${this.radius * 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', 0, 0);

    // 绘制引信
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(0, -this.radius - 15);
    ctx.stroke();

    // 绘制火花（闪烁效果）
    if (Math.random() > 0.5) {
      ctx.fillStyle = '#FF6600';
      ctx.beginPath();
      ctx.arc(0, -this.radius - 15, 5, 0, Math.PI * 2);
      ctx.fill();

      // 火花发光
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FF6600';
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.arc(0, -this.radius - 15, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 绘制警告标志
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 0, 0);
  }

  /**
   * 渲染爆炸效果
   */
  private renderExplosion(ctx: CanvasRenderingContext2D): void {
    const progress = this.explosionProgress;
    const maxRadius = this.radius * 4;
    const currentRadius = maxRadius * progress;

    // 外层爆炸圈（橙色）
    const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
    outerGradient.addColorStop(0, `rgba(255, 100, 0, ${1 - progress})`);
    outerGradient.addColorStop(0.5, `rgba(255, 150, 0, ${0.5 * (1 - progress)})`);
    outerGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // 内层爆炸圈（黄色）
    const innerRadius = currentRadius * 0.6;
    const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, innerRadius);
    innerGradient.addColorStop(0, `rgba(255, 255, 100, ${1 - progress})`);
    innerGradient.addColorStop(0.7, `rgba(255, 200, 0, ${0.5 * (1 - progress)})`);
    innerGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    // 核心白色闪光
    if (progress < 0.3) {
      const coreRadius = this.radius * (1 - progress / 0.3);
      ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress / 0.3})`;
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 绘制爆炸碎片
    this.renderExplosionDebris(ctx, progress, currentRadius);
  }

  /**
   * 渲染爆炸碎片
   */
  private renderExplosionDebris(
    ctx: CanvasRenderingContext2D,
    progress: number,
    maxRadius: number
  ): void {
    const debrisCount = 12;
    ctx.fillStyle = `rgba(50, 50, 50, ${1 - progress})`;

    for (let i = 0; i < debrisCount; i++) {
      const angle = (Math.PI * 2 * i) / debrisCount;
      const distance = maxRadius * progress * 0.8;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const size = 5 * (1 - progress);

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * 获取碰撞边界
   */
  getBounds(): Bounds {
    const size = this.radius * 2 * this.scale;
    return {
      x: this.position.x - this.radius * this.scale,
      y: this.position.y - this.radius * this.scale,
      width: size,
      height: size
    };
  }

  /**
   * 被切割时调用（触发爆炸）
   * 需求: 7.1 - 性能优化：根据帧率动态调整粒子质量
   */
  onSliced(qualityMultiplier: number = 1.0): void {
    this.explode(qualityMultiplier);
  }

  /**
   * 触发爆炸
   * 需求: 4.3 - WHEN 炸弹对象被切割时，THE 游戏系统 SHALL 播放爆炸动画和音效
   * 需求: 7.1 - 性能优化：根据帧率动态调整粒子质量
   */
  explode(qualityMultiplier: number = 1.0): void {
    this.isExploding = true;
    this.explosionProgress = 0;
    
    // 创建爆炸粒子效果（使用质量乘数）
    this.explosionEffect = ParticleEffect.createBombExplosionEffect(this.position, qualityMultiplier);
  }
}
