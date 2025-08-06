# -*- coding: utf-8 -*-
"""
古月今语 - Gunicorn生产环境配置
"""

# 服务器绑定地址和端口
bind = "0.0.0.0:6888"

# 工作进程数（建议设置为 CPU核心数 * 2 + 1）
workers = 4

# 工作模式
worker_class = "sync"

# 每个工作进程的连接数
worker_connections = 1000

# 请求超时时间（秒）
timeout = 30

# 保持连接时间（秒）
keepalive = 2

# 每个工作进程最大请求数（防止内存泄漏）
max_requests = 1000
max_requests_jitter = 100

# 是否后台运行
daemon = False

# 进程ID文件
pidfile = "/var/www/guyuejinyu/gunicorn.pid"

# 运行用户和组
user = "Ubuntu"
group = "Ubuntu"

# 日志配置
errorlog = "/var/www/guyuejinyu/logs/gunicorn_error.log"
accesslog = "/var/www/guyuejinyu/logs/gunicorn_access.log"
loglevel = "info"

# 预加载应用（提高性能）
preload_app = True

# 工作进程重启阈值
max_requests = 1000