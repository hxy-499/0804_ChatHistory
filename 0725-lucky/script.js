// 抽奖应用类
class LotteryApp {
    constructor() {
        this.currentSlide = 0;
        this.maxTries = 30;
        this.userTries = 0;
        this.isLotteryRunning = false;
        
        // 奖品配置
        this.prizes = [
            { 
                name: '一等奖', 
                description: 'iPhone 15 Pro Max', 
                probability: 0.01, 
                icon: 'fas fa-crown',
                class: 'text-yellow-500'
            },
            { 
                name: '二等奖', 
                description: 'MacBook Air', 
                probability: 0.05, 
                icon: 'fas fa-medal',
                class: 'text-gray-400'
            },
            { 
                name: '三等奖', 
                description: 'AirPods Pro', 
                probability: 0.15, 
                icon: 'fas fa-award',
                class: 'text-orange-500'
            },
            { 
                name: '纪念奖', 
                description: '精美小礼品', 
                probability: 0.79, 
                icon: 'fas fa-gift',
                class: 'text-blue-500'
            }
        ];
        
        this.init();
    }

    // 初始化应用
    init() {
        this.loadUserData();
        this.bindEvents();
        this.startCarousel();
        this.loadHistory();
        this.updateUI();
    }

    // 绑定事件监听器
    bindEvents() {
        // 抽奖表单提交
        document.getElementById('lotteryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLottery();
        });

        // 轮播指示器点击
        document.querySelectorAll('.carousel-dot').forEach((dot, index) => {
            dot.addEventListener('click', () => {
                this.goToSlide(index);
            });
        });

