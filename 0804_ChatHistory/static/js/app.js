// 古月今语 - 前端应用脚本

class GuYueJinYu {
    constructor() {
        this.currentCharacter = null;
        this.currentConversation = null;
        this.apiConfig = null;
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadCharacters();
        this.loadConfig();
        this.autoResizeTextarea();
    }
    
    bindEvents() {
        // 配置按钮事件
        document.getElementById('config-btn').addEventListener('click', () => {
            this.showConfigModal();
        });
        
        // 关闭配置模态框
        document.getElementById('close-config-btn').addEventListener('click', () => {
            this.hideConfigModal();
        });
        
        // 配置表单提交
        document.getElementById('config-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveConfig();
        });
        
        // 测试API连接
        document.getElementById('test-api-btn').addEventListener('click', () => {
            this.testApiConnection();
        });
        
        // 发送消息
        document.getElementById('send-btn').addEventListener('click', () => {
            this.sendMessage();
        });
        
        // 输入框事件
        const messageInput = document.getElementById('message-input');
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        messageInput.addEventListener('input', () => {
            this.updateCharCount();
        });
        
        // 清空对话
        document.getElementById('clear-chat-btn').addEventListener('click', () => {
            this.clearChat();
        });
        
        // 生成图片
        document.getElementById('generate-image-btn').addEventListener('click', () => {
            this.showImageModal();
        });
        
        // 关闭图片模态框
        document.getElementById('close-image-btn').addEventListener('click', () => {
            this.hideImageModal();
        });
        
        // 添加人物按钮事件
        document.getElementById('add-character-btn').addEventListener('click', () => {
            this.showAddCharacterModal();
        });
        
        // 关闭添加人物模态框
        document.getElementById('close-add-character-btn').addEventListener('click', () => {
            this.hideAddCharacterModal();
        });
        
        document.getElementById('cancel-add-character-btn').addEventListener('click', () => {
            this.hideAddCharacterModal();
        });
        
