# 防滥用与抗攻击 · 可落地的四层方案

> 目标：挡住"批量注册 + 灌水 + 爬取 + 小规模 CC"，同时不误伤正常用户。
> 先明确一件事：**只靠 IP 限制是不够的**。国内大量用户走运营商 NAT/CGNAT，
> 一个出口 IP 可能是几百人；校园网、公司网更是整栋楼一个 IP。
> 正确做法是 **IP + 设备 + 账号 + 行为** 四者组合，并按风险分层处置。

---

## 一、本站已经做的前端防线（无需服务器）

| 规则 | 阈值 | 位置 |
|---|---|---|
| 同一浏览器每日注册 | 5 个 | `store.js` `checkSignup()` |
| 同一邮箱连续登录失败 | 5 次后锁 10 分钟 | `checkLogin()` |
| 发笔记间隔 | 20 秒 | `checkPost('note')` |
| 发评论间隔 | 6 秒 | `checkPost('comment')` |
| 每日上限 | 笔记 20 篇 / 评论 100 条 | 同上 |
| 注册人机验证 | 随机算式 | `index.html` |
| 内容长度与屏蔽词 | 见设置页 | `moderate()` |

**这些只是"抬高成本"，不是安全边界**：清掉浏览器存储就能绕过。
真正的限制必须在服务端。下面是三层服务端方案。

---

## 二、边缘层：Cloudflare（推荐，免费档就够用）

1. **开启 Bot Fight Mode**：Security → Bots。
2. **Rate Limiting 规则**（Security → WAF → Rate limiting rules）：

| 路径 | 阈值 | 动作 |
|---|---|---|
| `/auth/v1/signup` | 5 次 / 10 分钟 / IP | Block 10 分钟 |
| `/auth/v1/token` | 10 次 / 10 分钟 / IP | Managed Challenge |
| `POST /rest/v1/notes` | 20 次 / 10 分钟 / IP | Managed Challenge |
| `POST /rest/v1/comments` | 60 次 / 10 分钟 / IP | Managed Challenge |
| 全站 | 120 次 / 分钟 / IP | JS Challenge |

3. **Turnstile**（免费人机验证）：注册与发帖时挂一个，前端拿 token，服务端校验。
4. **Under Attack Mode**：被 CC 时临时开启（会弹 5 秒验证）。

> 为什么优先 Cloudflare：它按 IP + ASN + 浏览器指纹综合判定，比"单 IP 5 个号"精准得多，
> 而且免费额度覆盖小站。

---

## 三、Nginx 层：限速与限连接

放在 `http { }` 里（全局，只加一次）：

```nginx
# 定义限速区：按 IP，10MB 记录约 16 万个 IP
limit_req_zone $binary_remote_addr zone=sixi_all:10m rate=60r/m;
limit_req_zone $binary_remote_addr zone=sixi_auth:10m rate=10r/m;
limit_conn_zone $binary_remote_addr zone=sixi_conn:10m;

# 登录 / 注册接口更严
map $request_uri $is_auth {
    default 0;
    "~^/(auth|api/login|api/register)" 1;
}
```

放在 `server { }` 里：

```nginx
limit_conn sixi_conn 20;
limit_req zone=sixi_all burst=30 nodelay;

location ~ ^/(auth|api/login|api/register) {
    limit_req zone=sixi_auth burst=5 nodelay;
    proxy_pass http://127.0.0.1:3000;
}

client_max_body_size 2m;          # 限制上传体积，防大包攻击
client_body_timeout 10s;
client_header_timeout 10s;
```

返回 429 时给一个友好页面，别让用户看到 Nginx 默认页。

---

## 四、应用层：账号与内容风控

1. **邮箱验证**：注册后必须点邮件链接才能发言（能挡掉 90% 的脚本注册）。
2. **新号观察期**：注册 24 小时内不能公开发言，或每日限 3 条。
3. **内容去重**：与近期内容相似度 > 0.9 直接拒（防复制灌水）。
4. **行为特征**：注册后 3 秒内发帖、连续相同标点、纯链接正文 → 进人工队列。
5. **设备指纹**：用 `fingerprintjs` 之类生成匿名设备 ID，与 IP 一起计数；
   清 Cookie 也能识别一部分。
6. **举报加权**：被多人举报的账号自动降权/限流。

---

## 五、数据层：如果需要自己记 IP

Supabase 里加一张表，配合 Edge Function 做原子计数：

```sql
create table if not exists public.ip_attempts (
  ip          inet not null,
  action      text not null,
  window_start timestamptz not null,
  count       int not null default 0,
  primary key (ip, action, window_start)
);

create or replace function public.hit_limit(p_ip inet, p_action text, p_limit int, p_window interval)
returns boolean
language plpgsql
security definer
as $$
declare
  w timestamptz := date_trunc('minute', now());
  c int;
begin
  insert into public.ip_attempts (ip, action, window_start, count)
  values (p_ip, p_action, w, 1)
  on conflict (ip, action, window_start)
  do update set count = public.ip_attempts.count + 1
  returning count into c;
  return c <= p_limit;
end;
$$;

-- 清理旧窗口（定时任务每天跑）
delete from public.ip_attempts where window_start < now() - interval '1 day';
```

Edge Function 里：

```ts
const ip = req.headers.get('cf-connecting-ip') ?? '0.0.0.0';
const ok = await supabase.rpc('hit_limit', { p_ip: ip, p_action: 'signup', p_limit: 5, p_window: '10 minutes' });
if (!ok) return new Response('too many', { status: 429 });
```

> 注意：`inet` 字段要存真实 IP，别存 `x-forwarded-for` 的第一段（可伪造）。
> Cloudflare 环境下用 `cf-connecting-ip`。

---

## 六、监控与应急

- **告警**：注册量、发帖量 5 分钟同比 > 5 倍 → 邮件/Telegram 告警。
- **一键降级**：Cloudflare 开 Under Attack，或 Nginx 把新用户写接口全返回 429。
- **取证**：保留 7 天访问日志（IP、UA、时间、路径），出事能回溯。
- **申诉**：被误封的走「驿站」，人工解封。

---

## 七、IP 限制到底怎么设

你提的"同一 IP 不许注册超过 5 个"可以作为**兜底规则**，但建议这样组合：

| 维度 | 阈值 | 说明 |
|---|---|---|
| 单 IP 注册 | 10 个/天 | 不是 5 个，避免误伤校园网/公司网 |
| 单设备注册 | 3 个/天 | 设备指纹或本地标记 |
| 单邮箱域 | 50 个/天 | 防同一临时邮箱域名批量注册 |
| 单 IP 登录失败 | 20 次/10 分钟 | 防撞库 |
| 单账号发帖 | 20 篇/天 | 防灌水 |

命中后的处置要分级：**首次 → 人机验证；再次 → 限流；持续 → 封禁 24 小时**。
一上来就封 IP，误伤成本很高。
