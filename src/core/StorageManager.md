# StorageManager 使用文档

## 概述

`StorageManager` 是一个静态类，用于管理游戏的本地存储数据。它使用浏览器的 `localStorage` API 来持久化保存游戏数据。

## 功能

### 1. 保存和加载完整数据

```typescript
import { StorageManager, SaveData } from './core';

// 加载所有保存的数据
const data: SaveData = StorageManager.load();

// 保存完整数据
const newData: SaveData = {
  highScore: 1000,
  tutorialCompleted: true,
  soundEnabled: true,
  musicEnabled: true,
  masterVolume: 0.8,
};
StorageManager.save(newData);
```

### 2. 最高分管理

```typescript
// 获取最高分
const highScore = StorageManager.getHighScore();

// 保存最高分（仅当新分数更高时才更新）
StorageManager.saveHighScore(1500);
```

### 3. 教程状态管理

```typescript
// 检查教程是否已完成
const completed = StorageManager.getTutorialCompleted();

// 标记教程为已完成
StorageManager.setTutorialCompleted(true);
```

### 4. 音频设置管理

```typescript
// 音效开关
const soundEnabled = StorageManager.getSoundEnabled();
StorageManager.setSoundEnabled(false);

// 音乐开关
const musicEnabled = StorageManager.getMusicEnabled();
StorageManager.setMusicEnabled(false);

// 主音量（0.0 - 1.0）
const volume = StorageManager.getMasterVolume();
StorageManager.setMasterVolume(0.5);
```

### 5. 重置和清除

```typescript
// 重置所有数据到默认值
StorageManager.reset();

// 清除所有保存的数据
StorageManager.clear();
```

## 默认值

```typescript
{
  highScore: 0,
  tutorialCompleted: false,
  soundEnabled: true,
  musicEnabled: true,
  masterVolume: 0.7,
}
```

## 错误处理

`StorageManager` 内置了错误处理机制：

- 如果 `localStorage` 不可用或读取失败，会返回默认值
- 如果保存失败，会在控制台输出错误信息
- 所有方法都是安全的，不会抛出异常

## 集成示例

### 在游戏结束时保存最高分

```typescript
import { StorageManager } from './core';
import { GameState } from './game';

function onGameOver(gameState: GameState) {
  const finalScore = gameState.score;
  StorageManager.saveHighScore(finalScore);
  
  const highScore = StorageManager.getHighScore();
  console.log(`Final Score: ${finalScore}, High Score: ${highScore}`);
}
```

### 在教程完成时保存状态

```typescript
import { StorageManager } from './core';
import { TutorialSystem } from './tutorial';

function onTutorialComplete(tutorial: TutorialSystem) {
  StorageManager.setTutorialCompleted(true);
  console.log('Tutorial completed and saved!');
}
```

### 在音频管理器中使用

```typescript
import { StorageManager } from './core';
import { AudioManager } from './audio';

class AudioManager {
  constructor() {
    // 从存储加载音频设置
    const volume = StorageManager.getMasterVolume();
    const soundEnabled = StorageManager.getSoundEnabled();
    const musicEnabled = StorageManager.getMusicEnabled();
    
    this.setMasterVolume(volume);
    this.setSoundEnabled(soundEnabled);
    this.setMusicEnabled(musicEnabled);
  }
  
  setMasterVolume(volume: number) {
    // 设置音量并保存
    this.volume = volume;
    StorageManager.setMasterVolume(volume);
  }
}
```

## 注意事项

1. **浏览器兼容性**: 需要浏览器支持 `localStorage` API
2. **存储限制**: `localStorage` 通常有 5-10MB 的存储限制
3. **同步操作**: `localStorage` 是同步操作，但数据量小不会影响性能
4. **隐私模式**: 在浏览器隐私模式下，`localStorage` 可能不可用或在会话结束后清除
