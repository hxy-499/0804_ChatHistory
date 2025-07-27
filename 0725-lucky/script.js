// 抽奖配置
const LOTTERY_CONFIG = {
    prizes: [
        {
            id: 1,
            name: 'iPhone 15',
            icon: 'fas fa-mobile-alt',
            probability: 0.01, // 1%
            color: '#ffd700',
            angle: 30 // 扇形中心角度
        },
        {
            id: 2,
            name: 'iPad',
            icon: 'fas fa-tablet-alt',
            probability: 0.03, // 3%
            color: '#ff6b6b',
            angle: 90 // 扇形中心角度
        },
        {
            id: 3,
            name: 'AirPods',
            icon: 'fas fa-headphones',
            probability: 0.05, // 5%
            color: '#4ecdc4',
            angle: 150 // 扇形中心角度
        },
        {
            id: 4,
            name: '充电宝',
            icon: 'fas fa-battery-three-quarters',
            probability: 0.15, // 15%
            color: '#45b7d1',
            angle: 210 // 扇形中心角度
        },
        {
            id: 5,
            name: '优惠券',
            icon: 'fas fa-ticket-alt',
            probability: 0.25, // 25%
            color: '#96ceb4',
            angle: 270 // 扇形中心角度
        },
        {
            id: 6,
            name: '谢谢参与',
            icon: 'fas fa-hand-paper',
            probability: 0.51, // 51%
            color: '#cc8e35',
            angle: 330 // 扇形中心角度
        }
    ],
    maxDailyAttempts: 3, // 每日最大抽奖次数
    spinDuration: 4000, // 转盘旋转时间（毫秒）
    minRotations: 5 // 最少旋转圈数
};

// 全局状态
let gameState = {
    isSpinning: false,
    userInfo: null,
    remainingAttempts: LOTTERY_CONFIG.maxDailyAttempts,
    lotteryHistory: []
};

// DOM元素
const elements = {
    wheel: document.getElementById('wheel'),
    spinBtn: document.getElementById('spin-btn'),
    userForm: document.getElementById('user-form'),
    userName: document.getElementById('user-name'),
    userPhone: document.getElementById('user-phone'),
    remainingChances: document.getElementById('remaining-chances'),
    resultModal: document.getElementById('result-modal'),
    resultIcon: document.getElementById('result-icon'),
    resultTitle: document.getElementById('result-title'),
    resultMessage: document.getElementById('result-message'),
    closeModal: document.getElementById('close-modal')
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
    bindEvents();
    loadUserData();
});

// 初始化游戏
function initializeGame() {
    console.log('🎮 初始化抽奖游戏...');
    updateRemainingAttempts();
    updateSpinButtonState();
    
    // 检查是否是新的一天，重置抽奖次数
    checkDailyReset();
}

// 绑定事件
function bindEvents() {
    // 用户信息表单提交
    elements.userForm.addEventListener('submit', handleUserFormSubmit);
    
    // 抽奖按钮点击
    elements.spinBtn.addEventListener('click', handleSpinClick);
    
    // 关闭弹窗
    elements.closeModal.addEventListener('click', closeResultModal);
    elements.resultModal.addEventListener('click', function(e) {
        if (e.target === elements.resultModal) {
            closeResultModal();
        }
    });
    
    // 输入框实时验证
    elements.userName.addEventListener('input', validateUserInput);
    elements.userPhone.addEventListener('input', validateUserInput);
}

// 处理用户信息表单提交
function handleUserFormSubmit(e) {
    e.preventDefault();
    
    const name = elements.userName.value.trim();
    const phone = elements.userPhone.value.trim();
    
    if (validateUserInfo(name, phone)) {
        gameState.userInfo = { name, phone };
        saveUserData();
        showSuccessMessage('用户信息已确认！现在可以开始抽奖了。');
        updateSpinButtonState();
    }
}

// 验证用户信息
function validateUserInfo(name, phone) {
    // 姓名验证
    if (!name || name.length < 2) {
        showErrorMessage('请输入有效的姓名（至少2个字符）');
        return false;
    }
    
    // 手机号验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
        showErrorMessage('请输入有效的11位手机号码');
        return false;
    }
    
    return true;
}

// 实时输入验证
function validateUserInput() {
    const name = elements.userName.value.trim();
    const phone = elements.userPhone.value.trim();
    
    // 移除之前的错误样式
    elements.userName.classList.remove('border-red-500');
    elements.userPhone.classList.remove('border-red-500');
    
    // 实时验证并添加视觉反馈
    if (name && name.length >= 2) {
        elements.userName.classList.add('border-green-500');
    }
    
    if (phone && /^1[3-9]\d{9}$/.test(phone)) {
        elements.userPhone.classList.add('border-green-500');
    }
}

