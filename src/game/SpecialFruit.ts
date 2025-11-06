/**
 * 特殊水果类
 * 需求: 2.1, 2.2, 2.6
 */

import { Fruit, FruitType } from './Fruit.js';
import { Vector2D } from './GameObject.js';

/**
 * 特殊水果类型枚举
 */
export enum SpecialFruitType {
  GOLDEN = 'golden',
  FROZEN = 'frozen',
  FRENZY = 'frenzy'
}

/**
 * 特殊水果颜色配置
 */
const SPECIAL_FRUIT_COLORS: Record<SpecialFruitType, string> = {
  [SpecialFruitType.GOLDEN]: '#FFD700',  // 金色
  [SpecialFruitType.FROZEN]: '#00BFFF',  // 蓝色
  [SpecialFruitType.FRENZY]: '#FF4500'   // 红色
};

/**
 * 粒子接口（用于特殊效果）
 */
interface SpecialFruitParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  angle: number;
}

/**
 * 特殊水果类
 * 继承自普通水果，添加特殊效果
 */
export class SpecialFruit extends Fruit {
  specialType: SpecialFruitType;
  specialColor: string;
  private animationTime: number = 0; // 动画时间计数器
  private particles: SpecialFruitParticle[] = []; // 粒子效果

  constructor(
    id: string,
    fruitType: FruitType,
    specialType: SpecialFruitType,
    position: Vector2D,
    velocity: Vector2D,
    rotation: number = 0,
    scale: number = 1
  ) {
    super(id, fruitType, position, velocity, rotation, scale);
    this.specialType = specialType;
    this.specialColor = SPECIAL_FRUIT_COLORS[specialType];
    
    // 覆盖普通水果的颜色为特殊颜色
    this.color = this.specialColor;
    
    // 初始化粒子效果
    this.initializeParticles();
  }

