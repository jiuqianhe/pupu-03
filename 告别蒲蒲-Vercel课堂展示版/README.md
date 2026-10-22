# 告别蒲蒲｜课堂展示版

这是可直接部署到 GitHub + Vercel 的课堂展示项目。视觉页面仍是原始单文件界面；所有静态图片、CSS 和前端脚本都内嵌在 `index.html` 中，因此不会因为 Vercel 路径、中文目录或缺少资源文件夹而丢图。

## 展示版行为

- 每次刷新或重新打开都会清空本地故事、告别进度、媒体和聊天。
- 当前页面会话内，栖所故事会作为生成递进告别事件的上下文。
- 图文整理最多临时发送两张经浏览器压缩的图片，不在本项目服务器长期保存。
- AI 接口失败时自动使用原有本地事件、排版和对话，不破坏演示流程。

## 部署

1. 在 GitHub 创建空仓库，将本目录全部文件推送到仓库根目录。
2. 在 Vercel 选择 **New Project**，导入该仓库。
3. Framework Preset 选择 **Other**；不填写 Build Command 和 Output Directory。
4. 在 Vercel 项目的 **Settings → Environment Variables** 添加：
   - `OPENAI_API_KEY`：OpenAI 项目 API Key。
   - `OPENAI_MODEL`：支持 Responses API、图片输入和 Structured Outputs 的模型 ID。
5. 勾选 Production、Preview、Development 环境后保存，然后重新部署。

不要把真实 API Key 写入 `index.html`、`.env.example` 或 GitHub 仓库。

## Git 命令

```bash
git init
git add .
git commit -m "Deploy farewell Pupu classroom demo"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

## 本地运行

安装依赖后，复制 `.env.example` 为 `.env.local` 并填写本地测试值：

```bash
npm install
npm run dev
```

请使用 `vercel dev` 生成的 `http://localhost:3000` 地址测试 AI 接口；直接双击 `index.html` 时，视觉页面可打开，但 `/api` 不存在，会自动使用本地备用内容。

## 上线检查

- 在 iPhone Safari 和 Android Chrome 打开 Vercel 的 HTTPS 地址。
- 确认首页、栖所、籽语、私屿图片均正常。
- 点击“摇动蒲公英抽取事件”一次以触发 iPhone 的运动权限，再测试摇晃。
- 分别测试 AI 事件、含图片的记录整理、精灵对话。
- 在 OpenAI 项目中设置预算提醒或硬性用量限制。
