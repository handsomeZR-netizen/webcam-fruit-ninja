/**
 * 科幻主题系统 - 提供科幻风格的UI绘制方法和配色方案
 * 需求: 9.1, 9.2, 9.3, 9.4, 9.5
 * 
 * 使用示例:
 * ```typescript
 * const theme = new SciFiTheme();
 * 
 * // 绘制霓虹边框
 * theme.drawNeonBorder(ctx, x, y, width, height, theme.colors.primary);
 * 
 * // 绘制发光文字
 * theme.drawGlowText(ctx, 'SCORE: 1000', x, y, 48, theme.colors.primary, theme.fonts.mono);
 * 
 * // 绘制扫描线效果
 * theme.drawScanlines(ctx, canvasWidth, canvasHeight);
 * 
 * // 绘制按钮
 * theme.drawButton(ctx, '开始游戏', x, y, width, height, isHovered);
 * 
 * // 绘制进度条
 * theme.drawProgressBar(ctx, x, y, width, height, progress, theme.colors.primary);
 * ```
 */

/**
 * 科幻主题配色方案
 */
export interface SciFiColors {
  primary: string;      // 主色：霓虹青色
  secondary: string;    // 次色：霓虹紫色
  accent: string;       // 强调色：霓虹橙色
  background: string;   // 背景：深色
  text: string;         // 文字：亮白
}

/**
 * 科幻主题效果配置
 */
export interface SciFiEffects {
  glowIntensity: number;      // 发光强度
  scanlineSpeed: number;      // 扫描线速度
  particleColor: string;      // 粒子颜色
}

/**
 * 科幻主题字体配置
 */
export interface SciFiFonts {
  main: string;  // 主字体
  mono: string;  // 等宽字体
}

/**
 * 科幻主题系统类
 * 需求: 9.1 - THE 游戏系统 SHALL 使用科幻主题的UI设计，包含霓虹线条、几何图形和未来感元素
 * 需求: 9.2 - THE 游戏系统 SHALL 避免使用常见的渐变AI配色方案
 * 需求: 9.3 - THE 游戏系统 SHALL 使用高对比度的色彩组合
 * 需求: 9.4 - THE 游戏系统 SHALL 为所有UI元素添加发光效果和动态扫描线动画
 * 需求: 9.5 - THE 游戏系统 SHALL 使用等宽字体或未来感字体显示分数和文本信息
 */
export class SciFiTheme {
  colors: SciFiColors;
  effects: SciFiEffects;
  fonts: SciFiFonts;
  private scanlineOffset: number = 0;
  private lastUpdateTime: number = 0;

  constructor() {
    // 需求: 9.3 - 使用高对比度的色彩组合，如深色背景配合明亮的霓虹色
    this.colors = {
      primary: '#00FFFF',      // 霓虹青色
      secondary: '#FF00FF',    // 霓虹紫色
      accent: '#FF6600',       // 霓虹橙色
      background: '#0A0E27',   // 深色背景
      text: '#FFFFFF'          // 亮白文字
    };

    // 需求: 9.4 - 发光效果和动态扫描线动画配置
    this.effects = {
      glowIntensity: 15,       // 发光强度
      scanlineSpeed: 50,       // 扫描线速度 (像素/秒)
      particleColor: '#00FFFF' // 粒子颜色（霓虹青色）
    };

    // 需求: 9.5 - 使用等宽字体或未来感字体
    this.fonts = {
      main: 'Orbitron',        // 未来感字体
      mono: 'Share Tech Mono'  // 等宽字体
    };

    this.lastUpdateTime = Date.now();
  }

