/**
 * 手势识别教程步骤
 * 需求: 8.2, 8.3
 */

import { TutorialStep } from './TutorialStep.js';
import { GameState } from '../game/GameState.js';
import { SciFiTheme } from '../ui/SciFiTheme.js';

/**
 * 手势识别教程步骤
 * 教导玩家如何让系统识别手部
 */
export class HandDetectionStep extends TutorialStep {
  private detectionStartTime: number = 0;
  private requiredDetectionTime: number = 2000; // 需要持续检测2秒

  constructor() {
    super(
      'hand_detection',
      '步骤 1: 手势识别',
      '将你的手放在摄像头前，让系统识别你的手部动作',
      'detect_hand'
    );
  }

  /**
   * 检查是否完成手部检测
   * 需求: 8.2 - 手势识别步骤
   * @param _gameState 游戏状态
   * @param handDetected 是否检测到手部
   */
  checkCompletion(_gameState: GameState, handDetected?: boolean): boolean {
    if (this.completed) {
      return true;
    }

    if (handDetected) {
      if (this.detectionStartTime === 0) {
        this.detectionStartTime = Date.now();
      }

      const elapsedTime = Date.now() - this.detectionStartTime;
      if (elapsedTime >= this.requiredDetectionTime) {
        this.completed = true;
        return true;
      }
    } else {
      // 如果手部丢失，重置计时
      this.detectionStartTime = 0;
    }

    return false;
  }

  /**
   * 渲染手势识别提示
   * 需求: 8.3 - 显示文字提示和视觉指引
   */
  renderHint(
    ctx: CanvasRenderingContext2D,
    theme: SciFiTheme,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const boxWidth = 600;
    const boxHeight = 250;
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

    // 绘制进度提示
    if (this.detectionStartTime > 0) {
      const progress = Math.min(1, (Date.now() - this.detectionStartTime) / this.requiredDetectionTime);
      
      theme.drawGlowText(
        ctx,
        '检测中...',
        canvasWidth / 2,
        y + 170,
        18,
        theme.colors.accent,
        theme.fonts.mono,
        'center'
      );

      // 绘制进度条
      const barWidth = 400;
      const barHeight = 20;
      const barX = (canvasWidth - barWidth) / 2;
      const barY = y + 200;
      
      theme.drawProgressBar(ctx, barX, barY, barWidth, barHeight, progress, theme.colors.primary);
    } else {
      theme.drawGlowText(
        ctx,
        '👋 请将手放在摄像头前',
        canvasWidth / 2,
        y + 190,
        20,
        theme.colors.accent,
        theme.fonts.mono,
        'center'
      );
    }

    // 绘制手部图标指示（简单的手形轮廓）
    this.drawHandIcon(ctx, canvasWidth / 2, y + boxHeight + 80, theme);
  }

  /**
   * 绘制手部图标
   */
  private drawHandIcon(ctx: CanvasRenderingContext2D, x: number, y: number, theme: SciFiTheme): void {
    ctx.save();

    const isDetecting = this.detectionStartTime > 0;
    const color = isDetecting ? theme.colors.primary : theme.colors.secondary;
    const alpha = isDetecting ? 1.0 : 0.5;

    // 绘制简单的手形轮廓
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = alpha;

    // 手掌
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.stroke();

    // 手指（5根）
    const fingerPositions = [
      { angle: -Math.PI * 0.6, length: 25 },  // 拇指
      { angle: -Math.PI * 0.3, length: 35 },  // 食指
      { angle: 0, length: 40 },               // 中指
      { angle: Math.PI * 0.3, length: 35 },   // 无名指
      { angle: Math.PI * 0.6, length: 25 }    // 小指
    ];

    fingerPositions.forEach(finger => {
      const startX = x + Math.cos(finger.angle) * 30;
      const startY = y + Math.sin(finger.angle) * 30;
      const endX = x + Math.cos(finger.angle) * (30 + finger.length);
      const endY = y + Math.sin(finger.angle) * (30 + finger.length);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    });

    // 添加发光效果
    if (isDetecting) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.stroke();
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
    this.detectionStartTime = 0;
  }
}
