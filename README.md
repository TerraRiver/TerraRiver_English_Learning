# IR 英语学术知识库 (IR-EKB) 开发设计文档

版本: v1.0

作者: Gemini & 用户

日期: 2026-01-19

项目代号: Project Lexicon

## 1. 项目背景与目标

### 1.1 背景

作为国际关系（International Relations, IR）领域的高校研究者/学生，在阅读大量英文文献（Foreign Affairs, Diplomat, 学术论文）时，积累了大量具有特定语境和专业含义的词汇。传统的单词APP无法满足“语境记忆”和“多义词深度解析”的需求。

### 1.2 目标

构建一个**自托管、轻量级、专注于语境学习**的个人Web应用。

* **知识库属性** ：以“词条”为核心，支持无限量的例句关联。
* **工具属性** ：提供即时发音（TTS）和基于 SM-2 算法的间隔重复复习功能。
* **技术属性** ：基于现代 Web 技术栈（Next.js），易于维护和扩展。

## 2. 技术架构选型

### 2.1 核心技术栈

* **前端框架** : **Next.js 14+ (App Router)**
* *理由* : React 生态首选，自带路由和 API 后端能力，支持服务端渲染 (SSR) 提升首屏速度，开发体验极佳。
* **开发语言** : **TypeScript**
* *理由* : 强类型约束，对于处理复杂的复习算法和数据库关系非常必要，减少运行时错误。
* **数据库** : **SQLite**
* *理由* : 单文件数据库，无需配置服务器进程，易于备份（直接拷贝文件），完全满足个人单用户的数据量级。
* **ORM 工具** : **Prisma**
* *理由* : 提供类型安全的数据库操作，Schema 定义清晰，自动生成迁移文件，大大降低 SQL 编写门槛。
* **样式方案** : **Tailwind CSS**
* *理由* : 原子化 CSS，无需在多个文件间切换，快速构建响应式界面。
* **语音合成** : **Web Speech API (Browser Native)**
* *理由* : 调用浏览器原生能力，零成本、零存储、无网络延迟。

### 2.2 系统架构图

```
graph TD
    User[用户] --> |浏览器访问| Client[Next.js 前端页面]
    Client --> |TTS 调用| BrowserAPI[Web Speech API]
    Client --> |API 请求| Server[Next.js API Routes]
    Server --> |ORM 操作| Prisma[Prisma Client]
    Prisma --> |读写| DB[(SQLite 数据库)]
  
    subgraph 核心模块
    Dash[仪表盘]
    Dict[词条管理]
    Review[复习系统/算法]
    end

```

## 3. 功能需求详细设计

### 3.1 核心模块：词条管理 (Encyclopedia)

* **词条录入** :
* 输入单词/短语 (Term)。
* 输入音标文本 (Phonetic, 可选)。
* 输入释义 (Definition)。
* 添加标签 (Tags, 如 "Realism", "Economy")。
* **动态添加例句** : 支持在一个词条下添加 N 条例句，每条包含：英文原句 + 中文翻译 + 出处（可选）。
* **词条展示** :
* 百科式详情页，清晰展示单词元数据和所有例句。
* **点击发音** : 单词旁和例句旁均有“小喇叭”按钮，点击即读。
* **检索与索引** :
* **A-Z 索引页** : 侧边栏或顶部导航按首字母分类。
* **即时搜索** : 顶部搜索框，输入时实时过滤列表。

### 3.2 核心模块：复习系统 (The Coach)

* **每日任务** : 首页显示“今日待复习”数量。
* **抽卡复习模式** :

1. **正面** : 显示单词 + 音标 (隐藏释义和例句)。
2. **思考** : 用户自测。
3. **翻面** : 点击“Show Answer”，展示释义、变体和所有例句。
4. **反馈** : 用户选择掌握程度按钮：
   * `Again` (重来): 间隔归零。
   * `Hard` (困难): 间隔微增。
   * `Good` (良好): 正常算法增长。
   * `Easy` (简单): 大幅增长。

* **算法逻辑** : 后端集成简易版  **SM-2 算法** ，根据反馈计算下一次复习的具体日期。

## 4. 数据库设计 (Schema)

使用 Prisma Schema Language 描述。

```
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// 1. 单词/词条表
model Word {
  id          Int      @id @default(autoincrement())
  term        String   @unique                 // 单词本身，唯一
  phonetic    String?                          // 音标文本，如 "/tɜːrm/"
  definition  String                           // 主要释义
  tags        String?                          // 标签，用逗号分隔字符串存储，如 "IR,Economy"
  
  // 关联
  examples    Example[]                        // 一对多：一个单词有多个例句
  progress    ReviewProgress?                  // 一对一：一个单词对应一个复习进度
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 2. 例句表
model Example {
  id          Int      @id @default(autoincrement())
  sentenceEn  String                           // 英文原句
  sentenceCn  String?                          // 中文翻译
  source      String?                          // 出处，如 "Foreign Affairs 2024-05"
  
  wordId      Int
  word        Word     @relation(fields: [wordId], references: [id], onDelete: Cascade)
}

// 3. 复习进度表 (基于 SM-2 算法参数)
model ReviewProgress {
  id            Int       @id @default(autoincrement())
  wordId        Int       @unique
  word          Word      @relation(fields: [wordId], references: [id], onDelete: Cascade)
  
  nextReview    DateTime  // 下一次复习的具体日期
  interval      Int       @default(0)   // 当前间隔天数
  easeFactor    Float     @default(2.5) // 难度系数 (EF)，初始为 2.5
  repetitions   Int       @default(0)   // 连续成功复习次数
  
  lastReviewed  DateTime  @default(now()) // 上次复习时间
}

```

## 5. 页面路由规划 (Next.js App Router)

* `app/page.tsx`: **首页 (Dashboard)**
  * 展示今日复习概览、最近添加的词条列表、快速添加入口。
* `app/dictionary/page.tsx`: **词条索引页**
  * 包含搜索框、A-Z 筛选器、词条列表。
* `app/word/[id]/page.tsx`: **词条详情页**
  * 展示完整信息、发音组件、编辑/删除按钮。
* `app/word/new/page.tsx`: **新建词条页**
  * 表单页面，支持动态增减例句输入框。
* `app/review/page.tsx`: **复习中心**
  * 沉浸式复习界面（Flashcard UI）。

## 6. 关键组件开发计划

1. **`<SpeakButton text={string} />`**
   * 封装 `window.speechSynthesis`。
   * 接收文本参数，点击播放音频。
2. **`<ExampleListEditable />`**
   * 在新建/编辑页面使用。
   * 允许用户点击“+ Add Example”动态增加输入框组。
3. **`<FlashCard />`**
   * 复习页面的核心交互组件，包含翻转动画和底部评分栏。

## 7. 后续扩展性规划 (V2.0)

* **AI 辅助录入** : 集成 DeepSeek 或 OpenAI API，输入单词自动生成释义和 IR 领域的经典例句。
* **数据导出** : 支持导出为 Anki 格式 (`.apkg`) 或 CSV 备份。
* **统计图表** : 使用 Recharts 展示每日复习量的趋势图。
