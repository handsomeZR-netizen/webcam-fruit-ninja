/**
 * 手势追踪器
 * 使用 MediaPipe Hands 追踪手部位置和移动
 * 需求: 1.2, 1.3, 1.4
 */

import { GameConfig } from '../core/GameConfig';

/**
 * 手部位置接口
 */
export interface HandPosition {
  x: number;  // 归一化坐标 0-1
  y: number;  // 归一化坐标 0-1
  z: number;  // 深度信息
  timestamp: number;  // 时间戳（毫秒）
}

/**
 * 手势事件回调类型
 */
export type HandDetectedCallback = (position: HandPosition) => void;
export type HandLostCallback = () => void;
export type SliceGestureCallback = (startPos: HandPosition, endPos: HandPosition, velocity: number) => void;

/**
 * 手势追踪器接口
 */
export interface IGestureTracker {
  initialize(videoElement: HTMLVideoElement, config: GameConfig): Promise<void>;
  startTracking(): void;
  stopTracking(): void;
  getCurrentHandPosition(): HandPosition | null;
  getHandTrail(frames?: number): HandPosition[];
  detectSliceGesture(): boolean;
  onHandDetected(callback: HandDetectedCallback): void;
  onHandLost(callback: HandLostCallback): void;
  onSliceGesture(callback: SliceGestureCallback): void;
}

/**
 * 手势追踪器实现
 */
export class GestureTracker implements IGestureTracker {
  private hands: any = null;  // MediaPipe Hands 实例
  private videoElement: HTMLVideoElement | null = null;
  private config: GameConfig | null = null;
  
  // 手部位置追踪
  private currentHandPosition: HandPosition | null = null;
  private handTrail: HandPosition[] = [];
  private isTracking: boolean = false;
  private handDetected: boolean = false;
  
  // 回调函数
  private handDetectedCallbacks: HandDetectedCallback[] = [];
  private handLostCallbacks: HandLostCallback[] = [];
  private sliceGestureCallbacks: SliceGestureCallback[] = [];
  
  // 动画帧 ID
  private animationFrameId: number | null = null;