// 处理转盘点击
function handleSpinClick() {
    if (gameState.isSpinning) return;
    
    // 检查用户信息
    if (!gameState.userInfo) {
        showErrorMessage('请先填写用户信息！');
        return;
    }
    
    // 检查抽奖次数
    if (gameState.remainingAttempts <= 0) {
        showErrorMessage('今日抽奖次数已用完，明天再来吧！');
        return;
    }
    
    startSpin();
}

// 开始转盘
function startSpin() {
    console.log('🎯 开始抽奖...');
    
    gameState.isSpinning = true;
    updateSpinButtonState();
    
    // 减少抽奖次数
    gameState.remainingAttempts--;
    updateRemainingAttempts();
    saveUserData();
    
    // 确定中奖结果
    const prize = determinePrize();
    console.log('🎁 中奖结果:', prize);
    
    // 计算转盘停止角度
    const finalAngle = calculateFinalAngle(prize.angle);
    
    // 添加旋转动画
    elements.wheel.style.setProperty('--final-rotation', `${finalAngle}deg`);
    elements.wheel.classList.add('spinning');
    
    // 播放转盘旋转音效（如果需要）
    // playSpinSound();
    
    // 转盘停止后显示结果
    setTimeout(() => {
        showResult(prize);
        gameState.isSpinning = false;
        updateSpinButtonState();
        
        // 移除旋转动画类
        setTimeout(() => {
            elements.wheel.classList.remove('spinning');
        }, 500);
    }, LOTTERY_CONFIG.spinDuration);
}

// 确定中奖结果
function determinePrize() {
    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (const prize of LOTTERY_CONFIG.prizes) {
        cumulativeProbability += prize.probability;
        if (random < cumulativeProbability) {
            return prize;
        }
    }
    
    // 默认返回最后一个奖品（谢谢参与）
    return LOTTERY_CONFIG.prizes[LOTTERY_CONFIG.prizes.length - 1];
}

// 计算转盘最终角度
function calculateFinalAngle(targetAngle) {
    // 基础旋转圈数（至少5圈）
    const baseRotations = LOTTERY_CONFIG.minRotations * 360;
    
    // 添加随机额外旋转（0-2圈）
    const extraRotations = Math.random() * 2 * 360;
    
    // 计算最终角度（360 - targetAngle 是因为转盘是顺时针转动，但指针指向需要逆向计算）
    const finalAngle = baseRotations + extraRotations + (360 - targetAngle);
    
    return finalAngle;
}

// 显示抽奖结果
function showResult(prize) {
    console.log('🎊 显示结果:', prize);
    
    // 记录抽奖历史
    const lotteryRecord = {
        prize: prize.name,
        time: new Date().toISOString(),
        user: gameState.userInfo.name
    };
    gameState.lotteryHistory.push(lotteryRecord);
    saveUserData();
    
    // 设置弹窗内容
    elements.resultIcon.innerHTML = `<i class="${prize.icon}" style="color: ${prize.color}"></i>`;
    
    if (prize.name === '谢谢参与') {
        elements.resultTitle.textContent = '很遗憾...';
        elements.resultTitle.className = 'text-2xl font-bold mb-4 text-gray-600';
        elements.resultMessage.textContent = '这次没有中奖，不要灰心，明天再来试试运气吧！';
    } else {
        elements.resultTitle.textContent = '恭喜中奖！';
        elements.resultTitle.className = 'text-2xl font-bold mb-4 text-green-600 gradient-text';
        elements.resultMessage.innerHTML = `
            <div class="text-lg font-semibold mb-2">🎉 您获得了：${prize.name}</div>
            <div class="text-sm text-gray-600">请保持手机畅通，客服将在3个工作日内联系您！</div>
        `;
        
        // 添加中奖特效
        createCelebrationEffect();
    }
    
    // 显示弹窗
    elements.resultModal.classList.add('show');
    elements.resultModal.classList.remove('hidden');
}

// 创建庆祝特效
function createCelebrationEffect() {
    // 创建烟花效果
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            createFirework();
        }, i * 200);
    }
    
    // 创建彩带效果
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            createConfetti();
        }, Math.random() * 2000);
    }
}

// 创建烟花
function createFirework() {
    const firework = document.createElement('div');
    firework.className = 'firework';
    firework.style.left = Math.random() * window.innerWidth + 'px';
    firework.style.top = Math.random() * window.innerHeight + 'px';
    
    document.body.appendChild(firework);
    
    setTimeout(() => {
        firework.remove();
    }, 1000);
}

// 创建彩带
function createConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * window.innerWidth + 'px';
    confetti.style.top = '-10px';
    
    // 随机颜色
    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#cc8e35'];
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    document.body.appendChild(confetti);
    
    setTimeout(() => {
        confetti.remove();
    }, 3000);
}

// 关闭结果弹窗
function closeResultModal() {
    elements.resultModal.classList.remove('show');
    elements.resultModal.classList.add('hidden');
}

