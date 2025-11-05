/**
 * 连击计数器 HUD
 * 需求: 1.5 - THE 视觉反馈系统 SHALL 在屏幕上显示当前连击数和分数倍率
 * 
 * 在屏幕顶部中央显示连击数和分数倍率，使用颜色渐变表示连击等级
 */

/**
 * 连击计数器 HUD 类
 * 显示当前连击数和分数倍率
 */
export class ComboCounterHUD {
  /**
   * 渲染连击计数器
   * 需求: 1.5 - 显示连击数和分数倍率，使用颜色渐变
   * 
   * @param ctx Canvas 渲染上下文
   * @param comboCount 当前连击数
   * @param multiplier 当前分数倍率
   * @param canvasWidth 画布宽度
   */
  render(
    ctx: CanvasRenderingContext2D,
    comboCount: number,
    multiplier: number,
    canvasWidth: number
  ): void {
    // 仅在连击数 >= 3 时显示
    if (comboCount < 3) {
      return;
    }

    // 获取连击等级对应的颜色
    const color = this.getComboColor(comboCount);

    // 保存当前绘图状态
    ctx.save();

    // 设置文本样式
    ctx.font = 'bold 48px Orbitron, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // 计算位置（屏幕顶部中央）
    const x = canvasWidth / 2;
    const y = 40;

    // 绘制文本阴影（增强可读性）
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // 绘制文本描边
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 4;
    ctx.strokeText(`连击 x${comboCount} | ${multiplier.toFixed(1)}x`, x, y);

    // 绘制文本填充
    ctx.fillStyle = color;
    ctx.fillText(`连击 x${comboCount} | ${multiplier.toFixed(1)}x`, x, y);

    // 恢复绘图状态
    ctx.restore();
  }

  /**
   * 根据连击数获取对应的颜色
   * 需求: 1.5 - 使用颜色渐变表示连击等级
   * 
   * 颜色规则：
   * - 3-5 连击: 绿色 (#00FF00)
   * - 6-10 连击: 蓝色 (#00BFFF)
   * - 11-19 连击: 紫色 (#9370DB)
   * - 20+ 连击: 金色 (#FFD700)
   * 
   * @param comboCount 连击数
   * @returns 颜色字符串
   */
  private getComboColor(comboCount: number): string {
    if (comboCount >= 20) {
      return '#FFD700'; // 金色
    } else if (comboCount >= 11) {
      return '#9370DB'; // 紫色
    } else if (comboCount >= 6) {
      return '#00BFFF'; // 蓝色
    } else {
      return '#00FF00'; // 绿色
    }
  }
}
