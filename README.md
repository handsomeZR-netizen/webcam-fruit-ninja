# 网页端水果忍者 (Webcam Fruit Ninja)

基于浏览器的互动游戏，使用摄像头捕捉玩家的手部动作来切割屏幕上飞出的水果。

## 技术栈

- **前端**: HTML5 Canvas + TypeScript
- **手势识别**: MediaPipe Hands
- **音频**: Web Audio API

## 项目结构

```
webcam-fruit-ninja/
├── src/
│   ├── core/          # 核心配置和工具
│   ├── game/          # 游戏逻辑模块
│   ├── ui/            # UI 模块
│   ├── gesture/       # 手势识别模块
│   ├── audio/         # 音频模块
│   ├── tutorial/      # 教学系统模块
│   └── main.ts        # 应用入口
├── dist/              # 编译输出
├── index.html         # HTML 入口
├── package.json       # 项目配置
└── tsconfig.json      # TypeScript 配置
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 编译 TypeScript

```bash
npm run build
```

### 开发模式（监听文件变化）

```bash
npm run watch
```

### 运行游戏

使用本地服务器打开 `index.html` 文件（需要 HTTPS 才能访问摄像头）。

推荐使用：
- VS Code Live Server 扩展
- `python -m http.server 8000`
- `npx serve`

## 游戏特性

- ✅ 摄像头手势识别
- ✅ 实时手部追踪
- ✅ 物理引擎（抛物线运动）
- ✅ 粒子效果系统
- ✅ 科幻风格 UI
- ✅ 音效和背景音乐
- ✅ 交互式教学系统

## 浏览器兼容性

- Chrome 90+ (推荐)
- Edge 90+
- Firefox 88+
- Safari 14+

**注意**: 需要 HTTPS 环境才能访问摄像头。

## 许可证

MIT