        // 添加人物表单提交
        document.getElementById('add-character-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCustomCharacter();
        });
        
        // 右键菜单相关事件
        document.getElementById('delete-character-btn').addEventListener('click', () => {
            this.deleteSelectedCharacter();
        });
        
        // 点击其他地方隐藏右键菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#context-menu')) {
                this.hideContextMenu();
            }
        });
        
        // 图片生成表单
        document.getElementById('image-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateImage();
        });
        
        // 点击模态框外部关闭
        document.getElementById('config-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideConfigModal();
            }
        });
        
        document.getElementById('image-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideImageModal();
            }
        });
        
        document.getElementById('add-character-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideAddCharacterModal();
            }
        });
        
        // 初始化变量
        this.selectedCharacterForDelete = null;
    }
    
    async loadCharacters() {
        try {
            const response = await fetch('/api/characters');
            const characters = await response.json();
            
            this.renderCharacters(characters);
        } catch (error) {
            console.error('加载角色失败:', error);
            this.showMessage('加载角色列表失败', 'error');
        }
    }
    
    renderCharacters(characters) {
        const container = document.getElementById('characters-list');
        container.innerHTML = '';
        
        characters.forEach(character => {
            const card = document.createElement('div');
            card.className = 'character-card p-3 ancient-bg border ancient-border rounded-lg cursor-pointer hover:bg-amber-50 transition-colors';
            card.dataset.characterId = character.id;
            
            // 根据是否有生成头像决定显示内容
            const avatarContent = character.generated_avatar_url ? 
                `<img src="${character.generated_avatar_url}" alt="${character.name}" class="w-10 h-10 rounded-full object-cover">` :
                `<div class="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                    </svg>
                </div>`;
            
            card.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="character-avatar-container">
                        ${avatarContent}
                    </div>
                    <div class="flex-1">
                        <h3 class="font-semibold ancient-accent">${character.name}</h3>
                        <p class="text-xs ancient-text opacity-75 line-clamp-2">${character.description}</p>
                    </div>
                    ${character.id.startsWith('custom_') ? 
                        '<div class="text-xs text-gray-400"><i class="fas fa-ellipsis-v"></i></div>' : ''
                    }
                </div>
            `;
            
            card.addEventListener('click', () => {
                this.selectCharacter(character);
            });
            
            // 只给自定义角色添加右键菜单
            if (character.id.startsWith('custom_')) {
                card.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showContextMenu(e, character);
                });
            }
            
            container.appendChild(card);
        });
    }
    
    selectCharacter(character) {
        // 更新选中状态
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`[data-character-id="${character.id}"]`);
        selectedCard.classList.add('selected');
        
        // 更新当前角色
        this.currentCharacter = character;
        this.currentConversation = null; // 重置对话
        
        // 更新UI
        document.getElementById('current-character-name').textContent = character.name;
        document.getElementById('current-character-desc').textContent = character.description;
        
        // 更新顶部头像
        this.updateTopBarAvatar(character);
        
        // 更新输入框placeholder（无论是否有API配置）
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const generateImageBtn = document.getElementById('generate-image-btn');
        
        // 使用统一的UI更新方法
        this.updateCharacterUI(character);
        
        // 加载该角色的历史对话，如果没有则显示欢迎消息
        this.loadCharacterChatHistory(character);
    }
    
    getWelcomeMessage(character) {
        const welcomes = {
            '孔子': '有朋自远方来，不亦乐乎？请问您有何疑问？',
            '李白': '诗酒趁年华，今日得遇知音，何不共论天下事？',
            '诸葛亮': '承蒙不弃，愿与阁下共谋大事。请问有何要事相商？',
            '武则天': '朕今日得见贤才，甚为欢喜。有何事需要朕的智慧？',
            '王阳明': '知行合一，贵在实践。不知您希望探讨何种道理？'
        };
        
        return welcomes[character.name] || `您好，我是${character.name}，很高兴与您对话。`;
    }
    
    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            
            if (config.api_key_masked) {
                this.apiConfig = config;
                document.getElementById('api-key-input').placeholder = config.api_key_masked;
            }
        } catch (error) {
            console.error('加载配置失败:', error);
        }
    }
    
    showConfigModal() {
        document.getElementById('config-modal').classList.remove('hidden');
    }
    
    hideConfigModal() {
        document.getElementById('config-modal').classList.add('hidden');
    }
    
    async saveConfig() {
        const apiKey = document.getElementById('api-key-input').value.trim();
        const textModel = document.getElementById('text-model-select').value;
        const imageModel = document.getElementById('image-model-select').value;
        
        if (!apiKey) {
            this.showMessage('请输入API Key', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    text_model: textModel,
                    image_model: imageModel
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.apiConfig = { api_key: apiKey, text_model: textModel, image_model: imageModel };
                this.showMessage('API配置保存成功', 'success');
                this.hideConfigModal();
                
                // 如果已选择角色，启用输入并更新placeholder
                if (this.currentCharacter) {
                    const messageInput = document.getElementById('message-input');
                    const sendBtn = document.getElementById('send-btn');
                    const generateImageBtn = document.getElementById('generate-image-btn');
                    
                    messageInput.disabled = false;
                    sendBtn.disabled = false;
                    generateImageBtn.disabled = false;
                    messageInput.placeholder = this.getCharacterPlaceholder(this.currentCharacter.name);
                }
            } else {
                this.showMessage(result.error || '保存失败', 'error');
            }
        } catch (error) {
            console.error('保存配置失败:', error);
            this.showMessage('保存配置失败', 'error');
        }
    }
    
    async testApiConnection() {
        const apiKey = document.getElementById('api-key-input').value.trim();
        
        if (!apiKey) {
            this.showMessage('请输入API Key', 'error');
            return;
        }
        
        const testBtn = document.getElementById('test-api-btn');
        const originalText = testBtn.textContent;
        testBtn.textContent = '测试中...';
        testBtn.disabled = true;
        
        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    text_model: 'qwen-plus',
                    image_model: 'wan2.2-t2i-flash'
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showMessage('API连接测试成功', 'success');
            } else {
                this.showMessage(result.error || 'API连接测试失败', 'error');
            }
        } catch (error) {
            console.error('测试API连接失败:', error);
            this.showMessage('网络错误，请检查连接', 'error');
        } finally {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
        }
    }
    
    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (!message || this.isLoading) {
            return;
        }
        
        // 首先检查是否选择了角色
        if (!this.currentCharacter) {
            this.showMessage('请先选择一个历史人物开始对话', 'warning');
            return;
        }
        
        // 然后检查API配置
        if (!this.apiConfig || !this.apiConfig.api_key) {
            this.showMessage('请先配置API Key才能开始对话', 'error');
            this.showConfigModal();
            return;
        }
        
        // 添加用户消息
        this.addMessage('user', message);
        messageInput.value = '';
        this.updateCharCount();
        
        // 显示加载状态
        this.setLoading(true);
        const thinkingText = this.getCharacterThinkingText(this.currentCharacter.name);
        const loadingMessage = this.addMessage('ai', thinkingText, this.currentCharacter, false, true);
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    character_id: this.currentCharacter.id,
                    conversation_id: this.currentConversation
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // 更新对话ID
                this.currentConversation = result.conversation_id;
                
                // 删除加载消息，添加真实回复（使用打字机效果）
                loadingMessage.remove();
                this.addMessageWithTypewriter('ai', result.response.trim(), result.character, result.is_rejection);
            } else {
                loadingMessage.remove();
                this.addMessage('ai', (result.error || '抱歉，我无法回复您的消息').trim(), this.currentCharacter);
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            loadingMessage.remove();
            this.addMessage('ai', '网络错误，请稍后重试'.trim(), this.currentCharacter);
        } finally {
            this.setLoading(false);
        }
    }
    
    addMessage(role, content, character = null, isRejection = false, isThinking = false) {
        const messagesContainer = document.getElementById('chat-messages');
        
        // 如果是第一条消息，清空占位内容
        const placeholder = messagesContainer.querySelector('.text-center');
        if (placeholder) {
            placeholder.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-bubble ${role === 'user' ? 'ml-auto' : 'mr-auto'} max-w-3xl`;
        
        if (role === 'user') {
            messageDiv.innerHTML = `
                <div class="bg-gradient-to-r from-amber-200 to-orange-300 text-gray-800 p-4 rounded-lg rounded-br-none">
                    <p class="whitespace-pre-wrap leading-relaxed">${this.escapeHtml(content).trim()}</p>
                    <span class="text-xs opacity-75 mt-2 block">${new Date().toLocaleTimeString()}</span>
                </div>
            `;
        } else {
            const characterName = character ? character.name : '助手';
            const rejectionClass = isRejection ? 'border-l-4 border-red-400' : '';
            const avatarUrl = character && character.generated_avatar_url ? character.generated_avatar_url : null;
            const thinkingClass = isThinking ? 'thinking-message' : '';
            
            const avatarContent = avatarUrl ? 
                `<img src="${avatarUrl}" alt="${characterName}" class="w-8 h-8 rounded-full object-cover">` :
                `<div class="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                    </svg>
                </div>`;
            
            messageDiv.innerHTML = `
                <div class="ancient-bg border ancient-border p-4 rounded-lg rounded-bl-none ${rejectionClass} ${thinkingClass}">
                    <div class="flex items-start space-x-3">
                        ${isThinking ? `
                            <div class="brush-container relative">
                                <svg class="brush-icon w-6 h-6 text-amber-600 animate-pulse" viewBox="0 0 24 24" fill="none">
                                    <path d="M4.5 21.5C4.5 21.5 6 20 8.5 17.5L15.5 10.5L13.5 8.5L6.5 15.5C4 18 2.5 19.5 2.5 19.5C2.5 19.5 2.5 21.5 4.5 21.5Z" 
                                          stroke="currentColor" 
                                          stroke-width="1.5" 
                                          stroke-linecap="round" 
                                          stroke-linejoin="round"
                                          fill="rgba(139, 69, 19, 0.2)"/>
                                    <path d="M13.5 8.5L15.5 10.5L19.5 6.5C20.3284 5.67157 20.3284 4.32843 19.5 3.5C18.6716 2.67157 17.3284 2.67157 16.5 3.5L13.5 8.5Z" 
                                          stroke="currentColor" 
                                          stroke-width="1.5" 
                                          stroke-linecap="round" 
                                          stroke-linejoin="round"
                                          fill="rgba(139, 69, 19, 0.4)"/>
                                    <path d="M8.5 17.5L6.5 15.5" 
                                          stroke="currentColor" 
                                          stroke-width="1.5" 
                                          stroke-linecap="round"/>
                                    <circle cx="4" cy="20" r="1.5" 
                                            fill="rgba(139, 69, 19, 0.6)" 
                                            stroke="currentColor" 
                                            stroke-width="0.5"/>
                                </svg>
                            </div>
                        ` : ''}
                        <div class="avatar-container flex-shrink-0">
                            ${avatarContent}
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center space-x-2 mb-2">
                                <span class="font-semibold ancient-accent">${characterName}</span>
                                <span class="text-xs ancient-text opacity-75">${new Date().toLocaleTimeString()}</span>
                            </div>
                            <p class="ancient-text whitespace-pre-wrap brush-effect message-content">${this.escapeHtml(content.trim())}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return messageDiv;
    }
    
    addMessageWithTypewriter(role, content, character = null, isRejection = false) {
        const messagesContainer = document.getElementById('chat-messages');
        
        // 如果是第一条消息，清空占位内容
        const placeholder = messagesContainer.querySelector('.text-center');
        if (placeholder) {
            placeholder.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-bubble ${role === 'user' ? 'ml-auto' : 'mr-auto'} max-w-3xl`;
        
        if (role === 'user') {
            // 用户消息不需要打字机效果
            this.addMessage(role, content, character, isRejection);
            return;
        }
        
        const characterName = character ? character.name : '助手';
        const rejectionClass = isRejection ? 'border-l-4 border-red-400' : '';
        const avatarUrl = character && character.generated_avatar_url ? character.generated_avatar_url : null;
        
        const avatarContent = avatarUrl ? 
            `<img src="${avatarUrl}" alt="${characterName}" class="w-8 h-8 rounded-full object-cover">` :
            `<div class="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                </svg>
            </div>`;
        
        messageDiv.innerHTML = `
            <div class="ancient-bg border ancient-border p-4 rounded-lg rounded-bl-none ${rejectionClass}">
                <div class="flex items-start space-x-3">
                    <div class="avatar-container flex-shrink-0">
                        ${avatarContent}
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="font-semibold ancient-accent">${characterName}</span>
                            <span class="text-xs ancient-text opacity-75">${new Date().toLocaleTimeString()}</span>
                        </div>
                        <p class="ancient-text whitespace-pre-wrap brush-effect message-content relative">
                            <span class="typewriter-text"></span>
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // 启动打字机效果
        this.startTypewriterEffect(messageDiv, content);
        
        return messageDiv;
    }
    
    clearChat() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = `
            <div class="text-center ancient-text opacity-50">
                <i class="fas fa-comments text-3xl mb-2"></i>
                <p>开始与${this.currentCharacter ? this.currentCharacter.name : '历史人物'}对话</p>
            </div>
        `;
        this.currentConversation = null;
    }
    
    async loadCharacterChatHistory(character) {
        try {
            // 获取该角色的对话列表
            const response = await fetch('/api/conversations');
            const conversations = await response.json();
            
            // 查找与当前角色的最近对话
            const characterConversations = conversations.filter(conv => 
                conv.character_id === character.id
            );
            
            if (characterConversations.length > 0) {
                // 加载最近的一次对话
                const latestConversation = characterConversations[0];
                this.currentConversation = latestConversation.id;
                
                // 获取对话详细内容
                const chatResponse = await fetch(`/api/conversation/${latestConversation.id}`);
                const messages = await response.ok ? await chatResponse.json() : [];
                
                this.renderChatHistory(messages, character);
            } else {
                // 如果没有历史对话，清空并显示欢迎消息
                this.clearChat();
                this.addMessage('ai', this.getWelcomeMessage(character), character);
            }
            
            // 自动为角色生成头像（如果还没有的话）
            this.autoGenerateAvatarIfNeeded(character);
            
        } catch (error) {
            console.error('加载对话历史失败:', error);
            // 如果加载失败，显示欢迎消息
            this.clearChat();
            this.addMessage('ai', this.getWelcomeMessage(character), character);
            this.autoGenerateAvatarIfNeeded(character);
        }
    }
    
    renderChatHistory(messages, character) {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';
        
        if (messages.length === 0) {
            this.addMessage('ai', this.getWelcomeMessage(character).trim(), character);
            return;
        }
        
        // 渲染历史消息
        messages.forEach(msg => {
            this.addMessage('user', msg.user_message.trim());
            this.addMessage('ai', msg.ai_response.trim(), character);
        });
        
        // 滚动到底部
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        const sendBtn = document.getElementById('send-btn');
        const messageInput = document.getElementById('message-input');
        
        sendBtn.disabled = loading || !this.currentCharacter || !this.apiConfig;
        messageInput.disabled = loading || !this.currentCharacter || !this.apiConfig;
        
        if (loading) {
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else {
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }
    
    showImageModal() {
        if (!this.currentCharacter) {
            this.showMessage('请先选择角色', 'error');
            return;
        }
        
        // 检查API配置
        if (!this.apiConfig || !this.apiConfig.api_key) {
            this.showMessage('请先配置API Key', 'error');
            this.showConfigModal();
            return;
        }
        
        const prompt = `${this.currentCharacter.description}的古代形象`;
        document.getElementById('image-prompt-input').value = prompt;
        document.getElementById('image-modal').classList.remove('hidden');
    }
    
    hideImageModal() {
        document.getElementById('image-modal').classList.add('hidden');
        document.getElementById('image-result').classList.add('hidden');
    }
    
    async generateImage() {
        const prompt = document.getElementById('image-prompt-input').value.trim();
        
        if (!prompt) {
            this.showMessage('请输入图片描述', 'error');
            return;
        }
        
        // 检查API配置
        if (!this.apiConfig || !this.apiConfig.api_key) {
            this.showMessage('请先配置API Key', 'error');
            this.hideImageModal();
            this.showConfigModal();
            return;
        }
        
        const submitBtn = document.querySelector('#image-form button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>生成中...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/generate_image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    character_id: this.currentCharacter.id
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.image_url) {
                document.getElementById('generated-image').src = result.image_url;
                document.getElementById('image-result').classList.remove('hidden');
                this.showMessage('图片生成成功', 'success');
                
                // 如果有角色ID，更新当前角色信息并刷新头像
                if (result.character_id && this.currentCharacter && this.currentCharacter.id === result.character_id) {
                    this.currentCharacter.generated_avatar_url = result.image_url;
                    this.updateCharacterAvatars();
                    this.updateCharacterListAvatar(this.currentCharacter);
                    this.updateTopBarAvatar(this.currentCharacter);
                }
            } else {
                // 如果生成失败，尝试自动生成一个简单的角色形象
                if (result.error && result.error.includes('字段') && this.currentCharacter) {
                    this.showMessage('正在尝试自动生成角色形象...', 'info');
                    const fallbackPrompt = `${this.currentCharacter.name}，${this.currentCharacter.description}`;
                    this.autoGenerateImageWithFallback(fallbackPrompt);
                } else {
                    this.showMessage(result.error || '图片生成失败', 'error');
                }
            }
        } catch (error) {
            console.error('生成图片失败:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    updateCharCount() {
        const messageInput = document.getElementById('message-input');
        const charCount = document.getElementById('char-count');
        const currentLength = messageInput.value.length;
        
        charCount.textContent = currentLength;
        
        if (currentLength > 800) {
            charCount.style.color = '#ef4444';
        } else if (currentLength > 600) {
            charCount.style.color = '#f59e0b';
        } else {
            charCount.style.color = '';
        }
    }
    
    autoResizeTextarea() {
        const textarea = document.getElementById('message-input');
        
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }
    
    showMessage(message, type = 'info') {
        // 居中显示的消息提示，字体与标题保持一致
        const alertDiv = document.createElement('div');
        alertDiv.className = `fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 rounded-lg shadow-2xl z-50 ${
            type === 'success' ? 'bg-green-50 text-green-800 border-2 border-green-200' :
            type === 'error' ? 'bg-red-50 text-red-800 border-2 border-red-200' :
            type === 'warning' ? 'bg-amber-50 text-amber-800 border-2 border-amber-200' :
            'bg-blue-50 text-blue-800 border-2 border-blue-200'
        } min-w-80 text-center`;
        
        // 使用与标题相同的字体样式
        alertDiv.innerHTML = `
            <div class="text-lg font-bold ancient-accent mb-2">
                ${type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <div class="text-base font-medium">${message}</div>
        `;
        
        // 添加背景遮罩
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-40';
        overlay.appendChild(alertDiv);
        
        document.body.appendChild(overlay);
        
        // 点击遮罩或等待3秒后自动关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
        
        setTimeout(() => {
            overlay.remove();
        }, 3000);
    }
    
    startTypewriterEffect(messageDiv, content) {
        const textElement = messageDiv.querySelector('.typewriter-text');
        const messageContentElement = messageDiv.querySelector('.message-content');
        
        // 清理内容，去掉前后空白
        content = content.trim();
        
        let currentIndex = 0;
        const typingSpeed = 80; // 毫秒，稍微慢一点更有感觉
        
        const createBrushFlash = () => {
            const brush = document.createElement('span');
            brush.className = 'brush-flash';
            brush.innerHTML = `
                <svg class="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none">
                    <path d="M4.5 21.5C4.5 21.5 6 20 8.5 17.5L15.5 10.5L13.5 8.5L6.5 15.5C4 18 2.5 19.5 2.5 19.5C2.5 19.5 2.5 21.5 4.5 21.5Z" 
                          stroke="currentColor" 
                          stroke-width="1.5" 
                          stroke-linecap="round" 
                          stroke-linejoin="round"
                          fill="rgba(139, 69, 19, 0.3)"/>
                    <path d="M13.5 8.5L15.5 10.5L19.5 6.5C20.3284 5.67157 20.3284 4.32843 19.5 3.5C18.6716 2.67157 17.3284 2.67157 16.5 3.5L13.5 8.5Z" 
                          stroke="currentColor" 
                          stroke-width="1.5" 
                          stroke-linecap="round" 
                          stroke-linejoin="round"
                          fill="rgba(139, 69, 19, 0.5)"/>
                    <circle cx="4" cy="20" r="1.5" 
                            fill="rgba(139, 69, 19, 0.7)" 
                            stroke="currentColor" 
                            stroke-width="0.5"/>
                </svg>
            `;
            return brush;
        };
        
        const typeNextChar = () => {
            if (currentIndex < content.length) {
                const char = content[currentIndex];
                textElement.textContent += char;
                
                // 每打一个字，在右上角闪现毛笔
                if (char.trim() && Math.random() > 0.4) { // 随机显示，营造自然感
                    const messageContainer = messageDiv.querySelector('.ancient-bg');
                    const brush = createBrushFlash();
                    
                    brush.style.position = 'absolute';
                    brush.style.right = '8px';
                    brush.style.top = '8px';
                    brush.style.zIndex = '20';
                    
                    messageContainer.style.position = 'relative';
                    messageContainer.appendChild(brush);
                    
                    // 毛笔闪现动画
                    setTimeout(() => {
                        brush.style.animation = 'brushFlash 0.5s ease-out';
                        setTimeout(() => {
                            if (brush.parentNode) {
                                brush.remove();
                            }
                        }, 500);
                    }, 100);
                }
                
                currentIndex++;
                
                // 滚动到底部
                const messagesContainer = document.getElementById('chat-messages');
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                setTimeout(typeNextChar, typingSpeed);
            } else {
                // 打字完成
            }
        };
        
        typeNextChar();
    }
    
    getCharacterThinkingText(characterName) {
        const thinkingTexts = {
            '孔子': "正在思索经典之理...",
            '李白': "酝酿诗意，笔下生花...",
            '诸葛亮': "运筹帷幄，深思熟虑...",
            '武则天': "凤眼观天下，深思熟虑...",
            '王阳明': "内观心性，致知格物...",
            '苏轼': "胸有成竹，落笔生花...",
            '辛弃疾': "慷慨激昂，词作豪迈...",
            '李清照': "易安居士，才思涌动...",
            '陆游': "爱国情怀，笔走龙蛇...",
            '杜甫': "忧国忧民，沉思默想..."
        };
        return thinkingTexts[characterName] || "正在思考...";
    }
    
    getCharacterPlaceholder(characterName) {
        const placeholders = {
            '孔子': "请教圣人，有何疑问...",
            '李白': "诗酒趁年华，有何雅兴...",
            '诸葛亮': "军机要务，请详述...",
            '武则天': "奏章已备，请呈上...",
            '王阳明': "心学之道，愿闻其详...",
            '苏轼': "东坡居士，愿闻高论...",
            '辛弃疾': "稼轩词客，请赐教诲...",
            '李清照': "易安居士，有何雅意...",
            '陆游': "放翁先生，请指点迷津...",
            '杜甫': "诗圣在此，敢问何事...",
            '白居易': "香山居士，请教民间疾苦...",
            '曹操': "丞相在上，请听禀报...",
            '刘备': "皇叔仁德，敢求指点...",
            '关羽': "关公义薄云天，请教...",
            '张飞': "翼德将军，直言相告...",
            '赵云': "子龙将军，敢请教导...",
            '唐玄宗': "圣上万安，敢呈愚见..."
        };
        return placeholders[characterName] || `敬请${characterName}赐教...`;
    }
    
    updateCharacterAvatars() {
        // 更新所有已显示的AI消息头像
        const messageContainers = document.querySelectorAll('.message-bubble .avatar-container');
        messageContainers.forEach(container => {
            if (this.currentCharacter && this.currentCharacter.generated_avatar_url) {
                const img = container.querySelector('img');
                if (img) {
                    img.src = this.currentCharacter.generated_avatar_url;
                } else {
                    // 如果原来是默认头像，替换为生成的图片
                    container.innerHTML = `
                        <img src="${this.currentCharacter.generated_avatar_url}" 
                             alt="${this.currentCharacter.name}" 
                             class="w-8 h-8 rounded-full object-cover">
                    `;
                }
            }
        });
        
        // 更新左侧角色选择面板中的头像
        this.updateCharacterListAvatar(this.currentCharacter);
        
        // 更新顶部对话栏头像
        this.updateTopBarAvatar(this.currentCharacter);
    }
    
    updateCharacterListAvatar(character) {
        const characterCard = document.querySelector(`[data-character-id="${character.id}"]`);
        if (characterCard && character.generated_avatar_url) {
            const avatarContainer = characterCard.querySelector('.character-avatar-container');
            if (avatarContainer) {
                avatarContainer.innerHTML = `
                    <img src="${character.generated_avatar_url}" 
                         alt="${character.name}" 
                         class="w-10 h-10 rounded-full object-cover">
                `;
            }
        }
    }
    
    updateTopBarAvatar(character) {
        const topBarAvatar = document.getElementById('current-character-avatar');
        if (topBarAvatar && character.generated_avatar_url) {
            topBarAvatar.innerHTML = `
                <img src="${character.generated_avatar_url}" 
                     alt="${character.name}" 
                     class="w-10 h-10 rounded-full object-cover">
            `;
        } else if (topBarAvatar && !character.generated_avatar_url) {
            // 如果没有生成头像，显示默认图标
            topBarAvatar.innerHTML = `
                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                </svg>
            `;
        }
    }
    
    async autoGenerateAvatarIfNeeded(character) {
        // 如果角色已经有生成的头像，跳过
        if (character.generated_avatar_url) {
            return;
        }
        
        // 如果没有API配置，跳过
        if (!this.apiConfig || !this.apiConfig.api_key) {
            console.log('未配置API Key，跳过自动生成头像');
            return;
        }
        
        // 自动生成角色描述的形象
        const autoPrompt = `${character.name}，${character.description}，中国古代风格肖像`;
        
        try {
            const response = await fetch('/api/generate_image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: autoPrompt,
                    character_id: character.id
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.image_url) {
                // 静默更新头像，不显示成功消息
                character.generated_avatar_url = result.image_url;
                this.updateCharacterAvatars();
                this.updateCharacterListAvatar(character);
                this.updateTopBarAvatar(character);
                console.log(`已自动为${character.name}生成头像`);
            }
        } catch (error) {
            // 静默失败，不影响用户体验
            console.log(`${character.name}头像自动生成失败:`, error);
        }
    }
    
    async autoGenerateImageWithFallback(prompt) {
        try {
            const response = await fetch('/api/generate_image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    character_id: this.currentCharacter.id
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.image_url) {
                this.currentCharacter.generated_avatar_url = result.image_url;
                this.updateCharacterAvatars();
                this.updateCharacterListAvatar(this.currentCharacter);
                this.updateTopBarAvatar(this.currentCharacter);
                this.showMessage('角色形象自动生成成功', 'success');
                
                // 同时显示在图片模态框中
                document.getElementById('generated-image').src = result.image_url;
                document.getElementById('image-result').classList.remove('hidden');
            } else {
                this.showMessage('自动生成也失败了，请稍后重试', 'error');
            }
        } catch (error) {
            this.showMessage('自动生成失败，请稍后重试', 'error');
        }
    }
    
    showAddCharacterModal() {
        // 检查API配置
        if (!this.apiConfig || !this.apiConfig.api_key) {
            this.showMessage('请先配置API Key', 'error');
            this.showConfigModal();
            return;
        }
        
        document.getElementById('add-character-modal').classList.remove('hidden');
        document.getElementById('character-name-input').focus();
    }
    
    hideAddCharacterModal() {
        document.getElementById('add-character-modal').classList.add('hidden');
        document.getElementById('add-character-form').reset();
        document.getElementById('character-generation-progress').classList.add('hidden');
        document.getElementById('progress-bar').style.width = '0%';
        
        // 重置表单显示状态
        const form = document.getElementById('add-character-form');
        const progress = document.getElementById('character-generation-progress');
        form.style.display = 'block';
        progress.classList.add('hidden');
    }
    
    async addCustomCharacter() {
        const name = document.getElementById('character-name-input').value.trim();
        const dynasty = document.getElementById('character-dynasty-input').value.trim();
        
        if (!name || !dynasty) {
            this.showMessage('请填写完整的姓名和朝代信息', 'error');
            return;
        }
        
        // 显示进度条
        const form = document.getElementById('add-character-form');
        const progress = document.getElementById('character-generation-progress');
        const progressBar = document.getElementById('progress-bar');
        
        form.style.display = 'none';
        progress.classList.remove('hidden');
        
        // 模拟进度
        let currentProgress = 0;
        const progressInterval = setInterval(() => {
            currentProgress += Math.random() * 15;
            if (currentProgress > 90) currentProgress = 90;
            progressBar.style.width = currentProgress + '%';
        }, 200);
        
        try {
            const response = await fetch('/api/characters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    dynasty: dynasty
                })
            });
            
            const result = await response.json();
            
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            
            if (response.ok) {
                this.showMessage(result.message, 'success');
                
                // 刷新角色列表
                await this.loadCharacters();
                
                // 自动选择新创建的角色
                this.selectCharacterById(result.character.id);
                
                // 更新当前角色信息
                this.currentCharacter = result.character;
                
                // 完整更新UI：placeholder、思考文案、角色状态
                this.updateCharacterUI(result.character);
                
                this.hideAddCharacterModal();
            } else {
                this.showMessage(result.error || '创建人物失败', 'error');
                form.style.display = 'block';
                progress.classList.add('hidden');
            }
        } catch (error) {
            clearInterval(progressInterval);
            console.error('创建人物失败:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
            form.style.display = 'block';
            progress.classList.add('hidden');
        }
    }
    
    selectCharacterById(characterId) {
        // 通过ID选择角色
        const characterCard = document.querySelector(`[data-character-id="${characterId}"]`);
        if (characterCard) {
            characterCard.click();
        }
    }
    
    updateCharacterUI(character) {
        // 统一更新角色相关的所有UI元素
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const generateImageBtn = document.getElementById('generate-image-btn');
        
        // 更新输入框placeholder
        messageInput.placeholder = this.getCharacterPlaceholder(character.name);
        
        // 更新思考文案
        this.currentCharacterThinkingText = this.getCharacterThinkingText(character.name);
        
        // 更新角色名称和描述
        document.getElementById('current-character-name').textContent = character.name;
        document.getElementById('current-character-desc').textContent = character.description;
        
        // 更新顶部头像
        this.updateTopBarAvatar(character);
        
        // 检查API配置状态
        if (this.apiConfig && this.apiConfig.api_key) {
            messageInput.disabled = false;
            sendBtn.disabled = false;
            generateImageBtn.disabled = false;
        } else {
            messageInput.disabled = true;
            sendBtn.disabled = true;
            generateImageBtn.disabled = true;
            messageInput.placeholder = "请先配置API Key...";
        }
    }
    
    showContextMenu(event, character) {
        const contextMenu = document.getElementById('context-menu');
        this.selectedCharacterForDelete = character;
        
        contextMenu.style.left = event.pageX + 'px';
        contextMenu.style.top = event.pageY + 'px';
        contextMenu.classList.remove('hidden');
    }
    
    hideContextMenu() {
        document.getElementById('context-menu').classList.add('hidden');
        this.selectedCharacterForDelete = null;
    }
    
    async deleteSelectedCharacter() {
        if (!this.selectedCharacterForDelete) return;
        
        const character = this.selectedCharacterForDelete;
        
        if (!confirm(`确定要删除「${character.name}」吗？\n此操作将同时删除所有相关对话记录，且无法恢复。`)) {
            this.hideContextMenu();
            return;
        }
        
        try {
            const response = await fetch(`/api/characters/${character.id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showMessage(`「${character.name}」已删除`, 'success');
                
                // 如果删除的是当前选中的角色，清空聊天
                if (this.currentCharacter && this.currentCharacter.id === character.id) {
                    this.currentCharacter = null;
                    this.clearChat();
                }
                
                // 刷新角色列表
                await this.loadCharacters();
                
            } else {
                this.showMessage(result.error || '删除失败', 'error');
            }
            
        } catch (error) {
            console.error('删除角色失败:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
        }
        
        this.hideContextMenu();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new GuYueJinYu();
});