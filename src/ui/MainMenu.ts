/**
 * 主菜单界面
 * 需求: 9.6 - WHEN 玩家与UI元素交互时，THE 游戏系统 SHALL 播放科幻音效和视觉反馈动画
 */

import { SciFiTheme } from './SciFiTheme.js';

/**
 * 菜单按钮接口
 */
export interface MenuButton {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isHovered: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

/**
 * 主菜单回调接口
 */
export interface MainMenuCallbacks {
  onStartGame?: () => void;
  onShowTutorial?: () => void;
  onShowSettings?: () => void;
  onButtonHover?: (buttonId: string) => void;
  onButtonClick?: (buttonId: string) => void;
}

/**
 * 主菜单类
 * 实现科幻风格的主菜单界面，包含开始游戏、教程、设置按钮
 */
export class MainMenu {
  private theme: SciFiTheme;
  private buttons: MenuButton[] = [];
  private canvas: HTMLCanvasElement;
  private callbacks: MainMenuCallbacks;
  private titlePulsePhase: number = 0;
  private lastUpdateTime: number = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: MainMenuCallbacks = {}) {
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
    const startY = this.canvas.height / 2 + 50;
    const buttonWidth = 400;
    const buttonHeight = 80;
    const buttonSpacing = 100;

    this.buttons = [
      {
        id: 'start',
        text: '开始游戏',
        x: centerX - buttonWidth / 2,
        y: startY,
        width: buttonWidth,
        height: buttonHeight,
        isHovered: false,
        isDisabled: false,
        onClick: () => {
          if (this.callbacks.onStartGame) {
            this.callbacks.onStartGame();
          }
        }
      },
      {
        id: 'tutorial',
        text: '游戏教程',
        x: centerX - buttonWidth / 2,
        y: startY + buttonSpacing,
        width: buttonWidth,
        height: buttonHeight,
        isHovered: false,
        isDisabled: false,
        onClick: () => {
          if (this.callbacks.onShowTutorial) {
            this.callbacks.onShowTutorial();
          }
        }
      },
      {
        id: 'settings',
        text: '游戏设置',
        x: centerX - buttonWidth / 2,
        y: startY + buttonSpacing * 2,
        width: buttonWidth,
        height: buttonHeight,
        isHovered: false,
        isDisabled: false,
        onClick: () => {
          if (this.callbacks.onShowSettings) {
            this.callbacks.onShowSettings();
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
        if (button.isHovered && !wasHovered && !button.isDisabled) {
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
        if (this.isPointInButton(mouseX, mouseY, button) && !button.isDisabled) {
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
  private isPointInButton(x: number, y: number, button: MenuButton): boolean {
    return x >= button.x &&
           x <= button.x + button.width &&
           y >= button.y &&
           y <= button.y + button.height;
  }

  /**
   * 更新动画状态
   */
  update(): void {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // 更新标题脉冲动画
    this.titlePulsePhase += deltaTime * 2; // 2 Hz 频率
    if (this.titlePulsePhase > Math.PI * 2) {
      this.titlePulsePhase -= Math.PI * 2;
    }
  }

  /**
   * 渲染主菜单
   */
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 渲染标题
    this.renderTitle(ctx);

    // 渲染副标题
    this.renderSubtitle(ctx);

    // 渲染按钮
    this.renderButtons(ctx);

    // 渲染装饰元素
    this.renderDecorations(ctx);

    // 渲染版本信息
    this.renderVersionInfo(ctx);

    ctx.restore();
  }

  /**
   * 渲染标题
   */
  private renderTitle(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const titleY = this.canvas.height / 2 - 200;

    // 计算脉冲效果
    const pulse = Math.sin(this.titlePulsePhase) * 0.1 + 1;
    const fontSize = 72 * pulse;

    // 绘制主标题
    this.theme.drawGlowText(
      ctx,
      '网页端水果忍者',
      centerX,
      titleY,
      fontSize,
      this.theme.colors.primary,
      this.theme.fonts.main,
      'center'
    );

    // 绘制标题装饰线
    const lineY = titleY + 60;
    const lineWidth = 500;
    const lineX = centerX - lineWidth / 2;

    ctx.strokeStyle = this.theme.colors.primary;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.theme.colors.primary;

    ctx.beginPath();
    ctx.moveTo(lineX, lineY);
    ctx.lineTo(lineX + lineWidth, lineY);
    ctx.stroke();

    // 绘制装饰点
    const dotPositions = [0, 0.25, 0.5, 0.75, 1];
    for (const pos of dotPositions) {
      const dotX = lineX + lineWidth * pos;
      ctx.beginPath();
      ctx.arc(dotX, lineY, 4, 0, Math.PI * 2);
      ctx.fillStyle = this.theme.colors.primary;
      ctx.fill();
    }
  }

  /**
   * 渲染副标题
   */
  private renderSubtitle(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const subtitleY = this.canvas.height / 2 - 100;

    this.theme.drawGlowText(
      ctx,
      'WEBCAM FRUIT NINJA',
      centerX,
      subtitleY,
      32,
      this.theme.colors.secondary,
      this.theme.fonts.mono,
      'center'
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
        button.isDisabled
      );
    }
  }

  /**
   * 渲染装饰元素
   */
  private renderDecorations(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // 绘制角落装饰框
    const cornerSize = 100;
    const cornerOffset = 150;

    // 左上角
    this.theme.drawNeonBorder(
      ctx,
      cornerOffset,
      cornerOffset,
      cornerSize,
      cornerSize,
      this.theme.colors.accent,
      30
    );

    // 右上角
    this.theme.drawNeonBorder(
      ctx,
      this.canvas.width - cornerOffset - cornerSize,
      cornerOffset,
      cornerSize,
      cornerSize,
      this.theme.colors.accent,
      30
    );

    // 左下角
    this.theme.drawNeonBorder(
      ctx,
      cornerOffset,
      this.canvas.height - cornerOffset - cornerSize,
      cornerSize,
      cornerSize,
      this.theme.colors.accent,
      30
    );

    // 右下角
    this.theme.drawNeonBorder(
      ctx,
      this.canvas.width - cornerOffset - cornerSize,
      this.canvas.height - cornerOffset - cornerSize,
      cornerSize,
      cornerSize,
      this.theme.colors.accent,
      30
    );

    // 绘制中心装饰圆环
    const ringRadius = 600;
    ctx.strokeStyle = this.addAlpha(this.theme.colors.primary, 0.1);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 绘制内圆环
    const innerRingRadius = 550;
    ctx.strokeStyle = this.addAlpha(this.theme.colors.secondary, 0.08);
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRingRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * 渲染版本信息
   */
  private renderVersionInfo(ctx: CanvasRenderingContext2D): void {
    const versionText = 'v1.0.0 ALPHA';
    const x = this.canvas.width - 20;
    const y = this.canvas.height - 20;

    this.theme.drawGlowText(
      ctx,
      versionText,
      x,
      y,
      14,
      this.addAlpha(this.theme.colors.text, 0.5),
      this.theme.fonts.mono,
      'right'
    );
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
   * 设置按钮禁用状态
   */
  setButtonDisabled(buttonId: string, disabled: boolean): void {
    const button = this.buttons.find(b => b.id === buttonId);
    if (button) {
      button.isDisabled = disabled;
    }
  }

  /**
   * 销毁菜单（移除事件监听器）
   */
  destroy(): void {
    // 注意：实际应用中应该保存事件处理器的引用以便正确移除
    // 这里简化处理，实际项目中需要改进
    this.canvas.style.cursor = 'default';
  }
}
