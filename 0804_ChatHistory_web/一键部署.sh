#!/bin/bash
# 古月今语 - 一键部署脚本
# 在你的Mac上运行这个脚本即可完成整个部署过程

set -e

echo "🌙 古月今语 - 开始一键部署"
echo "================================="

# 服务器信息
SERVER_IP="43.154.125.229"
SERVER_USER="ubuntu"
SERVER_PASS="Hxy201027."
PROJECT_DIR="/var/www/guyuejinyu"

echo "📡 连接服务器：$SERVER_IP"
echo "👤 用户：$SERVER_USER"

# 1. 上传项目文件
echo "📤 上传项目文件..."
scp -r ./* $SERVER_USER@$SERVER_IP:/tmp/guyuejinyu/

# 2. 远程执行部署命令
echo "🚀 开始远程部署..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
set -e

echo "🔧 安装系统依赖..."
sudo apt update >/dev/null 2>&1
sudo apt install -y python3 python3-pip python3-venv supervisor nginx >/dev/null 2>&1

echo "📁 创建项目目录..."
sudo mkdir -p /var/www/guyuejinyu
sudo chown ubuntu:ubuntu /var/www/guyuejinyu

echo "📂 移动项目文件..."
sudo mv /tmp/guyuejinyu/* /var/www/guyuejinyu/
cd /var/www/guyuejinyu

echo "🐍 配置Python环境..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip >/dev/null 2>&1
pip install -r requirements.txt >/dev/null 2>&1
pip install gunicorn >/dev/null 2>&1

echo "📝 创建必要目录..."
mkdir -p logs
chmod +x deploy.sh

echo "⚙️  配置系统服务..."
sudo cp supervisor.conf /etc/supervisor/conf.d/guyuejinyu.conf
sudo supervisorctl reread >/dev/null 2>&1
sudo supervisorctl update >/dev/null 2>&1

echo "🔥 启动应用服务..."
sudo supervisorctl start guyuejinyu

echo "🛡️  配置防火墙..."
sudo ufw allow 6888 >/dev/null 2>&1
sudo ufw allow 22 >/dev/null 2>&1
sudo ufw --force enable >/dev/null 2>&1

echo "✅ 检查服务状态..."
sudo supervisorctl status guyuejinyu

echo "🎉 部署完成！"
echo "访问地址：http://43.154.125.229:6888"
echo "管理后台：http://43.154.125.229:6888/admin"
echo "管理员账号：admin / admin123"
EOF

echo ""
echo "🎊 一键部署完成！"
echo "================================="
echo "🌐 访问地址："
echo "   用户端：http://43.154.125.229:6888"
echo "   管理端：http://43.154.125.229:6888/admin"
echo ""
echo "🔑 管理员账号："
echo "   用户名：admin"
echo "   密码：admin123"
echo "================================="