        // 清空历史记录
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearHistory();
        });

        // 姓名输入框失焦验证
        document.getElementById('userName').addEventListener('blur', () => {
            this.validateName();
        });

        // 转盘模态框点击背景关闭（仅在非抽奖状态）
        document.getElementById('wheelModal').addEventListener('click', (e) => {
            if (e.target.id === 'wheelModal' && !this.isLotteryRunning) {
                this.hideWheelModal();
            }
        });

        // 防止转盘内容区域点击冒泡
        document.querySelector('#wheelModal > div').addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // ESC键关闭转盘模态框（仅在非抽奖状态）
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !document.getElementById('wheelModal').classList.contains('hidden') && !this.isLotteryRunning) {
                this.hideWheelModal();
            }
        });
    }

    // 加载用户数据
    loadUserData() {
        const userData = localStorage.getItem('lotteryUserData');
        if (userData) {
            const data = JSON.parse(userData);
            this.userTries = data.userTries || 0;
            document.getElementById('userName').value = data.userName || '';
            document.getElementById('userPhone').value = data.userPhone || '';
        }
        this.updateRemainingTries();
    }

    // 保存用户数据
    saveUserData() {
        const userData = {
            userTries: this.userTries,
            userName: document.getElementById('userName').value,
            userPhone: document.getElementById('userPhone').value
        };
        localStorage.setItem('lotteryUserData', JSON.stringify(userData));
    }

    // 验证姓名
    validateName() {
        const nameInput = document.getElementById('userName');
        const name = nameInput.value.trim();
        
        // 移除之前的错误信息
        const existingError = nameInput.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        nameInput.classList.remove('input-error');

        if (!name) {
            this.showInputError(nameInput, '请输入您的姓名');
            return false;
        }

        if (name.length < 2) {
            this.showInputError(nameInput, '姓名至少需要2个字符');
            return false;
        }

        return true;
    }

    // 显示输入错误
    showInputError(input, message) {
        input.classList.add('input-error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }

    // 开始轮播
    startCarousel() {
        setInterval(() => {
            this.nextSlide();
        }, 3000);
    }

    // 下一张幻灯片
    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % 4;
        this.updateCarousel();
    }

    // 跳转到指定幻灯片
    goToSlide(index) {
        this.currentSlide = index;
        this.updateCarousel();
    }

    // 更新轮播显示
    updateCarousel() {
        const items = document.querySelectorAll('.prize-item');
        const dots = document.querySelectorAll('.carousel-dot');

        items.forEach((item, index) => {
            item.classList.remove('active', 'prev');
            if (index === this.currentSlide) {
                item.classList.add('active');
            } else if (index === (this.currentSlide - 1 + 4) % 4) {
                item.classList.add('prev');
            }
        });

        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }

    // 处理抽奖
    async handleLottery() {
        if (this.isLotteryRunning) return;
        
        if (!this.validateName()) return;
        
        if (this.userTries >= this.maxTries) {
            this.showResult('您的抽奖次数已用完！', 'fail-message');
            return;
        }

        this.isLotteryRunning = true;
        this.userTries++;
        this.saveUserData();
        
        // 更新按钮状态
        const btn = document.getElementById('lotteryBtn');
        const btnText = document.getElementById('btnText');
        btn.classList.add('btn-disabled', 'lottery-spinning');
        btnText.textContent = '抽奖中';
        btnText.classList.add('loading-dots');

        // 显示转盘抽奖过程
        const result = await this.showWheelLottery();
        
        // 恢复按钮状态
        btn.classList.remove('lottery-spinning');
        btnText.classList.remove('loading-dots');
        
        if (this.userTries >= this.maxTries) {
            btn.classList.add('btn-disabled');
            btnText.textContent = '抽奖结束';
        } else {
            btn.classList.remove('btn-disabled');
            btnText.textContent = '再次抽奖';
        }

        // 显示结果
        this.showResult(result.message, result.isWin ? 'success-message' : 'fail-message');
        
        // 保存中奖记录
        if (result.isWin) {
            this.saveWinningRecord(result.prize);
            this.createConfetti();
        }

        this.updateUI();
        this.isLotteryRunning = false;
    }

    // 显示转盘抽奖过程
    async showWheelLottery() {
        return new Promise((resolve) => {
            // 计算中奖结果
            const result = this.calculatePrize();
            const prizeIndex = result.isWin ? this.prizes.findIndex(p => p.name === result.prize.name) : 3; // 默认纪念奖
            
            // 显示转盘模态框
            const wheelModal = document.getElementById('wheelModal');
            const wheelSpin = document.getElementById('wheelSpin');
            const wheelStatus = document.getElementById('wheelStatus');
            
            wheelModal.classList.remove('hidden');
            wheelModal.classList.add('modal-enter');
            
            // 计算最终旋转角度
            // 每个扇形90度，根据奖品索引计算目标角度
            const baseAngle = 90 * prizeIndex; // 基础角度
            const randomOffset = Math.random() * 60 + 15; // 15-75度的随机偏移
            const finalAngle = baseAngle + randomOffset + 360 * 5; // 至少转5圈
            
            // 设置CSS变量用于动画
            wheelSpin.style.setProperty('--final-rotation', `${finalAngle}deg`);
            
            // 开始转盘旋转
            setTimeout(() => {
                wheelSpin.classList.add('wheel-spinning');
                wheelStatus.innerHTML = '<span class="loading-dots">转盘旋转中</span>';
            }, 500);
            
            // 动画完成后的处理
            setTimeout(() => {
                // 高亮中奖区域
                this.highlightWinningSegment(prizeIndex);
                wheelStatus.innerHTML = `<span class="glow-text">🎉 ${result.isWin ? result.prize.name : '纪念奖'}！🎉</span>`;
                
                // 延迟后隐藏转盘
                setTimeout(() => {
                    this.hideWheelModal();
                    resolve(result);
                }, 2000);
            }, 3500); // 转盘动画3秒 + 0.5秒延迟
        });
    }

    // 高亮中奖扇形区域
    highlightWinningSegment(prizeIndex) {
        const segments = document.querySelectorAll('.wheel-segment');
        segments.forEach((segment, index) => {
            if (index === prizeIndex) {
                segment.classList.add('wheel-result-highlight');
            }
        });
    }

    // 隐藏转盘模态框
    hideWheelModal() {
        const wheelModal = document.getElementById('wheelModal');
        const wheelSpin = document.getElementById('wheelSpin');
        
        wheelModal.classList.add('modal-exit');
        
        setTimeout(() => {
            wheelModal.classList.add('hidden');
            wheelModal.classList.remove('modal-enter', 'modal-exit');
            
            // 重置转盘状态
            wheelSpin.classList.remove('wheel-spinning');
            wheelSpin.style.removeProperty('--final-rotation');
            
            // 移除高亮效果
            const segments = document.querySelectorAll('.wheel-segment');
            segments.forEach(segment => {
                segment.classList.remove('wheel-result-highlight');
            });
            
            // 重置状态文字
            const wheelStatus = document.getElementById('wheelStatus');
            wheelStatus.innerHTML = '<span class="loading-dots">正在抽奖中</span>';
        }, 300);
    }

    // 计算中奖结果
    calculatePrize() {
        const random = Math.random();
        let cumulativeProbability = 0;

        for (const prize of this.prizes) {
            cumulativeProbability += prize.probability;
            if (random <= cumulativeProbability) {
                return {
                    isWin: true,
                    prize: prize,
                    message: `🎉 恭喜您获得${prize.name}：${prize.description}！🎉`
                };
            }
        }

        return {
            isWin: false,
            message: '很遗憾，这次没有中奖，下次再来！'
        };
    }

    // 显示结果
    showResult(message, className) {
        const resultArea = document.getElementById('resultArea');
        const resultContent = document.getElementById('resultContent');
        
        resultContent.innerHTML = `<div class="${className}">${message}</div>`;
        resultArea.classList.remove('hidden');
        resultArea.classList.add('result-animation');

        // 3秒后隐藏结果
        setTimeout(() => {
            resultArea.classList.add('hidden');
            resultArea.classList.remove('result-animation');
        }, 5000);
    }

    // 保存中奖记录
    saveWinningRecord(prize) {
        const history = this.getWinningHistory();
        const userName = document.getElementById('userName').value;
        const record = {
            name: userName,
            prize: `${prize.name} - ${prize.description}`,
            time: new Date().toLocaleString('zh-CN'),
            timestamp: Date.now()
        };
        
        history.unshift(record);
        
        // 只保留最近20条记录
        if (history.length > 20) {
            history.splice(20);
        }
        
        localStorage.setItem('lotteryHistory', JSON.stringify(history));
        this.updateHistoryDisplay();
    }

    // 获取中奖历史
    getWinningHistory() {
        const history = localStorage.getItem('lotteryHistory');
        return history ? JSON.parse(history) : [];
    }

    // 加载历史记录
    loadHistory() {
        this.updateHistoryDisplay();
    }

    // 更新历史记录显示
    updateHistoryDisplay() {
        const history = this.getWinningHistory();
        const tbody = document.getElementById('winningHistory');
        
        if (history.length === 0) {
            tbody.innerHTML = '<tr class="border-b border-white/10"><td class="px-4 py-3 text-gray-300" colspan="3">暂无中奖记录</td></tr>';
            return;
        }

        tbody.innerHTML = history.map(record => `
            <tr class="border-b border-white/10 history-item">
                <td class="px-4 py-3">${record.name}</td>
                <td class="px-4 py-3">${record.prize}</td>
                <td class="px-4 py-3 text-sm">${record.time}</td>
            </tr>
        `).join('');
    }

    // 清空历史记录
    clearHistory() {
        if (confirm('确定要清空所有中奖记录吗？')) {
            localStorage.removeItem('lotteryHistory');
            this.updateHistoryDisplay();
        }
    }

    // 更新剩余次数
    updateRemainingTries() {
        const remaining = Math.max(0, this.maxTries - this.userTries);
        document.getElementById('remainingTries').textContent = remaining;
        
        if (remaining === 0) {
            const btn = document.getElementById('lotteryBtn');
            const btnText = document.getElementById('btnText');
            btn.classList.add('btn-disabled');
            btnText.textContent = '抽奖结束';
        }
    }

    // 更新UI
    updateUI() {
        this.updateRemainingTries();
    }

    // 创建彩带特效
    createConfetti() {
        const container = document.getElementById('confetti-container');
        const colors = ['red', 'yellow', 'blue', 'purple', 'orange', 'green'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = `confetti confetti-${colors[Math.floor(Math.random() * colors.length)]}`;
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.animationDelay = Math.random() * 2 + 's';
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                
                container.appendChild(confetti);
                
                // 3秒后移除
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 3000);
            }, i * 50);
        }
    }

    // 睡眠函数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new LotteryApp();
    
    // 添加一些页面交互效果
    addPageEffects();
});

