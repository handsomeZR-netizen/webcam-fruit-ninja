# 端到端测试指南 (E2E Test Guide)

## 概述

本文档描述了网页端水果忍者游戏的端到端测试套件，用于验证完整的游戏流程、浏览器兼容性、移动端适配和各项功能。

## 测试内容

### 1. 浏览器兼容性检测
- 检测浏览器类型和版本
- 验证必需的 Web API 支持
  - Canvas API
  - MediaDevices API (getUserMedia)
  - Web Audio API
  - requestAnimationFrame
  - localStorage
  - Performance API
- 验证推荐的浏览器版本
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+

### 2. 移动端适配检测
- 检测设备类型（移动设备、平板、桌面）
- 检测触摸支持
- 检测屏幕尺寸和像素比
- 检测屏幕方向（横屏/竖屏）
- 验证触摸事件支持
- 验证响应式 Canvas 尺寸适配

### 3. 摄像头权限处理
- 验证 MediaDevices API 可用性
- 检测摄像头权限状态
- 测试 CameraManager 初始化
- 测试各种摄像头错误场景
  - NotAllowedError (用户拒绝权限)
  - NotFoundError (未找到摄像头)
  - NotReadableError (摄像头被占用)
  - OverconstrainedError (约束条件错误)
- 测试降级模式（鼠标/触摸替代手势）

### 4. 完整游戏流程
测试从启动到结束的完整游戏流程：

#### 阶段 1: 游戏启动
- 初始化游戏核心系统
- 创建 GameState、PhysicsSystem、CollisionDetector
- 创建 ObjectPool 和 ObjectSpawner

#### 阶段 2: 教程系统
- 启动教程
- 完成三个教程步骤
  1. 手部检测
  2. 切割水果
  3. 避免炸弹
- 验证教程完成回调

#### 阶段 3: 游戏进行
- 生成水果对象
- 更新物理系统
- 模拟切割动作
- 验证分数增加
- 验证对象移除

#### 阶段 4: 游戏结束
- 模拟失去所有生命
- 验证游戏正确结束
- 显示最终分数

### 5. UI 界面切换
- 主菜单渲染
- 摄像头预览界面
- 游戏 HUD（分数、生命值）
- 暂停菜单
- 游戏结束界面
- 科幻主题效果（霓虹边框、发光文字、扫描线）

### 6. 音频系统
- AudioManager 初始化
- Web Audio API 上下文状态
- 音量控制（setMasterVolume）
- 静音功能（toggleMute）
- 音效播放方法验证
- 背景音乐控制

### 7. 数据持久化
- 最高分保存和加载
- 教程完成状态保存和加载
- 音频设置保存和加载
  - soundEnabled
  - musicEnabled
  - masterVolume
- 数据清除功能

### 8. 性能监控
- PerformanceMonitor 初始化
- 模拟游戏循环
- 收集性能指标
  - FPS
  - 帧时间
  - 更新时间
  - 渲染时间
  - 对象数量
  - 粒子数量
  - 内存使用
- 检测性能瓶颈
- 配置更新
- 统计数据重置

### 9. 错误处理和降级模式
- ErrorHandler 初始化
- 摄像头错误处理
- 降级模式启用
- 鼠标轨迹获取
- 触摸轨迹获取
- 错误消息显示（error、warning、info）
- 错误消息清除

## 运行测试

### 方法 1: 使用测试页面（推荐）

1. 编译 TypeScript 代码：
   ```bash
   npm run build
   ```

2. 在浏览器中打开 `e2e-test.html`

3. 点击"运行测试"按钮

4. 查看测试结果和详细日志

### 方法 2: 在浏览器控制台运行

1. 编译 TypeScript 代码：
   ```bash
   npm run build
   ```

2. 在主游戏页面打开浏览器控制台

3. 导入并运行测试：
   ```javascript
   import { runE2ETests } from './dist/e2e-test.js';
   await runE2ETests();
   ```

### 方法 3: 集成到主应用

在 `src/main.ts` 中添加测试入口：

```typescript
import { runE2ETests } from './e2e-test.js';

// 在开发模式下添加测试按钮
if (import.meta.env.DEV) {
  const testButton = document.createElement('button');
  testButton.textContent = '运行 E2E 测试';
  testButton.onclick = () => runE2ETests();
  document.body.appendChild(testButton);
}
```

## 测试结果解读

### 成功标志
- ✓ 绿色勾号表示测试通过
- 所有测试通过时显示"所有端到端测试通过！"

### 失败标志
- ✗ 红色叉号表示测试失败
- 显示具体的错误信息
- 需要检查并修复相关功能

### 警告标志
- ⚠ 黄色警告表示非关键问题
- 例如：浏览器版本较低、某些功能不支持

## 浏览器兼容性要求

### 推荐浏览器
- **Chrome 90+** (推荐)
- **Edge 90+**
- **Firefox 88+**
- **Safari 14+** (iOS 14.5+)

### 必需功能
- HTTPS（摄像头访问必需）
- MediaDevices API
- Web Audio API
- Canvas API
- localStorage
- requestAnimationFrame
- Performance API

### 移动端支持
- 响应式设计
- 触摸事件支持
- 横屏/竖屏自适应
- 降级模式（触摸代替手势）

## 常见问题

### Q: 测试失败怎么办？
A: 查看具体的错误信息，检查相关功能是否正确实现。常见问题包括：
- 浏览器不支持某些 API
- 摄像头权限被拒绝
- 代码逻辑错误

### Q: 如何在移动设备上测试？
A: 
1. 确保使用 HTTPS 访问
2. 在移动浏览器中打开 `e2e-test.html`
3. 允许摄像头权限（如果需要）
4. 运行测试

### Q: 测试需要摄像头吗？
A: 大部分测试不需要实际的摄像头。摄像头权限测试会检测 API 可用性，但不会强制要求摄像头访问。如果摄像头不可用，会测试降级模式。

### Q: 如何添加新的测试？
A: 在 `src/e2e-test.ts` 中添加新的测试方法：

```typescript
private async testNewFeature(): Promise<void> {
  console.log('\n--- 测试新功能 ---');
  
  // 测试代码
  
  console.log('  ✓ 新功能测试通过');
}
```

然后在 `runAllTests()` 方法中调用：

```typescript
await this.runTest('新功能测试', () => this.testNewFeature());
```

## 持续集成

### GitHub Actions 示例

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test:e2e
```

### 本地自动化测试

使用 Playwright 或 Puppeteer 进行自动化测试：

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/e2e-test.html');
  await page.click('#runTests');
  await page.waitForSelector('.status.success', { timeout: 60000 });
  await browser.close();
})();
```

## 性能基准

### 目标性能指标
- FPS: ≥ 60
- 帧时间: ≤ 16.67ms
- 更新时间: ≤ 5ms
- 渲染时间: ≤ 10ms
- 内存使用: < 80%

### 性能优化建议
如果测试检测到性能问题：
1. 减少粒子效果数量
2. 优化碰撞检测算法
3. 使用对象池减少 GC
4. 降低游戏对象数量
5. 使用离屏 Canvas 预渲染

## 总结

端到端测试确保游戏在各种环境下都能正常运行。定期运行测试可以：
- 及早发现问题
- 验证新功能
- 确保浏览器兼容性
- 保证性能标准
- 提高代码质量

建议在每次代码提交前运行完整的测试套件。
