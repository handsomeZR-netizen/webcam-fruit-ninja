/**
 * 暂停菜单界面
 * 需求: 3.4 - 游戏暂停功能
 */

import { SciFiTheme } from './SciFiTheme.js';

/**
 * 暂停菜单按钮接口
 */
export interface PauseMenuButton {
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
 * 暂停菜单回调接口
 */
export interface PauseMenuCallbacks {
  onResume?: () => void;
  onRestart?: () => void;
  onMainMenu?: () => void;
  onButtonHover?: (buttonId: string) => void;
  onButtonClick?: (buttonId: string) => void;
}

/**
 * 暂停菜单类
 * 实现科幻风格的暂停菜单，包含继续、重新开始、返回主菜单按钮
 */
export class PauseMenu {
  private theme: SciFiTheme;
  private buttons: PauseMenuButton[] = [];
  private canvas: HTMLCanvasElement;
  private callbacks: PauseMenuCallbacks;
  private fadeInProgress: number = 0;
  private isAnimating: boolean = true;

  constructor(canvas: HTMLCanvasElement, callbacks: PauseMenuCallbacks = {}) {
    this.canvas = canvas;
    this.theme = new SciFiTheme();
    this.callbacks = callbacks;

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
    const startY = this.canvas.height / 2 + 20;
    const buttonWidth = 350;
    const buttonHeight = 70;
    const buttonSpacing = 90;

    this.buttons = [
      {
        id: 'resume',
        text: '继续游戏',
        x: centerX - buttonWidth / 2,
        y: startY,
        width: buttonWidth,
        height: buttonHeight,
        isHovered: false,
        onClick: () => {
          if (this.callbacks.onResume) {
            this.callbacks.onResume();
          }
        }
      },
      {
        id: 'restart',
        text: '重新开始',
        x: centerX - buttonWidth / 2,
        y: startY + buttonSpacing,
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
        y: startY + buttonSpacing * 2,
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
  private isPointInButton(x: number, y: number, button: PauseMenuButton): boolean {
    return x >= button.x &&
           x <= button.x + button.width &&
           y >= button.y &&
           y <= button.y + button.height;
  }

  /**
   * 更新动画状态
   */
  update(): void {
    // 更新淡入动画
    if (this.isAnimating && this.fadeInProgress < 1) {
      this.fadeInProgress += 0.05;
      if (this.fadeInProgress >= 1) {
        this.fadeInProgress = 1;
        this.isAnimating = false;
      }
    }
  }

  /**
   * 渲染暂停菜单
   */
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 应用淡入动画的透明度
    ctx.globalAlpha = this.fadeInProgress;

    // 渲染半透明背景遮罩
    this.renderOverlay(ctx);

    // 渲染标题
    this.renderTitle(ctx);

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
    ctx.fillStyle = 'rgba(10, 14, 39, 0.85)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 添加网格效果
    ctx.strokeStyle = this.addAlpha(this.theme.colors.primary, 0.05);
    ctx.lineWidth = 1;

    const gridSize = 50;
    for (let x = 0; x < this.canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < this.canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }

  /**
   * 渲染标题
   */
  private renderTitle(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const titleY = this.canvas.height / 2 - 150;

    // 绘制主标题
    this.theme.drawGlowText(
      ctx,
      '游戏暂停',
      centerX,
      titleY,
      64,
      this.theme.colors.primary,
      this.theme.fonts.main,
      'center'
    );

    // 绘制副标题
    this.theme.drawGlowText(
      ctx,
      'GAME PAUSED',
      centerX,
      titleY + 50,
      28,
      this.theme.colors.secondary,
      this.theme.fonts.mono,
      'center'
    );

    // 绘制标题装饰框
    const boxWidth = 500;
    const boxHeight = 120;
    this.theme.drawNeonBorder(
      ctx,
      centerX - boxWidth / 2,
      titleY - 50,
      boxWidth,
      boxHeight,
      this.theme.colors.primary,
      25
    );
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
    const cornerSize = 80;
    const cornerOffset = 100;

    // 左上角
    this.theme.drawNeonBorder(
      ctx,
      cornerOffset,
      cornerOffset,
      cornerSize,
      cornerSize,
      this.theme.colors.accent,
      20
    );

    // 右上角
    this.theme.drawNeonBorder(
      ctx,
      this.canvas.width - cornerOffset - cornerSize,
      cornerOffset,
      cornerSize,
      cornerSize,
      this.theme.colors.accent,
      20
    );

    // 左下角
    this.theme.drawNeonBorder(
      ctx,
      cornerOffset,
      this.canvas.height - cornerOffset - cornerSize,
      cornerSize,
      cornerSize,
      this.theme.colors.accent,
      20
    );

    // 右下角
    this.theme.drawNeonBorder(
      ctx,
      this.canvas.width - cornerOffset - cornerSize,
      this.canvas.height - cornerOffset - cornerSize,
      cornerSize,
      cornerSize,
      this.theme.colors.accent,
      20
    );

    // 绘制中心装饰圆环
    ctx.strokeStyle = this.addAlpha(this.theme.colors.primary, 0.2);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 400, 0, Math.PI * 2);
    ctx.stroke();
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
  }

  /**
   * 销毁菜单（移除事件监听器）
   */
  destroy(): void {
    this.canvas.style.cursor = 'default';
  }
}
