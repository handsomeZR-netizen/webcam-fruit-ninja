/**
 * 教程系统
 * 需求: 8.1, 8.4, 8.5
 */

import { ITutorialStep } from './TutorialStep.js';
import { HandDetectionStep } from './HandDetectionStep.js';
import { SliceFruitStep } from './SliceFruitStep.js';
import { AvoidBombStep } from './AvoidBombStep.js';
import { GameState } from '../game/GameState.js';
import { SciFiTheme } from '../ui/SciFiTheme.js';

/**
 * 教程系统回调接口
 */
export interface TutorialSystemCallbacks {
  onStepComplete?: (stepId: string) => void;
  onTutorialComplete?: () => void;
  onTutorialStart?: () => void;
}

/**
 * 教程系统类
 * 需求: 8.1 - WHEN 玩家首次访问游戏时，THE 教学系统 SHALL 自动启动交互式教程
 * 需求: 8.4 - WHEN 玩家完成教程中的每个步骤时，THE 教学系统 SHALL 提供正向反馈并自动进入下一步骤
 * 需求: 8.5 - THE 游戏系统 SHALL 在主菜单提供重新观看教程的选项
 */
export class TutorialSystem {
  private steps: ITutorialStep[];
  private currentStepIndex: number;
  private isActive: boolean;
  private theme: SciFiTheme;
  private callbacks: TutorialSystemCallbacks;
  private completionAnimationTime: number = 0;
  private showingCompletionFeedback: boolean = false;
  private readonly COMPLETION_FEEDBACK_DURATION = 2000; // 2秒的完成反馈
  private readonly TUTORIAL_COMPLETED_KEY = 'fruitNinja_tutorialCompleted';

  constructor(callbacks: TutorialSystemCallbacks = {}) {
    this.theme = new SciFiTheme();
    this.callbacks = callbacks;
    this.currentStepIndex = 0;
    this.isActive = false;

    // 初始化教程步骤
    // 需求: 8.2 - THE 教学系统 SHALL 分步骤展示游戏操作，包括手势识别、切割水果、避免炸弹三个核心步骤
    this.steps = [
      new HandDetectionStep(),
      new SliceFruitStep(),
      new AvoidBombStep()
    ];
  }

  /**
   * 启动教程
   * 需求: 8.1 - 自动启动交互式教程
   */
  start(): void {
    this.isActive = true;
    this.currentStepIndex = 0;
    this.showingCompletionFeedback = false;
    
    // 重置所有步骤
    for (const step of this.steps) {
      step.reset();
    }

    // 触发启动回调
    if (this.callbacks.onTutorialStart) {
      this.callbacks.onTutorialStart();
    }
  }

  /**
   * 更新教程状态
   * 需求: 8.4 - 提供正向反馈并自动进入下一步骤
   * @param gameState 游戏状态
   * @param handDetected 是否检测到手部
   * @param fruitSliced 是否切割了水果
   */
  update(gameState: GameState, handDetected?: boolean, fruitSliced?: boolean): void {
    if (!this.isActive) {
      return;
    }

    // 如果正在显示完成反馈，检查是否超时
    if (this.showingCompletionFeedback) {
      const elapsed = Date.now() - this.completionAnimationTime;
      if (elapsed >= this.COMPLETION_FEEDBACK_DURATION) {
        this.showingCompletionFeedback = false;
        this.nextStep();
      }
      return;
    }

    // 获取当前步骤
    const currentStep = this.getCurrentStep();
    if (!currentStep) {
      return;
    }

    // 检查当前步骤是否完成
    const wasCompleted = currentStep.completed;
    const isCompleted = currentStep.checkCompletion(gameState, handDetected, fruitSliced);

    // 如果步骤刚刚完成，显示正向反馈
    if (isCompleted && !wasCompleted) {
      this.showCompletionFeedback();
      
      // 触发步骤完成回调
      if (this.callbacks.onStepComplete) {
        this.callbacks.onStepComplete(currentStep.id);
      }
    }
  }

  /**
   * 显示步骤完成反馈
   * 需求: 8.4 - 提供正向反馈
   */
  private showCompletionFeedback(): void {
    this.showingCompletionFeedback = true;
    this.completionAnimationTime = Date.now();
  }

  /**
   * 进入下一步
   * 需求: 8.4 - 自动进入下一步骤
   */
  nextStep(): void {
    this.currentStepIndex++;

    // 检查是否完成所有步骤
    if (this.currentStepIndex >= this.steps.length) {
      this.complete();
    }
  }

  /**
   * 完成教程
   * 需求: 8.1 - 教程完成后保存状态到本地存储
   */
  complete(): void {
    this.isActive = false;
    
    // 保存教程完成状态到本地存储
    this.saveTutorialCompleted();

    // 触发完成回调
    if (this.callbacks.onTutorialComplete) {
      this.callbacks.onTutorialComplete();
    }
  }

  /**
   * 渲染教程UI
   * 需求: 8.3 - 显示文字提示和视觉指引
   * @param ctx Canvas 渲染上下文
   * @param canvasWidth 画布宽度
   * @param canvasHeight 画布高度
   */
  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (!this.isActive) {
      return;
    }

    ctx.save();

    // 如果正在显示完成反馈，渲染反馈动画
    if (this.showingCompletionFeedback) {
      this.renderCompletionFeedback(ctx, canvasWidth, canvasHeight);
    } else {
      // 渲染当前步骤的提示
      const currentStep = this.getCurrentStep();
      if (currentStep) {
        currentStep.renderHint(ctx, this.theme, canvasWidth, canvasHeight);
      }

      // 渲染进度指示器
      this.renderProgressIndicator(ctx, canvasWidth, canvasHeight);
    }

