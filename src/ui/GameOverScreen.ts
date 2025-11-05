/**
 * 游戏结束界面
 * 需求: 3.4 - WHEN 玩家生命值降至 0 时，THE 游戏系统 SHALL 结束游戏会话并显示最终分数
 */

import { SciFiTheme } from './SciFiTheme.js';

/**
 * 游戏结束按钮接口
 */
export interface GameOverButton {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isHovered: boolean;
  onClick: () => void;
}

/**
 * 游戏结束回调接口
 */
export interface GameOverCallbacks {
  onRestart?: () => void;
  onMainMenu?: () => void;
  onButtonHover?: (buttonId: string) => void;
  onButtonClick?: (buttonId: string) => void;
}

/**
 * 游戏结束界面类
 * 实现科幻风格的游戏结束界面，显示最终分数、最高分和操作按钮
 */
export class GameOverScreen {
  private theme: SciFiTheme;
  private buttons: GameOverButton[] = [];
  private canvas: HTMLCanvasElement;
  private callbacks: GameOverCallbacks;
  private finalScore: number = 0;
  private highScore: number = 0;
  private isNewHighScore: boolean = false;
  private fadeInProgress: number = 0;
  private isAnimating: boolean = true;
  private pulsePhase: number = 0;
  private lastUpdateTime: number = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameOverCallbacks = {}) {
    this.canvas = canvas;
    this.theme = new SciFiTheme();
    this.callbacks = callbacks;
    this.lastUpdateTime = Date.now();

    // 初始化按钮
    this.initializeButtons();

    // 绑定鼠标事件
    this.bindMouseEvents();
  }

  /**
   * 初始化菜单按钮
   */
  private initializeButtons(): void {
    const centerX = this.canvas.width / 2;
    const startY = this.canvas.height / 2 + 180;
    const buttonWidth = 350;
    const buttonHeight = 70;
    const buttonSpacing = 90;

    this.buttons = [
      {
        id: 'restart',
        text: '重新开始',
        x: centerX - buttonWidth / 2,
        y: startY,
        width: buttonWidth,
        height: buttonHeight,
        isHovered: false,
        onClick: () => {
          if (this.callbacks.onRestart) {
            this.callbacks.onRestart();
          }
        }
      },
      {
        id: 'mainmenu',
        text: '返回主菜单',
        x: centerX - buttonWidth / 2,
        y: startY + buttonSpacing,
        width: buttonWidth,
        height: buttonHeight,
        isHovered: false,
        onClick: () => {
          if (this.callbacks.onMainMenu) {
            this.callbacks.onMainMenu();
          }
        }
      }
    ];
  }

  /**
   * 绑定鼠标事件
   */
  private bindMouseEvents(): void {
    // 鼠标移动事件 - 检测悬停
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      let hasHover = false;

      for (const button of this.buttons) {
        const wasHovered = button.isHovered;
        button.isHovered = this.isPointInButton(mouseX, mouseY, button);

        // 触发悬停回调
        if (button.isHovered && !wasHovered) {
          hasHover = true;
          if (this.callbacks.onButtonHover) {
            this.callbacks.onButtonHover(button.id);
          }
        }
      }

      // 更改鼠标样式
      this.canvas.style.cursor = hasHover ? 'pointer' : 'default';
    });

    // 鼠标点击事件
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      for (const button of this.buttons) {
        if (this.isPointInButton(mouseX, mouseY, button)) {
          // 触发点击回调
          if (this.callbacks.onButtonClick) {
            this.callbacks.onButtonClick(button.id);
          }
          
          // 执行按钮的点击处理
          button.onClick();
          break;
        }
      }
    });
  }

  /**
   * 检查点是否在按钮内
   */
  private isPointInButton(x: number, y: number, button: GameOverButton): boolean {
    return x >= button.x &&
           x <= button.x + button.width &&
           y >= button.y &&
           y <= button.y + button.height;
  }

  /**
   * 设置分数数据
   * @param finalScore 最终分数
   * @param highScore 最高分
   */
  setScores(finalScore: number, highScore: number): void {
    this.finalScore = finalScore;
    this.highScore = highScore;
    this.isNewHighScore = finalScore >= highScore && finalScore > 0;
  }

  /**
   * 更新动画状态
   */
  update(): void {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // 更新淡入动画
    if (this.isAnimating && this.fadeInProgress < 1) {
      this.fadeInProgress += 0.03;
      if (this.fadeInProgress >= 1) {
        this.fadeInProgress = 1;
        this.isAnimating = false;
      }
    }

    // 更新脉冲动画（用于新纪录提示）
    if (this.isNewHighScore) {
      this.pulsePhase += deltaTime * 3; // 3 Hz 频率
      if (this.pulsePhase > Math.PI * 2) {
        this.pulsePhase -= Math.PI * 2;
      }
    }
  }

  /**
   * 渲染游戏结束界面
   */
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 应用淡入动画的透明度
    ctx.globalAlpha = this.fadeInProgress;

    // 渲染半透明背景遮罩
    this.renderOverlay(ctx);

    // 渲染标题
    this.renderTitle(ctx);

    // 渲染分数信息
    this.renderScores(ctx);

    // 渲染新纪录提示（如果适用）
    if (this.isNewHighScore) {
      this.renderNewHighScoreBanner(ctx);
    }

    // 渲染按钮
    this.renderButtons(ctx);

    // 渲染装饰元素
    this.renderDecorations(ctx);

    ctx.restore();
  }

  /**
   * 渲染背景遮罩
   */
  private renderOverlay(ctx: CanvasRenderingContext2D): void {
    // 绘制半透明黑色背景
    ctx.fillStyle = 'rgba(10, 14, 39, 0.9)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 添加径向渐变效果
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, this.canvas.width / 2
    );
    
    gradient.addColorStop(0, this.addAlpha(this.theme.colors.primary, 0.1));
    gradient.addColorStop(0.5, this.addAlpha(this.theme.colors.secondary, 0.05));
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 渲染标题
   */
  private renderTitle(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const titleY = this.canvas.height / 2 - 220;

    // 绘制主标题
    this.theme.drawGlowText(
      ctx,
      '游戏结束',
      centerX,
      titleY,
      72,
      this.theme.colors.accent,
      this.theme.fonts.main,
      'center'
    );

    // 绘制副标题
    this.theme.drawGlowText(
      ctx,
      'GAME OVER',
      centerX,
      titleY + 55,
      32,
      this.theme.colors.secondary,
      this.theme.fonts.mono,
      'center'
    );

    // 绘制标题装饰框
    const boxWidth = 550;
    const boxHeight = 130;
    this.theme.drawNeonBorder(
      ctx,
      centerX - boxWidth / 2,
      titleY - 55,
      boxWidth,
      boxHeight,
      this.theme.colors.accent,
      30
    );
  }

  /**
   * 渲染分数信息
   * 需求: 3.4 - 显示最终分数
   */
  private renderScores(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const scoresY = this.canvas.height / 2 - 50;

    // 绘制最终分数标签
    this.theme.drawGlowText(
      ctx,
      '最终分数',
      centerX,
      scoresY - 30,
      28,
      this.theme.colors.primary,
      this.theme.fonts.main,
      'center'
    );

    // 绘制最终分数值
    this.theme.drawGlowText(
      ctx,
      this.formatScore(this.finalScore),
      centerX,
      scoresY + 30,
      64,
      this.theme.colors.primary,
      this.theme.fonts.mono,
      'center'
    );

    // 绘制最高分（如果不是新纪录）
    if (!this.isNewHighScore && this.highScore > 0) {
      this.theme.drawGlowText(
        ctx,
        `最高分: ${this.formatScore(this.highScore)}`,
        centerX,
        scoresY + 100,
        24,
        this.addAlpha(this.theme.colors.secondary, 0.7),
        this.theme.fonts.mono,
        'center'
      );
    }

    // 绘制分数装饰框
    const boxWidth = 450;
    const boxHeight = 150;
    this.theme.drawNeonBorder(
      ctx,
      centerX - boxWidth / 2,
      scoresY - 60,
      boxWidth,
      boxHeight,
      this.theme.colors.primary,
      25
    );
  }

  /**
   * 渲染新纪录横幅
   */
  private renderNewHighScoreBanner(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const bannerY = this.canvas.height / 2 + 80;

    // 计算脉冲效果
    const pulse = Math.sin(this.pulsePhase) * 0.15 + 1;
    const fontSize = 36 * pulse;

    // 绘制新纪录文字
    this.theme.drawGlowText(
      ctx,
      '★ 新纪录！★',
      centerX,
      bannerY,
      fontSize,
      this.theme.colors.accent,
      this.theme.fonts.main,
      'center'
    );

    // 绘制副文字
    this.theme.drawGlowText(
      ctx,
      'NEW HIGH SCORE',
      centerX,
      bannerY + 40,
      20,
      this.theme.colors.accent,
      this.theme.fonts.mono,
      'center'
    );

    // 绘制装饰星星
    const starSize = 15;
    const starOffset = 200;
    
    this.drawStar(ctx, centerX - starOffset, bannerY, starSize, this.theme.colors.accent);
    this.drawStar(ctx, centerX + starOffset, bannerY, starSize, this.theme.colors.accent);
  }

  /**
   * 绘制星星装饰
   */
  private drawStar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    ctx.save();

    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size / 2;

    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / spikes) * i - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();

    // 绘制发光效果
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 渲染按钮
   */
  private renderButtons(ctx: CanvasRenderingContext2D): void {
    for (const button of this.buttons) {
      this.theme.drawButton(
        ctx,
        button.text,
        button.x,
        button.y,
        button.width,
        button.height,
        button.isHovered,
        false
      );
    }
  }

  /**
   * 渲染装饰元素
   */
  private renderDecorations(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // 绘制角落装饰
    const cornerSize = 100;
    const cornerOffset = 80;

    // 左上角
    this.theme.drawNeonBorder(
      ctx,
      cornerOffset,
      cornerOffset,
      cornerSize,
      cornerSize,
      this.theme.colors.secondary,
      25
    );

    // 右上角
    this.theme.drawNeonBorder(
      ctx,
      this.canvas.width - cornerOffset - cornerSize,
      cornerOffset,
      cornerSize,
      cornerSize,
      this.theme.colors.secondary,
      25
    );

    // 左下角
    this.theme.drawNeonBorder(
      ctx,
      cornerOffset,
      this.canvas.height - cornerOffset - cornerSize,
      cornerSize,
      cornerSize,
      this.theme.colors.secondary,
      25
    );

    // 右下角
    this.theme.drawNeonBorder(
      ctx,
      this.canvas.width - cornerOffset - cornerSize,
      this.canvas.height - cornerOffset - cornerSize,
      cornerSize,
      cornerSize,
      this.theme.colors.secondary,
      25
    );

    // 绘制中心装饰圆环
    ctx.strokeStyle = this.addAlpha(this.theme.colors.accent, 0.15);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 450, 0, Math.PI * 2);
    ctx.stroke();

    // 绘制内圆环
    ctx.strokeStyle = this.addAlpha(this.theme.colors.primary, 0.1);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 400, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * 格式化分数显示（添加前导零）
   * @param score 分数
   * @returns 格式化后的分数字符串
   */
  private formatScore(score: number): string {
    return score.toString().padStart(6, '0');
  }

  /**
   * 为颜色添加透明度
   */
  private addAlpha(color: string, alpha: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * 重置动画状态
   */
  resetAnimation(): void {
    this.fadeInProgress = 0;
    this.isAnimating = true;
    this.pulsePhase = 0;
    this.lastUpdateTime = Date.now();
  }

  /**
   * 销毁界面（移除事件监听器）
   */
  destroy(): void {
    this.canvas.style.cursor = 'default';
  }
}
