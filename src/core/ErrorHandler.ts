/**
 * 错误处理系统
 * 处理摄像头访问错误、MediaPipe 加载失败，并提供降级模式
 * 需求: 1.1
 */

import { CameraError } from '../gesture/CameraManager.js';
import { SciFiTheme } from '../ui/SciFiTheme.js';

/**
 * 错误类型
 */
export enum ErrorType {
  CAMERA_ERROR = 'CAMERA_ERROR',
  MEDIAPIPE_ERROR = 'MEDIAPIPE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  details?: string;
  canRetry: boolean;
  canUseFallback: boolean;
}

/**
 * 错误处理器回调接口
 */
export interface ErrorHandlerCallbacks {
  onRetry?: () => void;
  onUseFallback?: () => void;
  onDismiss?: () => void;
}

/**
 * 鼠标降级模式接口
 */
export interface MouseFallbackTracker {
  isActive: boolean;
  currentPosition: { x: number; y: number } | null;
  trail: Array<{ x: number; y: number; timestamp: number }>;
  isSlicing: boolean;
}

/**
 * 错误处理器类
 * 需求: 1.1 - 处理摄像头访问错误（显示友好提示）
 */
export class ErrorHandler {
  private canvas: HTMLCanvasElement;
  private theme: SciFiTheme;
  private currentError: ErrorInfo | null = null;
  private callbacks: ErrorHandlerCallbacks = {};
  private isShowingError: boolean = false;
  
  // 鼠标降级模式
  private mouseFallback: MouseFallbackTracker = {
    isActive: false,
    currentPosition: null,
    trail: [],
    isSlicing: false
  };
  
  // 按钮状态
  private retryButtonHovered: boolean = false;
  private fallbackButtonHovered: boolean = false;
  private dismissButtonHovered: boolean = false;
  
  // MediaPipe 加载进度
  private mediaPipeLoadProgress: number = 0;
  private isLoadingMediaPipe: boolean = false;
  
  // 事件处理器引用（用于移除监听器）
  private cameraErrorHandler: EventListener;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.theme = new SciFiTheme();
    
    // 创建事件处理器
    this.cameraErrorHandler = ((e: CustomEvent) => {
      this.handleCameraError(e.detail.type, e.detail.message);
    }) as EventListener;
    
    // 监听全局摄像头错误事件
    window.addEventListener('cameraError', this.cameraErrorHandler);
    
