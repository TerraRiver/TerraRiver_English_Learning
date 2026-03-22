# IR 英语学术知识库 (IR-EKB)

个人自用的英语知识库项目，专注于国际关系（International Relations）领域的英语学习。

## 功能特性

- ✅ **词条管理**：创建、编辑、删除词条，支持音标、释义、标签和多个例句
- ✅ **智能复习**：基于 SM-2 算法的间隔重复学习系统
- ✅ **即时发音**：使用浏览器原生 TTS 功能，点击即可朗读单词和例句
- ✅ **A-Z 索引**：按首字母浏览和搜索词条
- ✅ **仪表盘**：查看学习进度、待复习数量和最近添加的词条

## 技术栈

- **前端**：Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- **数据库**：SQLite + Prisma ORM
- **算法**：SM-2 间隔重复算法
- **TTS**：Web Speech API

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

数据库已经初始化完成，迁移文件位于 `prisma/migrations/`

如果需要重新生成 Prisma Client：

```bash
npx prisma generate
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
.
├── app/
│   ├── api/                    # API 路由
│   │   ├── dashboard/          # 仪表盘数据
│   │   ├── review/             # 复习相关 API
│   │   └── words/              # 词条 CRUD
│   ├── components/             # React 组件
│   │   ├── SpeakButton.tsx     # 发音按钮
│   │   └── ExampleListEditable.tsx  # 例句编辑器
│   ├── dictionary/             # 词典页面
│   ├── review/                 # 复习页面
│   ├── word/                   # 词条相关页面
│   │   ├── new/                # 新建词条
│   │   └── [id]/               # 词条详情
│   ├── layout.tsx              # 全局布局
│   └── page.tsx                # 首页
├── lib/
│   ├── prisma.ts               # Prisma Client 实例
│   └── sm2.ts                  # SM-2 算法实现
├── prisma/
│   ├── schema.prisma           # 数据库模型
│   ├── dev.db                  # SQLite 数据库文件
│   └── migrations/             # 数据库迁移文件
└── README.md
```

## 使用指南

### 添加词条

1. 点击导航栏的「添加词条」或首页的快速操作
2. 填写单词、音标、释义和标签
3. 可以添加多个例句，每个例句包含英文原文、中文翻译和出处
4. 点击「创建词条」保存

### 浏览词典

1. 点击导航栏的「词典」
2. 使用搜索框搜索单词或释义
3. 使用 A-Z 按钮按首字母筛选
4. 点击任意词条查看详情

### 开始复习

1. 首页显示今日待复习数量
2. 点击「开始复习」进入复习模式
3. 看到单词后先思考，然后点击「显示答案」
4. 根据掌握程度选择：
   - **Again**（重来）：完全不记得，间隔归零
   - **Hard**（困难）：想了很久才记起，间隔微增
   - **Good**（良好）：犹豫后想起，正常增长
   - **Easy**（简单）：轻松记起，大幅增长

### SM-2 算法说明

系统使用经典的 SM-2 间隔重复算法：

- 第一次复习：1 天后
- 第二次复习：6 天后
- 后续复习：根据难度系数和上次间隔计算

每次复习的反馈会影响：
- **间隔天数**：下次复习的时间
- **难度系数**：个性化调整复习频率
- **重复次数**：追踪学习进度

## 数据备份

SQLite 数据库文件位于 `prisma/dev.db`，可以直接复制该文件进行备份。

## 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# Prisma 命令
npx prisma studio      # 打开数据库可视化界面
npx prisma generate    # 生成 Prisma Client
npx prisma migrate dev # 创建新的迁移
```

## 后续计划 (V2.0)

- [ ] AI 辅助录入（DeepSeek API）
- [ ] 数据导出为 Anki 格式
- [ ] 学习统计图表
- [ ] 词条编辑功能
- [ ] 标签管理和筛选

## 作者

由 Claude Code 协助开发

## 许可

MIT License
