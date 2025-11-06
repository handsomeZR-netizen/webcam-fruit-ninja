/**
 * 成就通知渲染器
 * 需求: 5.4 - THE 视觉反馈系统 SHALL 在玩家解锁成就时显示成就通知
 */

import { Achievement } from '../game/AchievementDefinitions.js';

/**
 * 成就通知接口
 */
export interface AchievementNotification {
  achievement: Achievement;
  displayTime: number;      // 显示时长（毫秒）
  startTime: number;        // 开始显示的时间戳
  isVisible: boolean;       // 是否可见
  slideProgress: number;    // 滑入进度 (0-1)
  fadeProgress: number;     // 淡出进度 (0-1)
}

/**
 * 成就通知渲染器配置
 */
export interface AchievementNotificationConfig {
  displayDuration: number;      // 显示时长（毫秒），默认 3000
  slideInDuration: number;      // 滑入动画时长（毫秒），默认 500
  fadeOutDuration: number;      // 淡出动画时长（毫秒），默认 500
  width: number;                // 通知宽度，默认 350
  height: number;               // 通知高度，默认 100
  padding: number;              // 内边距，默认 20
  margin: number;               // 距离屏幕边缘的距离，默认 20
  backgroundColor: string;      // 背景颜色，默认 'rgba(0, 0, 0, 0.9)'
  borderColor: string;          // 边框颜色，默认 '#FFD700'
  borderWidth: number;          // 边框宽度，默认 3
  iconSize: number;             // 图标大小，默认 48
  titleFontSize: number;        // 标题字体大小，默认 24
  descriptionFontSize: number;  // 描述字体大小，默认 16
  titleColor: string;           // 标题颜色，默认 '#FFD700'
  descriptionColor: string;     // 描述颜色，默认 '#FFFFFF'
}

/**
 * 成就通知渲染器类
 * 需求: 5.4 - 在玩家解锁成就时显示成就通知
 */
export class AchievementNotificationRenderer {
  private config: AchievementNotificationConfig;
  private notifications: AchievementNotification[];
  private maxNotifications: number = 3; // 最多同时显示 3 个通知

  constructor(config?: Partial<AchievementNotificationConfig>) {
    // 默认配置
    this.config = {
      displayDuration: 3000,
      slideInDuration: 500,
      fadeOutDuration: 500,
      width: 350,
      height: 100,
      padding: 20,
      margin: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderColor: '#FFD700',
      borderWidth: 3,
      iconSize: 48,
      titleFontSize: 24,
      descriptionFontSize: 16,
      titleColor: '#FFD700',
      descriptionColor: '#FFFFFF',
      ...config
    };

    this.notifications = [];
  }

  /**
   * 显示成就通知
   * 需求: 5.4 - 在玩家解锁成就时显示成就通知
   * @param achievement 解锁的成就
   */
  showNotification(achievement: Achievement): void {
    // 检查是否已经在显示该成就
    const existingNotification = this.notifications.find(
      n => n.achievement.id === achievement.id && n.isVisible
    );
    if (existingNotification) {
      return; // 避免重复显示
    }

    // 如果通知数量达到上限，移除最旧的通知
    if (this.notifications.length >= this.maxNotifications) {
      this.notifications.shift();
    }

    // 创建新通知
    const notification: AchievementNotification = {
      achievement,
      displayTime: this.config.displayDuration,
      startTime: Date.now(),
      isVisible: true,
      slideProgress: 0,
      fadeProgress: 1
    };

    this.notifications.push(notification);
  }

  /**
   * 更新通知状态
   * 需求: 5.4 - 显示时长 3 秒后淡出
   */
  update(): void {
    const currentTime = Date.now();

    for (let i = this.notifications.length - 1; i >= 0; i--) {
      const notification = this.notifications[i];
      const elapsed = currentTime - notification.startTime;

      // 计算滑入进度
      if (elapsed < this.config.slideInDuration) {
        notification.slideProgress = elapsed / this.config.slideInDuration;
      } else {
        notification.slideProgress = 1;
      }

      // 计算淡出进度
      const fadeStartTime = notification.displayTime - this.config.fadeOutDuration;
      if (elapsed > fadeStartTime) {
        const fadeElapsed = elapsed - fadeStartTime;
        notification.fadeProgress = 1 - (fadeElapsed / this.config.fadeOutDuration);
      } else {
        notification.fadeProgress = 1;
      }

      // 移除已完成的通知
      if (elapsed > notification.displayTime) {
        notification.isVisible = false;
        this.notifications.splice(i, 1);
      }
    }
  }