  /**
   * 初始化粒子效果
   * 需求: 2.6 - 为特殊水果添加独特的视觉标识
   */
  private initializeParticles(): void {
    const particleCount = this.specialType === SpecialFruitType.FRENZY ? 6 : 4;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * 0.5,
        vy: Math.sin(angle) * 0.5,
        life: 1.0,
        maxLife: 1.0,
        size: 3,
        angle: angle
      });
    }
  }

  /**
   * 更新特殊水果状态（包括粒子动画）
   */
  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // 更新动画时间
    this.animationTime += deltaTime;
    
    // 更新粒子位置
    this.updateParticles(deltaTime);
  }

  /**
   * 更新粒子效果
   */
  private updateParticles(deltaTime: number): void {
    const dt = deltaTime / 1000; // 转换为秒
    
    for (const particle of this.particles) {
      // 根据特殊类型更新粒子
      switch (this.specialType) {
        case SpecialFruitType.FROZEN:
          // 冰晶粒子：缓慢旋转
          particle.angle += dt * 0.5;
          particle.x = Math.cos(particle.angle) * this.radius * 0.8;
          particle.y = Math.sin(particle.angle) * this.radius * 0.8;
          break;
          
        case SpecialFruitType.FRENZY:
          // 火焰粒子：向上飘动
          particle.angle += dt * 2;
          const baseAngle = particle.angle;
          particle.x = Math.cos(baseAngle) * this.radius * 0.6;
          particle.y = Math.sin(baseAngle) * this.radius * 0.6 - Math.abs(Math.sin(this.animationTime * 0.003)) * this.radius * 0.3;
          break;
          
        case SpecialFruitType.GOLDEN:
          // 金色粒子：脉冲效果
          particle.angle += dt * 1;
          const pulseRadius = this.radius * (0.7 + Math.sin(this.animationTime * 0.005) * 0.2);
          particle.x = Math.cos(particle.angle) * pulseRadius;
          particle.y = Math.sin(particle.angle) * pulseRadius;
          break;
      }
    }
  }

  /**
   * 重写渲染方法，添加特殊视觉效果
   */
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale, this.scale);

    if (this.isSliced) {
      // 渲染切割后的半个水果（使用父类方法）
      this.renderSlicedFruit(ctx);
    } else {
      // 渲染完整水果，添加特殊效果
      this.renderSpecialWholeFruit(ctx);
    }

    ctx.restore();
  }

  /**
   * 渲染带特殊效果的完整水果
   */
  private renderSpecialWholeFruit(ctx: CanvasRenderingContext2D): void {
    // 渲染粒子效果（在水果后面）
    this.renderParticleEffects(ctx);
    
    // 绘制光晕效果
    this.renderGlowEffect(ctx);

    // 绘制水果本体（使用父类的渲染逻辑）
    this.renderWholeFruit(ctx);

    // 绘制特殊标识
    this.renderSpecialIndicator(ctx);
  }

  /**
   * 渲染光晕效果
   * 需求: 2.6 - 为特殊水果添加独特的视觉标识
   */
  private renderGlowEffect(ctx: CanvasRenderingContext2D): void {
    switch (this.specialType) {
      case SpecialFruitType.GOLDEN:
        // 金色闪烁光晕
        const flickerIntensity = 0.2 + Math.sin(this.animationTime * 0.008) * 0.1;
        const gradient = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, this.radius * 1.5);
        gradient.addColorStop(0, `rgba(255, 215, 0, ${flickerIntensity * 1.5})`);
        gradient.addColorStop(0.5, `rgba(255, 215, 0, ${flickerIntensity})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case SpecialFruitType.FROZEN:
        // 蓝色冰霜光晕
        const frozenGradient = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, this.radius * 1.3);
        frozenGradient.addColorStop(0, 'rgba(0, 191, 255, 0.3)');
        frozenGradient.addColorStop(0.5, 'rgba(0, 191, 255, 0.15)');
        frozenGradient.addColorStop(1, 'rgba(0, 191, 255, 0)');
        ctx.fillStyle = frozenGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.3, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case SpecialFruitType.FRENZY:
        // 红色火焰光晕
        const frenzyGradient = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, this.radius * 1.4);
        frenzyGradient.addColorStop(0, 'rgba(255, 69, 0, 0.4)');
        frenzyGradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.2)');
        frenzyGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        ctx.fillStyle = frenzyGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.4, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }

  /**
   * 渲染粒子效果
   * 需求: 2.6 - 为特殊水果添加独特的视觉标识
   */
  private renderParticleEffects(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    for (const particle of this.particles) {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      
      switch (this.specialType) {
        case SpecialFruitType.GOLDEN:
          // 金色闪光粒子
          const starSize = particle.size * (1 + Math.sin(this.animationTime * 0.01 + particle.angle) * 0.3);
          ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
          ctx.beginPath();
          ctx.arc(0, 0, starSize, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case SpecialFruitType.FROZEN:
          // 冰晶粒子（六角形）
          ctx.strokeStyle = 'rgba(0, 191, 255, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.rotate(particle.angle);
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * particle.size;
            const y = Math.sin(angle) * particle.size;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          ctx.stroke();
          break;
          
        case SpecialFruitType.FRENZY:
          // 火焰粒子
          const flameAlpha = 0.6 + Math.sin(this.animationTime * 0.01 + particle.angle) * 0.3;
          const flameGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size * 2);
          flameGradient.addColorStop(0, `rgba(255, 200, 0, ${flameAlpha})`);
          flameGradient.addColorStop(0.5, `rgba(255, 69, 0, ${flameAlpha * 0.7})`);
          flameGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
          ctx.fillStyle = flameGradient;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size * 2, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      
      ctx.restore();
    }
    
    ctx.restore();
  }

  /**
   * 渲染特殊标识
   */
  private renderSpecialIndicator(ctx: CanvasRenderingContext2D): void {
    // 在水果上方绘制小星星或图标
    ctx.save();
    
    // 根据特殊类型绘制不同的标识
    switch (this.specialType) {
      case SpecialFruitType.GOLDEN:
        // 金色星星
        this.drawStar(ctx, 0, -this.radius * 0.7, this.radius * 0.3, '#FFD700');
        break;
      case SpecialFruitType.FROZEN:
        // 蓝色雪花（简化为六角形）
        this.drawSnowflake(ctx, 0, -this.radius * 0.7, this.radius * 0.25, '#00BFFF');
        break;
      case SpecialFruitType.FRENZY:
        // 红色火焰
        this.drawFlame(ctx, 0, -this.radius * 0.7, this.radius * 0.3, '#FF4500');
        break;
    }
    
    ctx.restore();
  }

  /**
   * 绘制星星
   */
  private drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? size : size * 0.5;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  /**
   * 绘制雪花（简化为六角形）
   */
  private drawSnowflake(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    // 绘制六条线
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
      ctx.stroke();
    }
  }

  /**
   * 绘制火焰
   */
  private drawFlame(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
    ctx.fillStyle = color;
    
    // 绘制简单的火焰形状
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.quadraticCurveTo(x + size * 0.5, y - size * 0.5, x + size * 0.3, y);
    ctx.quadraticCurveTo(x, y - size * 0.3, x - size * 0.3, y);
    ctx.quadraticCurveTo(x - size * 0.5, y - size * 0.5, x, y - size);
    ctx.closePath();
    ctx.fill();
  }



  /**
   * 重写 onSliced 方法，处理特殊效果
   * 需求: 2.2 - WHEN 玩家切割黄金水果时，THE 游戏系统 SHALL 给予玩家双倍分数奖励
   * 需求: 2.3 - WHEN 玩家切割冰冻水果时，THE 游戏系统 SHALL 将所有水果的移动速度降低50%持续3秒
   */
  onSliced(qualityMultiplier: number = 1.0): void {
    // 调用父类的 onSliced 方法（创建粒子效果等）
    super.onSliced(qualityMultiplier);
    
    // 特殊水果的额外效果将在 GameLoop 中处理
    // 这里只负责视觉效果
  }

  /**
   * 获取分数倍率
   * 黄金水果返回 2.0，其他返回 1.0
   */
  getScoreMultiplier(): number {
    if (this.specialType === SpecialFruitType.GOLDEN) {
      return 2.0;
    }
    return 1.0;
  }

  /**
   * 检查是否需要激活持续效果
   * 冰冻和狂暴水果需要激活持续效果
   */
  shouldActivateEffect(): boolean {
    return this.specialType === SpecialFruitType.FROZEN || 
           this.specialType === SpecialFruitType.FRENZY;
  }

  /**
   * 获取效果持续时间（毫秒）
   */
  getEffectDuration(): number {
    switch (this.specialType) {
      case SpecialFruitType.FROZEN:
        return 3000; // 3秒
      case SpecialFruitType.FRENZY:
        return 5000; // 5秒
      default:
        return 0;
    }
  }
}
