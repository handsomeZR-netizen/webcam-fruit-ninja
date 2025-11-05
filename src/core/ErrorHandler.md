# ErrorHandler - 错误处理系统

错误处理系统负责处理摄像头访问错误、MediaPipe 加载失败，并提供鼠标降级模式。

## 功能特性

### 1. 摄像头错误处理
- 权限被拒绝
- 设备未找到
- 设备不可读（被其他应用占用）
- 配置不支持
- 未知错误

### 2. MediaPipe 加载管理
- 显示加载进度条
- 处理加载失败
- 提供重试选项

### 3. 降级模式（鼠标输入）
- 使用鼠标代替手势识别
- 鼠标轨迹追踪
- 切割手势检测（鼠标按下并移动）

### 4. 用户友好的错误界面
- 科幻风格的错误提示
- 清晰的错误信息和解决方案
- 交互式按钮（重试、使用鼠标模式、关闭）

## 使用示例

### 基本使用

```typescript
import { ErrorHandler } from './core/ErrorHandler.js';

// 创建错误处理器
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const errorHandler = new ErrorHandler(canvas);

// 设置回调
errorHandler.setCallbacks({
  onRetry: () => {
    console.log('用户点击重试');
    // 重新初始化摄像头
    initializeCamera();
  },
  onUseFallback: () => {
    console.log('用户选择使用鼠标模式');
    // 启动游戏（使用鼠标输入）
    startGameWithMouseInput();
  },
  onDismiss: () => {
    console.log('用户关闭错误提示');
    // 返回主菜单
    showMainMenu();
  }
});

// 在游戏循环中渲染
function gameLoop() {
  // ... 其他渲染逻辑
  
  errorHandler.update();
  errorHandler.render(ctx);
  
  requestAnimationFrame(gameLoop);
}
```

### 处理摄像头错误

```typescript
import { CameraManager, CameraError } from './gesture/CameraManager.js';

async function initializeCamera() {
  const cameraManager = new CameraManager();
  
  try {
    await cameraManager.initialize();
    console.log('摄像头初始化成功');
  } catch (error) {
    // CameraManager 会自动触发 'cameraError' 事件
    // ErrorHandler 会自动捕获并显示错误
    console.error('摄像头初始化失败:', error);
  }
}
```

### 显示 MediaPipe 加载进度

```typescript
async function loadMediaPipe() {
  // 显示加载进度
  errorHandler.showMediaPipeLoadProgress(0);
  
  try {
    // 模拟加载过程
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      errorHandler.showMediaPipeLoadProgress(i / 100);
    }
    
    // 加载完成
    errorHandler.hideMediaPipeLoadProgress();
    console.log('MediaPipe 加载成功');
  } catch (error) {
    // 处理加载失败
    errorHandler.handleMediaPipeError(error as Error);
  }
}
```

### 使用降级模式（鼠标输入）

```typescript
// 检查是否处于降级模式
if (errorHandler.isFallbackMode()) {
  // 获取鼠标位置（归一化坐标 0-1）
  const mousePos = errorHandler.getMousePosition();
  
  if (mousePos) {
    console.log('鼠标位置:', mousePos);
  }
  
  // 获取鼠标轨迹
  const trail = errorHandler.getMouseTrail(10);
  
  // 检查是否正在切割（鼠标按下）
  if (errorHandler.isSlicing()) {
    console.log('正在切割！');
    
    // 使用轨迹进行碰撞检测
    const slicedObjects = collisionDetector.checkSliceCollision(
      trail.map(pos => ({
        x: pos.x,
        y: pos.y,
        z: 0,
        timestamp: pos.timestamp
      })),
      gameObjects
    );
  }
}
```

### 手动触发错误

```typescript
// 手动显示摄像头错误
errorHandler.handleCameraError(CameraError.PERMISSION_DENIED);

// 手动显示 MediaPipe 错误
errorHandler.handleMediaPipeError(new Error('网络连接失败'));

// 手动显示自定义错误
errorHandler.showError({
  type: ErrorType.UNKNOWN_ERROR,
  message: '发生未知错误',
  details: '请刷新页面重试',
  canRetry: true,
  canUseFallback: false
});
```

