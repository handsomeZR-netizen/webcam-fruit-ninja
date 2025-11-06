/**
 * 难度提升通知渲染器
 * 需求: 3.5 - THE 视觉反馈系统 SHALL 在难度等级提升时显示通知消息
 * 
 * 在难度等级提升时显示视觉通知，包含淡入淡出动画
 */

/**
 * 难度通知配置接口
 */
export interface DifficultyNotificationConfig {
  displayDuration: number;      // 通知显示时长（毫秒），默认 2000
  fadeInDuration: number;        // 淡入动画时长（毫秒），默认 300
  fadeOutDuration: number;       // 淡出动画时长（毫秒），默认 500
  fontSize: number;              // 字体大小，默认 36
  backgroundColor: string;       // 背景颜色，默认 'rgba(0, 0, 0, 0.7)'
  textColor: string;             // 文字颜色，默认 '#FFD700'
  borderColor: string;           // 边框颜色，默认 '#FFD700'
  borderWidth: number;           // 边框宽度，默认 3
  padding: number;               // 内边距，默认 30
}

/**
 * 难度通知状态接口
 */
interface DifficultyNotification {
  level: number;                 // 难度等级
  startTime: number;             // 通知开始时间
  isVisible: boolean;            // 是否可见
  opacity: number;               // 当前透明度
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: DifficultyNotificationConfig = {
  displayDuration: 2000,
  fadeInDuration: 300,
  fadeOutDuration: 500,
  fontSize: 36,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  textColor: '#FFD700',
  borderColor: '#FFD700',
  borderWidth: 3,
  padding: 30
};

/**
 * 难度提升通知渲染器类
 * 
 * 职责：
 * - 在难度等级提升时显示通知消息
 * - 实现淡入淡出动画
 * - 显示当前难度等级
 */
export class DifficultyNotificationRenderer {
  private config: DifficultyNotificationConfig;
  private currentNotification: DifficultyNotification | null;

  /**
   * 构造函数
   * @param config 通知配置（可选）
   */
  constructor(config?: Partial<DifficultyNotificationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentNotification = null;
  }

  /**
   * 显示难度提升通知
   * 需求: 3.5 - 在难度等级提升时显示通知消息
   * 
   * @param level 新的难度等级
   */
  showNotification(level: number): void {
    this.currentNotification = {
      level,
      startTime: Date.now(),
      isVisible: true,
      opacity: 0
    };
  }

  /**
   * 更新通知状态
   */
  update(): void {
    if (!this.currentNotification || !this.currentNotification.isVisible) {
      return;
    }

    const currentTime = Date.now();
    const elapsedTime = currentTime - this.currentNotification.startTime;

    // 计算透明度（淡入淡出动画）
    if (elapsedTime < this.config.fadeInDuration) {
      // 淡入阶段
      this.currentNotification.opacity = elapsedTime / this.config.fadeInDuration;
    } else if (elapsedTime < this.config.fadeInDuration + this.config.displayDuration) {
      // 完全显示阶段
      this.currentNotification.opacity = 1.0;
    } else if (elapsedTime < this.config.fadeInDuration + this.config.displayDuration + this.config.fadeOutDuration) {
      // 淡出阶段
      const fadeOutElapsed = elapsedTime - this.config.fadeInDuration - this.config.displayDuration;
      this.currentNotification.opacity = 1.0 - (fadeOutElapsed / this.config.fadeOutDuration);
    } else {
      // 动画结束，隐藏通知
      this.currentNotification.isVisible = false;
      this.currentNotification = null;
    }
  }

  /**
   * 渲染难度提升通知
   * 需求: 3.5 - 显示当前难度等级和实现淡入淡出动画
   * 
   * @param ctx Canvas 渲染上下文
   * @param canvasWidth 画布宽度
   * @param canvasHeight 画布高度
   */
  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (!this.currentNotification || !this.currentNotification.isVisible) {
      return;
    }

    const { level, opacity } = this.currentNotification;

    // 保存当前上下文状态
    ctx.save();

    // 设置全局透明度
    ctx.globalAlpha = opacity;

    // 准备文本
    const titleText = '难度提升！';
    const levelText = `等级 ${level}`;

    // 测量文本尺寸
    ctx.font = `bold ${this.config.fontSize}px Orbitron, Arial, sans-serif`;
    const titleWidth = ctx.measureText(titleText).width;
    
    ctx.font = `${this.config.fontSize * 0.7}px Orbitron, Arial, sans-serif`;
    const levelWidth = ctx.measureText(levelText).width;

    // 计算通知框尺寸
    const maxTextWidth = Math.max(titleWidth, levelWidth);
    const boxWidth = maxTextWidth + this.config.padding * 2;
    const boxHeight = this.config.fontSize * 2.5 + this.config.padding * 2;

    // 计算通知框位置（屏幕中央）
    const boxX = (canvasWidth - boxWidth) / 2;
    const boxY = (canvasHeight - boxHeight) / 2;

    // 绘制背景
    ctx.fillStyle = this.config.backgroundColor;
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // 绘制边框
    ctx.strokeStyle = this.config.borderColor;
    ctx.lineWidth = this.config.borderWidth;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // 绘制标题文本
    ctx.fillStyle = this.config.textColor;
    ctx.font = `bold ${this.config.fontSize}px Orbitron, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      titleText,
      canvasWidth / 2,
      boxY + this.config.padding + this.config.fontSize / 2
    );

    // 绘制等级文本
    ctx.font = `${this.config.fontSize * 0.7}px Orbitron, Arial, sans-serif`;
    ctx.fillText(
      levelText,
      canvasWidth / 2,
      boxY + this.config.padding + this.config.fontSize * 1.5
    );

    // 恢复上下文状态
    ctx.restore();
  }

  /**
   * 检查是否有通知正在显示
   * 
   * @returns 是否有通知正在显示
   */
  isNotificationVisible(): boolean {
    return this.currentNotification !== null && this.currentNotification.isVisible;
  }

  /**
   * 重置通知状态
   */
  reset(): void {
    this.currentNotification = null;
  }

  /**
   * 获取当前通知信息
   * 
   * @returns 当前通知信息或 null
   */
  getCurrentNotification(): DifficultyNotification | null {
    return this.currentNotification;
  }
}
