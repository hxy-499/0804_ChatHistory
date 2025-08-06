# 🌙 古月今语 - 云服务器部署指南

## 📋 服务器信息
- **服务器IP**: 43.154.125.229
- **账号**: Ubuntu
- **密码**: Hxy201027.

## 🚀 部署步骤

### 1. 连接服务器
```bash
# 使用SSH连接服务器
ssh Ubuntu@43.154.125.229
# 输入密码: Hxy201027.
```

### 2. 系统环境准备
```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装Python3和pip
sudo apt install python3 python3-pip python3-venv -y

# 安装其他必要工具
sudo apt install git nginx supervisor -y

# 检查Python版本
python3 --version
```

### 3. 创建项目目录
```bash
# 创建项目目录
sudo mkdir -p /var/www/guyuejinyu
sudo chown Ubuntu:Ubuntu /var/www/guyuejinyu
cd /var/www/guyuejinyu
```

### 4. 上传项目文件
有两种方式上传项目：

#### 方式一：使用SCP上传（推荐）
在本地电脑上执行：
```bash
# 进入项目目录
cd /Users/hanxiyu/Desktop/wpsAI/hanxiyu/0804_ChatHistory_web

# 上传整个项目
scp -r ./* Ubuntu@43.154.125.229:/var/www/guyuejinyu/
```

#### 方式二：使用Git（如果有仓库）
```bash
# 在服务器上克隆
git clone <your-repo-url> .
```

### 5. 创建虚拟环境
```bash
cd /var/www/guyuejinyu

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 安装生产环境服务器
pip install gunicorn
```

### 6. 配置生产环境启动文件
创建生产环境启动文件：
```bash
nano /var/www/guyuejinyu/wsgi.py
```

添加以下内容：
```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from app import app

if __name__ == "__main__":
    app.run()
```

### 7. 测试应用
```bash
# 激活虚拟环境
source venv/bin/activate

# 测试运行
python3 start.py
```

如果看到启动信息，按 `Ctrl+C` 停止，继续下一步。

### 8. 配置Gunicorn服务
创建Gunicorn配置文件：
```bash
nano /var/www/guyuejinyu/gunicorn.conf.py
```

添加以下内容：
```python
# Gunicorn配置文件
bind = "0.0.0.0:6888"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
daemon = False
pidfile = "/var/www/guyuejinyu/gunicorn.pid"
user = "Ubuntu"
group = "Ubuntu"
errorlog = "/var/www/guyuejinyu/logs/gunicorn_error.log"
accesslog = "/var/www/guyuejinyu/logs/gunicorn_access.log"
loglevel = "info"
```

创建日志目录：
```bash
mkdir -p /var/www/guyuejinyu/logs
```

### 9. 配置Supervisor守护进程
创建Supervisor配置：
```bash
sudo nano /etc/supervisor/conf.d/guyuejinyu.conf
```

添加以下内容：
```ini
[program:guyuejinyu]
command=/var/www/guyuejinyu/venv/bin/gunicorn -c /var/www/guyuejinyu/gunicorn.conf.py wsgi:app
directory=/var/www/guyuejinyu
user=Ubuntu
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/www/guyuejinyu/logs/supervisor.log
```

启动Supervisor：
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start guyuejinyu
sudo supervisorctl status
```

### 10. 配置防火墙
```bash
# 允许6888端口
sudo ufw allow 6888
sudo ufw allow ssh
sudo ufw --force enable
sudo ufw status
```

### 11. 配置Nginx反向代理（可选但推荐）
创建Nginx配置：
```bash
sudo nano /etc/nginx/sites-available/guyuejinyu
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name 43.154.125.229;

    location / {
        proxy_pass http://127.0.0.1:6888;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态文件直接由Nginx处理
    location /static {
        alias /var/www/guyuejinyu/static;
        expires 30d;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/guyuejinyu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 12. 最终测试
```bash
# 检查服务状态
sudo supervisorctl status guyuejinyu
sudo systemctl status nginx

# 查看日志
tail -f /var/www/guyuejinyu/logs/supervisor.log
```

## 🌐 访问应用

### 直接访问（端口6888）
- 用户端：http://43.154.125.229:6888
- 管理员后台：http://43.154.125.229:6888/admin

### 通过Nginx访问（端口80）
- 用户端：http://43.154.125.229
- 管理员后台：http://43.154.125.229/admin

## 🔧 维护命令

```bash
# 重启应用
sudo supervisorctl restart guyuejinyu

# 查看日志
sudo supervisorctl tail guyuejinyu

# 更新代码后重启
cd /var/www/guyuejinyu
git pull  # 如果使用Git
sudo supervisorctl restart guyuejinyu

# 备份数据库
cp guyuejinyu.db guyuejinyu_backup_$(date +%Y%m%d_%H%M%S).db
```

## 🛡️ 安全建议

1. **修改默认密码**
2. **配置HTTPS证书**（使用Let's Encrypt）
3. **设置定期备份**
4. **监控日志文件**
5. **定期更新系统**

## ⚠️ 注意事项

- 确保云服务器安全组开放了6888和80端口
- 第一次部署后记得在应用中配置阿里云API Key
- 管理员账号：admin / admin123（建议修改）

---

部署完成后即可通过公网IP访问你的"古月今语"历史人物对话系统！🎉