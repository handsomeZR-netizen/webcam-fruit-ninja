# 音频系统集成文档

## 概述

本文档描述了任务 7.2（集成游戏音效）的实现细节。音频系统已完全集成到游戏中，满足所有相关需求。

## 实现的功能

### 1. 音效生成系统 (SoundAssets.ts)

创建了 `SoundAssets` 类，使用 Web Audio API 生成所有游戏音效：

- **切割水果音效** (`slice`) - 需求 6.1
  - 快速下降的"嗖"声效果
  - 频率从 800Hz 降到 200Hz
  - 持续时间：150ms

- **炸弹爆炸音效** (`explosion`) - 需求 6.2
  - 低频爆炸声，混合多个频率
  - 包含白噪声增强真实感
  - 持续时间：800ms

- **UI 悬停音效** (`hover`) - 需求 9.6
  - 短促的高频"哔"声
  - 科幻风格
  - 持续时间：80ms

- **UI 点击音效** (`click`) - 需求 9.6
  - 双音调"哔哔"声
  - 科幻风格
  - 持续时间：120ms

- **游戏开始音效** (`gameStart`)
  - 上升音调，从 400Hz 升到 1200Hz
  - 持续时间：500ms

- **游戏结束音效** (`gameOver`)
  - 下降音调，从 600Hz 降到 200Hz
  - 悲伤效果
  - 持续时间：1000ms

- **错过水果音效** (`miss`)
  - 低沉的"咚"声
  - 持续时间：200ms

- **背景音乐** (`bgMusic`) - 需求 6.3
  - 8 秒循环的科幻氛围音乐
  - 使用 C 小调五声音阶
  - 音量较低，不干扰游戏

### 2. 音频管理器增强 (AudioManager.ts)

添加了 `loadSoundBuffers()` 方法，支持直接加载预生成的音频缓冲区，无需从 URL 加载文件。

### 3. 游戏事件音效集成 (main.ts)

#### 主菜单音效
- 按钮悬停：播放 `hover` 音效
- 按钮点击：播放 `click` 音效
- 所有菜单按钮（开始游戏、教程、设置）

#### 摄像头预览音效
- 按钮悬停：播放 `hover` 音效
- 按钮点击：播放 `click` 音效
- 开始游戏和返回按钮

#### 游戏内音效
- **游戏开始**：播放 `gameStart` 音效
- **背景音乐**：循环播放 `bgMusic` - 需求 6.3
- **切割水果**：播放 `slice` 音效（音量 0.8）- 需求 6.1
- **切割炸弹**：播放 `explosion` 音效（音量 1.0）- 需求 6.2
- **错过水果**：播放 `miss` 音效（音量 0.6）
- **游戏结束**：停止背景音乐，播放 `gameOver` 音效
- **暂停/恢复**：播放 `click` 音效
- **返回主菜单**：播放 `click` 音效，停止背景音乐

### 4. 摄像头预览界面音效 (CameraPreview.ts)

添加了音效回调接口：
- `onButtonHover`: 按钮悬停时触发
- `onButtonClick`: 按钮点击时触发

## 需求覆盖

### ✅ 需求 6.1
**WHEN 切割动作成功切割水果对象时，THE 游戏系统 SHALL 播放切割音效**
- 实现位置：`main.ts` - `onFruitSliced` 回调
- 音效：`slice`

### ✅ 需求 6.2
**WHEN 炸弹对象被切割时，THE 游戏系统 SHALL 播放爆炸音效**
- 实现位置：`main.ts` - `onBombSliced` 回调
- 音效：`explosion`

### ✅ 需求 6.3
**WHILE 游戏会话处于活动状态时，THE 游戏系统 SHALL 播放背景音乐**
- 实现位置：`main.ts` - `startGame()` 函数
- 音效：`bgMusic`（循环播放）

### ✅ 需求 6.4
**THE 游戏系统 SHALL 提供音量控制选项，允许玩家调整或静音音效**
- 实现位置：`AudioManager.ts`
- 方法：`setMasterVolume()`, `toggleMute()`, `setMuted()`

### ✅ 需求 4.3
**WHEN 炸弹对象被切割时，THE 游戏系统 SHALL 播放爆炸动画和音效**
- 实现位置：`main.ts` - `onBombSliced` 回调
- 音效：`explosion`

### ✅ 需求 9.6
**WHEN 玩家与UI元素交互时，THE 游戏系统 SHALL 播放科幻音效和视觉反馈动画**
- 实现位置：`main.ts`, `CameraPreview.ts`
- 音效：`hover`, `click`

## 技术实现

### Web Audio API 音效生成

所有音效都是通过 Web Audio API 程序化生成的，无需外部音频文件：

```typescript
// 示例：生成切割音效
static generateSliceSound(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.15;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 20);
    const frequency = 800 - t * 600;
    const value = Math.sin(2 * Math.PI * frequency * t) * envelope;
    data[i] = value * 0.3;
  }

  return buffer;
}
```

### 音效初始化流程

1. 创建临时 AudioContext
2. 使用 `SoundAssets.initializeAllSounds()` 生成所有音效
3. 通过 `AudioManager.loadSoundBuffers()` 加载音效缓冲区
4. 音效立即可用，无需网络请求

### 音效播放

```typescript
// 播放音效，可选音量参数
audioManager.playSound('slice', 0.8);

// 播放背景音乐，循环播放
audioManager.playBackgroundMusic('bgMusic', true);

// 停止背景音乐
audioManager.stopBackgroundMusic();
```

## 优势

1. **无需外部文件**：所有音效都是程序化生成，减少资源加载时间
2. **科幻风格**：音效设计符合游戏的科幻主题
3. **性能优化**：使用 Web Audio API，低延迟播放
4. **完整集成**：覆盖所有游戏事件和 UI 交互
5. **音量控制**：支持主音量、音效音量、音乐音量独立控制

## 测试建议

1. 启动游戏，测试主菜单按钮音效
2. 进入摄像头预览，测试按钮音效
3. 开始游戏，验证：
   - 游戏开始音效
   - 背景音乐循环播放
   - 切割水果音效
   - 切割炸弹爆炸音效
   - 错过水果音效
   - 游戏结束音效
4. 测试暂停/恢复功能的音效
5. 测试返回主菜单时背景音乐停止

## 未来改进

1. 添加音量设置界面
2. 支持自定义音效
3. 添加更多音效变化（如不同水果的切割音效）
4. 实现音效预加载进度显示
