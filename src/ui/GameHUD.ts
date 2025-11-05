/**
 * 游戏 HUD (Heads-Up Display) - 显示分数和生命值
 * 需求: 3.3
 * 
 * 使用示例:
 * ```typescript
 * const hud = new GameHUD(theme);
 * 
 * // 更新 HUD 数据
 * hud.updateScore(1000);
 * hud.updateLives(2);
 * hud.updateHighScore(5000);
 * 
 * // 渲染 HUD
 * hud.render(ctx, canvasWidth, canvasHeight);
 * ```
 */

import { SciFiTheme } from './SciFiTheme.js';

/**
 * 游戏 HUD 类
 * 需求: 3.3 - THE 游戏系统 SHALL 在屏幕上实时显示当前分数和剩余生命值
 */
export class GameHUD {
  private theme: SciFiTheme;
  private score: number = 0;
  private lives: number = 3;
  private highScore: number = 0;
  private scoreAnimationProgress: number = 0;
  private lastScore: number = 0;

  constructor(theme: SciFiTheme) {
    this.theme = theme;
  }

  /**
   * 更新分数
   * @param score 当前分数
   */
  updateScore(score: number): void {
    if (score !== this.lastScore) {
      this.scoreAnimationProgress = 1.0; // 触发分数变化动画
      this.lastScore = score;
    }
    this.score = score;
  }

  /**
   * 更新生命值
   * @param lives 当前生命值
   */
  updateLives(lives: number): void {
    this.lives = lives;
  }

  /**
   * 更新最高分
   * @param highScore 最高分
   */
  updateHighScore(highScore: number): void {
    this.highScore = highScore;
  }

  /**
   * 渲染 HUD
   * @param ctx Canvas 渲染上下文
   * @param canvasWidth 画布宽度
   * @param canvasHeight 画布高度
   */
  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    // 更新动画进度
    if (this.scoreAnimationProgress > 0) {
      this.scoreAnimationProgress -= 0.05;
      if (this.scoreAnimationProgress < 0) {
        this.scoreAnimationProgress = 0;
      }
    }

    // 渲染分数显示（左上角）
    this.renderScore(ctx, canvasWidth, canvasHeight);

    // 渲染生命值显示（右上角）
    this.renderLives(ctx, canvasWidth, canvasHeight);

    // 渲染最高分显示（顶部中央）
    this.renderHighScore(ctx, canvasWidth, canvasHeight);
  }

  /**
   * 渲染分数显示
   * 需求: 3.3 - 实时显示当前分数
   */
  private renderScore(ctx: CanvasRenderingContext2D, _canvasWidth: number, _canvasHeight: number): void {
    const padding = 40;
    const x = padding;
    const y = padding + 30;

    // 绘制分数标签
    this.theme.drawGlowText(
      ctx,
      'SCORE',
      x,
      y - 25,
      20,
      this.theme.colors.primary,
      this.theme.fonts.main,
      'left'
    );

    // 绘制分数值（带动画效果）
    const fontSize = 48 + (this.scoreAnimationProgress * 12); // 分数变化时放大
    const color = this.scoreAnimationProgress > 0 
      ? this.theme.colors.accent  // 变化时使用强调色
      : this.theme.colors.primary; // 正常时使用主色

    this.theme.drawGlowText(
      ctx,
      this.formatScore(this.score),
      x,
      y + 20,
      fontSize,
      color,
      this.theme.fonts.mono,
      'left'
    );

    // 绘制装饰边框
    const boxWidth = 200;
    const boxHeight = 80;
    this.theme.drawNeonBorder(
      ctx,
      x - 15,
      y - 40,
      boxWidth,
      boxHeight,
      this.theme.colors.primary,
      12
    );
  }

  /**
   * 渲染生命值显示
   * 需求: 3.3 - 实时显示剩余生命值
   */
  private renderLives(ctx: CanvasRenderingContext2D, canvasWidth: number, _canvasHeight: number): void {
    const padding = 40;
    const x = canvasWidth - padding;
    const y = padding + 30;

    // 绘制生命值标签
    this.theme.drawGlowText(
      ctx,
      'LIVES',
      x,
      y - 25,
      20,
      this.theme.colors.secondary,
      this.theme.fonts.main,
      'right'
    );

    // 绘制生命值图标（心形或方块）
    const iconSize = 30;
    const iconSpacing = 40;
    const startX = x - (this.lives - 1) * iconSpacing;

    for (let i = 0; i < this.lives; i++) {
      const iconX = startX + i * iconSpacing;
      const iconY = y + 20;
      
      // 绘制生命值图标（使用菱形代表生命）
      this.drawLifeIcon(ctx, iconX, iconY, iconSize, this.theme.colors.secondary);
    }

    // 绘制装饰边框
    const boxWidth = Math.max(150, this.lives * iconSpacing + 30);
    const boxHeight = 80;
    this.theme.drawNeonBorder(
      ctx,
      x - boxWidth + 15,
      y - 40,
      boxWidth,
      boxHeight,
      this.theme.colors.secondary,
      12
    );
  }

  /**
   * 渲染最高分显示
   */
  private renderHighScore(ctx: CanvasRenderingContext2D, canvasWidth: number, _canvasHeight: number): void {
    const x = canvasWidth / 2;
    const y = 40;

    // 只在有最高分时显示
    if (this.highScore > 0) {
      const text = `HIGH SCORE: ${this.formatScore(this.highScore)}`;
      
      this.theme.drawGlowText(
        ctx,
        text,
        x,
        y,
        24,
        this.theme.colors.accent,
        this.theme.fonts.mono,
        'center'
      );
    }
  }

  /**
   * 绘制生命值图标（菱形）
   * @param ctx Canvas 渲染上下文
   * @param x 中心 X 坐标
   * @param y 中心 Y 坐标
   * @param size 图标大小
   * @param color 图标颜色
   */
  private drawLifeIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    ctx.save();

    const halfSize = size / 2;

    // 绘制多层菱形实现发光效果
    // 外层发光
    this.drawDiamond(ctx, x, y, halfSize + 4, color, 0.2, 3);
    // 中层发光
    this.drawDiamond(ctx, x, y, halfSize + 2, color, 0.5, 2);
    // 核心菱形
    this.drawDiamond(ctx, x, y, halfSize, color, 1.0, 1.5);

    // 绘制内部装饰线
    ctx.strokeStyle = this.addAlpha(color, 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - halfSize * 0.5);
    ctx.lineTo(x, y + halfSize * 0.5);
    ctx.moveTo(x - halfSize * 0.5, y);
    ctx.lineTo(x + halfSize * 0.5, y);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 绘制菱形
   */
  private drawDiamond(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    alpha: number,
    lineWidth: number
  ): void {
    ctx.strokeStyle = this.addAlpha(color, alpha);
    ctx.fillStyle = this.addAlpha(color, alpha * 0.2);
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.moveTo(x, y - size);           // 上
    ctx.lineTo(x + size, y);           // 右
    ctx.lineTo(x, y + size);           // 下
    ctx.lineTo(x - size, y);           // 左
    ctx.closePath();
    
    ctx.fill();
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
   * @param color 十六进制颜色
   * @param alpha 透明度 (0-1)
   * @returns RGBA 颜色字符串
   */
  private addAlpha(color: string, alpha: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * 重置 HUD 状态
   */
  reset(): void {
    this.score = 0;
    this.lives = 3;
    this.lastScore = 0;
    this.scoreAnimationProgress = 0;
  }
}
