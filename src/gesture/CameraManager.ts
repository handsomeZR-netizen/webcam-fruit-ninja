/**
 * 摄像头管理器
 * 负责摄像头访问、视频流管理和错误处理
 * 需求: 1.1, 1.2, 5.1
 */

/**
 * 摄像头错误类型
 */
export enum CameraError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  NOT_READABLE = 'NOT_READABLE',
  OVERCONSTRAINED = 'OVERCONSTRAINED',
  UNKNOWN = 'UNKNOWN'
}

/**
 * 摄像头管理器接口
 */
export interface ICameraManager {
  initialize(): Promise<void>;
  getVideoStream(): MediaStream | null;
  getVideoElement(): HTMLVideoElement;
  stop(): void;
  isReady(): boolean;
}

/**
 * 摄像头管理器实现
 */
export class CameraManager implements ICameraManager {
  private videoElement: HTMLVideoElement;
  private mediaStream: MediaStream | null = null;
  private ready: boolean = false;

  constructor(videoElement?: HTMLVideoElement) {
    // 如果没有提供视频元素，创建一个新的
    if (videoElement) {
      this.videoElement = videoElement;
    } else {
      this.videoElement = document.createElement('video');
      this.videoElement.setAttribute('playsinline', ''); // iOS 支持
      this.videoElement.setAttribute('autoplay', '');
      this.videoElement.setAttribute('muted', '');
    }
  }

  /**
   * 请求摄像头权限并初始化视频流
   * 需求: 1.1 - WHEN 游戏会话启动时，THE 游戏系统 SHALL 请求用户授权访问摄像头
   */
  async initialize(): Promise<void> {
    try {
      // 检查浏览器是否支持 getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持摄像头访问');
      }

      // 请求摄像头权限
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // 前置摄像头
        },
        audio: false
      };

      // 获取视频流
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // 将视频流绑定到视频元素
      this.videoElement.srcObject = this.mediaStream;

      // 等待视频元素准备就绪
      await new Promise<void>((resolve, reject) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play()
            .then(() => {
              this.ready = true;
              resolve();
            })
            .catch(reject);
        };

        this.videoElement.onerror = () => {
          reject(new Error('视频元素加载失败'));
        };

        // 超时处理
        setTimeout(() => {
          if (!this.ready) {
            reject(new Error('摄像头初始化超时'));
          }
        }, 10000);
      });

      console.log('摄像头初始化成功');
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * 获取视频流
   * 需求: 1.2 - WHEN 用户授权摄像头访问后，THE 手势识别模块 SHALL 在 100 毫秒内开始捕捉视频流
   */
  getVideoStream(): MediaStream | null {
    return this.mediaStream;
  }

  /**
   * 获取视频元素
   */
  getVideoElement(): HTMLVideoElement {
    return this.videoElement;
  }

  /**
   * 停止摄像头
   */
  stop(): void {
    if (this.mediaStream) {
      // 停止所有视频轨道
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
      });
      this.mediaStream = null;
    }

    // 清空视频元素
    if (this.videoElement.srcObject) {
      this.videoElement.srcObject = null;
    }

    this.ready = false;
    console.log('摄像头已停止');
  }

  /**
   * 检查摄像头是否就绪
   * 需求: 5.2 - THE 游戏系统 SHALL 在摄像头预览界面上显示手部检测状态指示器
   */
  isReady(): boolean {
    return this.ready && 
           this.mediaStream !== null && 
           this.videoElement.readyState >= 2; // HAVE_CURRENT_DATA
  }

  /**
   * 处理摄像头错误
   * 需求: 1.1 - 实现错误处理（权限拒绝、设备未找到等）
   */
  private handleError(error: any): void {
    let errorType: CameraError = CameraError.UNKNOWN;
    let errorMessage = '未知错误';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // 根据错误名称判断错误类型
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorType = CameraError.PERMISSION_DENIED;
      errorMessage = '摄像头权限被拒绝。请在浏览器设置中允许访问摄像头。';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorType = CameraError.NOT_FOUND;
      errorMessage = '未找到摄像头设备。请确保您的设备已连接摄像头。';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorType = CameraError.NOT_READABLE;
      errorMessage = '无法访问摄像头。摄像头可能正被其他应用使用。';
    } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      errorType = CameraError.OVERCONSTRAINED;
      errorMessage = '摄像头不支持请求的配置。';
    }

    console.error(`摄像头错误 [${errorType}]:`, errorMessage);
    
    // 触发自定义错误事件，供外部监听
    const event = new CustomEvent('cameraError', {
      detail: { type: errorType, message: errorMessage }
    });
    window.dispatchEvent(event);
  }

  /**
   * 获取可用的摄像头设备列表
   */
  static async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('无法获取摄像头设备列表:', error);
      return [];
    }
  }

  /**
   * 检查浏览器是否支持摄像头访问
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}
