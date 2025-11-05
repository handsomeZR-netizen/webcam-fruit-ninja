# GitHub 上传指南

## 📝 准备工作

### 1. 在 GitHub 上创建新仓库

1. 访问 [github.com](https://github.com)
2. 登录你的账号
3. 点击右上角的 "+" → "New repository"
4. 填写信息：
   - Repository name: `webcam-fruit-ninja`（或你喜欢的名字）
   - Description: `网页端水果忍者游戏 - 基于摄像头手势识别`
   - 选择 Public（公开）或 Private（私有）
   - **不要**勾选 "Initialize this repository with a README"
5. 点击 "Create repository"

---

## 🚀 上传步骤

### 方式一：命令行上传（推荐）

在项目根目录打开终端，依次执行：

```bash
# 1. 初始化 Git 仓库（如果还没有）
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "Initial commit: 网页端水果忍者游戏"

# 4. 添加远程仓库（替换成你的 GitHub 用户名和仓库名）
git remote add origin https://github.com/你的用户名/webcam-fruit-ninja.git

# 5. 推送到 GitHub
git branch -M main
git push -u origin main
```

#### 如果遇到认证问题：

**使用 Personal Access Token（推荐）：**

1. 访问 GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 "Generate new token (classic)"
3. 勾选 `repo` 权限
4. 生成并复制 token
5. 推送时使用：
```bash
git push -u origin main
# 用户名：你的 GitHub 用户名
# 密码：粘贴刚才复制的 token
```

---

### 方式二：GitHub Desktop（图形界面）

1. 下载并安装 [GitHub Desktop](https://desktop.github.com/)
2. 登录你的 GitHub 账号
3. File → Add Local Repository → 选择项目文件夹
4. 点击 "Publish repository"
5. 选择仓库名称和可见性
6. 点击 "Publish repository"

---

### 方式三：VS Code（如果你在用）

1. 打开项目文件夹
2. 点击左侧的 Source Control 图标
3. 点击 "Initialize Repository"
4. 添加所有文件并提交
5. 点击 "Publish to GitHub"
6. 选择仓库名称和可见性

---

## ✅ 验证上传成功

访问你的仓库地址：
```
https://github.com/你的用户名/webcam-fruit-ninja
```

应该能看到所有项目文件。

---

## 🔄 后续更新代码

每次修改代码后，执行：

```bash
# 1. 查看修改的文件
git status

# 2. 添加修改的文件
git add .

# 3. 提交修改
git commit -m "描述你的修改"

# 4. 推送到 GitHub
git push
```

---

## 📦 直接部署到 GitHub Pages

上传到 GitHub 后，可以直接启用 GitHub Pages：

1. 进入仓库的 Settings
2. 找到 Pages 选项
3. Source 选择 "main" 分支
4. 点击 Save
5. 等待几分钟，访问：
   ```
   https://你的用户名.github.io/webcam-fruit-ninja/
   ```

---

## ⚠️ 注意事项

### 不要上传的文件（已在 .gitignore 中配置）：
- `node_modules/` - 依赖包（太大）
- `dist/` - 编译输出（可以重新生成）
- `.env` - 环境变量（可能包含敏感信息）
- 日志文件

### 需要上传的文件：
- 所有源代码（`src/` 目录）
- `index.html`
- `package.json`
- `tsconfig.json`
- 配置文件（`vercel.json`, `netlify.toml`）
- 文档文件（`README.md`, `部署指南.md` 等）

---

## 🎯 快速命令参考

```bash
# 克隆仓库（下载到本地）
git clone https://github.com/你的用户名/webcam-fruit-ninja.git

# 查看状态
git status

# 查看提交历史
git log

# 拉取最新代码
git pull

# 创建新分支
git checkout -b feature-name

# 切换分支
git checkout main

# 合并分支
git merge feature-name
```

---

## 🆘 常见问题

### 1. 提示 "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/你的用户名/webcam-fruit-ninja.git
```

### 2. 推送被拒绝
```bash
git pull origin main --rebase
git push -u origin main
```

### 3. 忘记添加 .gitignore
```bash
git rm -r --cached node_modules
git commit -m "Remove node_modules"
git push
```

### 4. 想要撤销最后一次提交
```bash
git reset --soft HEAD~1
```

---

## 🎉 完成！

上传成功后，你可以：
- 分享仓库链接给其他人
- 使用 GitHub Actions 自动部署
- 启用 GitHub Pages 直接访问游戏
- 接受其他人的 Pull Request

需要帮助？查看 [GitHub 官方文档](https://docs.github.com/)
