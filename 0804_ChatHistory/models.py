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
    
    def get_characters(self):
        """获取所有角色"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM characters ORDER BY created_at')
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
    
    def add_custom_character(self, character_data):
        """添加自定义角色"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO characters (id, name, description, style, avatar_url, system_prompt)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                character_data['id'],
                character_data['name'], 
                character_data['description'],
                character_data['style'],
                character_data.get('avatar_url', ''),
                character_data['system_prompt']
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