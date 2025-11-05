/**
 * 粒子效果系统
 * 需求: 7.2 - WHEN 水果对象被切割时，THE 游戏引擎 SHALL 显示水果分裂成两半的动画效果
 * 需求: 7.3 - WHEN 水果对象被切割时，THE 游戏引擎 SHALL 显示果汁飞溅的粒子效果
 * 需求: 4.3 - WHEN 炸弹对象被切割时，THE 游戏系统 SHALL 播放爆炸动画和音效
 */

import { Vector2D } from './GameObject.js';

/**
 * 单个粒子
 */
interface Particle {
  position: Vector2D;
  velocity: Vector2D;
  life: number;        // 剩余生命值 (0-1)
  maxLife: number;     // 最大生命值（秒）
  size: number;        // 粒子大小
  color: string;       // 粒子颜色
  rotation: number;    // 旋转角度
  rotationSpeed: number; // 旋转速度
  alpha: number;       // 透明度
  gravity: number;     // 重力影响系数
}

/**
 * 粒子效果类型
 */
export type ParticleEffectType = 'fruit_slice' | 'bomb_explosion';

/**
 * 粒子效果类
 */
export class ParticleEffect {
  type: ParticleEffectType;
  position: Vector2D;
  particles: Particle[];
  isAlive: boolean;
  duration: number;    // 效果持续时间（秒）
  elapsed: number;     // 已经过时间（秒）

  constructor(type: ParticleEffectType, position: Vector2D) {
    this.type = type;
    this.position = { ...position };
    this.particles = [];
    this.isAlive = true;
    this.duration = 2.0; // 默认2秒
    this.elapsed = 0;
  }

  /**
   * 更新粒子效果
   * @param deltaTime 时间增量（秒）
   */
  update(deltaTime: number): void {
    this.elapsed += deltaTime;

    // 更新所有粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // 更新粒子生命值
      particle.life -= deltaTime / particle.maxLife;
      
      // 移除死亡粒子
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // 更新粒子位置
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;

      // 应用重力
      particle.velocity.y += 980 * particle.gravity * deltaTime;

      // 更新旋转
      particle.rotation += particle.rotationSpeed * deltaTime;

      // 更新透明度（随生命值衰减）
      particle.alpha = particle.life;
    }

    // 如果所有粒子都死亡，标记效果为死亡
    if (this.particles.length === 0 || this.elapsed >= this.duration) {
      this.isAlive = false;
    }
  }

  /**
   * 渲染粒子效果
   * @param ctx Canvas 渲染上下文
   */
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    for (const particle of this.particles) {
      ctx.save();
      ctx.translate(particle.position.x, particle.position.y);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = particle.alpha;

      // 绘制粒子
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * 创建水果切割粒子效果
   * 需求: 7.1 - 性能优化：根据帧率动态调整粒子数量
   * @param position 效果位置
   * @param fruitColor 水果颜色
   * @param sliceAngle 切割角度
   * @param qualityMultiplier 质量乘数（0.5-1.0，基于性能）
   * @returns 粒子效果实例
   */
  static createFruitSliceEffect(
    position: Vector2D,
    fruitColor: string,
    sliceAngle: number,
    qualityMultiplier: number = 1.0
  ): ParticleEffect {
    const effect = new ParticleEffect('fruit_slice', position);
    effect.duration = 1.5;

    // 根据性能调整粒子数量
    const baseParticleCount = 20;
    const particleCount = Math.max(5, Math.floor(baseParticleCount * qualityMultiplier));
    
    for (let i = 0; i < particleCount; i++) {
      // 粒子主要沿切割方向飞溅
      const spreadAngle = sliceAngle + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 200 + Math.random() * 300;
      
      const particle: Particle = {
        position: { ...position },
        velocity: {
          x: Math.cos(spreadAngle) * speed,
          y: Math.sin(spreadAngle) * speed
        },
        life: 1.0,
        maxLife: 0.8 + Math.random() * 0.7,
        size: 3 + Math.random() * 5,
        color: effect.getLighterColor(fruitColor, 20),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10,
        alpha: 1.0,
        gravity: 0.5 + Math.random() * 0.5
      };

      effect.particles.push(particle);
    }

    // 添加一些更小的雾化粒子（根据性能调整）
    const baseMistCount = 15;
    const mistCount = Math.max(3, Math.floor(baseMistCount * qualityMultiplier));
    
    for (let i = 0; i < mistCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      
      const particle: Particle = {
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        life: 1.0,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 1 + Math.random() * 3,
        color: effect.getLighterColor(fruitColor, 40),
        rotation: 0,
        rotationSpeed: 0,
        alpha: 0.8,
        gravity: 0.2
      };

      effect.particles.push(particle);
    }

    return effect;
  }

  /**
   * 创建炸弹爆炸粒子效果
   * 需求: 7.1 - 性能优化：根据帧率动态调整粒子数量
   * @param position 效果位置
   * @param qualityMultiplier 质量乘数（0.5-1.0，基于性能）
   * @returns 粒子效果实例
   */
  static createBombExplosionEffect(position: Vector2D, qualityMultiplier: number = 1.0): ParticleEffect {
    const effect = new ParticleEffect('bomb_explosion', position);
    effect.duration = 2.0;

    // 根据性能调整粒子数量
    const baseFlameCount = 30;
    const flameCount = Math.max(10, Math.floor(baseFlameCount * qualityMultiplier));
    
    for (let i = 0; i < flameCount; i++) {
      const angle = (Math.PI * 2 * i) / flameCount + (Math.random() - 0.5) * 0.3;
      const speed = 300 + Math.random() * 400;
      
      // 火焰颜色（橙色到黄色）
      const colorVariant = Math.random();
      let color: string;
      if (colorVariant < 0.3) {
        color = '#FF6600'; // 橙色
      } else if (colorVariant < 0.6) {
        color = '#FF9900'; // 亮橙色
      } else {
        color = '#FFCC00'; // 黄色
      }

      const particle: Particle = {
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        life: 1.0,
        maxLife: 0.6 + Math.random() * 0.8,
        size: 5 + Math.random() * 10,
        color: color,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 15,
        alpha: 1.0,
        gravity: 0.3
      };

      effect.particles.push(particle);
    }

    // 添加烟雾粒子（根据性能调整）
    const baseSmokeCount = 20;
    const smokeCount = Math.max(5, Math.floor(baseSmokeCount * qualityMultiplier));
    
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 250;
      
      const particle: Particle = {
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 100 // 烟雾向上飘
        },
        life: 1.0,
        maxLife: 1.0 + Math.random() * 1.0,
        size: 8 + Math.random() * 15,
        color: '#555555',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 5,
        alpha: 0.7,
        gravity: -0.1 // 负重力，向上飘
      };

      effect.particles.push(particle);
    }

    // 添加碎片粒子（根据性能调整）
    const baseDebrisCount = 15;
    const debrisCount = Math.max(5, Math.floor(baseDebrisCount * qualityMultiplier));
    
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 400 + Math.random() * 500;
      
      const particle: Particle = {
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        life: 1.0,
        maxLife: 0.8 + Math.random() * 0.7,
        size: 3 + Math.random() * 6,
        color: '#2C2C2C',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 20,
        alpha: 1.0,
        gravity: 1.0
      };

      effect.particles.push(particle);
    }

    return effect;
  }

  /**
   * 获取更亮的颜色
   * @param color 原始颜色
   * @param amount 变亮量
   * @returns 更亮的颜色
   */
  private getLighterColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + amount);
    const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  }
}
