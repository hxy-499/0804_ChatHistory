#!/bin/bash
# -*- coding: utf-8 -*-

# 古月今语 - 自动部署脚本
# 运行此脚本可自动完成服务器环境配置

set -e  # 遇到错误立即退出

echo "🌙 古月今语 - 开始部署到生产环境"
echo "=================================="

# 检查是否在正确的目录
if [ ! -f "app.py" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 创建虚拟环境
echo "📦 创建Python虚拟环境..."
python3 -m venv venv
source venv/bin/activate

# 安装依赖
echo "📥 安装项目依赖..."
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs
mkdir -p static/js
mkdir -p templates

# 设置文件权限
echo "🔐 设置文件权限..."
chmod +x start.py
chmod +x wsgi.py
chmod +x deploy.sh

# 测试应用
echo "🧪 测试应用启动..."
python3 -c "from app import app; print('✅ 应用导入成功')"

echo ""
echo "✅ 部署准备完成！"
echo "=================================="
echo "📖 接下来的步骤："
echo "1. 配置Supervisor: sudo cp supervisor.conf /etc/supervisor/conf.d/guyuejinyu.conf"
echo "2. 启动服务: sudo supervisorctl reread && sudo supervisorctl update"
echo "3. 检查状态: sudo supervisorctl status guyuejinyu"
echo "4. 配置防火墙: sudo ufw allow 6888"
echo ""
echo "🌐 部署完成后访问："
echo "   用户端: http://$(curl -s ifconfig.me):6888"
echo "   管理员: http://$(curl -s ifconfig.me):6888/admin"
echo "=================================="