    // 设置鼠标事件监听
    this.setupMouseListeners();
  }

  /**
   * 处理摄像头错误
   * 需求: 1.1 - 处理摄像头访问错误（显示友好提示）
   */
  handleCameraError(errorType: CameraError, customMessage?: string): void {
    let message = '';
    let details = '';
    let canRetry = true;
    let canUseFallback = true;

    switch (errorType) {
      case CameraError.PERMISSION_DENIED:
        message = '摄像头权限被拒绝';
        details = '请在浏览器设置中允许访问摄像头，然后点击重试。\n或者使用鼠标模式继续游戏。';
        canRetry = true;
        canUseFallback = true;
        break;

      case CameraError.NOT_FOUND:
        message = '未找到摄像头设备';
        details = '请确保您的设备已连接摄像头。\n您可以使用鼠标模式继续游戏。';
        canRetry = true;
        canUseFallback = true;
        break;

      case CameraError.NOT_READABLE:
        message = '无法访问摄像头';
        details = '摄像头可能正被其他应用使用。\n请关闭其他使用摄像头的应用后重试。';
        canRetry = true;
        canUseFallback = true;
        break;

      case CameraError.OVERCONSTRAINED:
        message = '摄像头配置不支持';
        details = '您的摄像头不支持请求的配置。\n请尝试使用鼠标模式继续游戏。';
        canRetry = false;
        canUseFallback = true;
        break;

      case CameraError.UNKNOWN:
      default:
        message = '摄像头初始化失败';
        details = customMessage || '发生未知错误。\n请刷新页面重试或使用鼠标模式。';
        canRetry = true;
        canUseFallback = true;
        break;
    }

    this.showError({
      type: ErrorType.CAMERA_ERROR,
      message,
      details,
      canRetry,
      canUseFallback
    });
  }

  /**
   * 处理 MediaPipe 加载失败
   * 需求: 1.1 - 处理 MediaPipe 加载失败（显示加载进度和重试选项）
   */
  handleMediaPipeError(error: Error): void {
    const message = 'MediaPipe 加载失败';
    const details = `无法加载手势识别库。\n错误信息: ${error.message}\n\n请检查网络连接后重试，或使用鼠标模式继续游戏。`;

    this.showError({
      type: ErrorType.MEDIAPIPE_ERROR,
      message,
      details,
      canRetry: true,
      canUseFallback: true
    });
  }

  /**
   * 显示 MediaPipe 加载进度
   * 需求: 1.1 - 显示加载进度
   */
  showMediaPipeLoadProgress(progress: number): void {
    this.isLoadingMediaPipe = true;
    this.mediaPipeLoadProgress = Math.max(0, Math.min(1, progress));
  }

  /**
   * 隐藏 MediaPipe 加载进度
   */
  hideMediaPipeLoadProgress(): void {
    this.isLoadingMediaPipe = false;
    this.mediaPipeLoadProgress = 0;
  }

  /**
   * 显示错误消息
   * 需求: 1.1 - 显示用户友好的错误消息
   */
  showError(error: ErrorInfo): void {
    this.currentError = error;
    this.isShowingError = true;
    console.error(`[ErrorHandler] ${error.type}:`, error.message, error.details);
  }

  /**
   * 隐藏错误消息
   */
  hideError(): void {
    this.currentError = null;
    this.isShowingError = false;
  }

  /**
   * 设置错误处理回调
   */
  setCallbacks(callbacks: ErrorHandlerCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 启用降级模式（使用鼠标代替手势）
   * 需求: 1.1 - 实现降级模式（使用鼠标代替手势）
   */
  enableFallbackMode(): void {
    this.mouseFallback.isActive = true;
    this.hideError();
    console.log('[ErrorHandler] 降级模式已启用 - 使用鼠标代替手势');
  }

  /**
   * 禁用降级模式
   */
  disableFallbackMode(): void {
    this.mouseFallback.isActive = false;
    this.mouseFallback.currentPosition = null;
    this.mouseFallback.trail = [];
    this.mouseFallback.isSlicing = false;
    console.log('[ErrorHandler] 降级模式已禁用');
  }

  /**
   * 检查是否处于降级模式
   */
  isFallbackMode(): boolean {
    return this.mouseFallback.isActive;
  }

  /**
   * 获取鼠标位置（归一化坐标 0-1）
   */
  getMousePosition(): { x: number; y: number } | null {
    return this.mouseFallback.currentPosition;
  }

  /**
   * 获取鼠标轨迹
   */
  getMouseTrail(frames: number = 10): Array<{ x: number; y: number; timestamp: number }> {
    return this.mouseFallback.trail.slice(-frames);
  }

  /**
   * 检查是否正在切割（鼠标按下）
   */
  isSlicing(): boolean {
    return this.mouseFallback.isSlicing;
  }

  /**
   * 设置鼠标事件监听
   */
  private setupMouseListeners(): void {
    // 鼠标移动
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.mouseFallback.isActive) {
        // 检查是否悬停在按钮上（仅在显示错误时）
        if (this.isShowingError) {
          this.updateButtonHoverState(e);
        }
        return;
      }

      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      this.mouseFallback.currentPosition = { x, y };

      // 添加到轨迹
      if (this.mouseFallback.isSlicing) {
        this.mouseFallback.trail.push({
          x,
          y,
          timestamp: Date.now()
        });

        // 限制轨迹长度
        if (this.mouseFallback.trail.length > 20) {
          this.mouseFallback.trail.shift();
        }

        // 清理过期轨迹点（超过 300ms）
        const now = Date.now();
        this.mouseFallback.trail = this.mouseFallback.trail.filter(
          pos => now - pos.timestamp < 300
        );
      }
    });

    // 鼠标按下
    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.mouseFallback.isActive) {
        // 检查是否点击按钮（仅在显示错误时）
        if (this.isShowingError) {
          this.handleButtonClick(e);
        }
        return;
      }

      this.mouseFallback.isSlicing = true;
      this.mouseFallback.trail = [];
    });

    // 鼠标释放
    this.canvas.addEventListener('mouseup', () => {
      if (!this.mouseFallback.isActive) return;

      this.mouseFallback.isSlicing = false;
      // 保留轨迹一段时间以显示淡出效果
      setTimeout(() => {
        if (!this.mouseFallback.isSlicing) {
          this.mouseFallback.trail = [];
        }
      }, 300);
    });

    // 鼠标离开画布
    this.canvas.addEventListener('mouseleave', () => {
      if (!this.mouseFallback.isActive) return;

      this.mouseFallback.isSlicing = false;
      this.mouseFallback.currentPosition = null;
    });
  }

  /**
   * 更新按钮悬停状态
   */
  private updateButtonHoverState(e: MouseEvent): void {
    if (!this.currentError) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const buttonWidth = 300;
    const buttonHeight = 60;
    const buttonSpacing = 20;

    let buttonY = centerY + 150;

    // 检查重试按钮
    if (this.currentError.canRetry) {
      this.retryButtonHovered = this.isPointInRect(
        mouseX, mouseY,
        centerX - buttonWidth / 2, buttonY,
        buttonWidth, buttonHeight
      );
      buttonY += buttonHeight + buttonSpacing;
    }

    // 检查降级模式按钮
    if (this.currentError.canUseFallback) {
      this.fallbackButtonHovered = this.isPointInRect(
        mouseX, mouseY,
        centerX - buttonWidth / 2, buttonY,
        buttonWidth, buttonHeight
      );
      buttonY += buttonHeight + buttonSpacing;
    }

    // 检查关闭按钮
    this.dismissButtonHovered = this.isPointInRect(
      mouseX, mouseY,
      centerX - buttonWidth / 2, buttonY,
      buttonWidth, buttonHeight
    );

    // 更新鼠标样式
    if (this.retryButtonHovered || this.fallbackButtonHovered || this.dismissButtonHovered) {
      this.canvas.style.cursor = 'pointer';
    } else {
      this.canvas.style.cursor = 'default';
    }
  }

  /**
   * 处理按钮点击
   */
  private handleButtonClick(e: MouseEvent): void {
    if (!this.currentError) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const buttonWidth = 300;
    const buttonHeight = 60;
    const buttonSpacing = 20;

    let buttonY = centerY + 150;

    // 检查重试按钮
    if (this.currentError.canRetry) {
      if (this.isPointInRect(
        mouseX, mouseY,
        centerX - buttonWidth / 2, buttonY,
        buttonWidth, buttonHeight
      )) {
        this.hideError();
        if (this.callbacks.onRetry) {
          this.callbacks.onRetry();
        }
        return;
      }
      buttonY += buttonHeight + buttonSpacing;
    }

    // 检查降级模式按钮
    if (this.currentError.canUseFallback) {
      if (this.isPointInRect(
        mouseX, mouseY,
        centerX - buttonWidth / 2, buttonY,
        buttonWidth, buttonHeight
      )) {
        this.enableFallbackMode();
        if (this.callbacks.onUseFallback) {
          this.callbacks.onUseFallback();
        }
        return;
      }
      buttonY += buttonHeight + buttonSpacing;
    }

    // 检查关闭按钮
    if (this.isPointInRect(
      mouseX, mouseY,
      centerX - buttonWidth / 2, buttonY,
      buttonWidth, buttonHeight
    )) {
      this.hideError();
      if (this.callbacks.onDismiss) {
        this.callbacks.onDismiss();
      }
    }
  }

  /**
   * 检查点是否在矩形内
   */
  private isPointInRect(
    px: number, py: number,
    rx: number, ry: number,
    rw: number, rh: number
  ): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  /**
   * 渲染错误界面
   */
  render(ctx: CanvasRenderingContext2D): void {
    // 渲染 MediaPipe 加载进度
    if (this.isLoadingMediaPipe) {
      this.renderLoadProgress(ctx);
      return;
    }

    // 渲染错误消息
    if (this.isShowingError && this.currentError) {
      this.renderError(ctx);
    }

    // 渲染降级模式提示
    if (this.mouseFallback.isActive) {
      this.renderFallbackHint(ctx);
    }
  }

  /**
   * 渲染加载进度
   */
  private renderLoadProgress(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // 半透明背景
    ctx.fillStyle = 'rgba(10, 14, 39, 0.9)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 标题
    this.theme.drawGlowText(
      ctx,
      '正在加载手势识别库...',
      centerX,
      centerY - 80,
      32,
      this.theme.colors.primary,
      this.theme.fonts.main,
      'center'
    );

    // 进度条
    const progressBarWidth = 400;
    const progressBarHeight = 30;
    this.theme.drawProgressBar(
      ctx,
      centerX - progressBarWidth / 2,
      centerY - 20,
      progressBarWidth,
      progressBarHeight,
      this.mediaPipeLoadProgress,
      this.theme.colors.primary
    );

    // 进度百分比
    const percentage = Math.round(this.mediaPipeLoadProgress * 100);
    this.theme.drawGlowText(
      ctx,
      `${percentage}%`,
      centerX,
      centerY + 40,
      24,
      this.theme.colors.text,
      this.theme.fonts.mono,
      'center'
    );
  }

  /**
   * 渲染错误消息
   */
  private renderError(ctx: CanvasRenderingContext2D): void {
    if (!this.currentError) return;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // 半透明背景
    ctx.fillStyle = 'rgba(10, 14, 39, 0.95)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 错误图标（三角形警告）
    this.drawWarningIcon(ctx, centerX, centerY - 200);

    // 错误标题
    this.theme.drawGlowText(
      ctx,
      this.currentError.message,
      centerX,
      centerY - 100,
      36,
      this.theme.colors.accent,
      this.theme.fonts.main,
      'center'
    );

    // 错误详情
    if (this.currentError.details) {
      const lines = this.currentError.details.split('\n');
      let lineY = centerY - 40;
      lines.forEach(line => {
        this.theme.drawGlowText(
          ctx,
          line,
          centerX,
          lineY,
          18,
          this.theme.colors.text,
          this.theme.fonts.mono,
          'center'
        );
        lineY += 30;
      });
    }

    // 按钮
    const buttonWidth = 300;
    const buttonHeight = 60;
    const buttonSpacing = 20;
    let buttonY = centerY + 150;

    // 重试按钮
    if (this.currentError.canRetry) {
      this.theme.drawButton(
        ctx,
        '重试',
        centerX - buttonWidth / 2,
        buttonY,
        buttonWidth,
        buttonHeight,
        this.retryButtonHovered
      );
      buttonY += buttonHeight + buttonSpacing;
    }

    // 降级模式按钮
    if (this.currentError.canUseFallback) {
      this.theme.drawButton(
        ctx,
        '使用鼠标模式',
        centerX - buttonWidth / 2,
        buttonY,
        buttonWidth,
        buttonHeight,
        this.fallbackButtonHovered
      );
      buttonY += buttonHeight + buttonSpacing;
    }

    // 关闭按钮
    this.theme.drawButton(
      ctx,
      '关闭',
      centerX - buttonWidth / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      this.dismissButtonHovered
    );
  }

  /**
   * 绘制警告图标
   */
  private drawWarningIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const size = 60;

    ctx.save();

    // 三角形外框
    ctx.strokeStyle = this.theme.colors.accent;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.theme.colors.accent;

    ctx.beginPath();
    ctx.moveTo(x, y - size / 2);
    ctx.lineTo(x - size / 2, y + size / 2);
    ctx.lineTo(x + size / 2, y + size / 2);
    ctx.closePath();
    ctx.stroke();

    // 感叹号
    ctx.fillStyle = this.theme.colors.accent;
    ctx.shadowBlur = 10;

    // 感叹号上部
    ctx.fillRect(x - 3, y - 15, 6, 20);

    // 感叹号下部（点）
    ctx.beginPath();
    ctx.arc(x, y + 15, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * 渲染降级模式提示
   */
  private renderFallbackHint(ctx: CanvasRenderingContext2D): void {
    const padding = 20;
    const hintText = '鼠标模式 - 按住鼠标左键并移动来切割水果';

    // 绘制提示框
    const textWidth = ctx.measureText(hintText).width;
    const boxWidth = textWidth + 40;
    const boxHeight = 50;
    const boxX = this.canvas.width - boxWidth - padding;
    const boxY = padding;

    // 半透明背景
    ctx.fillStyle = 'rgba(10, 14, 39, 0.8)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // 边框
    this.theme.drawNeonBorder(
      ctx,
      boxX,
      boxY,
      boxWidth,
      boxHeight,
      this.theme.colors.secondary,
      10
    );

    // 提示文字
    this.theme.drawGlowText(
      ctx,
      hintText,
      boxX + boxWidth / 2,
      boxY + boxHeight / 2,
      16,
      this.theme.colors.secondary,
      this.theme.fonts.mono,
      'center'
    );
  }

  /**
   * 更新（用于动画）
   */
  update(): void {
    // 可以在这里添加动画逻辑
  }

  /**
   * 检查是否正在显示错误
   */
  isShowingErrorMessage(): boolean {
    return this.isShowingError;
  }

  /**
   * 销毁错误处理器
   */
  destroy(): void {
    this.hideError();
    this.disableFallbackMode();
    window.removeEventListener('cameraError', this.cameraErrorHandler);
  }
}
