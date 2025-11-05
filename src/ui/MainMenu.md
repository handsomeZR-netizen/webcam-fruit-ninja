# 主菜单界面 (MainMenu)

## 概述

主菜单界面是游戏的入口界面，采用科幻风格设计，包含开始游戏、教程和设置三个主要按钮。

## 功能特性

### 1. 科幻风格设计
- 霓虹发光标题和副标题
- 脉冲动画效果
- 装饰性边框和几何图形
- 扫描线背景动画

### 2. 交互式按钮
- 三个主要按钮：
  - **开始游戏**: 启动游戏主循环
  - **游戏教程**: 显示教程界面（待实现）
  - **游戏设置**: 显示设置界面（待实现）

### 3. 悬停效果
- 鼠标悬停时按钮颜色变化
- 鼠标指针自动切换
- 悬停回调支持音效播放

### 4. 点击反馈
- 点击按钮触发相应操作
- 点击回调支持音效播放
- 视觉反馈动画

## 使用方法

```typescript
import { MainMenu } from './ui/MainMenu';

// 创建主菜单
const mainMenu = new MainMenu(canvas, {
  onStartGame: () => {
    console.log('开始游戏');
    // 启动游戏逻辑
  },
  onShowTutorial: () => {
    console.log('显示教程');
    // 显示教程界面
  },
  onShowSettings: () => {
    console.log('显示设置');
    // 显示设置界面
  },
  onButtonHover: (buttonId) => {
    // 播放悬停音效
    audioManager.playSound('hover');
  },
  onButtonClick: (buttonId) => {
    // 播放点击音效
    audioManager.playSound('click');
  }
});

// 在渲染循环中更新和渲染
function renderLoop() {
  mainMenu.update();
  mainMenu.render(ctx);
  requestAnimationFrame(renderLoop);
}
```

## API 接口

### MainMenuCallbacks

```typescript
interface MainMenuCallbacks {
  onStartGame?: () => void;
  onShowTutorial?: () => void;
  onShowSettings?: () => void;
  onButtonHover?: (buttonId: string) => void;
  onButtonClick?: (buttonId: string) => void;
}
```

### 方法

- `update()`: 更新动画状态
- `render(ctx: CanvasRenderingContext2D)`: 渲染主菜单
- `setButtonDisabled(buttonId: string, disabled: boolean)`: 设置按钮禁用状态
- `destroy()`: 销毁菜单并清理事件监听器

## 测试

启动开发服务器后访问 http://localhost:8080 即可看到主菜单界面。

### 测试要点

1. ✅ 标题和副标题正确显示
2. ✅ 三个按钮正确渲染
3. ✅ 鼠标悬停时按钮高亮
4. ✅ 点击按钮触发相应回调
5. ✅ 装饰元素和动画效果正常
6. ✅ 科幻风格符合设计要求

## 需求映射

- **需求 9.6**: WHEN 玩家与UI元素交互时，THE 游戏系统 SHALL 播放科幻音效和视觉反馈动画
  - ✅ 实现了按钮悬停和点击的视觉反馈
  - ✅ 提供了音效回调接口
  - ✅ 使用科幻主题的霓虹发光效果

## 后续改进

1. 添加按钮点击动画（缩放效果）
2. 添加更多装饰性粒子效果
3. 实现按钮禁用状态的视觉反馈
4. 添加键盘导航支持
5. 优化移动端触摸交互
