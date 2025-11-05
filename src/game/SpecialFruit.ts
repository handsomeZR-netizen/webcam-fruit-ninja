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
 * 特殊水果类
 * 继承自普通水果，添加特殊效果
 */
export class SpecialFruit extends Fruit {
  specialType: SpecialFruitType;
  specialColor: string;

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
    // 绘制光晕效果（黄金水果）
    if (this.specialType === SpecialFruitType.GOLDEN) {
      // 金色光晕
      const gradient = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, this.radius * 1.5);
      gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
      gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 绘制水果本体（使用父类的渲染逻辑）
    this.renderWholeFruit(ctx);

    // 绘制特殊标识
    this.renderSpecialIndicator(ctx);
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
