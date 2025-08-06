#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
隐私修复工具
用于清理共享的默认用户数据，确保用户隐私
"""

import sqlite3
import os
from datetime import datetime

def backup_database(db_path="guyuejinyu.db"):
    """备份原数据库"""
    backup_path = f"guyuejinyu_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    
    if os.path.exists(db_path):
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"✅ 数据库已备份到: {backup_path}")
        return backup_path
    else:
        print("❌ 数据库文件不存在")
        return None

def clean_default_user_data(db_path="guyuejinyu.db"):
    """清理default用户的数据"""
    if not os.path.exists(db_path):
        print("❌ 数据库文件不存在")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 统计要删除的数据
        cursor.execute("SELECT COUNT(*) FROM user_configs WHERE user_id = 'default'")
        config_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM conversations WHERE user_id = 'default'")
        conversation_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM messages WHERE user_id = 'default'")
        message_count = cursor.fetchone()[0]
        
        print(f"准备清理数据:")
        print(f"  - 用户配置: {config_count} 条")
        print(f"  - 对话记录: {conversation_count} 条")
        print(f"  - 消息记录: {message_count} 条")
        
        if config_count + conversation_count + message_count == 0:
            print("✅ 没有需要清理的default用户数据")
            conn.close()
            return True
        
        # 询问用户确认
        confirm = input("\n确认清理以上数据吗？(输入 'YES' 确认): ")
        if confirm != 'YES':
            print("❌ 操作已取消")
            conn.close()
            return False
        
        # 清理数据
        cursor.execute("DELETE FROM messages WHERE user_id = 'default'")
        cursor.execute("DELETE FROM conversations WHERE user_id = 'default'")
        cursor.execute("DELETE FROM user_configs WHERE user_id = 'default'")
        
        conn.commit()
        conn.close()
        
        print("✅ 成功清理default用户数据")
        print("✅ 现在每个用户都有独立的数据空间")
        return True
        
    except Exception as e:
        print(f"❌ 清理失败: {e}")
        return False

def verify_user_isolation(db_path="guyuejinyu.db"):
    """验证用户隔离效果"""
    if not os.path.exists(db_path):
        print("❌ 数据库文件不存在")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 统计用户数据
        cursor.execute("SELECT user_id, COUNT(*) FROM user_configs GROUP BY user_id")
        configs = cursor.fetchall()
        
        cursor.execute("SELECT user_id, COUNT(*) FROM conversations GROUP BY user_id")
        conversations = cursor.fetchall()
        
        cursor.execute("SELECT user_id, COUNT(*) FROM messages GROUP BY user_id")
        messages = cursor.fetchall()
        
        print("\n当前用户数据分布:")
        print("=" * 50)
        
        all_users = set()
        for data in [configs, conversations, messages]:
            for user_id, _ in data:
                all_users.add(user_id)
        
        for user_id in all_users:
            config_count = next((count for uid, count in configs if uid == user_id), 0)
            conv_count = next((count for uid, count in conversations if uid == user_id), 0)
            msg_count = next((count for uid, count in messages if uid == user_id), 0)
            
            user_display = user_id[:8] + "..." if len(user_id) > 12 else user_id
            print(f"用户 {user_display}: 配置({config_count}) 对话({conv_count}) 消息({msg_count})")
        
        if 'default' in all_users:
            print("\n⚠️  警告: 仍存在'default'用户数据，隐私问题未完全解决")
        else:
            print("\n✅ 隐私修复成功：所有用户数据已隔离")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 验证失败: {e}")

def main():
    print("🔒 古月今语 - 隐私修复工具")
    print("=" * 40)
    
    # 1. 备份数据库
    print("\n1. 备份数据库...")
    backup_path = backup_database()
    if not backup_path:
        return
    
    # 2. 验证当前状态
    print("\n2. 检查当前数据状态...")
    verify_user_isolation()
    
    # 3. 清理共享数据
    print("\n3. 清理共享数据...")
    if clean_default_user_data():
        print("\n4. 验证修复效果...")
        verify_user_isolation()
        
        print(f"\n🎉 隐私修复完成！")
        print(f"📁 备份文件: {backup_path}")
        print(f"💡 现在每个用户访问网站时都会有独立的数据空间")
        print(f"🔄 建议重启应用服务器以确保更改生效")
    else:
        print("\n❌ 修复失败，请检查错误信息")

if __name__ == "__main__":
    main()