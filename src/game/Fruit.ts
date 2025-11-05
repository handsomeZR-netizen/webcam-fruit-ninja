/**
 * 水果对象类
 * 需求: 2.4, 4.4
 */

import { GameObject, Vector2D, Bounds } from './GameObject.js';
import { ParticleEffect } from './ParticleEffect.js';

export type FruitType = 'watermelon' | 'apple' | 'orange' | 'banana' | 'strawberry';

/**
 * 水果 Emoji 图标配置
 */
const FRUIT_EMOJIS: Record<FruitType, string> = {
  watermelon: '🍉',
  apple: '🍎',
  orange: '🍊',
  banana: '🍌',
  strawberry: '🍓'
};

/**
 * 水果颜色配置（用于切割后的显示）
 */
const FRUIT_COLORS: Record<FruitType, string> = {
  watermelon: '#FF6B6B',
  apple: '#FF3838',
  orange: '#FFA500',
  banana: '#FFE135',
  strawberry: '#FF1744'
};

/**
 * 水果大小配置（半径）
 */
const FRUIT_SIZES: Record<FruitType, number> = {
  watermelon: 60,
  apple: 40,
  orange: 45,
  banana: 50,
  strawberry: 35
};

/**
 * 水果类
 */
export class Fruit extends GameObject {
  fruitType: FruitType;
  radius: number;
  color: string;
  isSliced: boolean;
  sliceAngle: number;
  sliceOffset: Vector2D; // 切割后的偏移量
  sliceEffect: ParticleEffect | null; // 切割粒子效果

  constructor(
    id: string,
    fruitType: FruitType,
    position: Vector2D,
    velocity: Vector2D,
    rotation: number = 0,
    scale: number = 1
  ) {
    super(id, 'fruit', position, velocity, rotation, scale);
    this.fruitType = fruitType;
    this.radius = FRUIT_SIZES[fruitType];
    this.color = FRUIT_COLORS[fruitType];
    this.isSliced = false;
    this.sliceAngle = 0;
    this.sliceOffset = { x: 0, y: 0 };
    this.sliceEffect = null;
  }

  /**
   * 更新水果状态
   */
  update(deltaTime: number): void {
    this.updatePhysics(deltaTime);

    // 如果被切割，应用偏移
    if (this.isSliced) {
      this.position.x += this.sliceOffset.x * deltaTime;
      this.position.y += this.sliceOffset.y * deltaTime;
    }
  }

  /**
   * 渲染水果
   */
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale, this.scale);

    if (this.isSliced) {
      // 渲染切割后的半个水果
      this.renderSlicedFruit(ctx);
    } else {
      // 渲染完整水果
      this.renderWholeFruit(ctx);
    }

    ctx.restore();
  }

  /**
   * 渲染完整水果
   */
  protected renderWholeFruit(ctx: CanvasRenderingContext2D): void {
    // 绘制水果 Emoji（优化：移除阴影以提升性能）
    ctx.font = `${this.radius * 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(FRUIT_EMOJIS[this.fruitType], 0, 0);
  }

  /**
   * 渲染切割后的水果
   */
  protected renderSlicedFruit(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.rotate(this.sliceAngle);

    // 绘制半个水果
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI);
    ctx.closePath();
    ctx.fill();

    // 绘制切面
    ctx.fillStyle = this.getLighterColor(this.color);
    ctx.fillRect(-this.radius, 0, this.radius * 2, 3);

    // 绘制轮廓
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 获取更亮的颜色（用于切面）
   */
  protected getLighterColor(color: string): string {
    // 简单的颜色变亮算法
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + 40);
    const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + 40);
    const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + 40);
    return `rgb(${r}, ${g}, ${b})`;
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
   * 被切割时调用
   * 需求: 7.2, 7.3 - 显示水果分裂动画和果汁飞溅粒子效果
   * 需求: 7.1 - 性能优化：根据帧率动态调整粒子质量
   */
  onSliced(qualityMultiplier: number = 1.0): void {
    this.isSliced = true;
    // 记录切割角度（基于当前旋转）
    this.sliceAngle = Math.random() * Math.PI * 2;
    
    // 创建切割粒子效果（使用质量乘数）
    this.sliceEffect = ParticleEffect.createFruitSliceEffect(
      this.position,
      this.color,
      this.sliceAngle,
      qualityMultiplier
    );
  }

  /**
   * 分裂成两半
   * @param sliceAngle 切割角度
   * @returns 两个新的水果对象
   */
  split(sliceAngle: number): [Fruit, Fruit] {
    // 创建第一半
    const fruit1 = new Fruit(
      `${this.id}_1`,
      this.fruitType,
      { ...this.position },
      { ...this.velocity },
      this.rotation,
      this.scale
    );
    fruit1.isSliced = true;
    fruit1.sliceAngle = sliceAngle;
    fruit1.sliceOffset = {
      x: Math.cos(sliceAngle) * 50,
      y: Math.sin(sliceAngle) * 50
    };

    // 创建第二半
    const fruit2 = new Fruit(
      `${this.id}_2`,
      this.fruitType,
      { ...this.position },
      { ...this.velocity },
      this.rotation,
      this.scale
    );
    fruit2.isSliced = true;
    fruit2.sliceAngle = sliceAngle + Math.PI;
    fruit2.sliceOffset = {
      x: Math.cos(sliceAngle + Math.PI) * 50,
      y: Math.sin(sliceAngle + Math.PI) * 50
    };

    return [fruit1, fruit2];
  }

  /**
   * 创建随机水果
   */
  static createRandom(
    id: string,
    fruitTypes: FruitType[],
    position: Vector2D,
    velocity: Vector2D
  ): Fruit {
    const randomType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
    return new Fruit(id, randomType, position, velocity);
  }
}
