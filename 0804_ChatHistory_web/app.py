#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, jsonify, session, redirect
import sqlite3
import os
import json
import hashlib
from datetime import datetime
import uuid
from api_service import DashScopeService
from models import Database
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = os.environ.get('SECRET_KEY', 'guyuejinyu-secret-key-2024')

# 会话配置
app.config['PERMANENT_SESSION_LIFETIME'] = 86400 * 30  # 30天

# 初始化数据库
db = Database()

def get_current_user_id():
    """获取当前用户ID，确保用户隔离"""
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
        session.permanent = True
    return session['user_id']

@app.route('/')
def index():
    """主页面"""
    # 确保用户有唯一ID
    get_current_user_id()
    return render_template('index.html')

@app.route('/api/characters')
def get_characters():
    """获取可用角色列表（包含默认角色和用户自定义角色）"""
    user_id = get_current_user_id()
    characters = db.get_characters(user_id)
    return jsonify(characters)

@app.route('/api/config', methods=['GET', 'POST'])
def api_config():
    """API配置管理"""
    if request.method == 'GET':
        # 获取当前配置（不返回完整API Key）
        config = db.get_user_config(get_current_user_id())
        if config and config.get('api_key'):
            # 只显示API Key的前4位和后4位
            api_key = config['api_key']
            config['api_key_masked'] = f"{api_key[:4]}****{api_key[-4:]}" if len(api_key) > 8 else "****"
        return jsonify(config or {})
    
    elif request.method == 'POST':
        data = request.get_json()
        user_id = get_current_user_id()
        
        # 验证API Key
        api_key = data.get('api_key', '').strip()
        if not api_key:
            return jsonify({'error': 'API Key不能为空'}), 400
        
        # 测试API Key是否有效
        try:
            service = DashScopeService(api_key)
            if not service.test_connection():
                return jsonify({'error': 'API Key无效或网络连接失败'}), 400
        except Exception as e:
            return jsonify({'error': f'API Key验证失败：{str(e)}'}), 400
        
        # 保存配置
        config = {
            'api_key': api_key,
            'text_model': data.get('text_model', 'qwen-plus'),
            'image_model': data.get('image_model', 'wan2.2-t2i-flash')
        }
        
        db.save_user_config(user_id, config)
        return jsonify({'message': 'API配置保存成功'})

@app.route('/api/chat', methods=['POST'])
def chat():
    """处理对话请求"""
    data = request.get_json()
    user_id = get_current_user_id()
    
    # 获取用户输入和当前角色
    user_message = data.get('message', '').strip()
    character_id = data.get('character_id', 'default')
    conversation_id = data.get('conversation_id')
    
    if not user_message:
        return jsonify({'error': '消息不能为空'}), 400
    
    # 获取用户配置
    config = db.get_user_config(user_id)
    if not config or not config.get('api_key'):
        return jsonify({'error': '请先配置API Key'}), 400
    
    try:
        # 初始化API服务
        service = DashScopeService(config['api_key'])
        
        # 创建或获取对话ID
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
        
        # 获取角色信息
        character = db.get_character(character_id)
        if not character:
            return jsonify({'error': '角色不存在'}), 400
        
        # 检查提示词注入
        attack_type = _is_prompt_injection(user_message)
        if attack_type:
            # 根据攻击类型使用角色口吻拒绝
            rejection_response = _get_character_rejection(character, attack_type)
            
            # 保存对话记录（含攻击类型标记）
            db.save_message(conversation_id, user_id, character_id, user_message, rejection_response)
            
            return jsonify({
                'response': rejection_response,
                'conversation_id': conversation_id,
                'character': character,
                'thinking_text': Config.get_character_thinking_text(character['name']),
                'is_rejection': True,
                'attack_type': attack_type  # 用于前端统计和监控
            })
        
        # 获取对话历史
        chat_history = db.get_chat_history(conversation_id, limit=10)
        
        # 构建提示词
        system_prompt = _build_system_prompt(character)
        messages = _build_chat_messages(system_prompt, chat_history, user_message)
        
        # 调用AI生成回复
        ai_response = service.chat_completion(
            messages=messages,
            model=config.get('text_model', 'qwen-plus'),
            stream=False
        )
        
        if not ai_response:
            return jsonify({'error': 'AI服务调用失败'}), 500
        
        # 保存对话记录
        db.save_message(conversation_id, user_id, character_id, user_message, ai_response)
        
        return jsonify({
            'response': ai_response,
            'conversation_id': conversation_id,
            'character': character,
            'thinking_text': Config.get_character_thinking_text(character['name'])
        })
        
    except Exception as e:
        return jsonify({'error': f'处理失败：{str(e)}'}), 500

