/**
 * 连击里程碑动画器
 * 需求: 4.2 - WHEN 玩家达到新的连击里程碑（5连击、10连击、20连击）时，THE 视觉反馈系统 SHALL 显示特殊动画效果
 * 
 * 负责在玩家达到连击里程碑时显示特殊动画效果
 */

/**
 * 动画类型
 */
export type AnimationType = 'pulse' | 'explosion' | 'rainbow';

/**
 * 连击里程碑接口
 */
export interface ComboMilestone {
  comboCount: number;           // 里程碑连击数
  animationType: AnimationType; // 动画类型
  duration: number;             // 动画持续时间（毫秒）
  startTime: number;            // 动画开始时间戳
}

/**
 * 粒子接口（用于爆炸动画）
 */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

/**
 * 连击里程碑动画器配置
 */
export interface ComboMilestoneAnimatorConfig {
  pulseDuration: number;      // 脉冲动画持续时间（毫秒）
  explosionDuration: number;  // 爆炸动画持续时间（毫秒）
  rainbowDuration: number;    // 彩虹动画持续时间（毫秒）
  particleCount: number;      // 爆炸粒子数量
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: ComboMilestoneAnimatorConfig = {
  pulseDuration: 1500,
  explosionDuration: 2000,
  rainbowDuration: 1500,
  particleCount: 30
};

/**
 * 连击里程碑动画器类
 */
export class ComboMilestoneAnimator {
  private currentAnimation: ComboMilestone | null;
  private config: ComboMilestoneAnimatorConfig;
  private particles: Particle[];
  private lastMilestone: number;

  /**
   * 构造函数
   * @param config 动画器配置
   */
  constructor(config: Partial<ComboMilestoneAnimatorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentAnimation = null;
    this.particles = [];
    this.lastMilestone = 0;
  }

  /**
   * 触发里程碑动画
   * 需求: 4.2 - 在达到里程碑时触发对应动画
   * @param comboCount 当前连击数
   */
  triggerMilestone(comboCount: number): void {
    // 防止重复触发相同里程碑
    if (comboCount === this.lastMilestone) {
      return;
    }

    let animationType: AnimationType;
    let duration: number;

    // 根据连击数确定动画类型和持续时间
    if (comboCount === 5) {
      // 5 连击: 脉冲动画，绿色光环
      animationType = 'pulse';
      duration = this.config.pulseDuration;
    } else if (comboCount === 10) {
      // 10 连击: 爆炸动画，蓝色粒子
      animationType = 'explosion';
      duration = this.config.explosionDuration;
      this.createExplosionParticles();
    } else if (comboCount === 20) {
      // 20 连击: 彩虹动画，全屏闪烁
      animationType = 'rainbow';
      duration = this.config.rainbowDuration;
    } else {
      // 不是里程碑，不触发动画
      return;
    }

    // 创建新动画
    this.currentAnimation = {
      comboCount,
      animationType,
      duration,
      startTime: Date.now()
    };

    this.lastMilestone = comboCount;
  }

  /**
   * 创建爆炸粒子
   */
  private createExplosionParticles(): void {
    this.particles = [];
    const particleCount = this.config.particleCount;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 200 + Math.random() * 300;
      
      this.particles.push({
        x: 0, // 将在渲染时设置为屏幕中心
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        color: this.getBlueShade(),
        size: 4 + Math.random() * 4
      });
    }
  }

  /**
   * 获取蓝色色调
   */
  private getBlueShade(): string {
    const blues = [
      '#00BFFF', // 深天蓝
      '#1E90FF', // 道奇蓝
      '#4169E1', // 皇家蓝
      '#6495ED', // 矢车菊蓝
      '#87CEEB'  // 天蓝色
    ];
    return blues[Math.floor(Math.random() * blues.length)];
  }

  /**
   * 更新动画状态
   * @param deltaTime 时间增量（秒）
   */
  update(deltaTime: number): void {
    if (!this.currentAnimation) {
      return;
    }

    const currentTime = Date.now();
    const elapsed = currentTime - this.currentAnimation.startTime;

    // 检查动画是否结束
    if (elapsed >= this.currentAnimation.duration) {
      this.currentAnimation = null;
      this.particles = [];
      return;
    }

    // 更新爆炸粒子
    if (this.currentAnimation.animationType === 'explosion') {
      this.updateExplosionParticles(deltaTime);
    }
  }

  /**
   * 更新爆炸粒子
   * @param deltaTime 时间增量（秒）
   */
  private updateExplosionParticles(deltaTime: number): void {
    for (const particle of this.particles) {
      // 更新位置
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      // 应用重力
      particle.vy += 500 * deltaTime;

      // 减少生命值
      particle.life -= deltaTime / 2;
    }

    // 移除死亡的粒子
    this.particles = this.particles.filter(p => p.life > 0);
  }

  /**
   * 渲染动画
   * @param ctx Canvas 渲染上下文
   * @param canvasWidth 画布宽度
   * @param canvasHeight 画布高度
   */
  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (!this.currentAnimation) {
      return;
    }

    const currentTime = Date.now();
    const elapsed = currentTime - this.currentAnimation.startTime;
    const progress = elapsed / this.currentAnimation.duration;

