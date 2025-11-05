/**
 * 避免炸弹教程步骤
 * 需求: 8.2, 8.3
 */

import { TutorialStep } from './TutorialStep.js';
import { GameState } from '../game/GameState.js';
import { SciFiTheme } from '../ui/SciFiTheme.js';

/**
 * 避免炸弹教程步骤
 * 教导玩家如何避免切割炸弹
 */
export class AvoidBombStep extends TutorialStep {
  private bombsAvoided: number = 0;
  private requiredAvoidances: number = 2; // 需要避开2个炸弹
  private bombsSpawned: number = 0;

  constructor() {
    super(
      'avoid_bomb',
      '步骤 3: 避免炸弹',
      '小心！不要切割炸弹，让它们自然落下。避开 2 个炸弹',
      'avoid_bomb'
    );
  }

  /**
   * 检查是否完成避免炸弹
   * 需求: 8.2 - 避免炸弹步骤
   * @param gameState 游戏状态
   */
  checkCompletion(gameState: GameState): boolean {
    if (this.completed) {
      return true;
    }

    // 统计当前炸弹数量
    const currentBombCount = gameState.getBombCount();
    
    // 如果炸弹数量增加，说明生成了新炸弹
    if (currentBombCount > this.bombsSpawned) {
      this.bombsSpawned = currentBombCount;
    }

    // 如果炸弹数量减少，检查是否是因为离开屏幕（成功避开）
    if (currentBombCount < this.bombsSpawned) {
      const bombsRemoved = this.bombsSpawned - currentBombCount;
      
      // 检查游戏是否还在进行（如果游戏结束说明切到了炸弹）
      if (gameState.isPlaying && !gameState.isGameOver) {
        this.bombsAvoided += bombsRemoved;
      }
      
      this.bombsSpawned = currentBombCount;
    }

    // 检查是否达到要求
    if (this.bombsAvoided >= this.requiredAvoidances) {
      this.completed = true;
      return true;
    }

    return false;
  }

  /**
   * 渲染避免炸弹提示
   * 需求: 8.3 - 显示文字提示和视觉指引
   */
  renderHint(
    ctx: CanvasRenderingContext2D,
    theme: SciFiTheme,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const boxWidth = 600;
    const boxHeight = 300;
    const x = (canvasWidth - boxWidth) / 2;
    const y = canvasHeight * 0.3;

    // 绘制提示框
    this.drawHintBox(ctx, theme, x, y, boxWidth, boxHeight);

    // 绘制标题
    theme.drawGlowText(
      ctx,
      this.title,
      canvasWidth / 2,
      y + 40,
      32,
      theme.colors.primary,
      theme.fonts.main,
      'center'
    );

    // 绘制描述
    ctx.save();
    ctx.font = `20px ${theme.fonts.main}, sans-serif`;
    ctx.fillStyle = theme.colors.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const lines = this.wrapText(ctx, this.description, boxWidth - 80);
    lines.forEach((line, index) => {
      ctx.fillText(line, canvasWidth / 2, y + 100 + index * 30);
    });
    ctx.restore();

    // 绘制警告
    theme.drawGlowText(
      ctx,
      '⚠️ 警告：切割炸弹会立即结束游戏！',
      canvasWidth / 2,
      y + 160,
      20,
      theme.colors.accent,
      theme.fonts.mono,
      'center'
    );

    // 绘制进度
    const progress = this.bombsAvoided / this.requiredAvoidances;
    
    theme.drawGlowText(
      ctx,
      `已避开: ${this.bombsAvoided} / ${this.requiredAvoidances}`,
      canvasWidth / 2,
      y + 200,
      24,
      theme.colors.secondary,
      theme.fonts.mono,
      'center'
    );

    // 绘制进度条
    const barWidth = 400;
    const barHeight = 20;
    const barX = (canvasWidth - barWidth) / 2;
    const barY = y + 240;
    
    theme.drawProgressBar(ctx, barX, barY, barWidth, barHeight, progress, theme.colors.secondary);

    // 绘制操作提示
    theme.drawGlowText(
      ctx,
      '🚫 看到炸弹时，不要挥动手部',
      canvasWidth / 2,
      y + 275,
      18,
      theme.colors.text,
      theme.fonts.mono,
      'center'
    );

    // 绘制炸弹警告示意
    this.drawBombWarning(ctx, canvasWidth / 2, y + boxHeight + 80, theme);
  }

  /**
   * 绘制炸弹警告示意
   */
  private drawBombWarning(ctx: CanvasRenderingContext2D, x: number, y: number, theme: SciFiTheme): void {
    ctx.save();

    const time = Date.now() / 1000;
    const pulse = (Math.sin(time * 4) + 1) / 2; // 快速脉冲动画

    // 绘制炸弹（简单的圆形带引线）
    ctx.fillStyle = theme.colors.accent;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    // 绘制引线
    ctx.strokeStyle = theme.colors.text;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 30);
    ctx.lineTo(x, y - 50);
    ctx.stroke();

    // 绘制引线火花（闪烁）
    if (pulse > 0.5) {
      ctx.fillStyle = theme.colors.accent;
      ctx.shadowBlur = 20;
      ctx.shadowColor = theme.colors.accent;
      ctx.beginPath();
      ctx.arc(x, y - 50, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 绘制警告圈
    ctx.strokeStyle = theme.colors.accent;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6 + pulse * 0.4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = theme.colors.accent;
    ctx.beginPath();
    ctx.arc(x, y, 50 + pulse * 10, 0, Math.PI * 2);
    ctx.stroke();

    // 绘制禁止符号
    ctx.strokeStyle = theme.colors.accent;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 20;
    ctx.shadowColor = theme.colors.accent;
    
    // 外圈
    ctx.beginPath();
    ctx.arc(x, y, 45, 0, Math.PI * 2);
    ctx.stroke();
    
    // 斜线
    ctx.beginPath();
    ctx.moveTo(x - 32, y - 32);
    ctx.lineTo(x + 32, y + 32);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 文字换行辅助方法
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split('');
    const lines: string[] = [];
    let currentLine = '';

    for (const char of words) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * 重置步骤状态
   */
  reset(): void {
    super.reset();
    this.bombsAvoided = 0;
    this.bombsSpawned = 0;
  }

  /**
   * 获取已避开的炸弹数量
   */
  getBombsAvoided(): number {
    return this.bombsAvoided;
  }

  /**
   * 通知炸弹离开屏幕（成功避开）
   * 这个方法可以被教程系统调用来手动增加避开计数
   */
  notifyBombAvoided(): void {
    this.bombsAvoided++;
  }
}
