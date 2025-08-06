#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
多轮对话功能测试脚本
验证修复后的用户隔离和多轮对话功能
"""

import requests
import json
import uuid

class ChatTester:
    def __init__(self, base_url="http://localhost:6888"):
        self.base_url = base_url
        self.session = requests.Session()
        
    def test_user_isolation(self):
        """测试用户隔离功能"""
        print("🧪 测试用户隔离功能...")
        
        # 创建两个独立的会话
        session1 = requests.Session()
        session2 = requests.Session()
        
        # 两个会话访问首页（触发用户ID生成）
        session1.get(f"{self.base_url}/")
        session2.get(f"{self.base_url}/")
        
        # 检查是否生成了不同的用户ID
        # 通过设置不同的API配置来验证
        config1 = {"api_key": "test-key-1", "text_model": "qwen-plus"}
        config2 = {"api_key": "test-key-2", "text_model": "qwen-turbo"}
        
        try:
            # 会话1设置配置
            resp1 = session1.post(f"{self.base_url}/api/config", 
                                json=config1,
                                headers={'Content-Type': 'application/json'})
            
            # 会话2设置配置
            resp2 = session2.post(f"{self.base_url}/api/config", 
                                json=config2,
                                headers={'Content-Type': 'application/json'})
            
            # 验证各自能获取到自己的配置
            resp1_get = session1.get(f"{self.base_url}/api/config")
            resp2_get = session2.get(f"{self.base_url}/api/config")
            
            if resp1_get.status_code == 200 and resp2_get.status_code == 200:
                config1_retrieved = resp1_get.json()
                config2_retrieved = resp2_get.json()
                
                # 检查是否获取到不同的配置
                if (config1_retrieved.get('text_model') == 'qwen-plus' and 
                    config2_retrieved.get('text_model') == 'qwen-turbo'):
                    print("✅ 用户隔离测试通过 - 不同会话有独立配置")
                    return True
                else:
                    print("❌ 用户隔离测试失败 - 配置被共享")
                    return False
            else:
                print("❌ 无法完成用户隔离测试 - API调用失败")
                return False
                
        except Exception as e:
            print(f"❌ 用户隔离测试出错: {e}")
            return False
    
    def test_multi_turn_chat(self):
        """测试多轮对话功能"""
        print("🧪 测试多轮对话功能...")
        
        # 模拟对话数据
        test_messages = [
            "你好，孔子老师",
            "请问什么是仁？",
            "那么仁和礼的关系是什么？",
            "谢谢您的教导"
        ]
        
        conversation_id = None
        
        for i, message in enumerate(test_messages, 1):
            try:
                chat_data = {
                    "message": message,
                    "character_id": "kongzi",
                    "conversation_id": conversation_id
                }
                
                resp = self.session.post(
                    f"{self.base_url}/api/chat",
                    json=chat_data,
                    headers={'Content-Type': 'application/json'}
                )
                
                if resp.status_code == 200:
                    result = resp.json()
                    conversation_id = result.get('conversation_id')
                    print(f"✅ 第{i}轮对话成功")
                    print(f"   用户: {message}")
                    print(f"   AI: {result.get('response', '')[:50]}...")
                else:
                    print(f"❌ 第{i}轮对话失败: {resp.status_code}")
                    return False
                    
            except Exception as e:
                print(f"❌ 第{i}轮对话出错: {e}")
                return False
        
        print("✅ 多轮对话测试完成")
        return True
    
    def test_conversation_history(self):
        """测试对话历史功能"""
        print("🧪 测试对话历史功能...")
        
        try:
            # 获取对话列表
            resp = self.session.get(f"{self.base_url}/api/conversations")
            
            if resp.status_code == 200:
                conversations = resp.json()
                print(f"✅ 成功获取对话历史: {len(conversations)} 个对话")
                
                if conversations:
                    # 测试获取特定对话的详细内容
                    conv_id = conversations[0]['id']
                    detail_resp = self.session.get(f"{self.base_url}/api/conversation/{conv_id}")
                    
                    if detail_resp.status_code == 200:
                        messages = detail_resp.json()
                        print(f"✅ 成功获取对话详情: {len(messages)} 条消息")
                        return True
                    else:
                        print("❌ 获取对话详情失败")
                        return False
                else:
                    print("✅ 对话历史为空（正常情况）")
                    return True
            else:
                print(f"❌ 获取对话历史失败: {resp.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ 测试对话历史出错: {e}")
            return False

def main():
    print("🧪 古月今语 - 功能测试")
    print("=" * 40)
    
    tester = ChatTester()
    
    # 1. 测试用户隔离
    isolation_ok = tester.test_user_isolation()
    
    # 2. 测试多轮对话
    chat_ok = tester.test_multi_turn_chat()
    
    # 3. 测试对话历史
    history_ok = tester.test_conversation_history()
    
    print("\n📊 测试结果总结:")
    print("=" * 40)
    print(f"用户隔离: {'✅ 通过' if isolation_ok else '❌ 失败'}")
    print(f"多轮对话: {'✅ 通过' if chat_ok else '❌ 失败'}")
    print(f"对话历史: {'✅ 通过' if history_ok else '❌ 失败'}")
    
    if all([isolation_ok, chat_ok, history_ok]):
        print("\n🎉 所有测试通过！隐私修复成功，功能正常！")
    else:
        print("\n⚠️  部分测试失败，请检查配置")

if __name__ == "__main__":
    main()