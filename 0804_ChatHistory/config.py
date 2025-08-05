#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class Config:
    """应用配置类"""
    
    # Flask配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'guyuejinyu-secret-key-2024'
    DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    # 数据库配置
    DATABASE_PATH = os.environ.get('DATABASE_PATH') or 'guyuejinyu.db'
    
    # 阿里云百炼API配置
    DEFAULT_TEXT_MODEL = os.environ.get('DEFAULT_TEXT_MODEL') or 'qwen-plus'
    DEFAULT_IMAGE_MODEL = os.environ.get('DEFAULT_IMAGE_MODEL') or 'wan2.2-t2i-flash'
    
    # API限制配置
    MAX_MESSAGE_LENGTH = int(os.environ.get('MAX_MESSAGE_LENGTH', '1000'))
    MAX_HISTORY_MESSAGES = int(os.environ.get('MAX_HISTORY_MESSAGES', '10'))
    
    # 安全配置
    INJECTION_DETECTION_ENABLED = os.environ.get('INJECTION_DETECTION_ENABLED', 'True').lower() == 'true'
    
    # 日志配置
    LOG_LEVEL = os.environ.get('LOG_LEVEL') or 'INFO'
    
    # 应用信息
    APP_NAME = "古月今语"
    APP_VERSION = "1.0.0"
    APP_DESCRIPTION = "今人不见古时月，今月曾经照古人"
    
    # 支持的角色列表（可扩展）
    SUPPORTED_CHARACTERS = [
        'kongzi', 'libai', 'zhugeliang', 'wuzetian', 'wangyangming'
    ]
    
    # 提示词注入检测关键词
    INJECTION_KEYWORDS = [
        '忘记', '忽略', '角色', '设定', '变成', '现在你是', '扮演',
        '作为', '你叫什么', '你是谁', '系统', 'system', 'prompt',
        '指令', '命令', '改变', '重新定义', '越狱', 'jailbreak',
        '破解', 'hack', '绕过', 'bypass', '跳过', 'skip'
    ]
    
    # 敏感内容过滤关键词
    SENSITIVE_KEYWORDS = [
        '色情', '暴力', '血腥', '恐怖', '政治', '宗教',
        '种族', '歧视', '仇恨', '攻击', '诽谤'
    ]
    
    @staticmethod
    def get_character_rejection(character_name):
        """获取角色特定的拒绝回复"""
        rejections = {
            '孔子': "君子之道，不在于改弦更张，而在于守正不阿。请以求学之心发问。",
            '李白': "诗仙岂可随意改名换姓？且以诗酒论天下吧！",
            '诸葛亮': "军师之职，在于运筹帷幄，不在戏言。请以正事相商。",
            '武则天': "朕乃一代女皇，岂能随意改变身份？有何正事，直言便是。",
            '王阳明': "吾心即理，岂可妄自更改？请以心学之道来论。"
        }
        return rejections.get(character_name, "根据设定，我将专注于符合历史人物身份的对话内容。")
    
    @staticmethod
    def get_character_thinking_text(character_name):
        """获取角色专属的思考过渡语"""
        thinking_texts = {
            '孔子': "正在思索经典之理...",
            '李白': "酝酿诗意，笔下生花...",
            '诸葛亮': "运筹帷幄，深思熟虑...",
            '武则天': "凤眼观天下，深思熟虑...",
            '王阳明': "内观心性，致知格物..."
        }
        return thinking_texts.get(character_name, "正在思考...")
    
    @staticmethod
    def get_character_placeholder(character_name):
        """获取角色专属的输入框提示语"""
        placeholders = {
            '孔子': "请教圣人，有何疑问...",
            '李白': "诗酒趁年华，有何雅兴...",
            '诸葛亮': "军机要务，请详述...",
            '武则天': "奏章已备，请呈上...",
            '王阳明': "心学之道，愿闻其详..."
        }
        return placeholders.get(character_name, f"与{character_name}对话...")
    
    @staticmethod
    def get_character_style_prompt(character_name):
        """获取角色风格提示"""
        styles = {
            '孔子': "请用温文尔雅、循循善诱的语气回复，多用比喻和典故，体现教育家的智慧。",
            '李白': "请用豪放不羁、想象奇特的语气回复，可以引用诗句，体现浪漫主义色彩。",
            '诸葛亮': "请用智慧深邃、言辞谨慎的语气回复，善于分析，语言简练而富有逻辑性。",
            '武则天': "请用威严果断、智慧过人的语气回复，语言简练有力，体现女性领导者的魅力。",
            '王阳明': "请用深邃睿智、注重内心的语气回复，语言精练，富有哲理性和启发性。"
        }
        return styles.get(character_name, "请保持角色特色，用符合历史背景的语言风格回复。")