    switch (this.currentAnimation.animationType) {
      case 'pulse':
        this.renderPulseAnimation(ctx, canvasWidth, canvasHeight, progress);
        break;
      case 'explosion':
        this.renderExplosionAnimation(ctx, canvasWidth, canvasHeight, progress);
        break;
      case 'rainbow':
        this.renderRainbowAnimation(ctx, canvasWidth, canvasHeight, progress);
        break;
    }
  }

  /**
   * 渲染脉冲动画（5 连击）
   * 绿色光环从中心扩散
   * 性能优化: 使用整数坐标，减少路径复杂度
   */
  private renderPulseAnimation(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    progress: number
  ): void {
    const centerX = Math.round(canvasWidth / 2);
    const centerY = Math.round(canvasHeight / 2);

    // 计算光环半径（从 50 扩散到 300）
    const maxRadius = 300;
    const radius = Math.round(50 + (maxRadius - 50) * progress);

    // 计算透明度（从 0.8 淡出到 0）
    const opacity = 0.8 * (1 - progress);

    ctx.save();

    // 绘制外圈光环
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 255, 0, ${opacity})`;
    ctx.lineWidth = 10;
    ctx.stroke();

    // 绘制内圈光环
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.round(radius * 0.7), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 255, 0, ${opacity * 0.6})`;
    ctx.lineWidth = 6;
    ctx.stroke();

    // 绘制文字
    const textOpacity = opacity * 1.2;
    ctx.fillStyle = `rgba(0, 255, 0, ${textOpacity})`;
    ctx.font = 'bold 48px Orbitron, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('5 连击!', centerX, centerY);

    ctx.restore();
  }

  /**
   * 渲染爆炸动画（10 连击）
   * 蓝色粒子从中心爆炸
   * 性能优化: 使用整数坐标，批量渲染粒子
   */
  private renderExplosionAnimation(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    progress: number
  ): void {
    const centerX = Math.round(canvasWidth / 2);
    const centerY = Math.round(canvasHeight / 2);

    ctx.save();

    // 批量渲染粒子（按颜色分组）
    const particlesByColor = new Map<string, Particle[]>();
    for (const particle of this.particles) {
      if (!particlesByColor.has(particle.color)) {
        particlesByColor.set(particle.color, []);
      }
      particlesByColor.get(particle.color)!.push(particle);
    }

    // 渲染每组颜色的粒子
    for (const [color, particles] of particlesByColor) {
      for (const particle of particles) {
        const opacity = particle.life;
        ctx.fillStyle = color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
        
        ctx.beginPath();
        ctx.arc(
          Math.round(centerX + particle.x),
          Math.round(centerY + particle.y),
          particle.size,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // 绘制文字（在前半段显示）
    if (progress < 0.5) {
      const textOpacity = 1 - progress * 2;
      ctx.fillStyle = `rgba(30, 144, 255, ${textOpacity})`;
      ctx.font = 'bold 64px Orbitron, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('10 连击!!', centerX, centerY);
    }

    ctx.restore();
  }

  /**
   * 渲染彩虹动画（20 连击）
   * 全屏闪烁彩虹色
   */
  private renderRainbowAnimation(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    progress: number
  ): void {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    ctx.save();

    // 创建彩虹渐变（全屏）
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, Math.max(canvasWidth, canvasHeight)
    );

    // 彩虹色
    const colors = [
      '#FF0000', // 红
      '#FF7F00', // 橙
      '#FFFF00', // 黄
      '#00FF00', // 绿
      '#0000FF', // 蓝
      '#4B0082', // 靛
      '#9400D3'  // 紫
    ];

    // 添加渐变色
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });

    // 计算闪烁效果（使用正弦波）
    const flashFrequency = 4; // 闪烁频率
    const flashIntensity = Math.abs(Math.sin(progress * Math.PI * flashFrequency));
    const opacity = 0.3 * flashIntensity;

    // 绘制全屏彩虹叠加层
    ctx.fillStyle = gradient;
    ctx.globalAlpha = opacity;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 绘制文字
    ctx.globalAlpha = 1;
    const textScale = 1 + Math.sin(progress * Math.PI * 2) * 0.2;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(textScale, textScale);
    
    // 文字描边
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 8;
    ctx.font = 'bold 80px Orbitron, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('20 连击!!!', 0, 0);
    
    // 文字填充（渐变）
    const textGradient = ctx.createLinearGradient(-200, -40, 200, 40);
    textGradient.addColorStop(0, '#FF0000');
    textGradient.addColorStop(0.5, '#FFFF00');
    textGradient.addColorStop(1, '#FF00FF');
    ctx.fillStyle = textGradient;
    ctx.fillText('20 连击!!!', 0, 0);
    
    ctx.restore();

    ctx.restore();
  }

  /**
   * 检查是否有动画正在播放
   * @returns 是否有动画正在播放
   */
  isAnimating(): boolean {
    return this.currentAnimation !== null;
  }

  /**
   * 获取当前动画
   * @returns 当前动画或 null
   */
  getCurrentAnimation(): ComboMilestone | null {
    return this.currentAnimation;
  }

  /**
   * 重置动画器
   */
  reset(): void {
    this.currentAnimation = null;
    this.particles = [];
    this.lastMilestone = 0;
  }
}
