#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
古月今语 - 启动脚本
运行此文件启动应用服务器
"""

import os
import sys
from app import app

if __name__ == '__main__':
    # 设置环境变量
    os.environ.setdefault('FLASK_ENV', 'development')
    
    # 创建必要的目录
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    
    print("🌙 古月今语 - 历史人物对话系统")
    print("=" * 50)
    print("💡 项目特色：")
    print("   ✨ 与历史名人对话")
    print("   🛡️ 提示词注入防御")
    print("   🎨 阿里云百炼API集成")
    print("   🖼️ 支持图像生成")
    print("=" * 50)
    print(f"🚀 服务器启动地址: http://localhost:6888")
    print("📖 使用说明：")
    print("   1. 打开浏览器访问上述地址")
    print("   2. 点击'API配置'设置阿里云百炼API Key")
    print("   3. 选择历史人物开始对话")
    print("=" * 50)
    
    try:
        app.run(
            debug=True,
            host='0.0.0.0',
            port=6888,
            use_reloader=True
        )
    except KeyboardInterrupt:
        print("\n👋 感谢使用古月今语！")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ 启动失败：{e}")
        sys.exit(1)