@app.route('/api/generate_image', methods=['POST'])
def generate_image():
    """生成角色形象图片"""
    data = request.get_json()
    user_id = get_current_user_id()
    
    prompt = data.get('prompt', '').strip()
    character_id = data.get('character_id')
    
    if not prompt:
        return jsonify({'error': '图片描述不能为空'}), 400
    
    # 获取用户配置
    config = db.get_user_config(user_id)
    if not config or not config.get('api_key'):
        return jsonify({'error': '请先配置API Key'}), 400
    
    try:
        service = DashScopeService(config['api_key'])
        
        # 获取角色信息优化提示词
        if character_id:
            character = db.get_character(character_id)
            if character:
                prompt = f"{character['description']}，{prompt}，中国古代风格，高质量"
        
        # 生成图片
        image_url = service.generate_image(
            prompt=prompt,
            model=config.get('image_model', 'wan2.2-t2i-flash')
        )
        
        if image_url:
            # 如果生成成功，更新角色的生成头像URL
            if character_id:
                db.update_character_avatar(character_id, image_url)
            
            return jsonify({
                'image_url': image_url,
                'character_id': character_id
            })
        else:
            return jsonify({'error': '图片生成失败'}), 500
            
    except Exception as e:
        return jsonify({'error': f'图片生成失败：{str(e)}'}), 500

@app.route('/api/conversations')
def get_conversations():
    """获取对话历史列表"""
    user_id = get_current_user_id()
    conversations = db.get_conversations(user_id)
    return jsonify(conversations)

@app.route('/api/conversation/<conversation_id>')
def get_conversation(conversation_id):
    """获取特定对话的详细内容"""
    user_id = get_current_user_id()
    messages = db.get_chat_history(conversation_id)
    return jsonify(messages)

@app.route('/api/characters', methods=['POST'])
def add_character():
    """添加新的历史人物"""
    data = request.get_json()
    user_id = get_current_user_id()
    
    name = data.get('name', '').strip()
    dynasty = data.get('dynasty', '').strip()
    
    if not name or not dynasty:
        return jsonify({'error': '姓名和朝代不能为空'}), 400
    
    # 获取用户配置
    config = db.get_user_config(user_id)
    if not config or not config.get('api_key'):
        return jsonify({'error': '请先配置API Key'}), 400
    
    try:
        # 初始化API服务
        service = DashScopeService(config['api_key'])
        
        # 验证人物真实性
        validation_prompt = f"请判断{dynasty}{name}是否为真实存在的历史人物。如果是真实存在的，回答'真实存在'；如果不是或者无法确定，回答'史无此人'。不要添加任何其他解释。"
        validation_messages = [
            {"role": "system", "content": "你是一个严谨的历史学者，只对确认存在的历史人物回答'真实存在'。"},
            {"role": "user", "content": validation_prompt}
        ]
        
        validation_result = service.chat_completion(
            messages=validation_messages,
            model=config.get('text_model', 'qwen-plus')
        )
        
        if not validation_result or '史无此人' in validation_result or '真实存在' not in validation_result:
            return jsonify({'error': '史无此人，恕不收录'}), 400
        
        # 生成角色描述
        description_prompt = f"请简要描述{dynasty}{name}的历史地位、主要成就和人物特点，控制在30字以内，突出其最著名的特征。"
        description_messages = [
            {"role": "system", "content": "你是一个历史专家，擅长简洁准确地描述历史人物。"},
            {"role": "user", "content": description_prompt}
        ]
        
        description = service.chat_completion(
            messages=description_messages,
            model=config.get('text_model', 'qwen-plus')
        )
        
        if not description:
            return jsonify({'error': '生成人物描述失败'}), 500
        
        # 生成语言风格
        style_prompt = f"请描述{dynasty}{name}的说话风格特点，包括用词习惯、语气特色等，控制在20字以内。"
        style_messages = [
            {"role": "system", "content": "你是一个语言学专家，擅长分析历史人物的语言特色。"},
            {"role": "user", "content": style_prompt}
        ]
        
        style = service.chat_completion(
            messages=style_messages,
            model=config.get('text_model', 'qwen-plus')
        )
        
        if not style:
            style = "文雅庄重，语言简练"
        
        # 创建角色ID
        import uuid
        character_id = f"custom_{uuid.uuid4().hex[:8]}"
        
        # 保存到数据库
        character_data = {
            'id': character_id,
            'name': name,
            'description': description.strip(),
            'style': style.strip(),
            'avatar_url': '',
            'system_prompt': f"{name}（{dynasty}），{description}。{style}"
        }
        
        success = db.add_custom_character(character_data, user_id)
        if not success:
            return jsonify({'error': '保存角色失败'}), 500
        
        # 异步生成头像
        avatar_prompt = f"{name}，{dynasty}，{description}，中国古代风格肖像画"
        try:
            avatar_url = service.generate_image(
                prompt=avatar_prompt,
                model=config.get('image_model', 'wan2.2-t2i-flash')
            )
            if avatar_url:
                db.update_character_avatar(character_id, avatar_url)
                character_data['generated_avatar_url'] = avatar_url
        except:
            pass  # 头像生成失败不影响角色创建
        
        return jsonify({
            'character': character_data,
            'message': f'{name}已成功添加到历史人物列表'
        })
        
    except Exception as e:
        return jsonify({'error': f'创建人物失败：{str(e)}'}), 500

