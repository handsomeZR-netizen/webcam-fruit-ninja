/**
 * 摄像头预览界面
 * 需求: 5.1, 5.2, 5.3, 5.4
 * 
 * 显示摄像头视频流预览，绘制手部检测状态指示器，实现开始游戏按钮
 */

import { SciFiTheme } from './SciFiTheme.js';
import { CameraManager } from '../gesture/CameraManager.js';
import { GestureTracker } from '../gesture/GestureTracker.js';

/**
 * 摄像头预览回调接口
 */
export interface CameraPreviewCallbacks {
  onStartGame?: () => void;
  onBackToMenu?: () => void;
  onCameraReady?: () => void;
  onCameraError?: (error: string) => void;
  onButtonHover?: () => void;
  onButtonClick?: () => void;
}

/**
 * 摄像头预览界面类
 * 需求: 5.1 - WHEN 玩家首次启动游戏时，THE 游戏系统 SHALL 显示摄像头预览界面
 */
export class CameraPreview {
  private theme: SciFiTheme;
  private canvas: HTMLCanvasElement;
  private callbacks: CameraPreviewCallbacks;
  private cameraManager: CameraManager | null = null;
  private gestureTracker: GestureTracker | null = null;
  
  // 状态
  private isInitializing: boolean = false;
  private isReady: boolean = false;
  private errorMessage: string = '';
  
  // 按钮状态
  private startButton = {
    x: 0,
    y: 0,
    width: 400,
    height: 80,
    isHovered: false,
    isEnabled: false
  };
  
  private backButton = {
    x: 0,
    y: 0,
    width: 200,
    height: 60,
    isHovered: false
  };
  
  // 动画
  private pulsePhase: number = 0;
  private lastUpdateTime: number = 0;
  
