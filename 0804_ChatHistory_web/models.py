#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3
import json
import os
from datetime import datetime

class Database:
    def __init__(self, db_path="guyuejinyu.db"):
        self.db_path = db_path
        self.init_database()
        self.init_default_characters()
    
    def get_connection(self):
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        """初始化数据库表"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 用户配置表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_configs (
                user_id TEXT PRIMARY KEY,
                api_key TEXT,
                text_model TEXT DEFAULT 'qwen-plus',
                image_model TEXT DEFAULT 'wan2.2-t2i-flash',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 角色表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS characters (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                style TEXT,
                avatar_url TEXT,
                generated_avatar_url TEXT,
                system_prompt TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 检查并添加缺失的字段
        try:
            cursor.execute("SELECT generated_avatar_url FROM characters LIMIT 1")
        except Exception:
            # 如果字段不存在，添加它
            cursor.execute("ALTER TABLE characters ADD COLUMN generated_avatar_url TEXT")
            print("已添加 generated_avatar_url 字段到 characters 表")
        
        # 检查并添加user_id字段（用于角色隔离）
        try:
            cursor.execute("SELECT user_id FROM characters LIMIT 1")
        except Exception:
            # 如果字段不存在，添加它
            cursor.execute("ALTER TABLE characters ADD COLUMN user_id TEXT")
            print("已添加 user_id 字段到 characters 表，实现角色用户隔离")
        
        # 对话表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                character_id TEXT,
                title TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (character_id) REFERENCES characters (id)
            )
        ''')
        
        # 消息表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT,
                user_id TEXT,
                character_id TEXT,
                user_message TEXT,
                ai_response TEXT,
                is_image_request BOOLEAN DEFAULT 0,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations (id),
                FOREIGN KEY (character_id) REFERENCES characters (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def init_default_characters(self):
        """初始化默认角色"""
        characters = [
            {
                'id': 'kongzi',
                'name': '孔子',
                'description': '春秋时期著名思想家、教育家，儒家学派创始人',
                'style': '温文尔雅，循循善诱，喜用比喻，语言庄重而富有哲理',
                'avatar_url': '',
                'system_prompt': '孔子（公元前551年－公元前479年），字仲尼，春秋时期鲁国人，中国古代思想家、教育家，儒家学派创始人。以仁、义、礼、智、信为核心思想，主张"有教无类"，注重道德修养和社会秩序。'
            },
            {
                'id': 'libai',
                'name': '李白',
                'description': '唐代伟大的浪漫主义诗人，被誉为"诗仙"',
                'style': '豪放不羁，想象奇特，语言飘逸，常用夸张和比喻，富有浪漫色彩',
                'avatar_url': '',
                'system_prompt': '李白（701年－762年），字太白，号青莲居士，唐代伟大的浪漫主义诗人，被誉为"诗仙"。性格豪放，喜好饮酒作诗，追求自由，蔑视权贵，其诗风雄奇豪放，想象丰富。'
            },
            {
                'id': 'zhugeliang',
                'name': '诸葛亮',
                'description': '三国时期蜀汉丞相，杰出的政治家、军事家、发明家',
                'style': '智慧深邃，言辞谨慎，善于分析，语言简练而富有逻辑性',
                'avatar_url': '',
                'system_prompt': '诸葛亮（181年－234年），字孔明，号卧龙，三国时期蜀汉丞相，杰出的政治家、军事家、发明家。以智谋著称，忠诚于蜀汉，鞠躬尽瘁，死而后已。'
            },
            {
                'id': 'wuzetian',
                'name': '武则天',
                'description': '中国历史上唯一的正统女皇帝，政治家',
                'style': '威严果断，智慧过人，语言简练有力，体现女性领导者的魅力',
                'avatar_url': '',
                'system_prompt': '武则天（624年－705年），中国历史上唯一的正统女皇帝，杰出的政治家。善于用人，推行科举制度，促进文化发展，统治期间社会相对稳定。'
            },
            {
                'id': 'wangyangming',
                'name': '王阳明',
                'description': '明代著名哲学家、教育家、军事家，心学集大成者',
                'style': '深邃睿智，注重内心修养，语言精练，富有哲理性和启发性',
                'avatar_url': '',
                'system_prompt': '王阳明（1472年－1529年），名守仁，字伯安，明代著名哲学家、教育家、军事家，心学集大成者。主张"心即理"、"知行合一"、"致良知"，强调内心的道德修养。'
            }
        ]
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        for char in characters:
            # 检查角色是否已存在
            cursor.execute('SELECT id FROM characters WHERE id = ?', (char['id'],))
            if not cursor.fetchone():
                cursor.execute('''
                    INSERT INTO characters (id, name, description, style, avatar_url, system_prompt)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (char['id'], char['name'], char['description'], char['style'], 
                     char['avatar_url'], char['system_prompt']))
        
        conn.commit()
        conn.close()
    
    def get_characters(self, user_id=None):
        """获取角色列表（包含默认角色和用户自定义角色）"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if user_id:
            # 获取默认角色（user_id为空）和当前用户的自定义角色
            cursor.execute('''
                SELECT * FROM characters 
                WHERE user_id IS NULL OR user_id = ? 
                ORDER BY created_at
            ''', (user_id,))
        else:
            # 如果没有提供user_id，只返回默认角色
            cursor.execute('''
                SELECT * FROM characters 
                WHERE user_id IS NULL 
                ORDER BY created_at
            ''')
        
        characters = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return characters
    
    def get_character(self, character_id):
        """获取特定角色"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM characters WHERE id = ?', (character_id,))
        character = cursor.fetchone()
        conn.close()
        return dict(character) if character else None
    
    def save_user_config(self, user_id, config):
        """保存用户配置"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO user_configs 
            (user_id, api_key, text_model, image_model, updated_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, config.get('api_key'), config.get('text_model', 'qwen-plus'),
              config.get('image_model', 'wan2.2-t2i-flash'), datetime.now()))
        
        conn.commit()
        conn.close()
    
    def get_user_config(self, user_id):
        """获取用户配置"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM user_configs WHERE user_id = ?', (user_id,))
        config = cursor.fetchone()
        conn.close()
        return dict(config) if config else None
    
    def save_message(self, conversation_id, user_id, character_id, user_message, ai_response, image_url=None):
        """保存对话消息"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 先确保对话记录存在
        cursor.execute('SELECT id FROM conversations WHERE id = ?', (conversation_id,))
        if not cursor.fetchone():
            # 创建新对话
            character = self.get_character(character_id)
            title = f"与{character['name']}的对话" if character else "新对话"
            cursor.execute('''
                INSERT INTO conversations (id, user_id, character_id, title)
                VALUES (?, ?, ?, ?)
            ''', (conversation_id, user_id, character_id, title))
        
        # 保存消息
        cursor.execute('''
            INSERT INTO messages 
            (conversation_id, user_id, character_id, user_message, ai_response, image_url)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (conversation_id, user_id, character_id, user_message, ai_response, image_url))
        
        # 更新对话的最后更新时间
        cursor.execute('''
            UPDATE conversations SET updated_at = ? WHERE id = ?
        ''', (datetime.now(), conversation_id))
        
        conn.commit()
        conn.close()
    
    def get_chat_history(self, conversation_id, limit=50):
        """获取对话历史"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM messages 
            WHERE conversation_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        ''', (conversation_id, limit))
        
        messages = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return list(reversed(messages))  # 按时间正序返回
    
    def get_conversations(self, user_id):
        """获取用户的对话列表"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT c.*, ch.name as character_name
            FROM conversations c
            LEFT JOIN characters ch ON c.character_id = ch.id
            WHERE c.user_id = ?
            ORDER BY c.updated_at DESC
        ''', (user_id,))
        
        conversations = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return conversations
    
    def update_character_avatar(self, character_id, avatar_url):
        """更新角色的生成头像"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE characters 
            SET generated_avatar_url = ? 
            WHERE id = ?
        ''', (avatar_url, character_id))
        
        conn.commit()
        conn.close()
    
    def add_custom_character(self, character_data, user_id):
        """添加自定义角色"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO characters (id, name, description, style, avatar_url, system_prompt, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                character_data['id'],
                character_data['name'], 
                character_data['description'],
                character_data['style'],
                character_data.get('avatar_url', ''),
                character_data['system_prompt'],
                user_id
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"添加角色失败: {e}")
            conn.close()
            return False
    
    def delete_custom_character(self, character_id):
        """删除自定义角色"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # 删除角色相关的所有对话记录
            cursor.execute('DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE character_id = ?)', (character_id,))
            cursor.execute('DELETE FROM conversations WHERE character_id = ?', (character_id,))
            
            # 删除角色
            cursor.execute('DELETE FROM characters WHERE id = ?', (character_id,))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"删除角色失败: {e}")
            conn.close()
            return False
    
    # ====== 管理员相关方法 ======
    
    def get_admin_stats(self):
        """获取管理员统计数据"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 总用户数
        cursor.execute('SELECT COUNT(DISTINCT user_id) FROM conversations')
        total_users = cursor.fetchone()[0]
        
        # 总对话数
        cursor.execute('SELECT COUNT(*) FROM conversations')
        total_conversations = cursor.fetchone()[0]
        
        # 总消息数
        cursor.execute('SELECT COUNT(*) FROM messages')
        total_messages = cursor.fetchone()[0]
        
        # 今日新增对话
        cursor.execute('''
            SELECT COUNT(*) FROM conversations 
            WHERE DATE(created_at) = DATE('now')
        ''')
        today_conversations = cursor.fetchone()[0]
        
        # 最受欢迎的角色
        cursor.execute('''
            SELECT c.name, COUNT(conv.id) as conversation_count
            FROM characters c
            LEFT JOIN conversations conv ON c.id = conv.character_id
            GROUP BY c.id, c.name
            ORDER BY conversation_count DESC
            LIMIT 5
        ''')
        popular_characters = cursor.fetchall()
        
        # 用户活跃度（最近7天）
        cursor.execute('''
            SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as active_users
            FROM conversations
            WHERE created_at >= datetime('now', '-7 days')
            GROUP BY DATE(created_at)
            ORDER BY date
        ''')
        user_activity = cursor.fetchall()
        
        conn.close()
        
        return {
            'total_users': total_users,
            'total_conversations': total_conversations,
            'total_messages': total_messages,
            'today_conversations': today_conversations,
            'popular_characters': [dict(row) for row in popular_characters],
            'user_activity': [dict(row) for row in user_activity]
        }
    
    def get_all_conversations(self, page=1, limit=20):
        """获取所有对话记录（分页）"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        offset = (page - 1) * limit
        
        cursor.execute('''
            SELECT 
                conv.id,
                conv.user_id,
                conv.title,
                c.name as character_name,
                conv.created_at,
                COUNT(m.id) as message_count
            FROM conversations conv
            LEFT JOIN characters c ON conv.character_id = c.id
            LEFT JOIN messages m ON conv.id = m.conversation_id
            GROUP BY conv.id
            ORDER BY conv.created_at DESC
            LIMIT ? OFFSET ?
        ''', (limit, offset))
        
        conversations = cursor.fetchall()
        
        # 获取总数
        cursor.execute('SELECT COUNT(*) FROM conversations')
        total = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            'conversations': [dict(row) for row in conversations],
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        }
    
    def get_user_statistics(self):
        """获取用户统计数据"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 用户活跃度分析
        cursor.execute('''
            SELECT 
                user_id,
                COUNT(DISTINCT conversation_id) as conversation_count,
                COUNT(*) as message_count,
                MAX(created_at) as last_active
            FROM messages
            GROUP BY user_id
            ORDER BY message_count DESC
            LIMIT 20
        ''')
        active_users = cursor.fetchall()
        
        # 用户偏好角色分析
        cursor.execute('''
            SELECT 
                c.name as character_name,
                COUNT(DISTINCT m.user_id) as user_count,
                COUNT(m.id) as message_count
            FROM messages m
            LEFT JOIN characters c ON m.character_id = c.id
            GROUP BY m.character_id, c.name
            ORDER BY user_count DESC
        ''')
        character_preferences = cursor.fetchall()
        
        conn.close()
        
        return {
            'active_users': [dict(row) for row in active_users],
            'character_preferences': [dict(row) for row in character_preferences]
        }
    
    def get_performance_stats(self):
        """获取AI性能统计"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 按小时统计消息量
        cursor.execute('''
            SELECT 
                strftime('%H', created_at) as hour,
                COUNT(*) as message_count,
                AVG(CASE WHEN ai_response != '' THEN 1 ELSE 0 END) as success_rate
            FROM messages
            WHERE created_at >= datetime('now', '-24 hours')
            GROUP BY strftime('%H', created_at)
            ORDER BY hour
        ''')
        hourly_stats = cursor.fetchall()
        
        # 响应成功率
        cursor.execute('''
            SELECT 
                COUNT(*) as total_messages,
                SUM(CASE WHEN ai_response != '' AND ai_response IS NOT NULL THEN 1 ELSE 0 END) as successful_responses
            FROM messages
            WHERE created_at >= datetime('now', '-7 days')
        ''')
        response_stats = cursor.fetchone()
        success_rate = 0
        if response_stats[0] > 0:
            success_rate = (response_stats[1] / response_stats[0]) * 100
        
        # 图片生成统计
        cursor.execute('''
            SELECT 
                COUNT(*) as total_image_requests,
                SUM(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 ELSE 0 END) as successful_images
            FROM messages
            WHERE is_image_request = 1 AND created_at >= datetime('now', '-7 days')
        ''')
        image_stats = cursor.fetchone()
        
        conn.close()
        
        return {
            'hourly_stats': [dict(row) for row in hourly_stats],
            'success_rate': round(success_rate, 2),
            'response_stats': dict(response_stats),
            'image_stats': dict(image_stats) if image_stats else {'total_image_requests': 0, 'successful_images': 0}
        }