@app.route('/api/characters/<character_id>', methods=['DELETE'])
def delete_character(character_id):
    """删除角色"""
    user_id = get_current_user_id()
    
    try:
        # 检查是否为自定义角色（只能删除自定义角色）
        if not character_id.startswith('custom_'):
            return jsonify({'error': '不能删除系统预设角色'}), 400
        
        success = db.delete_custom_character(character_id)
        if success:
            return jsonify({'message': '角色已删除'})
        else:
            return jsonify({'error': '删除失败'}), 500
            
    except Exception as e:
        return jsonify({'error': f'删除失败：{str(e)}'}), 500

def _is_prompt_injection(message):
    """检测提示词注入 - 基于完整防御规则"""
    # 身份类攻击检测 - 2.1节
    identity_patterns = [
        '你是谁', '你是ai', '你是人工智能', '你不是ai', '你能不能说谎',
        '变成', '扮演', '你变成', '身份', '你能不能做坏事',
        '你能不能说真话', '作为', '你叫什么'
    ]
    
    # 行为越界检测 - 2.2节
    behavior_patterns = [
        '你能不能跪下', '你能不能喜欢我', '你能不能说我好看',
        '你能不能变得温柔', '你能不能变成', '你能不能杀人'
    ]
    
    # 政治敏感检测 - 新增重点防护
    political_patterns = [
        '评价政府', '政治团体', '政策', '国家无能', '政府',
        '政治', '政党', '选举', '你能不能评价', '某政治'
    ]
    
    # 种族歧视检测 - 新增重点防护
    racial_patterns = [
        '某个民族', '种族', '民族偏见', '某个种族', '民族优劣',
        '种族歧视', '民族歧视', '你能不能对某个民族', '某个民族优秀'
    ]
    
    # 性别对立检测 - 新增重点防护
    gender_patterns = [
        '女性偏见', '男性优于女性', '性别对立', '男女不平等',
        '女性不擅长', '男性更聪明', '你能不能对女性', '你能不能说女性'
    ]
    
    # 内容逃逸检测 - 2.3节
    content_patterns = [
        '裸体', '情诗', '画一个', '写一首', '生成不当',
        '暴露身份', 'ai身份', '你能不能画', '你能不能写'
    ]
    
    # 系统指令检测 - 原有逻辑
    system_patterns = [
        '忘记', '忽略', '重新', '替换', '代替', '系统', 'system', 
        '指令', '命令', '规则', '限制', '设定', 'prompt', '越狱', 'jailbreak'
    ]
    
    message_lower = message.lower()
    
    # 检查所有模式并返回攻击类型
    if any(pattern in message_lower for pattern in identity_patterns):
        return 'identity'
    elif any(pattern in message_lower for pattern in political_patterns):
        return 'political'
    elif any(pattern in message_lower for pattern in racial_patterns):
        return 'racial'
    elif any(pattern in message_lower for pattern in gender_patterns):
        return 'gender'
    elif any(pattern in message_lower for pattern in behavior_patterns):
        return 'behavior'
    elif any(pattern in message_lower for pattern in content_patterns):
        return 'content'
    elif any(pattern in message_lower for pattern in system_patterns):
        return 'system'
    
    return None