  /**
   * 绘制霓虹边框
   * 需求: 9.1 - 霓虹线条和几何图形
   * 需求: 9.4 - 发光效果
   * @param ctx Canvas 渲染上下文
   * @param x 左上角 X 坐标
   * @param y 左上角 Y 坐标
   * @param width 宽度
   * @param height 高度
   * @param color 边框颜色（可选，默认使用主色）
   * @param cornerSize 角落装饰大小（可选）
   */
  drawNeonBorder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string = this.colors.primary,
    cornerSize: number = 20
  ): void {
    ctx.save();

    // 绘制多层边框实现霓虹发光效果
    // 外层发光（最模糊）
    this.drawBorderLayer(ctx, x, y, width, height, color, 0.2, 6, cornerSize);
    // 中层发光
    this.drawBorderLayer(ctx, x, y, width, height, color, 0.4, 4, cornerSize);
    // 内层发光
    this.drawBorderLayer(ctx, x, y, width, height, color, 0.7, 2, cornerSize);
    // 核心边框
    this.drawBorderLayer(ctx, x, y, width, height, color, 1.0, 1, cornerSize);

    ctx.restore();
  }

  /**
   * 绘制单层边框（用于创建发光效果）
   */
  private drawBorderLayer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    alpha: number,
    lineWidth: number,
    cornerSize: number
  ): void {
    ctx.strokeStyle = this.addAlpha(color, alpha);
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';

    ctx.beginPath();

    // 左上角
    ctx.moveTo(x + cornerSize, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + cornerSize);

    // 右上角
    ctx.moveTo(x + width - cornerSize, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + cornerSize);

    // 右下角
    ctx.moveTo(x + width, y + height - cornerSize);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width - cornerSize, y + height);

    // 左下角
    ctx.moveTo(x + cornerSize, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + height - cornerSize);

    ctx.stroke();

    // 绘制角落装饰线
    if (cornerSize > 10) {
      ctx.beginPath();
      const offset = cornerSize * 0.4;
      
      // 左上
      ctx.moveTo(x + offset, y);
      ctx.lineTo(x + offset, y + offset);
      ctx.lineTo(x, y + offset);
      
      // 右上
      ctx.moveTo(x + width - offset, y);
      ctx.lineTo(x + width - offset, y + offset);
      ctx.lineTo(x + width, y + offset);
      
      // 右下
      ctx.moveTo(x + width - offset, y + height);
      ctx.lineTo(x + width - offset, y + height - offset);
      ctx.lineTo(x + width, y + height - offset);
      
      // 左下
      ctx.moveTo(x + offset, y + height);
      ctx.lineTo(x + offset, y + height - offset);
      ctx.lineTo(x, y + height - offset);
      
      ctx.stroke();
    }
  }

  /**
   * 绘制发光文字
   * 需求: 9.4 - 发光效果
   * 需求: 9.5 - 使用等宽字体或未来感字体
   * @param ctx Canvas 渲染上下文
   * @param text 文字内容
   * @param x X 坐标
   * @param y Y 坐标
   * @param fontSize 字体大小
   * @param color 文字颜色（可选，默认使用文字色）
   * @param fontFamily 字体族（可选，默认使用主字体）
   * @param align 文字对齐方式（可选）
   */
  drawGlowText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    fontSize: number = 24,
    color: string = this.colors.text,
    fontFamily: string = this.fonts.main,
    align: CanvasTextAlign = 'left'
  ): void {
    ctx.save();

    // 设置字体
    ctx.font = `${fontSize}px ${fontFamily}, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';

    // 绘制多层文字实现发光效果
    // 外层发光（最模糊）
    ctx.shadowBlur = this.effects.glowIntensity * 2;
    ctx.shadowColor = color;
    ctx.fillStyle = this.addAlpha(color, 0.3);
    ctx.fillText(text, x, y);

    // 中层发光
    ctx.shadowBlur = this.effects.glowIntensity;
    ctx.shadowColor = color;
    ctx.fillStyle = this.addAlpha(color, 0.6);
    ctx.fillText(text, x, y);

    // 核心文字
    ctx.shadowBlur = this.effects.glowIntensity * 0.5;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);

    ctx.restore();
  }

  /**
   * 绘制扫描线效果
   * 需求: 9.4 - 动态扫描线动画
   * @param ctx Canvas 渲染上下文
   * @param canvasWidth 画布宽度
   * @param canvasHeight 画布高度
   */
  drawScanlines(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // 更新扫描线偏移
    this.scanlineOffset += this.effects.scanlineSpeed * deltaTime;
    if (this.scanlineOffset > canvasHeight) {
      this.scanlineOffset = 0;
    }

    ctx.save();

    // 绘制水平扫描线
    const lineSpacing = 4;
    ctx.strokeStyle = this.addAlpha(this.colors.primary, 0.05);
    ctx.lineWidth = 1;

    for (let y = 0; y < canvasHeight; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    // 绘制移动的扫描线（高亮）
    const scanlineHeight = 100;
    const gradient = ctx.createLinearGradient(
      0, this.scanlineOffset - scanlineHeight / 2,
      0, this.scanlineOffset + scanlineHeight / 2
    );
    
    gradient.addColorStop(0, this.addAlpha(this.colors.primary, 0));
    gradient.addColorStop(0.5, this.addAlpha(this.colors.primary, 0.15));
    gradient.addColorStop(1, this.addAlpha(this.colors.primary, 0));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, this.scanlineOffset - scanlineHeight / 2, canvasWidth, scanlineHeight);

    ctx.restore();
  }

  /**
   * 绘制科幻按钮
   * 需求: 9.1 - 霓虹线条和几何图形
   * @param ctx Canvas 渲染上下文
   * @param text 按钮文字
   * @param x 左上角 X 坐标
   * @param y 左上角 Y 坐标
   * @param width 宽度
   * @param height 高度
   * @param isHovered 是否悬停状态
   * @param isDisabled 是否禁用状态
   */
  drawButton(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    isHovered: boolean = false,
    isDisabled: boolean = false
  ): void {
    ctx.save();

    // 确定按钮颜色
    let color = this.colors.primary;
    let alpha = 0.2;
    
    if (isDisabled) {
      color = this.colors.text;
      alpha = 0.1;
    } else if (isHovered) {
      color = this.colors.accent;
      alpha = 0.4;
    }

    // 绘制背景
    ctx.fillStyle = this.addAlpha(color, alpha);
    ctx.fillRect(x, y, width, height);

    // 绘制边框
    this.drawNeonBorder(ctx, x, y, width, height, color, 15);

    // 绘制文字
    const textColor = isDisabled ? this.addAlpha(this.colors.text, 0.3) : color;
    this.drawGlowText(
      ctx,
      text,
      x + width / 2,
      y + height / 2,
      Math.min(height * 0.4, 24),
      textColor,
      this.fonts.main,
      'center'
    );

    ctx.restore();
  }

  /**
   * 绘制进度条
   * 需求: 9.1 - 霓虹线条和几何图形
   * @param ctx Canvas 渲染上下文
   * @param x 左上角 X 坐标
   * @param y 左上角 Y 坐标
   * @param width 宽度
   * @param height 高度
   * @param progress 进度值 (0-1)
   * @param color 进度条颜色（可选）
   */
  drawProgressBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    progress: number,
    color: string = this.colors.primary
  ): void {
    ctx.save();

    // 绘制背景边框
    this.drawNeonBorder(ctx, x, y, width, height, this.addAlpha(color, 0.3), 8);

    // 绘制进度填充
    const fillWidth = Math.max(0, (width - 4) * progress);
    if (fillWidth > 0) {
      // 创建渐变填充
      const gradient = ctx.createLinearGradient(x + 2, y, x + 2 + fillWidth, y);
      gradient.addColorStop(0, this.addAlpha(color, 0.6));
      gradient.addColorStop(1, this.addAlpha(color, 0.9));

      ctx.fillStyle = gradient;
      ctx.fillRect(x + 2, y + 2, fillWidth, height - 4);

      // 添加发光效果
      ctx.shadowBlur = this.effects.glowIntensity;
      ctx.shadowColor = color;
      ctx.fillRect(x + 2, y + 2, fillWidth, height - 4);
    }

    ctx.restore();
  }

  /**
   * 为颜色添加透明度
   * @param color 十六进制颜色
   * @param alpha 透明度 (0-1)
   * @returns RGBA 颜色字符串
   */
  private addAlpha(color: string, alpha: number): string {
    // 移除 # 符号
    const hex = color.replace('#', '');
    
    // 解析 RGB 值
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * 重置扫描线动画
   */
  resetScanlineAnimation(): void {
    this.scanlineOffset = 0;
    this.lastUpdateTime = Date.now();
  }
}