  /**
   * 初始化 MediaPipe Hands
   * 需求: 1.2 - WHEN 用户授权摄像头访问后，THE 手势识别模块 SHALL 在 100 毫秒内开始捕捉视频流
   */
  async initialize(videoElement: HTMLVideoElement, config: GameConfig): Promise<void> {
    this.videoElement = videoElement;
    this.config = config;

    try {
      // 检查 MediaPipe Hands 是否已加载
      if (typeof window.Hands === 'undefined') {
        throw new Error('MediaPipe Hands 库未加载。请确保已引入相关脚本。');
      }

      // 创建 MediaPipe Hands 实例
      this.hands = new window.Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      // 配置 MediaPipe Hands
      this.hands.setOptions({
        maxNumHands: 1,  // 只追踪一只手
        modelComplexity: 1,  // 模型复杂度 (0, 1, 2)
        minDetectionConfidence: 0.5,  // 最小检测置信度
        minTrackingConfidence: 0.5  // 最小追踪置信度
      });

      // 设置结果回调
      this.hands.onResults((results: any) => {
        this.processResults(results);
      });

      // 初始化完成
      console.log('GestureTracker 初始化成功');
    } catch (error) {
      console.error('GestureTracker 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 开始追踪
   * 需求: 1.2 - THE 手势识别模块 SHALL 在 100 毫秒内开始捕捉视频流
   */
  startTracking(): void {
    if (!this.hands || !this.videoElement) {
      console.error('GestureTracker 未初始化');
      return;
    }

    if (this.isTracking) {
      console.warn('GestureTracker 已在追踪中');
      return;
    }

    this.isTracking = true;
    this.processFrame();
    console.log('GestureTracker 开始追踪');
  }

  /**
   * 停止追踪
   */
  stopTracking(): void {
    this.isTracking = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    console.log('GestureTracker 停止追踪');
  }

  /**
   * 获取当前手部位置（食指尖端）
   * 需求: 1.3 - WHEN 手势识别模块检测到手部移动时，THE 游戏系统 SHALL 在屏幕上显示手部轨迹的视觉反馈
   */
  getCurrentHandPosition(): HandPosition | null {
    return this.currentHandPosition;
  }

  /**
   * 获取手部移动轨迹（最近 N 帧）
   * 需求: 1.3 - 实现手部轨迹记录（保存最近 N 帧位置）
   */
  getHandTrail(frames?: number): HandPosition[] {
    const trailLength = frames || this.config?.handTrailLength || 10;
    return this.handTrail.slice(-trailLength);
  }

  /**
   * 检测是否有快速挥动动作（切割手势）
   * 需求: 1.4 - WHEN 手部轨迹与水果对象相交时，THE 游戏引擎 SHALL 触发切割动作并播放切割效果
   */
  detectSliceGesture(): boolean {
    if (this.handTrail.length < 2) {
      return false;
    }

    // 获取最近的两个位置
    const current = this.handTrail[this.handTrail.length - 1];
    const previous = this.handTrail[this.handTrail.length - 2];

    // 计算时间差（秒）
    const deltaTime = (current.timestamp - previous.timestamp) / 1000;
    
    if (deltaTime <= 0) {
      return false;
    }

    // 计算距离（像素）
    const canvasWidth = this.config?.canvasWidth || 1920;
    const canvasHeight = this.config?.canvasHeight || 1080;
    
    const dx = (current.x - previous.x) * canvasWidth;
    const dy = (current.y - previous.y) * canvasHeight;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 计算速度（px/s）
    const velocity = distance / deltaTime;

    // 检查是否超过阈值
    const threshold = this.config?.sliceVelocityThreshold || 500;
    const isSlice = velocity > threshold;

    // 触发切割手势回调
    if (isSlice) {
      this.sliceGestureCallbacks.forEach(callback => {
        callback(previous, current, velocity);
      });
    }

    return isSlice;
  }

  /**
   * 注册手部检测回调
   * 需求: 1.2 - 添加手势事件回调机制
   */
  onHandDetected(callback: HandDetectedCallback): void {
    this.handDetectedCallbacks.push(callback);
  }

  /**
   * 注册手部丢失回调
   */
  onHandLost(callback: HandLostCallback): void {
    this.handLostCallbacks.push(callback);
  }

  /**
   * 注册切割手势回调
   */
  onSliceGesture(callback: SliceGestureCallback): void {
    this.sliceGestureCallbacks.push(callback);
  }

  /**
   * 获取视频元素（用于显示摄像头预览）
   */
  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  /**
   * 处理每一帧
   */
  private async processFrame(): Promise<void> {
    if (!this.isTracking || !this.videoElement || !this.hands) {
      return;
    }

    try {
      // 发送视频帧到 MediaPipe
      await this.hands.send({ image: this.videoElement });
    } catch (error) {
      console.error('处理视频帧失败:', error);
    }

    // 继续处理下一帧
    if (this.isTracking) {
      this.animationFrameId = requestAnimationFrame(() => this.processFrame());
    }
  }

  /**
   * 处理 MediaPipe 结果
   * 需求: 1.2 - 实现手部关键点检测（获取食指尖端位置）
   */
  private processResults(results: any): void {
    const wasHandDetected = this.handDetected;

    // 检查是否检测到手部
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      this.handDetected = true;
      
      // 获取第一只手的关键点
      const landmarks = results.multiHandLandmarks[0];
      
      // 食指尖端是第 8 个关键点
      // MediaPipe Hands 关键点索引: https://google.github.io/mediapipe/solutions/hands.html
      const indexFingerTip = landmarks[8];
      
      // 创建手部位置对象
      // 注意：水平翻转 x 坐标，让摄像头像镜子一样工作
      const handPosition: HandPosition = {
        x: 1 - indexFingerTip.x,  // 水平翻转：归一化坐标 0-1
        y: indexFingerTip.y,  // 归一化坐标 0-1
        z: indexFingerTip.z,  // 深度信息
        timestamp: Date.now()
      };

      // 更新当前位置
      this.currentHandPosition = handPosition;

      // 添加到轨迹
      this.handTrail.push(handPosition);

      // 限制轨迹长度
      const maxTrailLength = (this.config?.handTrailLength || 10) * 2;  // 保留更多帧用于速度计算
      if (this.handTrail.length > maxTrailLength) {
        this.handTrail.shift();
      }

      // 清理过期的轨迹点（超过淡出时间）
      const fadeTime = this.config?.handTrailFadeTime || 300;
      const now = Date.now();
      this.handTrail = this.handTrail.filter(pos => now - pos.timestamp < fadeTime * 2);

      // 触发手部检测回调
      if (!wasHandDetected) {
        this.handDetectedCallbacks.forEach(callback => {
          callback(handPosition);
        });
      }

      // 检测切割手势
      this.detectSliceGesture();
    } else {
      // 未检测到手部
      this.handDetected = false;
      this.currentHandPosition = null;

      // 触发手部丢失回调
      if (wasHandDetected) {
        this.handLostCallbacks.forEach(callback => {
          callback();
        });
      }

      // 清空轨迹（可选：保留一段时间以显示淡出效果）
      // this.handTrail = [];
    }
  }

  /**
   * 清空手部轨迹
   */
  clearTrail(): void {
    this.handTrail = [];
  }

  /**
   * 获取手部检测状态
   * 需求: 5.2 - THE 游戏系统 SHALL 在摄像头预览界面上显示手部检测状态指示器
   */
  isHandDetected(): boolean {
    return this.handDetected;
  }

  /**
   * 销毁追踪器
   */
  destroy(): void {
    this.stopTracking();
    
    if (this.hands) {
      this.hands.close();
      this.hands = null;
    }

    this.videoElement = null;
    this.config = null;
    this.currentHandPosition = null;
    this.handTrail = [];
    this.handDetectedCallbacks = [];
    this.handLostCallbacks = [];
    this.sliceGestureCallbacks = [];
  }
}

/**
 * 全局类型声明（用于 MediaPipe）
 */
declare global {
  interface Window {
    Hands: any;
  }
}