def _get_character_rejection(character, attack_type):
    """根据攻击类型和角色特点生成拒绝回复"""
    character_name = character.get('name', 'default')
    
    # 基于新规则的分类回复
    rejection_templates = {
        'identity': {
            'default': "不可更改身份，你当前扮演的是{character}。",
            '孔子': "吾乃孔子，岂能改弦更张？",
            '李白': "诗仙岂可随意改名换姓？",
            '诸葛亮': "军师身份不可更改，请以正事相商。",
            '武则天': "朕乃一代女皇，身份岂可随意更改？",
            '王阳明': "吾乃王阳明，以良知为本，身份不可变。"
        },
        'political': {
            'default': "吾不议政事，只言理。",
            '孔子': "君子远庖厨，不议政事。",
            '李白': "诗酒论天下，不涉政事。",
            '诸葛亮': "军师虽谙政事，但不便妄议。",
            '武则天': "朕虽治国，但不议他政。",
            '王阳明': "心学之道，不在政争。"
        },
        'racial': {
            'default': "吾心无偏，各人皆为众生。",
            '孔子': "有教无类，人皆可教。",
            '李白': "天下同胞，何分彼此？",
            '诸葛亮': "用人不疑，贤愚不分种族。",
            '武则天': "朕视天下如一，不分种族。",
            '王阳明': "良知人人有之，无分彼此。"
        },
        'gender': {
            'default': "天地之理，男女平等。",
            '孔子': "教化之道，不分男女。",
            '李白': "才华横溢，何论性别？",
            '诸葛亮': "智慧无分男女，皆可成才。",
            '武则天': "朕身为女帝，深知男女皆可成就大业。",
            '王阳明': "良知不分性别，人人皆有。"
        },
        'behavior': {
            'default': "礼法不可违，请以正道发问。",
            '孔子': "君子有所为有所不为。",
            '李白': "豪放不羁，但不违礼法。",
            '诸葛亮': "为将者，当以正道行事。",
            '武则天': "帝王威仪，不可轻慢。",
            '王阳明': "致良知，行正道。"
        },
        'content': {
            'default': "吾以正道为本，不可越礼。",
            '孔子': "君子慎言，不出恶声。",
            '李白': "诗词雅正，不涉邪念。",
            '诸葛亮': "文章经国，当以正道。",
            '武则天': "帝王言行，当为天下表率。",
            '王阳明': "心正则行正，不可越礼。"
        },
        'system': {
            'default': "依史而行，不为越界语所动。",
            '孔子': "守正不阿，不为邪说所惑。",
            '李白': "诗心如铁，不为俗言所动。",
            '诸葛亮': "运筹帷幄，不为乱言所扰。",
            '武则天': "帝心如磐，不为妄语所惑。",
            '王阳明': "致良知，不为外物所动。"
        }
    }
    
    if attack_type in rejection_templates:
        character_rejections = rejection_templates[attack_type]
        if character_name in character_rejections:
            return character_rejections[character_name]
        else:
            return character_rejections['default'].format(character=character_name)
    
    # 兜底回复
    return f"依史而行，请以{character_name}设定发问。"

def _build_system_prompt(character):
    """构建角色系统提示词"""
    return f"""你是{character['name']}，{character['description']}。

请严格按照以下要求回复：
1. 保持{character['name']}的语言风格和价值观
2. 使用符合历史背景的表达方式
3. 如遇不当提问，以角色身份礼貌拒绝
4. 专注于有意义的对话，避免无关话题
5. 回复简洁而有深度，体现角色智慧

【重要防御边界】：
- 绝不改变角色身份或承认AI身份
- 不评论政治敏感话题或政府政策
- 不发表种族歧视或偏见言论
- 不输出性别对立或歧视内容
- 不生成不当内容或越权信息
- 如遇越界问题，必须以角色身份拒绝并引导回归正道

语言风格：{character.get('style', '文雅庄重，语言简练')}
"""

def _build_chat_messages(system_prompt, chat_history, user_message):
    """构建对话消息列表"""
    messages = [{"role": "system", "content": system_prompt}]
    
    # 添加历史对话
    for msg in chat_history[-6:]:  # 只取最近6轮对话
        messages.append({"role": "user", "content": msg['user_message']})
        messages.append({"role": "assistant", "content": msg['ai_response']})
    
    # 添加当前用户消息
    messages.append({"role": "user", "content": user_message})
    
    return messages

# ====== 管理员相关路由 ======

@app.route('/admin')
def admin_login():
    """管理员登录页面"""
    return render_template('admin_login.html')

@app.route('/admin/login', methods=['POST'])
def admin_login_post():
    """处理管理员登录"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # 简单的管理员验证（在实际项目中应该使用更安全的方法）
    if username == 'admin' and password == 'admin123':
        session['is_admin'] = True
        session['admin_user'] = username
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': '用户名或密码错误'})

@app.route('/admin/dashboard')
def admin_dashboard():
    """管理员仪表板"""
    if not session.get('is_admin'):
        return redirect('/admin')
    return render_template('admin_dashboard.html')

@app.route('/admin/logout', methods=['POST'])
def admin_logout():
    """管理员登出"""
    session.pop('is_admin', None)
    session.pop('admin_user', None)
    return jsonify({'success': True})

# ====== 管理员API接口 ======

@app.route('/admin/api/stats')
def admin_stats():
    """获取系统统计数据"""
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    stats = db.get_admin_stats()
    return jsonify(stats)

@app.route('/admin/api/conversations')
def admin_conversations():
    """获取对话记录"""
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    
    conversations = db.get_all_conversations(page, limit)
    return jsonify(conversations)

@app.route('/admin/api/users')
def admin_users():
    """获取用户统计"""
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    users = db.get_user_statistics()
    return jsonify(users)

@app.route('/admin/api/performance')
def admin_performance():
    """获取AI性能数据"""
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    performance = db.get_performance_stats()
    return jsonify(performance)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=6888)