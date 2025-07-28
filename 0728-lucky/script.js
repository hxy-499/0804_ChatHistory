// 全局变量
let participants = [];
let winners = [];
let isDrawing = false;
let drawInterval;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initParticles();
    loadDefaultParticipants();
});

// 初始化粒子背景
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    
    // 创建粒子
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // 随机大小
        const size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // 随机位置
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 4 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
        
        particlesContainer.appendChild(particle);
        
        // 动画结束后移除粒子
        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    }
    
    // 持续创建粒子
    setInterval(createParticle, 300);
}

// 加载默认参与者
function loadDefaultParticipants() {
    const defaultNames = [
        '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
        '郑十一', '王十二', '冯十三', '陈十四', '褚十五', '卫十六',
        '蒋十七', '沈十八', '韩十九', '杨二十'
    ];
    
    defaultNames.forEach(name => {
        participants.push(name);
    });
    
    updateParticipantList();
    updateTotalCount();
}

// 添加参与者
function addParticipant() {
    const nameInput = document.getElementById('nameInput');
    const name = nameInput.value.trim();
    
    if (name === '') {
        showMessage('请输入姓名！', 'error');
        return;
    }
    
    if (participants.includes(name)) {
        showMessage('该姓名已存在！', 'warning');
        return;
    }
    
    participants.push(name);
    nameInput.value = '';
    
    updateParticipantList();
    updateTotalCount();
    showMessage('添加成功！', 'success');
}

// 移除参与者
function removeParticipant(name) {
    const index = participants.indexOf(name);
    if (index > -1) {
        participants.splice(index, 1);
        updateParticipantList();
        updateTotalCount();
        showMessage('已移除参与者！', 'info');
    }
}

// 更新参与者列表显示
function updateParticipantList() {
    const participantList = document.getElementById('participantList');
    participantList.innerHTML = '';
    
    participants.forEach((name, index) => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center bg-white bg-opacity-20 rounded-lg p-3 animate-in slide-in-from-left duration-300';
        li.style.animationDelay = `${index * 50}ms`;
        
        li.innerHTML = `
            <span class="flex items-center">
                <i class="fas fa-user text-blue-300 mr-2"></i>
                ${name}
            </span>
            <button onclick="removeParticipant('${name}')" 
                    class="text-red-400 hover:text-red-300 transition-colors duration-200">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        participantList.appendChild(li);
    });
}

// 更新总人数
function updateTotalCount() {
    document.getElementById('totalCount').textContent = participants.length;
}

// 开始抽奖
function startDraw() {
    if (participants.length === 0) {
        showMessage('请先添加参与者！', 'error');
        return;
    }
    
    if (isDrawing) {
        stopDraw();
        return;
    }
    
    isDrawing = true;
    const drawBtn = document.getElementById('drawBtn');
    const drawDisplay = document.getElementById('drawDisplay');
    
    // 更新按钮状态
    drawBtn.innerHTML = '<i class="fas fa-stop mr-2"></i>停止抽奖';
    drawBtn.className = drawBtn.className.replace('from-yellow-400 to-orange-500', 'from-red-400 to-red-600');
    
    // 开始滚动动画
    drawDisplay.className += ' rolling-animation';
    
    let currentIndex = 0;
    drawInterval = setInterval(() => {
        const randomName = participants[Math.floor(Math.random() * participants.length)];
        drawDisplay.innerHTML = `
            <i class="fas fa-star sparkle-animation mr-2"></i>
            ${randomName}
            <i class="fas fa-star sparkle-animation ml-2"></i>
        `;
        currentIndex++;
    }, 100);
}

// 停止抽奖
function stopDraw() {
    if (!isDrawing) return;
    
    clearInterval(drawInterval);
    isDrawing = false;
    
    const drawBtn = document.getElementById('drawBtn');
    const drawDisplay = document.getElementById('drawDisplay');
    const prizeSelect = document.getElementById('prizeSelect');
    
    // 移除滚动动画
    drawDisplay.className = drawDisplay.className.replace(' rolling-animation', '');
    
    // 选择最终获奖者
    const winner = participants[Math.floor(Math.random() * participants.length)];
    const prize = prizeSelect.value;
    
    // 显示获奖者
    drawDisplay.innerHTML = `
        <div class="animate-in zoom-in fade-in duration-1000">
            <div class="text-6xl mb-2">🎉</div>
            <div class="text-2xl font-bold">${winner}</div>
            <div class="text-lg text-yellow-300 mt-2">${prize}</div>
        </div>
    `;
    
    // 添加到获奖名单
    addWinner(winner, prize);
    
    // 重置按钮
    drawBtn.innerHTML = '<i class="fas fa-play mr-2"></i>开始抽奖';
    drawBtn.className = drawBtn.className.replace('from-red-400 to-red-600', 'from-yellow-400 to-orange-500');
    
    // 显示庆祝效果
    showCelebration();
    showMessage(`恭喜 ${winner} 获得 ${prize}！`, 'success');
}

// 添加获奖者
function addWinner(name, prize) {
    const winner = {
        name: name,
        prize: prize,
        time: new Date().toLocaleString()
    };
    
    winners.unshift(winner); // 添加到开头
    updateWinnersList();
}

// 更新获奖名单显示
function updateWinnersList() {
    const winnersList = document.getElementById('winnersList');
    
    if (winners.length === 0) {
        winnersList.innerHTML = `
            <div class="text-center text-gray-300 py-8">
                <i class="fas fa-gift text-4xl mb-2"></i>
                <p>还没有中奖者<br>快来开始抽奖吧！</p>
            </div>
        `;
        return;
    }
    
    winnersList.innerHTML = '';
    
    winners.forEach((winner, index) => {
        const div = document.createElement('div');
        div.className = 'bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 text-gray-800 animate-in slide-in-from-top duration-500';
        div.style.animationDelay = `${index * 100}ms`;
        
        let prizeIcon = '';
        switch(winner.prize) {
            case '一等奖': prizeIcon = '🏆'; break;
            case '二等奖': prizeIcon = '🥈'; break;
            case '三等奖': prizeIcon = '🥉'; break;
            case '特别奖': prizeIcon = '🌟'; break;
            case '幸运奖': prizeIcon = '🍀'; break;
            default: prizeIcon = '🎁';
        }
        
        div.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-bold text-lg">${prizeIcon} ${winner.prize}</div>
                    <div class="text-gray-700">${winner.name}</div>
                    <div class="text-sm text-gray-600">${winner.time}</div>
                </div>
                <div class="text-2xl">${prizeIcon}</div>
            </div>
        `;
        
        winnersList.appendChild(div);
    });
}