    ctx.restore();
  }

  /**
   * 渲染完成反馈动画
   * 需求: 8.4 - 提供正向反馈
   */
  private renderCompletionFeedback(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    const elapsed = Date.now() - this.completionAnimationTime;
    const progress = elapsed / this.COMPLETION_FEEDBACK_DURATION;
    
    // 淡入淡出效果
    const alpha = progress < 0.3 ? progress / 0.3 : (progress > 0.7 ? (1 - progress) / 0.3 : 1);
    
    ctx.save();
    ctx.globalAlpha = alpha;

    // 绘制成功消息
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // 绘制背景框
    const boxWidth = 600;
    const boxHeight = 200;
    const boxX = centerX - boxWidth / 2;
    const boxY = centerY - boxHeight / 2;

    ctx.fillStyle = this.addAlpha(this.theme.colors.background, 0.9);
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    this.theme.drawNeonBorder(ctx, boxX, boxY, boxWidth, boxHeight, this.theme.colors.primary, 25);

    // 绘制成功图标（勾号）
    const checkSize = 60;
    const checkX = centerX;
    const checkY = centerY - 30;

    ctx.strokeStyle = this.theme.colors.primary;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.theme.colors.primary;

    ctx.beginPath();
    ctx.moveTo(checkX - checkSize / 2, checkY);
    ctx.lineTo(checkX - checkSize / 6, checkY + checkSize / 3);
    ctx.lineTo(checkX + checkSize / 2, checkY - checkSize / 3);
    ctx.stroke();

    // 绘制成功文字
    this.theme.drawGlowText(
      ctx,
      '✓ 步骤完成！',
      centerX,
      centerY + 50,
      36,
      this.theme.colors.primary,
      this.theme.fonts.main,
      'center'
    );

    // 如果不是最后一步，显示"进入下一步"
    if (this.currentStepIndex < this.steps.length - 1) {
      this.theme.drawGlowText(
        ctx,
        '准备进入下一步...',
        centerX,
        centerY + 90,
        20,
        this.theme.colors.secondary,
        this.theme.fonts.mono,
        'center'
      );
    }

    ctx.restore();
  }

  /**
   * 渲染进度指示器
   */
  private renderProgressIndicator(ctx: CanvasRenderingContext2D, canvasWidth: number, _canvasHeight: number): void {
    const indicatorY = 50;
    const stepWidth = 150;
    const totalWidth = this.steps.length * stepWidth;
    const startX = (canvasWidth - totalWidth) / 2;

    ctx.save();

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      const x = startX + i * stepWidth;
      const isCurrent = i === this.currentStepIndex;
      const isCompleted = step.completed;

      // 绘制步骤圆圈
      const circleRadius = 20;
      const circleX = x + stepWidth / 2;
      const circleY = indicatorY;

      // 圆圈颜色
      let color = this.theme.colors.text;
      if (isCompleted) {
        color = this.theme.colors.primary;
      } else if (isCurrent) {
        color = this.theme.colors.accent;
      }

      // 绘制圆圈
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowBlur = isCurrent ? 15 : 5;
      ctx.shadowColor = color;

      ctx.beginPath();
      ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 如果完成，填充圆圈
      if (isCompleted) {
        ctx.fillStyle = this.addAlpha(color, 0.3);
        ctx.fill();
      }

      // 绘制步骤编号
      ctx.font = `16px ${this.theme.fonts.mono}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(`${i + 1}`, circleX, circleY);

      // 绘制连接线（除了最后一个）
      if (i < this.steps.length - 1) {
        const lineStartX = circleX + circleRadius;
        const lineEndX = startX + (i + 1) * stepWidth + stepWidth / 2 - circleRadius;
        
        ctx.strokeStyle = this.addAlpha(this.theme.colors.text, 0.3);
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(lineStartX, circleY);
        ctx.lineTo(lineEndX, circleY);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * 获取当前步骤
   */
  getCurrentStep(): ITutorialStep | null {
    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      return this.steps[this.currentStepIndex];
    }
    return null;
  }

  /**
   * 获取当前步骤索引
   */
  getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  /**
   * 检查教程是否激活
   */
  isActiveTutorial(): boolean {
    return this.isActive;
  }

  /**
   * 停止教程
   */
  stop(): void {
    this.isActive = false;
  }

  /**
   * 检查是否是首次访问
   * 需求: 8.1 - 检测首次访问并自动启动教程
   */
  isFirstVisit(): boolean {
    return !this.isTutorialCompleted();
  }

  /**
   * 检查教程是否已完成
   */
  isTutorialCompleted(): boolean {
    const completed = localStorage.getItem(this.TUTORIAL_COMPLETED_KEY);
    return completed === 'true';
  }

  /**
   * 保存教程完成状态
   */
  private saveTutorialCompleted(): void {
    localStorage.setItem(this.TUTORIAL_COMPLETED_KEY, 'true');
  }

  /**
   * 重置教程完成状态（用于测试或重新观看教程）
   * 需求: 8.5 - 在主菜单提供重新观看教程的选项
   */
  resetTutorialProgress(): void {
    localStorage.removeItem(this.TUTORIAL_COMPLETED_KEY);
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
   * 获取所有步骤
   */
  getSteps(): ITutorialStep[] {
    return this.steps;
  }

  /**
   * 获取教程总步骤数
   */
  getTotalSteps(): number {
    return this.steps.length;
  }
}
