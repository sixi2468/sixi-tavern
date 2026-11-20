/* ===========================================================
   站点配置（上线前改这里）
   =========================================================== */
window.SIXI_CONFIG = {
  siteName: '四夕酒馆',

  // 馆主邮箱：用这个邮箱注册的账号自动获得后台权限（纯静态阶段用；接后端后由数据库角色控制）
  ownerEmail: 'sixi2468@163.com',

  // 联系邮箱：留空则页面只显示「驿站」，不会出现假邮箱。
  // 上线前填成你自己的，例如 'hi@yourdomain.com'
  contactEmail: '',

  // 广告联盟代码（也可在后台「广告位」里填）
  adCode: { 'tavern-feed-1': '', 'note-bottom-1': '' },

  // 可选：你自己的 ISBN 查询代理（返回 {title, author, publisher, cover}）
  // 例如 'https://your-api.example.com/isbn?q={isbn}'
  // 留空则依次使用：内置表 → 本地补录 → OpenLibrary → Google Books
  isbnApi: '',

  // 若接了后端（Supabase），在这里填；前端适配见 docs/03-上线教程.md 第五节
  emptySeed: true,

  supabase: { url: '', anonKey: '' },
};
