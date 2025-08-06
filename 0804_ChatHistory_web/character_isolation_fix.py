#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
角色隔离修复工具
修复自定义角色的用户隔离问题
"""

import sqlite3
import os
from datetime import datetime

def backup_database(db_path="guyuejinyu.db"):
    """备份原数据库"""
    backup_path = f"guyuejinyu_backup_character_fix_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    
    if os.path.exists(db_path):
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"✅ 数据库已备份到: {backup_path}")
        return backup_path
    else:
        print("❌ 数据库文件不存在")
        return None

def add_user_id_column(db_path="guyuejinyu.db"):
    """为角色表添加user_id字段"""
    if not os.path.exists(db_path):
        print("❌ 数据库文件不存在")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 检查user_id字段是否已存在
        cursor.execute("PRAGMA table_info(characters)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'user_id' not in columns:
            print("🔧 为角色表添加user_id字段...")
            cursor.execute("ALTER TABLE characters ADD COLUMN user_id TEXT")
            conn.commit()
            print("✅ 成功添加user_id字段")
        else:
            print("✅ user_id字段已存在")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ 添加字段失败: {e}")
        return False

def analyze_character_data(db_path="guyuejinyu.db"):
    """分析角色数据"""
    if not os.path.exists(db_path):
        print("❌ 数据库文件不存在")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 统计角色数据
        cursor.execute("SELECT COUNT(*) FROM characters")
        total_characters = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM characters WHERE user_id IS NULL")
        default_characters = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM characters WHERE user_id IS NOT NULL")
        custom_characters = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM characters WHERE id LIKE 'custom_%'")
        custom_prefix_characters = cursor.fetchone()[0]
        
        print("\n📊 角色数据分析:")
        print("=" * 50)
        print(f"总角色数: {total_characters}")
        print(f"默认角色数: {default_characters}")
        print(f"已关联用户的自定义角色: {custom_characters}")
        print(f"未关联用户的自定义角色: {custom_prefix_characters - custom_characters}")
        
        # 显示需要修复的角色
        cursor.execute("""
            SELECT id, name, user_id FROM characters 
            WHERE id LIKE 'custom_%' AND user_id IS NULL
        """)
        unassigned_characters = cursor.fetchall()
        
        if unassigned_characters:
            print(f"\n⚠️  需要修复的自定义角色 ({len(unassigned_characters)} 个):")
            for char_id, name, user_id in unassigned_characters:
                print(f"  - {name} (ID: {char_id})")
        else:
            print("\n✅ 所有自定义角色都已正确关联用户")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 分析失败: {e}")

def fix_unassigned_characters(db_path="guyuejinyu.db"):
    """修复未分配用户的自定义角色"""
    if not os.path.exists(db_path):
        print("❌ 数据库文件不存在")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 查找未分配用户的自定义角色
        cursor.execute("""
            SELECT id, name FROM characters 
            WHERE id LIKE 'custom_%' AND user_id IS NULL
        """)
        unassigned_characters = cursor.fetchall()
        
        if not unassigned_characters:
            print("✅ 没有需要修复的角色")
            conn.close()
            return True
        
        print(f"\n🔧 修复 {len(unassigned_characters)} 个未分配的自定义角色...")
        
        # 选择处理方式
        print("\n选择处理方式:")
        print("1. 删除这些角色（推荐 - 因为无法确定原始创建者）")
        print("2. 保留角色但标记为系统角色")
        print("3. 取消操作")
        
        choice = input("请选择 (1/2/3): ").strip()
        
        if choice == '1':
            # 删除未分配的自定义角色
            for char_id, name in unassigned_characters:
                # 删除相关的对话记录
                cursor.execute('DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE character_id = ?)', (char_id,))
                cursor.execute('DELETE FROM conversations WHERE character_id = ?', (char_id,))
                # 删除角色
                cursor.execute('DELETE FROM characters WHERE id = ?', (char_id,))
                print(f"  ✅ 已删除角色: {name}")
            
            conn.commit()
            print(f"\n✅ 成功删除 {len(unassigned_characters)} 个未分配的自定义角色")
            
        elif choice == '2':
            # 保留角色但不分配用户（作为系统角色）
            print(f"✅ 保留 {len(unassigned_characters)} 个角色作为系统角色")
            
        else:
            print("❌ 操作已取消")
            conn.close()
            return False
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ 修复失败: {e}")
        return False

def verify_character_isolation(db_path="guyuejinyu.db"):
    """验证角色隔离效果"""
    if not os.path.exists(db_path):
        print("❌ 数据库文件不存在")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("\n🧪 验证角色隔离效果:")
        print("=" * 50)
        
        # 统计角色分布
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN user_id IS NULL THEN '系统默认角色'
                    ELSE SUBSTR(user_id, 1, 8) || '...'
                END as user_category,
                COUNT(*) as count
            FROM characters 
            GROUP BY user_category
            ORDER BY count DESC
        """)
        
        distribution = cursor.fetchall()
        
        for category, count in distribution:
            print(f"{category}: {count} 个角色")
        
        # 检查是否还有未分配的自定义角色
        cursor.execute("SELECT COUNT(*) FROM characters WHERE id LIKE 'custom_%' AND user_id IS NULL")
        unassigned_count = cursor.fetchone()[0]
        
        if unassigned_count == 0:
            print("\n✅ 角色隔离修复成功！")
            print("✅ 现在每个用户只能看到系统默认角色和自己创建的角色")
        else:
            print(f"\n⚠️  仍有 {unassigned_count} 个未分配的自定义角色")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 验证失败: {e}")

def main():
    print("🎭 古月今语 - 角色隔离修复工具")
    print("=" * 50)
    
    # 1. 备份数据库
    print("\n1. 备份数据库...")
    backup_path = backup_database()
    if not backup_path:
        return
    
    # 2. 添加user_id字段
    print("\n2. 更新数据库结构...")
    if not add_user_id_column():
        return
    
    # 3. 分析当前数据
    print("\n3. 分析角色数据...")
    analyze_character_data()
    
    # 4. 修复未分配的角色
    print("\n4. 修复角色隔离...")
    if fix_unassigned_characters():
        print("\n5. 验证修复效果...")
        verify_character_isolation()
        
        print(f"\n🎉 角色隔离修复完成！")
        print(f"📁 备份文件: {backup_path}")
        print(f"🔄 建议重启应用服务器以确保更改生效")
    else:
        print("\n❌ 修复失败，请检查错误信息")

if __name__ == "__main__":
    main()