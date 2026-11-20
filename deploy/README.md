# 部署配置说明

| 文件 | 放到哪 | 用途 |
|---|---|---|
| `_redirects`（在 site 根目录） | 与 `index.html` 同级 | Cloudflare Pages / Netlify 的 404 回退 |
| `netlify.toml` | 仓库根目录 | Netlify 构建、缓存与安全头 |
| `vercel.json` | 仓库根目录 | Vercel 缓存与安全头 |
| `nginx.conf` | `/etc/nginx/sites-available/sixi` | 国内云服务器反向代理 + HTTPS |
| `../supabase/schema.sql` | Supabase SQL Editor | 建表、触发器、行级权限、存储桶 |

## 三个平台的最短路径

### Cloudflare Pages
1. GitHub 上传 `site/` 里的全部文件（`index.html` 在根）；
2. Pages → Connect to Git → Framework: None，Build command 留空，Output directory `/`；
3. Deploy。`_redirects` 会自动生效。

### Netlify
1. 把 `netlify.toml` 放到仓库根（和 `index.html` 同级）；
2. New site from Git → Publish directory `.` → Deploy。

### 国内服务器（Nginx）
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp -r site/* /var/www/sixi/
sudo cp deploy/nginx.conf /etc/nginx/sites-available/sixi
sudo ln -s /etc/nginx/sites-available/sixi /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d notes.example.com
```

## 注意

- 静态托管只需要 `_redirects`；`netlify.toml` / `vercel.json` 只在你用对应平台时才需要。
- 换成自己的域名后，把 `manifest.webmanifest` 里的 `start_url` 保持相对路径即可，不用改。
- 接后端后，把 `Content-Security-Policy` 加到安全头里（先确认 Supabase 域名再放开）。
