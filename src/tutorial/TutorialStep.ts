/**
 * 教程步骤类
 * 需求: 8.2, 8.3
 */

import { GameState } from '../game/GameState';
import { SciFiTheme } from '../ui/SciFiTheme';

/**
 * 教程步骤目标动作类型
 */
export type TutorialTargetAction = 'detect_hand' | 'slice_fruit' | 'avoid_bomb';

/**
 * 教程步骤接口
 */
export interface ITutorialStep {
  id: string;
  title: string;
  description: string;
  targetAction: TutorialTargetAction;
  completed: boolean;
  
  checkCompletion(gameState: GameState, handDetected?: boolean, fruitSliced?: boolean): boolean;
  renderHint(ctx: CanvasRenderingContext2D, theme: SciFiTheme, canvasWidth: number, canvasHeight: number): void;
  reset(): void;
}

/**
 * 教程步骤基类
 * 需求: 8.2 - THE 教学系统 SHALL 分步骤展示游戏操作，包括手势识别、切割水果、避免炸弹三个核心步骤
 * 需求: 8.3 - WHEN 教学系统处于活动状态时，THE 游戏系统 SHALL 显示文字提示和视觉指引
 */
export abstract class TutorialStep implements ITutorialStep {
  id: string;
  title: string;
  description: string;
  targetAction: TutorialTargetAction;
  completed: boolean;

  constructor(
    id: string,
    title: string,
    description: string,
    targetAction: TutorialTargetAction
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.targetAction = targetAction;
    this.completed = false;
  }

  /**
   * 检查步骤是否完成
   * @param gameState 游戏状态
   * @param handDetected 是否检测到手部（可选）
   * @param fruitSliced 是否切割了水果（可选）
   */
  abstract checkCompletion(gameState: GameState, handDetected?: boolean, fruitSliced?: boolean): boolean;

  /**
   * 渲染提示
   * @param ctx Canvas 渲染上下文
   * @param theme 科幻主题
   * @param canvasWidth 画布宽度
   * @param canvasHeight 画布高度
   */
  abstract renderHint(
    ctx: CanvasRenderingContext2D,
    theme: SciFiTheme,
    canvasWidth: number,
    canvasHeight: number
  ): void;

  /**
   * 重置步骤状态
   */
  reset(): void {
    this.completed = false;
  }

  /**
   * 绘制通用提示框
   * @param ctx Canvas 渲染上下文
   * @param theme 科幻主题
   * @param x 左上角 X 坐标
   * @param y 左上角 Y 坐标
   * @param width 宽度
   * @param height 高度
   */
  protected drawHintBox(
    ctx: CanvasRenderingContext2D,
    theme: SciFiTheme,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    ctx.save();

    // 绘制半透明背景
    ctx.fillStyle = theme['addAlpha'] 
      ? (theme as any).addAlpha(theme.colors.background, 0.85)
      : `rgba(10, 14, 39, 0.85)`;
    ctx.fillRect(x, y, width, height);

    // 绘制霓虹边框
    theme.drawNeonBorder(ctx, x, y, width, height, theme.colors.primary, 20);

    ctx.restore();
  }
}