// 重置抽奖
function resetDraw() {
    if (isDrawing) {
        stopDraw();
    }
    
    const drawDisplay = document.getElementById('drawDisplay');
    drawDisplay.innerHTML = `
        <i class="fas fa-star sparkle-animation mr-2"></i>
        点击开始抽奖
        <i class="fas fa-star sparkle-animation ml-2"></i>
    `;
    
    showMessage('抽奖已重置！', 'info');
}

// 导出结果
function exportResults() {
    if (winners.length === 0) {
        showMessage('暂无中奖结果可导出！', 'warning');
        return;
    }
    
    let csvContent = "奖项,姓名,时间\n";
    winners.forEach(winner => {
        csvContent += `${winner.prize},${winner.name},${winner.time}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `年会抽奖结果_${new Date().toLocaleDateString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showMessage('结果导出成功！', 'success');
    }
}

// 显示消息提示
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-semibold animate-in slide-in-from-right duration-300`;
    
    // 根据类型设置颜色
    switch(type) {
        case 'success':
            messageDiv.className += ' bg-green-500';
            messageDiv.innerHTML = `<i class="fas fa-check mr-2"></i>${message}`;
            break;
        case 'error':
            messageDiv.className += ' bg-red-500';
            messageDiv.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i>${message}`;
            break;
        case 'warning':
            messageDiv.className += ' bg-yellow-500';
            messageDiv.innerHTML = `<i class="fas fa-exclamation mr-2"></i>${message}`;
            break;
        default:
            messageDiv.className += ' bg-blue-500';
            messageDiv.innerHTML = `<i class="fas fa-info mr-2"></i>${message}`;
    }
    
    document.body.appendChild(messageDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        messageDiv.className = messageDiv.className.replace('slide-in-from-right', 'slide-out-to-right');
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// 显示庆祝效果
function showCelebration() {
    // 创建烟花效果
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createFirework();
        }, i * 100);
    }
}

// 创建烟花效果
function createFirework() {
    const firework = document.createElement('div');
    firework.className = 'fixed pointer-events-none';
    firework.style.left = Math.random() * 100 + '%';
    firework.style.top = Math.random() * 100 + '%';
    firework.style.zIndex = '1000';
    
    firework.innerHTML = '🎆';
    firework.style.fontSize = Math.random() * 20 + 20 + 'px';
    firework.style.animation = 'sparkle 1s ease-out forwards';
    
    document.body.appendChild(firework);
    
    setTimeout(() => {
        if (firework.parentNode) {
            firework.parentNode.removeChild(firework);
        }
    }, 1000);
}

// 键盘事件监听
document.addEventListener('keydown', function(event) {
    // 按回车键添加参与者
    if (event.key === 'Enter') {
        const nameInput = document.getElementById('nameInput');
        if (document.activeElement === nameInput) {
            event.preventDefault();
            addParticipant();
        }
    }
    
    // 按空格键开始/停止抽奖
    if (event.code === 'Space') {
        event.preventDefault();
        if (participants.length > 0) {
            startDraw();
        }
    }
    
    // 按ESC键重置
    if (event.key === 'Escape') {
        resetDraw();
    }
});

// 添加触摸设备支持
document.addEventListener('touchstart', function() {
    // 启用触摸设备的hover效果
});

// 页面可见性变化时暂停动画（性能优化）
document.addEventListener('visibilitychange', function() {
    if (document.hidden && isDrawing) {
        stopDraw();
    }
}); 