// 更新剩余抽奖次数显示
function updateRemainingAttempts() {
    elements.remainingChances.textContent = gameState.remainingAttempts;
    
    // 根据剩余次数改变颜色
    if (gameState.remainingAttempts === 0) {
        elements.remainingChances.className = 'text-red-400 font-bold';
    } else if (gameState.remainingAttempts === 1) {
        elements.remainingChances.className = 'text-orange-400 font-bold';
    } else {
        elements.remainingChances.className = 'text-yellow-400 font-bold';
    }
}

// 更新抽奖按钮状态
function updateSpinButtonState() {
    const canSpin = gameState.userInfo && 
                   gameState.remainingAttempts > 0 && 
                   !gameState.isSpinning;
    
    elements.spinBtn.disabled = !canSpin;
    
    if (gameState.isSpinning) {
        elements.spinBtn.innerHTML = '<div class="loading-spinner"></div>正在抽奖...';
    } else if (!gameState.userInfo) {
        elements.spinBtn.innerHTML = '<i class="fas fa-user-times mr-2"></i>请先填写信息';
    } else if (gameState.remainingAttempts === 0) {
        elements.spinBtn.innerHTML = '<i class="fas fa-clock mr-2"></i>明天再来';
    } else {
        elements.spinBtn.innerHTML = '<i class="fas fa-play mr-2"></i>开始抽奖';
    }
}

// 检查每日重置
function checkDailyReset() {
    const today = new Date().toDateString();
    const lastPlayDate = localStorage.getItem('lastPlayDate');
    
    if (lastPlayDate !== today) {
        // 新的一天，重置抽奖次数
        gameState.remainingAttempts = LOTTERY_CONFIG.maxDailyAttempts;
        localStorage.setItem('lastPlayDate', today);
        console.log('🌅 新的一天，重置抽奖次数');
    }
}

// 保存用户数据到本地存储
function saveUserData() {
    const userData = {
        userInfo: gameState.userInfo,
        remainingAttempts: gameState.remainingAttempts,
        lotteryHistory: gameState.lotteryHistory
    };
    
    localStorage.setItem('lotteryUserData', JSON.stringify(userData));
    localStorage.setItem('lastPlayDate', new Date().toDateString());
}

// 从本地存储加载用户数据
function loadUserData() {
    try {
        const userData = localStorage.getItem('lotteryUserData');
        if (userData) {
            const data = JSON.parse(userData);
            
            if (data.userInfo) {
                gameState.userInfo = data.userInfo;
                elements.userName.value = data.userInfo.name;
                elements.userPhone.value = data.userInfo.phone;
                
                // 添加视觉反馈
                elements.userName.classList.add('border-green-500');
                elements.userPhone.classList.add('border-green-500');
                
                showSuccessMessage('欢迎回来！用户信息已加载。');
            }
            
            if (typeof data.remainingAttempts === 'number') {
                gameState.remainingAttempts = data.remainingAttempts;
            }
            
            if (Array.isArray(data.lotteryHistory)) {
                gameState.lotteryHistory = data.lotteryHistory;
            }
        }
    } catch (error) {
        console.error('加载用户数据失败:', error);
    }
    
    updateRemainingAttempts();
    updateSpinButtonState();
}

// 显示成功消息
function showSuccessMessage(message) {
    removeExistingMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
    successDiv.style.display = 'block';
    
    elements.userForm.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// 显示错误消息
function showErrorMessage(message) {
    removeExistingMessages();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i>${message}`;
    errorDiv.style.display = 'block';
    
    elements.userForm.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// 移除现有消息
function removeExistingMessages() {
    const existingMessages = elements.userForm.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
}

// 键盘事件处理
document.addEventListener('keydown', function(e) {
    // ESC键关闭弹窗
    if (e.key === 'Escape') {
        closeResultModal();
    }
    
    // 回车键开始抽奖（如果满足条件）
    if (e.key === 'Enter' && !gameState.isSpinning && gameState.userInfo && gameState.remainingAttempts > 0) {
        // 如果当前焦点不在输入框上
        if (!elements.userName.matches(':focus') && !elements.userPhone.matches(':focus')) {
            handleSpinClick();
        }
    }
});

// 防止页面刷新时丢失状态
window.addEventListener('beforeunload', function() {
    saveUserData();
});

// 调试函数（仅开发时使用）
window.debugLottery = {
    resetAttempts: () => {
        gameState.remainingAttempts = LOTTERY_CONFIG.maxDailyAttempts;
        updateRemainingAttempts();
        updateSpinButtonState();
        console.log('🔄 抽奖次数已重置');
    },
    clearData: () => {
        localStorage.removeItem('lotteryUserData');
        localStorage.removeItem('lastPlayDate');
        location.reload();
    },
    showHistory: () => {
        console.table(gameState.lotteryHistory);
    },
    testPrize: (prizeId) => {
        const prize = LOTTERY_CONFIG.prizes.find(p => p.id === prizeId);
        if (prize) {
            showResult(prize);
        }
    }
};

console.log('🎲 抽奖游戏已加载完成！');
console.log('💡 调试工具已挂载到 window.debugLottery'); 