## API 参考

### 构造函数

```typescript
constructor(canvas: HTMLCanvasElement)
```

### 方法

#### handleCameraError(errorType, customMessage?)
处理摄像头错误并显示友好提示。

**参数:**
- `errorType: CameraError` - 错误类型
- `customMessage?: string` - 自定义错误消息（可选）

#### handleMediaPipeError(error)
处理 MediaPipe 加载失败。

**参数:**
- `error: Error` - 错误对象

#### showMediaPipeLoadProgress(progress)
显示 MediaPipe 加载进度。

**参数:**
- `progress: number` - 进度值（0-1）

#### hideMediaPipeLoadProgress()
隐藏 MediaPipe 加载进度。

#### showError(error)
显示自定义错误消息。

**参数:**
- `error: ErrorInfo` - 错误信息对象

#### hideError()
隐藏错误消息。

#### setCallbacks(callbacks)
设置错误处理回调。

**参数:**
- `callbacks: ErrorHandlerCallbacks` - 回调对象
  - `onRetry?: () => void` - 重试回调
  - `onUseFallback?: () => void` - 使用降级模式回调
  - `onDismiss?: () => void` - 关闭回调

#### enableFallbackMode()
启用降级模式（使用鼠标代替手势）。

#### disableFallbackMode()
禁用降级模式。

#### isFallbackMode()
检查是否处于降级模式。

**返回:** `boolean`

#### getMousePosition()
获取鼠标位置（归一化坐标 0-1）。

**返回:** `{ x: number; y: number } | null`

#### getMouseTrail(frames?)
获取鼠标轨迹。

**参数:**
- `frames?: number` - 轨迹帧数（默认 10）

**返回:** `Array<{ x: number; y: number; timestamp: number }>`

#### isSlicing()
检查是否正在切割（鼠标按下）。

**返回:** `boolean`

#### render(ctx)
渲染错误界面。

**参数:**
- `ctx: CanvasRenderingContext2D` - Canvas 渲染上下文

#### update()
更新错误处理器（用于动画）。

#### isShowingErrorMessage()
检查是否正在显示错误。

**返回:** `boolean`

#### destroy()
销毁错误处理器。

## 类型定义

### ErrorType
```typescript
enum ErrorType {
  CAMERA_ERROR = 'CAMERA_ERROR',
  MEDIAPIPE_ERROR = 'MEDIAPIPE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

### ErrorInfo
```typescript
interface ErrorInfo {
  type: ErrorType;
  message: string;
  details?: string;
  canRetry: boolean;
  canUseFallback: boolean;
}
```

### ErrorHandlerCallbacks
```typescript
interface ErrorHandlerCallbacks {
  onRetry?: () => void;
  onUseFallback?: () => void;
  onDismiss?: () => void;
}
```

## 注意事项

1. **自动错误捕获**: ErrorHandler 会自动监听 `cameraError` 事件，CameraManager 会在发生错误时触发此事件。

2. **降级模式**: 启用降级模式后，ErrorHandler 会自动追踪鼠标位置和轨迹，可以直接用于碰撞检测。

3. **渲染顺序**: 确保在游戏循环的最后调用 `errorHandler.render(ctx)`，以便错误界面显示在最上层。

4. **事件清理**: 在应用关闭时调用 `errorHandler.destroy()` 以清理事件监听器。

5. **科幻风格**: 错误界面使用 SciFiTheme 渲染，与游戏整体风格保持一致。

## 需求映射

- **需求 1.1**: 处理摄像头访问错误（显示友好提示）
- **需求 1.1**: 处理 MediaPipe 加载失败（显示加载进度和重试选项）
- **需求 1.1**: 实现降级模式（使用鼠标代替手势）
