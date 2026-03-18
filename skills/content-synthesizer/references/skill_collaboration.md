# Skill 协作关系

## 上游 Skill

| 上游 Skill | 输入 | 说明 |
|-----------|------|------|
| deep-reading | 分析结果 + 核心洞察 | 最常见的输入来源 |
| reading-workflow | `materials.md` 素材清单 | 批量素材输入，解析 `contents/reading-notes/YYYY-MM-DD/materials.md` |
| bestblogs-fetcher | 文章元数据 | 提供基础素材 |
| xgo-fetch-tweets | 推文内容 | 推文内容再创作 |

## 下游 Skill

| 下游 Skill | 输出 | 说明 |
|-----------|------|------|
| post-to-x | 推文/推文串 | 直接发布到 Twitter |
| post-to-wechat | 公众号文章 | 直接发布到微信公众号 |
| cover-image | 博客/公众号标题 | 生成封面图 |
| article-illustrator | 文章内容 | 生成文章配图 |
| image-gen | 内容主题 | 生成各类图片 |