// 添加页面特效
function addPageEffects() {
    // 鼠标移动背景效果
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        document.body.style.background = `
            radial-gradient(circle at ${x * 100}% ${y * 100}%, 
            rgba(168, 85, 247, 0.4) 0%, 
            rgba(236, 72, 153, 0.3) 25%, 
            rgba(239, 68, 68, 0.2) 50%, 
            rgba(168, 85, 247, 0.1) 100%)
        `;
    });

    // 添加标题发光效果
    const title = document.querySelector('h1');
    if (title) {
        title.addEventListener('mouseenter', () => {
            title.classList.add('glow-text');
        });
        
        title.addEventListener('mouseleave', () => {
            title.classList.remove('glow-text');
        });
    }

    // 添加卡片悬停效果
    const cards = document.querySelectorAll('.bg-white\\/10');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px) scale(1.02)';
            card.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// 重置抽奖次数（开发测试用）
function resetLottery() {
    localStorage.removeItem('lotteryUserData');
    localStorage.removeItem('lotteryHistory');
    location.reload();
}

// 在控制台中提供重置功能
console.log('🎉 抽奖页面已加载完成！');
console.log('💡 开发提示：在控制台中输入 resetLottery() 可以重置抽奖次数和历史记录');

// 错误处理
window.addEventListener('error', (e) => {
    console.error('页面发生错误：', e.error);
});

// 确保在移动设备上的良好体验
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    document.addEventListener('DOMContentLoaded', () => {
        // 移动设备特殊处理
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
        
        // 禁用双击缩放
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    });
} 