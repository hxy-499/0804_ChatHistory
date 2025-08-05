#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import time
from typing import List, Dict, Optional

class DashScopeService:
    """阿里云百炼API服务"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://dashscope.aliyuncs.com"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def test_connection(self) -> bool:
        """测试API连接是否有效"""
        try:
            response = requests.get(
                f"{self.base_url}/compatible-mode/v1/models",
                headers=self.headers,
                timeout=10
            )
            return response.status_code == 200
        except Exception:
            return False
    
    def chat_completion(self, messages: List[Dict], model: str = "qwen-plus", stream: bool = False) -> Optional[str]:
        """文本对话completion"""
        try:
            payload = {
                "model": model,
                "messages": messages,
                "stream": stream,
                "temperature": 0.7,
                "max_tokens": 2000
            }
            
            response = requests.post(
                f"{self.base_url}/compatible-mode/v1/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("choices") and len(result["choices"]) > 0:
                    return result["choices"][0]["message"]["content"]
            
            return None
            
        except Exception as e:
            print(f"Chat completion error: {e}")
            return None
    
    def generate_image(self, prompt: str, model: str = "wan2.2-t2i-flash", size: str = "1024*1024") -> Optional[str]:
        """生成图片"""
        try:
            # 第一步：提交图片生成任务
            payload = {
                "model": model,
                "input": {
                    "prompt": prompt
                },
                "parameters": {
                    "size": size,
                    "n": 1
                }
            }
            
            task_headers = self.headers.copy()
            task_headers["X-DashScope-Async"] = "enable"
            
            response = requests.post(
                f"{self.base_url}/api/v1/services/aigc/text2image/image-synthesis",
                headers=task_headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                print(f"Image generation request failed: {response.text}")
                return None
            
            result = response.json()
            task_id = result.get("output", {}).get("task_id")
            
            if not task_id:
                print("No task_id returned")
                return None
            
            # 第二步：轮询获取结果
            max_attempts = 30  # 最多等待30次，每次2秒
            for attempt in range(max_attempts):
                time.sleep(2)  # 等待2秒
                
                status_response = requests.get(
                    f"{self.base_url}/api/v1/tasks/{task_id}",
                    headers=self.headers,
                    timeout=15
                )
                
                if status_response.status_code == 200:
                    status_result = status_response.json()
                    task_status = status_result.get("output", {}).get("task_status")
                    
                    if task_status == "SUCCEEDED":
                        # 获取图片URL
                        results = status_result.get("output", {}).get("results", [])
                        if results and len(results) > 0:
                            return results[0].get("url")
                    
                    elif task_status == "FAILED":
                        error_msg = status_result.get("output", {}).get("message", "图片生成失败")
                        print(f"Image generation failed: {error_msg}")
                        return None
                    
                    # 如果是PENDING或RUNNING状态，继续等待
                    elif task_status in ["PENDING", "RUNNING"]:
                        continue
                else:
                    print(f"Status check failed: {status_response.text}")
            
            # 超时
            print("Image generation timeout")
            return None
            
        except Exception as e:
            print(f"Image generation error: {e}")
            return None
    
    def get_available_models(self) -> List[Dict]:
        """获取可用模型列表"""
        try:
            response = requests.get(
                f"{self.base_url}/compatible-mode/v1/models",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("data", [])
            
            return []
            
        except Exception as e:
            print(f"Get models error: {e}")
            return []
    
    def stream_chat_completion(self, messages: List[Dict], model: str = "qwen-plus"):
        """流式对话（生成器）"""
        try:
            payload = {
                "model": model,
                "messages": messages,
                "stream": True,
                "temperature": 0.7,
                "max_tokens": 2000
            }
            
            response = requests.post(
                f"{self.base_url}/compatible-mode/v1/chat/completions",
                headers=self.headers,
                json=payload,
                stream=True,
                timeout=30
            )
            
            if response.status_code == 200:
                for line in response.iter_lines():
                    if line:
                        line_text = line.decode('utf-8')
                        if line_text.startswith('data: '):
                            data_text = line_text[6:]  # 去掉 'data: ' 前缀
                            
                            if data_text.strip() == '[DONE]':
                                break
                            
                            try:
                                data = json.loads(data_text)
                                choices = data.get('choices', [])
                                if choices and len(choices) > 0:
                                    delta = choices[0].get('delta', {})
                                    content = delta.get('content', '')
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                continue
            
        except Exception as e:
            print(f"Stream chat error: {e}")
            yield f"错误：{str(e)}"