  /**
   * 渲染成就通知
   * 需求: 5.4 - 在屏幕右下角显示成就通知，从右侧滑入
   * @param ctx Canvas 渲染上下文
   * @param canvasWidth 画布宽度
   * @param canvasHeight 画布高度
   */
  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (this.notifications.length === 0) {
      return;
    }

    ctx.save();

    // 从下往上渲染通知（最新的在最下面）
    for (let i = 0; i < this.notifications.length; i++) {
      const notification = this.notifications[i];
      if (!notification.isVisible) {
        continue;
      }

      // 计算通知位置（右下角，从右侧滑入）
      const baseX = canvasWidth - this.config.margin;
      const baseY = canvasHeight - this.config.margin - (i * (this.config.height + 10));

      // 应用滑入动画（使用缓动函数）
      const slideOffset = this.easeOutCubic(notification.slideProgress) * this.config.width;
      const x = baseX - slideOffset;
      const y = baseY - this.config.height;

      // 应用淡出透明度
      ctx.globalAlpha = notification.fadeProgress;

      // 渲染通知背景
      this.renderNotificationBackground(ctx, x, y);

      // 渲染成就图标
      this.renderAchievementIcon(ctx, notification.achievement, x, y);

      // 渲染成就文本
      this.renderAchievementText(ctx, notification.achievement, x, y);
    }

    ctx.restore();
  }

  /**
   * 渲染通知背景
   * @param ctx Canvas 渲染上下文
   * @param x X 坐标
   * @param y Y 坐标
   */
  private renderNotificationBackground(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // 绘制背景
    ctx.fillStyle = this.config.backgroundColor;
    ctx.fillRect(x, y, this.config.width, this.config.height);

    // 绘制边框
    ctx.strokeStyle = this.config.borderColor;
    ctx.lineWidth = this.config.borderWidth;
    ctx.strokeRect(x, y, this.config.width, this.config.height);

    // 绘制装饰性光晕效果
    const gradient = ctx.createLinearGradient(x, y, x, y + this.config.height);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
    gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, this.config.width, this.config.height);
  }

  /**
   * 渲染成就图标
   * @param ctx Canvas 渲染上下文
   * @param achievement 成就对象
   * @param x X 坐标
   * @param y Y 坐标
   */
  private renderAchievementIcon(
    ctx: CanvasRenderingContext2D,
    achievement: Achievement,
    x: number,
    y: number
  ): void {
    const iconX = x + this.config.padding;
    const iconY = y + (this.config.height - this.config.iconSize) / 2;

    // 绘制图标背景圆形
    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(
      iconX + this.config.iconSize / 2,
      iconY + this.config.iconSize / 2,
      this.config.iconSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 绘制图标边框
    ctx.strokeStyle = this.config.borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制 emoji 图标
    ctx.font = `${this.config.iconSize * 0.7}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(
      achievement.icon,
      iconX + this.config.iconSize / 2,
      iconY + this.config.iconSize / 2
    );
  }

  /**
   * 渲染成就文本
   * @param ctx Canvas 渲染上下文
   * @param achievement 成就对象
   * @param x X 坐标
   * @param y Y 坐标
   */
  private renderAchievementText(
    ctx: CanvasRenderingContext2D,
    achievement: Achievement,
    x: number,
    y: number
  ): void {
    const textX = x + this.config.padding * 2 + this.config.iconSize;
    const textY = y + this.config.height / 2;

    // 绘制 "成就解锁" 标签
    ctx.font = `bold ${this.config.descriptionFontSize}px Orbitron, Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.fillText('成就解锁!', textX, textY - 20);

    // 绘制成就名称
    ctx.font = `bold ${this.config.titleFontSize}px Orbitron, Arial`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.config.titleColor;
    ctx.fillText(achievement.name, textX, textY);

    // 绘制成就描述
    ctx.font = `${this.config.descriptionFontSize}px Arial`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = this.config.descriptionColor;
    
    // 文本换行处理
    const maxWidth = this.config.width - textX - this.config.padding + x;
    this.wrapText(ctx, achievement.description, textX, textY + 15, maxWidth, 20);
  }

  /**
   * 文本换行处理
   * @param ctx Canvas 渲染上下文
   * @param text 文本内容
   * @param x X 坐标
   * @param y Y 坐标
   * @param maxWidth 最大宽度
   * @param lineHeight 行高
   */
  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): void {
    const words = text.split('');
    let line = '';
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  /**
   * 缓动函数：三次方缓出
   * @param t 进度 (0-1)
   * @returns 缓动后的进度 (0-1)
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * 获取当前显示的通知数量
   */
  getNotificationCount(): number {
    return this.notifications.length;
  }

  /**
   * 清除所有通知
   */
  clear(): void {
    this.notifications = [];
  }

  /**
   * 重置渲染器
   */
  reset(): void {
    this.clear();
  }
}
