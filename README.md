# Project Lexicon — 个人英语词汇管理工具

自托管的个人英语单词本，支持语境例句记录、AI 辅助录入和 SM-2 间隔重复复习。

## 功能

- **词条管理**：录入单词/短语，支持音标、词性、释义、变体、标签（四级/六级/雅思/学术/通用/其他）和多条例句（英文 + 中文译文 + 出处）
- **编辑词条**：在词条详情页随时修改所有字段和例句
- **AI 辅助录入**：输入单词后一键调用 DeepSeek API，自动补全音标、释义、标签和例句
- **词典浏览**：A–Z 字母索引筛选 + 实时搜索
- **导入 / 导出**：词库可导出为 CSV 文件，也可从 CSV 导入（重复词条以现有数据为准）
- **间隔复习**：基于 SM-2 算法，按紧迫度排序，永远有词可复习；支持精细（Again/Hard/Good/Easy）和简洁（Again/Easy）两种评分模式
- **即时发音**：调用浏览器原生 Web Speech API，单词和例句均可朗读
- **统计仪表盘**：词条总数、复习进度、标签分布、难度排行等
- **手机端适配**：复习界面针对手机优化，导航栏支持移动端汉堡菜单

## 环境要求

- **Node.js** 18 或更高版本
- （可选）**DeepSeek API Key**，用于 AI 辅助录入功能

## 部署步骤

### 1. 克隆仓库

```bash
git clone <仓库地址>
cd terrariver_english_learning
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# 数据库路径（SQLite，保持默认即可）
DATABASE_URL="file:./dev.db"

# DeepSeek API Key（可选，不填则 AI 补全功能不可用）
# 前往 https://platform.deepseek.com 获取
DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
```

### 4. 初始化数据库

首次部署时执行，创建数据库文件并应用所有迁移：

```bash
npx prisma migrate deploy
```

> 开发环境也可以用 `npx prisma migrate dev`，效果相同但会提示命名迁移。

### 5. 生成 Prisma Client

```bash
npx prisma generate
```

> `npm install` 通常会自动触发此步骤，若 Prisma Client 报错时手动执行。

### 6. 启动服务

**开发模式**（热重载，适合本地调试）：

```bash
npm run dev
```

**生产模式**：

```bash
npm run build
npm start
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 常用命令

```bash
npm run dev              # 开发模式（热重载）
npm run build            # 生产构建
npm start                # 启动生产服务器
npm run lint             # ESLint 代码检查

npx prisma studio        # 可视化数据库管理界面（浏览器打开）
npx prisma migrate dev   # 修改 schema 后创建并应用新迁移
npx prisma generate      # 重新生成 Prisma Client
```

## 数据备份与迁移

数据库是单文件 SQLite（已加入 `.gitignore`，不会随代码提交），备份只需复制该文件：

```bash
cp prisma/dev.db prisma/dev.db.bak
```

迁移到新机器时，将 `prisma/dev.db` 复制到目标环境的同路径下，确保 `DATABASE_URL` 指向该文件即可，无需重新初始化数据库。

也可以通过词典页的**导出 CSV** 功能备份词条内容（不含复习进度），在新环境通过**导入 CSV** 还原。

## CSV 格式

导出/导入使用以下列格式（一词多例句时展开为多行）：

```
term,phonetic,partOfSpeech,definition,variants,tags,sentenceEn,sentenceCn,source
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 数据库 | SQLite |
| ORM | Prisma 5 |
| 样式 | Tailwind CSS 4 |
| AI 补全 | DeepSeek API (`deepseek-chat`) |
| 复习算法 | SM-2（排序制，全词库按紧迫度排队）|
| 发音 | Web Speech API |
