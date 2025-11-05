/**
 * 切割水果教程步骤
 * 需求: 8.2, 8.3
 */

import { TutorialStep } from './TutorialStep.js';
import { GameState } from '../game/GameState.js';
import { SciFiTheme } from '../ui/SciFiTheme.js';

/**
 * 切割水果教程步骤
 * 教导玩家如何切割水果
 */
export class SliceFruitStep extends TutorialStep {
  private fruitsSliced: number = 0;
  private requiredSlices: number = 3; // 需要切割3个水果

  constructor() {
    super(
      'slice_fruit',
      '步骤 2: 切割水果',
      '挥动你的手来切割飞出的水果，尝试切割 3 个水果',
      'slice_fruit'
    );
  }

  /**
   * 检查是否完成水果切割
   * 需求: 8.2 - 切割水果步骤
   * @param _gameState 游戏状态
   * @param _handDetected 是否检测到手部
   * @param fruitSliced 是否切割了水果
   */
  checkCompletion(_gameState: GameState, _handDetected?: boolean, fruitSliced?: boolean): boolean {
    if (this.completed) {
      return true;
    }

    // 如果刚刚切割了水果，增加计数
    if (fruitSliced) {
      this.fruitsSliced++;
    }

    // 检查是否达到要求
    if (this.fruitsSliced >= this.requiredSlices) {
      this.completed = true;
      return true;
    }

    return false;
  }

  /**
   * 渲染切割水果提示
   * 需求: 8.3 - 显示文字提示和视觉指引
   */
  renderHint(
    ctx: CanvasRenderingContext2D,
    theme: SciFiTheme,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const boxWidth = 600;
    const boxHeight = 280;
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

    // 绘制进度
    const progress = this.fruitsSliced / this.requiredSlices;
    
    theme.drawGlowText(
      ctx,
      `进度: ${this.fruitsSliced} / ${this.requiredSlices}`,
      canvasWidth / 2,
      y + 170,
      24,
      theme.colors.accent,
      theme.fonts.mono,
      'center'
    );

    // 绘制进度条
    const barWidth = 400;
    const barHeight = 20;
    const barX = (canvasWidth - barWidth) / 2;
    const barY = y + 210;
    
    theme.drawProgressBar(ctx, barX, barY, barWidth, barHeight, progress, theme.colors.primary);

    // 绘制操作提示
    theme.drawGlowText(
      ctx,
      '✋ 快速挥动手部来切割水果',
      canvasWidth / 2,
      y + 250,
      18,
      theme.colors.secondary,
      theme.fonts.mono,
      'center'
    );

    // 绘制切割动作示意
    this.drawSliceMotion(ctx, canvasWidth / 2, y + boxHeight + 80, theme);
  }

  /**
   * 绘制切割动作示意
   */
  private drawSliceMotion(ctx: CanvasRenderingContext2D, x: number, y: number, theme: SciFiTheme): void {
    ctx.save();

    const time = Date.now() / 1000;
    const animProgress = (Math.sin(time * 2) + 1) / 2; // 0-1 循环动画

    // 绘制水果（简单的圆形）
    ctx.fillStyle = theme.colors.accent;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();

    // 绘制切割轨迹
    const startX = x - 50 + animProgress * 100;
    const startY = y + 40 - animProgress * 80;
    const endX = x + 50 + animProgress * 100;
    const endY = y - 40 - animProgress * 80;

    ctx.strokeStyle = theme.colors.primary;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 1 - animProgress * 0.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = theme.colors.primary;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 如果动画进行到一半，显示切割效果
    if (animProgress > 0.5) {
      const splitProgress = (animProgress - 0.5) * 2;
      
      // 左半部分
      ctx.fillStyle = theme.colors.accent;
      ctx.globalAlpha = 0.6 * (1 - splitProgress * 0.5);
      ctx.beginPath();
      ctx.arc(x - splitProgress * 20, y + splitProgress * 10, 25, 0, Math.PI * 2);
      ctx.fill();

      // 右半部分
      ctx.beginPath();
      ctx.arc(x + splitProgress * 20, y + splitProgress * 10, 25, 0, Math.PI * 2);
      ctx.fill();
    }

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
    this.fruitsSliced = 0;
  }

  /**
   * 获取当前切割数量
   */
  getFruitsSliced(): number {
    return this.fruitsSliced;
  }
}
