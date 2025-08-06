# 🚀 古月今语 - 快速部署指南

## 📋 服务器信息
- **IP**: 43.154.125.229
- **账号**: ubuntu  
- **密码**: Hxy201027.

---

## ⚡ 快速部署（5分钟完成）

### 1️⃣ 连接服务器
```bash
ssh Ubuntu@43.154.125.229
# 输入密码: Hxy201027.
```

### 2️⃣ 环境准备
```bash
# 安装必要软件
sudo apt update && sudo apt install -y python3 python3-pip python3-venv git supervisor nginx

# 创建项目目录
sudo mkdir -p /var/www/guyuejinyu
sudo chown Ubuntu:Ubuntu /var/www/guyuejinyu
cd /var/www/guyuejinyu
```

### 3️⃣ 上传项目文件
**在你的本地电脑上执行：**
```bash
cd /Users/hanxiyu/Desktop/wpsAI/hanxiyu/0804_ChatHistory_web
scp -r ./* Ubuntu@43.154.125.229:/var/www/guyuejinyu/
```

### 4️⃣ 配置和启动（在服务器上）
```bash
cd /var/www/guyuejinyu

# 运行自动配置脚本
chmod +x deploy.sh
./deploy.sh

# 配置Supervisor守护进程
sudo cp supervisor.conf /etc/supervisor/conf.d/guyuejinyu.conf
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start guyuejinyu

# 配置Nginx（可选，提供80端口访问）
sudo cp nginx.conf /etc/nginx/sites-available/guyuejinyu
sudo ln -s /etc/nginx/sites-available/guyuejinyu /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# 开放防火墙端口
sudo ufw allow 6888
sudo ufw allow 80
sudo ufw --force enable
```

### 5️⃣ 验证部署
```bash
# 检查服务状态
sudo supervisorctl status guyuejinyu

# 查看日志
tail -f logs/supervisor.log
```

---

## 🌐 访问地址

### 🎯 直接访问（推荐）
- **用户端**: http://43.154.125.229:6888
- **管理员后台**: http://43.154.125.229:6888/admin

### 🌍 通过Nginx
- **用户端**: http://43.154.125.229
- **管理员后台**: http://43.154.125.229/admin

---

## 🔑 默认账号
- **管理员用户名**: admin
- **管理员密码**: admin123
- **⚠️ 首次登录后请立即修改密码**

---

## 🛠️ 常用维护命令

```bash
# 重启应用
sudo supervisorctl restart guyuejinyu

# 查看日志
sudo supervisorctl tail guyuejinyu

# 停止应用
sudo supervisorctl stop guyuejinyu

# 启动应用  
sudo supervisorctl start guyuejinyu

# 查看状态
sudo supervisorctl status
```

---

## 🎉 完成！

部署完成后，你的"古月今语"系统就可以通过公网访问了！

记得在用户界面中配置阿里云百炼API Key才能使用对话功能。

---

**🔗 项目地址**: http://43.154.125.229:6888  
**👑 管理后台**: http://43.154.125.229:6888/admin