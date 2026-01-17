# DuckPay 前端

DuckPay 是一个现代化的支付管理系统，拥有美观直观的用户界面。

## 技术栈

- **React 19** - 现代化 UI 框架
- **Vite** - 快速构建工具和开发服务器
- **TailwindCSS** - 原子化 CSS 框架
- **Framer Motion** - 动画库
- **Lucide React** - 图标库
- **Axios** - HTTP 客户端

## 快速开始

### 前提条件

- Node.js 18+ 或 20+
- pnpm 包管理器

### 安装

1. 安装依赖：

```bash
pnpm install
```

2. 基于 `.env.example` 模板创建 `.env` 文件：

```bash
cp .env.example .env
```

3. 启动开发服务器：

```bash
pnpm dev
```

应用将在 `http://localhost:5173` 可用

### 生产构建

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

## 项目结构

```
src/
├── components/        # 可复用 UI 组件
├── contexts/          # React Context 提供器
├── i18n/              # 国际化文件
├── pages/             # 页面组件
├── utils/             # 工具函数
├── App.jsx            # 根组件
├── main.jsx           # 应用入口点
└── index.css          # 全局样式
```

## 功能特性

- 用户认证和授权
- 带有支付统计的仪表板
- 支付记录管理
- 分类管理
- 响应式设计
- 实时更新

## 开发

### 代码风格

- 使用 ESLint 和 Prettier 进行代码检查和格式化
- 遵循 React 最佳实践
- 使用带钩子的函数组件
- 实现适当的错误处理

### 测试

```bash
pnpm test
```

## 许可证

MIT

---

[English Version](./README.md)