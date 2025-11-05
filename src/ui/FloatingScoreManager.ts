/**
 * 浮动分数文本管理器
 * 需求: 4.1 - WHEN 玩家切割水果时，THE 视觉反馈系统 SHALL 在切割位置显示浮动分数文本
 * 
 * 负责创建、更新和渲染浮动分数文本效果
 */

/**
 * 浮动分数文本接口
 */
export interface FloatingScoreText {
  score: number;           // 分数值
  x: number;               // X 坐标
  y: number;               // Y 坐标
  opacity: number;         // 透明度 (0-1)
  lifetime: number;        // 显示时长（毫秒）
  startTime: number;       // 开始时间戳
  color: string;           // 文本颜色
  isAlive: boolean;        // 是否存活
  fontSize: number;        // 字体大小
}

/**
 * 浮动分数管理器配置
 */
export interface FloatingScoreConfig {
  lifetime: number;           // 浮动文本显示时长（毫秒），默认 1000
  riseDistance: number;       // 上升距离（像素），默认 50
  maxFloatingScores: number;  // 最大浮动分数数量，默认 10
  baseFontSize: number;       // 基础字体大小，默认 24
  highScoreFontSize: number;  // 高分字体大小，默认 36
  highScoreThreshold: number; // 高分阈值，默认 20
}

/**
 * 浮动分数管理器类
 */
export class FloatingScoreManager {
  private floatingTexts: FloatingScoreText[];
  private config: FloatingScoreConfig;
  private pool: FloatingScoreText[];  // 对象池

  constructor(config?: Partial<FloatingScoreConfig>) {
    this.floatingTexts = [];
    this.pool = [];
    
    // 合并默认配置
    this.config = {
      lifetime: config?.lifetime ?? 1000,
      riseDistance: config?.riseDistance ?? 50,
      maxFloatingScores: config?.maxFloatingScores ?? 10,
      baseFontSize: config?.baseFontSize ?? 24,
      highScoreFontSize: config?.highScoreFontSize ?? 36,
      highScoreThreshold: config?.highScoreThreshold ?? 20
    };
    
    // 预创建对象池
    this.initializePool();
  }

  /**
   * 初始化对象池
   */
  private initializePool(): void {
    for (let i = 0; i < this.config.maxFloatingScores; i++) {
      this.pool.push(this.createEmptyFloatingText());
    }
  }

  /**
   * 创建空的浮动文本对象
   */
  private createEmptyFloatingText(): FloatingScoreText {
    return {
      score: 0,
      x: 0,
      y: 0,
      opacity: 1.0,
      lifetime: this.config.lifetime,
      startTime: 0,
      color: '#FFFFFF',
      isAlive: false,
      fontSize: this.config.baseFontSize
    };
  }

  /**
   * 从对象池获取浮动文本对象
   */
  private acquireFromPool(): FloatingScoreText | null {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return null;
  }

  /**
   * 释放浮动文本对象到对象池
   */
  private releaseToPool(text: FloatingScoreText): void {
    text.isAlive = false;
    if (this.pool.length < this.config.maxFloatingScores) {
      this.pool.push(text);
    }
  }

  /**
   * 创建浮动分数文本
   * 需求: 4.1 - 在切割位置显示浮动分数文本
   * 
   * @param score 分数值
   * @param x X 坐标
   * @param y Y 坐标
   * @param color 文本颜色（可选）
   */
  createFloatingScore(score: number, x: number, y: number, color?: string): void {
    // 如果已达到最大数量，移除最旧的浮动文本
    if (this.floatingTexts.length >= this.config.maxFloatingScores) {
      const oldestText = this.floatingTexts.shift();
      if (oldestText) {
        this.releaseToPool(oldestText);
      }
    }

    // 从对象池获取或创建新对象
    let floatingText = this.acquireFromPool();
    if (!floatingText) {
      floatingText = this.createEmptyFloatingText();
    }

    // 根据分数值确定字体大小
    const fontSize = score >= this.config.highScoreThreshold 
      ? this.config.highScoreFontSize 
      : this.config.baseFontSize;

    // 初始化浮动文本
    floatingText.score = score;
    floatingText.x = x;
    floatingText.y = y;
    floatingText.opacity = 1.0;
    floatingText.lifetime = this.config.lifetime;
    floatingText.startTime = Date.now();
    floatingText.color = color || this.getDefaultColor(score);
    floatingText.isAlive = true;
    floatingText.fontSize = fontSize;

    this.floatingTexts.push(floatingText);
  }

  /**
   * 获取默认颜色（基于分数值）
   */
  private getDefaultColor(score: number): string {
    if (score >= 50) {
      return '#FFD700'; // 金色（超高分）
    } else if (score >= 30) {
      return '#FF69B4'; // 粉色（高分）
    } else if (score >= 20) {
      return '#00BFFF'; // 蓝色（中高分）
    } else {
      return '#FFFFFF'; // 白色（普通分数）
    }
  }

  /**
   * 更新所有浮动文本
   * 需求: 4.1 - 实现上浮动画和透明度渐变
   * 
   * @param deltaTime 时间增量（秒）
   */
  update(deltaTime: number): void {
    const currentTime = Date.now();

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const text = this.floatingTexts[i];
      
      if (!text.isAlive) {
        continue;
      }

      // 计算经过的时间
      const elapsed = currentTime - text.startTime;
      
      // 检查是否超过生命周期
      if (elapsed >= text.lifetime) {
        text.isAlive = false;
        const removedText = this.floatingTexts.splice(i, 1)[0];
        this.releaseToPool(removedText);
        continue;
      }

      // 计算进度 (0-1)
      const progress = elapsed / text.lifetime;

      // 更新 Y 坐标（向上漂浮）
      text.y = text.y - (this.config.riseDistance / this.config.lifetime) * (deltaTime * 1000);

      // 更新透明度（线性渐变到 0）
      text.opacity = 1.0 - progress;
    }
  }

  /**
   * 渲染所有浮动文本
   * 需求: 4.1 - 渲染浮动分数文本
   * 
   * @param ctx Canvas 渲染上下文
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (this.floatingTexts.length === 0) {
      return;
    }

    // 保存当前状态
    ctx.save();
    
    // 设置文本对齐方式
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 24px Orbitron, Arial, sans-serif';

    // 批量渲染所有浮动文本
    for (const text of this.floatingTexts) {
      if (!text.isAlive) {
        continue;
      }

      // 设置透明度
      ctx.globalAlpha = text.opacity;
      
      // 设置字体大小
      ctx.font = `bold ${text.fontSize}px Orbitron, Arial, sans-serif`;
      
      // 设置颜色
      ctx.fillStyle = text.color;
      
      // 添加文本阴影以提高可读性
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // 渲染分数文本
      ctx.fillText(`+${text.score}`, Math.round(text.x), Math.round(text.y));
    }

    // 恢复状态
    ctx.restore();
  }

  /**
   * 清除所有浮动文本
   */
  clear(): void {
    // 将所有浮动文本释放回对象池
    for (const text of this.floatingTexts) {
      this.releaseToPool(text);
    }
    this.floatingTexts = [];
  }

  /**
   * 获取当前浮动文本数量
   */
  getCount(): number {
    return this.floatingTexts.filter(t => t.isAlive).length;
  }

  /**
   * 重置管理器
   */
  reset(): void {
    this.clear();
  }
}
