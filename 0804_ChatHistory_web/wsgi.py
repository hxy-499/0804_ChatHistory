#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
古月今语 - WSGI生产环境启动文件
用于Gunicorn等WSGI服务器
"""

from app import app

if __name__ == "__main__":
    app.run()