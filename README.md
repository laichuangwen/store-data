# store-data

基于 Vite + TypeScript 的表格数据层项目，包含行/列节点与 Store 数据模型。

## 环境要求

- Node.js 18+
- npm / pnpm / yarn

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
store-data/
├── index.html          # 入口 HTML，由 Vite 提供
├── src/
│   ├── index.ts        # 应用入口，列/数据配置与 Store 使用
│   └── Store.ts        # 数据模型：rowNode、columnNode、Store
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 变更记录

- **2025-02-09**：初始化 Vite 项目，支持 TypeScript；将 `Store.ts`、`index.ts` 迁入 `src/`，配置 Vite 与 TS 编译选项。