  // 视频预览位置和尺寸
  private previewRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };

  constructor(canvas: HTMLCanvasElement, callbacks: CameraPreviewCallbacks = {}) {
    this.canvas = canvas;
    this.theme = new SciFiTheme();
    this.callbacks = callbacks;
    this.lastUpdateTime = Date.now();
    
    // 计算布局
    this.calculateLayout();
    
    // 绑定鼠标事件
    this.bindMouseEvents();
  }

  /**
   * 计算界面布局
   */
  private calculateLayout(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // 视频预览区域（16:9 比例）
    const previewWidth = Math.min(this.canvas.width * 0.6, 960);
    const previewHeight = previewWidth * 9 / 16;
    
    this.previewRect = {
      x: centerX - previewWidth / 2,
      y: centerY - previewHeight / 2 - 80,
      width: previewWidth,
      height: previewHeight
    };
    
    // 开始游戏按钮
    this.startButton.x = centerX - this.startButton.width / 2;
    this.startButton.y = this.previewRect.y + this.previewRect.height + 60;
    
    // 返回按钮
    this.backButton.x = 50;
    this.backButton.y = 50;
  }

  /**
   * 绑定鼠标事件
   */
  private bindMouseEvents(): void {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      
      // 检查开始按钮悬停
      const wasStartHovered = this.startButton.isHovered;
      this.startButton.isHovered = this.isPointInRect(
        mouseX, mouseY,
        this.startButton.x, this.startButton.y,
        this.startButton.width, this.startButton.height
      );
      
      // 触发悬停音效
      if (this.startButton.isHovered && !wasStartHovered && this.startButton.isEnabled) {
        if (this.callbacks.onButtonHover) {
          this.callbacks.onButtonHover();
        }
      }
      
      // 检查返回按钮悬停
      const wasBackHovered = this.backButton.isHovered;
      this.backButton.isHovered = this.isPointInRect(
        mouseX, mouseY,
        this.backButton.x, this.backButton.y,
        this.backButton.width, this.backButton.height
      );
      
      // 触发悬停音效
      if (this.backButton.isHovered && !wasBackHovered) {
        if (this.callbacks.onButtonHover) {
          this.callbacks.onButtonHover();
        }
      }
      
      // 更新鼠标样式
      const hasHover = (this.startButton.isHovered && this.startButton.isEnabled) || 
                       this.backButton.isHovered;
      this.canvas.style.cursor = hasHover ? 'pointer' : 'default';
    });
    
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      
      // 检查开始按钮点击
      if (this.startButton.isEnabled && this.isPointInRect(
        mouseX, mouseY,
        this.startButton.x, this.startButton.y,
        this.startButton.width, this.startButton.height
      )) {
        if (this.callbacks.onButtonClick) {
          this.callbacks.onButtonClick();
        }
        if (this.callbacks.onStartGame) {
          this.callbacks.onStartGame();
        }
      }
      
      // 检查返回按钮点击
      if (this.isPointInRect(
        mouseX, mouseY,
        this.backButton.x, this.backButton.y,
        this.backButton.width, this.backButton.height
      )) {
        if (this.callbacks.onButtonClick) {
          this.callbacks.onButtonClick();
        }
        if (this.callbacks.onBackToMenu) {
          this.callbacks.onBackToMenu();
        }
      }
    });
  }

  /**
   * 检查点是否在矩形内
   */
  private isPointInRect(
    x: number, y: number,
    rectX: number, rectY: number,
    rectWidth: number, rectHeight: number
  ): boolean {
    return x >= rectX && x <= rectX + rectWidth &&
           y >= rectY && y <= rectY + rectHeight;
  }

  /**
   * 初始化摄像头和手势追踪
   * 需求: 5.1 - THE 游戏系统 SHALL 显示摄像头预览界面
   */
  async initializeCamera(cameraManager: CameraManager, gestureTracker: GestureTracker): Promise<void> {
    this.isInitializing = true;
    this.errorMessage = '';
    this.cameraManager = cameraManager;
    this.gestureTracker = gestureTracker;
    
    try {
      // 初始化摄像头
      await cameraManager.initialize();
      
      // 检查摄像头是否就绪
      if (!cameraManager.isReady()) {
        throw new Error('摄像头初始化失败');
      }
      
      this.isReady = true;
      this.isInitializing = false;
      
      if (this.callbacks.onCameraReady) {
        this.callbacks.onCameraReady();
      }
      
      console.log('摄像头预览已就绪');
    } catch (error) {
      this.isInitializing = false;
      this.isReady = false;
      this.errorMessage = error instanceof Error ? error.message : '摄像头初始化失败';
      
      if (this.callbacks.onCameraError) {
        this.callbacks.onCameraError(this.errorMessage);
      }
      
      console.error('摄像头初始化错误:', error);
    }
  }

  /**
   * 更新动画状态
   */
  update(): void {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;
    
    // 更新脉冲动画
    this.pulsePhase += deltaTime * 3; // 3 Hz 频率
    if (this.pulsePhase > Math.PI * 2) {
      this.pulsePhase -= Math.PI * 2;
    }
    
    // 更新开始按钮状态
    // 需求: 5.4 - THE 游戏系统 SHALL 提供开始游戏按钮，仅在手部检测成功后启用
    if (this.gestureTracker && this.isReady) {
      this.startButton.isEnabled = this.gestureTracker.isHandDetected();
    } else {
      this.startButton.isEnabled = false;
    }
  }

  /**
   * 渲染摄像头预览界面
   */
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // 渲染标题
    this.renderTitle(ctx);
    
    // 渲染视频预览
    this.renderVideoPreview(ctx);
    
    // 渲染手部检测状态指示器
    this.renderHandDetectionIndicator(ctx);
    
    // 渲染状态信息
    this.renderStatusInfo(ctx);
    
    // 渲染按钮
    this.renderButtons(ctx);
    
    // 渲染错误信息
    if (this.errorMessage) {
      this.renderError(ctx);
    }
    
    ctx.restore();
  }

  /**
   * 渲染标题
   */
  private renderTitle(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const titleY = 100;
    
    this.theme.drawGlowText(
      ctx,
      '摄像头校准',
      centerX,
      titleY,
      48,
      this.theme.colors.primary,
      this.theme.fonts.main,
      'center'
    );
    
    // 副标题
    this.theme.drawGlowText(
      ctx,
      'CAMERA CALIBRATION',
      centerX,
      titleY + 50,
      20,
      this.theme.colors.secondary,
      this.theme.fonts.mono,
      'center'
    );
  }

  /**
   * 渲染视频预览
   * 需求: 5.1 - 显示摄像头视频流预览
   */
  private renderVideoPreview(ctx: CanvasRenderingContext2D): void {
    const { x, y, width, height } = this.previewRect;
    
    // 绘制预览边框
    this.theme.drawNeonBorder(
      ctx,
      x - 5,
      y - 5,
      width + 10,
      height + 10,
      this.theme.colors.primary,
      30
    );
    
    // 绘制视频流
    if (this.cameraManager && this.isReady) {
      const videoElement = this.cameraManager.getVideoElement();
      
      if (videoElement && videoElement.readyState >= 2) {
        // 计算视频缩放以适应预览区域（保持宽高比）
        const videoAspect = videoElement.videoWidth / videoElement.videoHeight;
        const previewAspect = width / height;
        
        let drawWidth = width;
        let drawHeight = height;
        
        if (videoAspect > previewAspect) {
          // 视频更宽，以高度为准
          drawWidth = height * videoAspect;
        } else {
          // 视频更高，以宽度为准
          drawHeight = width / videoAspect;
        }
        
        // 裁剪区域
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
        
        // 绘制视频（镜像翻转）
        ctx.translate(x + width, y);
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, 0, 0, drawWidth, drawHeight);
        
        ctx.restore();
      }
    } else {
      // 显示占位符
      ctx.fillStyle = this.addAlpha(this.theme.colors.background, 0.8);
      ctx.fillRect(x, y, width, height);
      
      // 显示加载文字
      const loadingText = this.isInitializing ? '正在初始化摄像头...' : '等待摄像头';
      this.theme.drawGlowText(
        ctx,
        loadingText,
        x + width / 2,
        y + height / 2,
        24,
        this.theme.colors.text,
        this.theme.fonts.mono,
        'center'
      );
    }
  }

  /**
   * 渲染手部检测状态指示器
   * 需求: 5.2 - THE 游戏系统 SHALL 在摄像头预览界面上显示手部检测状态指示器
   * 需求: 5.3 - WHEN 手势识别模块成功检测到手部时，THE 游戏系统 SHALL 显示绿色指示器
   */
  private renderHandDetectionIndicator(ctx: CanvasRenderingContext2D): void {
    const { x, y, width } = this.previewRect;
    
    // 指示器位置（预览框右上角）
    const indicatorX = x + width - 80;
    const indicatorY = y + 30;
    const indicatorSize = 50;
    
    // 确定指示器颜色和状态
    let color = this.theme.colors.text;
    let statusText = '未检测';
    let isDetected = false;
    
    if (this.gestureTracker && this.isReady) {
      isDetected = this.gestureTracker.isHandDetected();
      
      if (isDetected) {
        // 需求: 5.3 - 显示绿色指示器
        color = '#00FF00'; // 绿色
        statusText = '已检测';
      } else {
        color = '#FF0000'; // 红色
        statusText = '未检测';
      }
    }
    
    // 绘制指示器圆圈
    ctx.save();
    
    // 外圈发光
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, indicatorSize / 2, 0, Math.PI * 2);
    ctx.stroke();
    
    // 内圈填充（带脉冲效果）
    if (isDetected) {
      const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8;
      ctx.fillStyle = this.addAlpha(color, pulse * 0.6);
    } else {
      ctx.fillStyle = this.addAlpha(color, 0.3);
    }
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, indicatorSize / 2 - 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // 绘制状态文字
    this.theme.drawGlowText(
      ctx,
      statusText,
      indicatorX,
      indicatorY + indicatorSize / 2 + 25,
      16,
      color,
      this.theme.fonts.mono,
      'center'
    );
  }

  /**
   * 渲染状态信息
   */
  private renderStatusInfo(ctx: CanvasRenderingContext2D): void {
    const { x, y, width, height } = this.previewRect;
    const infoY = y + height + 20;
    
    let infoText = '';
    let infoColor = this.theme.colors.text;
    
    if (this.isInitializing) {
      infoText = '正在初始化摄像头，请稍候...';
      infoColor = this.theme.colors.secondary;
    } else if (!this.isReady) {
      infoText = '请允许浏览器访问摄像头';
      infoColor = this.theme.colors.accent;
    } else if (this.gestureTracker && !this.gestureTracker.isHandDetected()) {
      infoText = '请将手放在摄像头前，确保手部清晰可见';
      infoColor = this.theme.colors.secondary;
    } else {
      infoText = '手部检测成功！点击下方按钮开始游戏';
      infoColor = '#00FF00';
    }
    
    this.theme.drawGlowText(
      ctx,
      infoText,
      x + width / 2,
      infoY,
      18,
      infoColor,
      this.theme.fonts.mono,
      'center'
    );
  }

  /**
   * 渲染按钮
   */
  private renderButtons(ctx: CanvasRenderingContext2D): void {
    // 渲染开始游戏按钮
    // 需求: 5.4 - 提供开始游戏按钮，仅在手部检测成功后启用
    this.theme.drawButton(
      ctx,
      '开始游戏',
      this.startButton.x,
      this.startButton.y,
      this.startButton.width,
      this.startButton.height,
      this.startButton.isHovered,
      !this.startButton.isEnabled
    );
    
    // 渲染返回按钮
    this.theme.drawButton(
      ctx,
      '返回',
      this.backButton.x,
      this.backButton.y,
      this.backButton.width,
      this.backButton.height,
      this.backButton.isHovered,
      false
    );
  }

  /**
   * 渲染错误信息
   */
  private renderError(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // 半透明背景
    ctx.fillStyle = this.addAlpha(this.theme.colors.background, 0.9);
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 错误标题
    this.theme.drawGlowText(
      ctx,
      '摄像头错误',
      centerX,
      centerY - 50,
      36,
      this.theme.colors.accent,
      this.theme.fonts.main,
      'center'
    );
    
    // 错误信息
    this.theme.drawGlowText(
      ctx,
      this.errorMessage,
      centerX,
      centerY + 20,
      20,
      this.theme.colors.text,
      this.theme.fonts.mono,
      'center'
    );
    
    // 提示信息
    this.theme.drawGlowText(
      ctx,
      '请检查浏览器权限设置或点击返回按钮',
      centerX,
      centerY + 70,
      16,
      this.addAlpha(this.theme.colors.text, 0.7),
      this.theme.fonts.mono,
      'center'
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
   * 清理资源
   */
  destroy(): void {
    this.canvas.style.cursor = 'default';
    this.cameraManager = null;
    this.gestureTracker = null;
  }
}
