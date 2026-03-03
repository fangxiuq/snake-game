# 🐍 贪吃蛇游戏

一个使用 React + FastAPI 开发的现代化贪吃蛇游戏，支持排行榜功能。

![Snake Game](https://img.shields.io/badge/React-18.3-blue) ![FastAPI-0.128-orange) ![Vite-7.3-purple)

## 🎮 游戏特性

- 🎯 经典贪吃蛇玩法
- 🏆 排行榜系统（成绩持久化）
- 💾 本地最高分记录
- 🎨 霓虹风格 UI 设计
- 📱 响应式布局，支持移动端

## 🛠️ 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: FastAPI + SQLite
- **样式**: CSS3 (渐变、阴影、动画)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/fangxiuq/snake-game.git
cd snake-game
```

### 2. 启动后端

```bash
cd backend
pip install fastapi uvicorn pydantic
python main.py
```

后端服务将在 http://localhost:8000 运行

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:5173 运行

## 🎯 操作说明

| 按键 | 功能 |
|------|------|
| ↑ ↓ ← → | 控制蛇的移动方向 |
| 空格键 | 暂停 / 继续游戏 |
| 开始游戏 | 点击按钮或按方向键开始 |
| 保存成绩 | 游戏结束后输入名字保存到排行榜 |

## 📁 项目结构

```
snake-game/
├── backend/
│   ├── main.py         # FastAPI 后端服务
│   └── snake_game.db   # SQLite 数据库（自动创建）
└── frontend/
    ├── src/
    │   ├── App.tsx     # 游戏主组件
    │   └── App.css     # 样式文件
    └── dist/           # 构建产物
```

## 🔧 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/scores` | 获取排行榜（前10名） |
| GET | `/api/scores/max` | 获取最高分 |
| POST | `/api/scores` | 保存成绩 |

## 📝 许可证

MIT License
