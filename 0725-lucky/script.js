// 全局变量
let participants = [];
let winners = [];
let isDrawing = false;
let drawInterval;
let autoStopTimeout;
let countdownInterval;
let pendingImportNames = []; // 待导入的姓名列表

// 奖项配置
let prizeConfig = {
    '一等奖': { count: 2, icon: '🏆' },
    '二等奖': { count: 3, icon: '🥈' },
    '三等奖': { count: 4, icon: '🥉' },
    '特别奖': { count: 1, icon: '🌟' },
    '幸运奖': { count: 6, icon: '🍀' }
};

// 奖项显示顺序
const prizeOrder = ['幸运奖', '三等奖', '二等奖', '一等奖', '特别奖'];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initParticles();
    loadDefaultParticipants();
    updatePrizeSelect();
    updatePrizeInfo();
    updateWinnersList(); // 确保中奖名单正确初始化
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

// 更新奖项选择下拉框
function updatePrizeSelect() {
    const prizeSelect = document.getElementById('prizeSelect');
    prizeSelect.innerHTML = '';
    const availableParticipants = getAvailableParticipants();
    
    // 按指定顺序排列奖项
    prizeOrder.forEach(prizeName => {
        const option = document.createElement('option');
        option.value = prizeName;
        
        const drawnCount = getDrawnCount(prizeName);
        const totalCount = prizeConfig[prizeName].count;
        const remainingCount = getRemainingCount(prizeName);
        const isComplete = isPrizeComplete(prizeName);
        
        if (isComplete) {
            option.textContent = `${prizeConfig[prizeName].icon} ${prizeName}`;
            option.style.color = '#999'; // 灰色表示已抽完
        } else {
            option.textContent = `${prizeConfig[prizeName].icon} ${prizeName}`;
            option.style.color = 'black';
        }
        
        prizeSelect.appendChild(option);
    });
    
    // 绑定事件监听器
    bindPrizeSelectEvent();
    
    // 更新奖项信息
    updatePrizeInfo();
}

// 统计指定奖项已经抽取的人数
function getDrawnCount(prizeName) {
    return winners.filter(winner => winner.prize === prizeName).length;
}

// 检查奖项是否已经抽完
function isPrizeComplete(prizeName) {
    const drawnCount = getDrawnCount(prizeName);
    const totalCount = prizeConfig[prizeName].count;
    return drawnCount >= totalCount;
}

// 获取奖项剩余名额
function getRemainingCount(prizeName) {
    const drawnCount = getDrawnCount(prizeName);
    const totalCount = prizeConfig[prizeName].count;
    return Math.max(0, totalCount - drawnCount);
}

// 获取所有已获奖人员名单
function getAllWinnerNames() {
    return [...new Set(winners.map(winner => winner.name))];
}

// 获取未获奖的参与者名单
function getAvailableParticipants() {
    const winnerNames = getAllWinnerNames();
    return participants.filter(name => !winnerNames.includes(name));
}

// 更新奖项信息显示
function updatePrizeInfo() {
    const prizeSelect = document.getElementById('prizeSelect');
    const prizeInfo = document.getElementById('prizeInfo');
    const selectedPrize = prizeSelect.value;
    
    if (selectedPrize && prizeConfig[selectedPrize]) {
        const config = prizeConfig[selectedPrize];
        const drawnCount = getDrawnCount(selectedPrize);
        const remainingCount = getRemainingCount(selectedPrize);
        const isComplete = isPrizeComplete(selectedPrize);
        const availableParticipants = getAvailableParticipants();
        const totalWinners = getAllWinnerNames().length;
        
        if (isComplete) {
            prizeInfo.innerHTML = `
                <i class="fas fa-check-circle mr-1 text-green-400"></i>
                <span class="text-gray-400">(该奖项已抽完 ${drawnCount}/${config.count}人)</span>
            `;
        } else {
            prizeInfo.innerHTML = `
                <i class="fas fa-info-circle mr-1"></i>
                本次将抽取 <span class="text-yellow-400 font-semibold">${remainingCount}</span> 位获奖者
                <span class="text-gray-400">(已抽${drawnCount}/${config.count}人，可选${availableParticipants.length}人)</span>
            `;
        }
    }
}

// 在updatePrizeSelect函数中绑定事件监听器
function bindPrizeSelectEvent() {
    const prizeSelect = document.getElementById('prizeSelect');
    if (prizeSelect) {
        prizeSelect.addEventListener('change', updatePrizeInfo);
    }
}

// 开始抽奖
function startDraw() {
    const prizeSelect = document.getElementById('prizeSelect');
    const selectedPrize = prizeSelect.value;
    const totalPrizeCount = prizeConfig[selectedPrize].count;
    const remainingCount = getRemainingCount(selectedPrize);
    const availableParticipants = getAvailableParticipants();
    
    if (participants.length === 0) {
        showMessage('请先添加参与者！', 'error');
        return;
    }
    
    // 检查奖项是否已经抽完
    if (isPrizeComplete(selectedPrize)) {
        showMessage(`${selectedPrize}已经抽完了！请选择其他奖项`, 'warning');
        return;
    }
    
    // 检查未获奖人员是否足够
    if (availableParticipants.length < remainingCount) {
        const winnerCount = getAllWinnerNames().length;
        showMessage(`未获奖人员不足！需要${remainingCount}人，但只有${availableParticipants.length}人未获奖`, 'error');
        return;
    }
    
    if (isDrawing) {
        return; // 如果正在抽奖中，不做任何操作
    }
    
    isDrawing = true;
    const drawBtn = document.getElementById('drawBtn');
    const drawDisplay = document.getElementById('drawDisplay');
    
    // 禁用按钮并显示抽奖中状态
    drawBtn.disabled = true;
    drawBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>抽奖中...';
    drawBtn.className = drawBtn.className.replace('from-yellow-400 to-orange-500', 'from-blue-400 to-purple-600');
    
    // 开始滚动动画
    drawDisplay.className += ' rolling-animation';
    
    // 抽奖持续时间（3秒）
    const drawDuration = 3000;
    let countdown = Math.ceil(drawDuration / 1000);
    
    // 更新按钮倒计时显示
    const updateCountdown = () => {
        if (countdown > 0) {
            drawBtn.innerHTML = `<i class="fas fa-hourglass-half fa-spin mr-2"></i>抽奖中... ${countdown}s`;
            countdown--;
        }
    };
    
    // 立即显示第一次倒计时
    updateCountdown();
    
    // 每秒更新倒计时
    countdownInterval = setInterval(updateCountdown, 1000);
    
    // 快速滚动显示名字（多人抽奖时显示多个名字）
    drawInterval = setInterval(() => {
        const currentAvailableParticipants = getAvailableParticipants();
        
        if (remainingCount === 1) {
            // 单人抽奖，显示一个名字
            const randomName = currentAvailableParticipants[Math.floor(Math.random() * currentAvailableParticipants.length)];
            drawDisplay.innerHTML = `
                <div class="text-2xl font-bold">
                    <i class="fas fa-star sparkle-animation mr-2"></i>
                    ${randomName}
                    <i class="fas fa-star sparkle-animation ml-2"></i>
                </div>
            `;
        } else {
            // 多人抽奖，显示多个名字
            const shuffled = [...currentAvailableParticipants].sort(() => 0.5 - Math.random());
            const displayNames = shuffled.slice(0, remainingCount);
            drawDisplay.innerHTML = `
                <div class="space-y-1 w-full">
                    ${displayNames.map(name => `
                        <div class="text-lg font-semibold">
                            <i class="fas fa-star sparkle-animation mr-2"></i>
                            ${name}
                            <i class="fas fa-star sparkle-animation ml-2"></i>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }, 100);
    
    // 设置自动停止
    autoStopTimeout = setTimeout(() => {
        stopDraw();
    }, drawDuration);
}

// 停止抽奖
function stopDraw() {
    if (!isDrawing) return;
    
    // 清理所有定时器
    clearInterval(drawInterval);
    clearInterval(countdownInterval);
    clearTimeout(autoStopTimeout);
    isDrawing = false;
    
    const drawBtn = document.getElementById('drawBtn');
    const drawDisplay = document.getElementById('drawDisplay');
    const prizeSelect = document.getElementById('prizeSelect');
    const prize = prizeSelect.value;
    const remainingCount = getRemainingCount(prize);
    
    // 移除滚动动画
    drawDisplay.className = drawDisplay.className.replace(' rolling-animation', '');
    
    // 选择最终获奖者（支持多人，只从未获奖人员中选择）
    const finalAvailableParticipants = getAvailableParticipants();
    const shuffled = [...finalAvailableParticipants].sort(() => 0.5 - Math.random());
    const selectedWinners = shuffled.slice(0, remainingCount);
    
    // 显示获奖者
    if (remainingCount === 1) {
        // 单人获奖显示
        drawDisplay.innerHTML = `
            <div class="animate-in zoom-in fade-in duration-1000 w-full flex flex-col items-center justify-center">
                <div class="text-3xl mb-2">🎉</div>
                <div class="text-2xl font-bold">${selectedWinners[0]}</div>
                <div class="text-lg text-yellow-300 mt-1">${prize}</div>
            </div>
        `;
    } else {
        // 多人获奖显示
        drawDisplay.innerHTML = `
            <div class="animate-in zoom-in fade-in duration-1000 w-full flex flex-col items-center justify-center">
                <div class="text-3xl mb-2">🎉</div>
                <div class="text-lg font-bold text-yellow-300 mb-2">${prize}</div>
                <div class="space-y-1 text-center">
                    ${selectedWinners.map((winner, index) => `
                        <div class="text-lg font-semibold animate-in slide-in-from-left duration-500" style="animation-delay: ${index * 200}ms">
                            ${prizeConfig[prize].icon} ${winner}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // 添加到获奖名单（支持多人）
    selectedWinners.forEach(winnerName => {
        addWinner(winnerName, prize);
    });
    
    // 重置按钮状态
    drawBtn.disabled = false;
    drawBtn.innerHTML = '<i class="fas fa-play mr-2"></i>开始抽奖';
    drawBtn.className = drawBtn.className.replace('from-blue-400 to-purple-600', 'from-yellow-400 to-orange-500');
    
    // 显示庆祝效果
    showCelebration();
    
    // 显示成功消息
    if (remainingCount === 1) {
        showMessage(`恭喜 ${selectedWinners[0]} 获得 ${prize}！`, 'success');
    } else {
        showMessage(`恭喜 ${selectedWinners.join('、')} 获得 ${prize}！`, 'success');
    }
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
    updatePrizeInfo(); // 更新奖项信息，显示最新的剩余名额
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
        
        const prizeIcon = prizeConfig[winner.prize] ? prizeConfig[winner.prize].icon : '🎁';
        
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
        // 清理所有定时器
        clearInterval(drawInterval);
        clearInterval(countdownInterval);
        clearTimeout(autoStopTimeout);
        isDrawing = false;
        
        // 重置按钮状态
        const drawBtn = document.getElementById('drawBtn');
        drawBtn.disabled = false;
        drawBtn.innerHTML = '<i class="fas fa-play mr-2"></i>开始抽奖';
        drawBtn.className = drawBtn.className.replace('from-blue-400 to-purple-600', 'from-yellow-400 to-orange-500');
    }
    
    const drawDisplay = document.getElementById('drawDisplay');
    drawDisplay.className = drawDisplay.className.replace(' rolling-animation', '');
    drawDisplay.innerHTML = `
        <div class="text-2xl font-bold">
            <i class="fas fa-star sparkle-animation mr-2"></i>
            点击下方按钮开始抽奖
            <i class="fas fa-star sparkle-animation ml-2"></i>
        </div>
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
    
    // 按空格键开始抽奖
    if (event.code === 'Space') {
        event.preventDefault();
        if (participants.length > 0 && !isDrawing) {
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

// ==================== 批量导入功能 ====================

// 显示批量导入模态框
function showBatchImport() {
    document.getElementById('batchImportModal').classList.remove('hidden');
    // 重置状态
    switchImportMethod('text');
    clearBatchImport();
    
    // 添加拖拽事件监听
    setupDragAndDrop();
}

// 隐藏批量导入模态框
function hideBatchImport() {
    document.getElementById('batchImportModal').classList.add('hidden');
    clearBatchImport();
}

// 清空批量导入数据
function clearBatchImport() {
    document.getElementById('batchTextInput').value = '';
    document.getElementById('fileInput').value = '';
    document.getElementById('previewArea').classList.add('hidden');
    document.getElementById('confirmImportBtn').disabled = true;
    pendingImportNames = [];
}

// 切换导入方式
function switchImportMethod(method) {
    const textTab = document.getElementById('textImportTab');
    const fileTab = document.getElementById('fileImportTab');
    const textArea = document.getElementById('textImportArea');
    const fileArea = document.getElementById('fileImportArea');
    
    if (method === 'text') {
        textTab.className = 'px-4 py-2 rounded-lg bg-purple-500 text-white font-semibold';
        fileTab.className = 'px-4 py-2 rounded-lg bg-gray-300 text-gray-700 font-semibold';
        textArea.classList.remove('hidden');
        fileArea.classList.add('hidden');
    } else {
        textTab.className = 'px-4 py-2 rounded-lg bg-gray-300 text-gray-700 font-semibold';
        fileTab.className = 'px-4 py-2 rounded-lg bg-purple-500 text-white font-semibold';
        textArea.classList.add('hidden');
        fileArea.classList.remove('hidden');
    }
    
    // 清空预览
    document.getElementById('previewArea').classList.add('hidden');
    document.getElementById('confirmImportBtn').disabled = true;
    pendingImportNames = [];
}

// 解析姓名文本（支持多种分隔符）
function parseNamesFromText(text) {
    if (!text.trim()) return [];
    
    // 支持多种分隔符：换行符、逗号、分号、空格、制表符
    const separators = /[\n\r,;，；\s\t]+/;
    let names = text.split(separators)
        .map(name => name.trim())
        .filter(name => name.length > 0);
    
    // 去重
    names = [...new Set(names)];
    
    return names;
}

// 预览批量导入
function previewBatchImport() {
    const text = document.getElementById('batchTextInput').value;
    const names = parseNamesFromText(text);
    updatePreview(names);
}

// 更新预览显示
function updatePreview(names) {
    const previewArea = document.getElementById('previewArea');
    const previewList = document.getElementById('previewList');
    const importStats = document.getElementById('importStats');
    const confirmBtn = document.getElementById('confirmImportBtn');
    
    if (names.length === 0) {
        previewArea.classList.add('hidden');
        confirmBtn.disabled = true;
        pendingImportNames = [];
        return;
    }
    
    // 计算统计信息
    const newNames = names.filter(name => !participants.includes(name));
    const duplicateNames = names.filter(name => participants.includes(name));
    
    // 显示预览列表
    previewList.innerHTML = names.map((name, index) => {
        const isDuplicate = participants.includes(name);
        const color = isDuplicate ? 'text-red-500' : 'text-green-600';
        const icon = isDuplicate ? 'fa-exclamation-triangle' : 'fa-check';
        return `<span class="${color}"><i class="fas ${icon} mr-1"></i>${name}</span>`;
    }).join(', ');
    
    // 显示统计信息
    importStats.innerHTML = `
        <div class="flex flex-wrap gap-4">
            <span class="text-green-600"><i class="fas fa-plus mr-1"></i>新增: ${newNames.length}人</span>
            ${duplicateNames.length > 0 ? `<span class="text-red-500"><i class="fas fa-exclamation-triangle mr-1"></i>重复: ${duplicateNames.length}人</span>` : ''}
            <span class="text-blue-600"><i class="fas fa-users mr-1"></i>总计: ${names.length}人</span>
        </div>
    `;
    
    previewArea.classList.remove('hidden');
    confirmBtn.disabled = newNames.length === 0;
    pendingImportNames = names;
}

// 处理文件上传
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileType = file.name.split('.').pop().toLowerCase();
    if (!['txt', 'csv'].includes(fileType)) {
        showMessage('只支持 .txt 和 .csv 文件格式！', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const names = parseNamesFromText(text);
        updatePreview(names);
    };
    
    reader.onerror = function() {
        showMessage('文件读取失败，请重试！', 'error');
    };
    
    reader.readAsText(file, 'UTF-8');
}

// 设置拖拽上传
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    
    // 阻止默认拖拽行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // 拖拽进入和悬停
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    // 拖拽离开
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    // 文件放下
    dropZone.addEventListener('drop', handleDrop, false);
    
    function highlight() {
        dropZone.classList.add('bg-purple-50', 'border-purple-300');
    }
    
    function unhighlight() {
        dropZone.classList.remove('bg-purple-50', 'border-purple-300');
    }
    
    function handleDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            document.getElementById('fileInput').files = files;
            handleFileUpload({ target: { files: [file] } });
        }
    }
}

// 确认批量导入
function confirmBatchImport() {
    if (pendingImportNames.length === 0) {
        showMessage('没有可导入的人员！', 'warning');
        return;
    }
    
    // 只添加不重复的姓名
    const newNames = pendingImportNames.filter(name => !participants.includes(name));
    
    if (newNames.length === 0) {
        showMessage('所有姓名都已存在，无需导入！', 'warning');
        return;
    }
    
    // 添加到参与者列表
    participants.push(...newNames);
    
    // 更新显示
    updateParticipantList();
    updateTotalCount();
    
    // 关闭模态框
    hideBatchImport();
    
    // 显示成功消息
    showMessage(`成功导入 ${newNames.length} 位参与者！`, 'success');
}

// 添加清空所有参与者的功能
function clearAllParticipants() {
    if (participants.length === 0) {
        showMessage('参与者列表已经为空！', 'info');
        return;
    }
    
    if (confirm('确定要清空所有参与者吗？此操作不可恢复。')) {
        participants = [];
        updateParticipantList();
        updateTotalCount();
        showMessage('已清空所有参与者！', 'info');
    }
}

// 模态框点击外部关闭
document.getElementById('batchImportModal').addEventListener('click', function(e) {
    if (e.target === this) {
        hideBatchImport();
    }
});

// ESC键关闭模态框
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const batchModal = document.getElementById('batchImportModal');
        const prizeModal = document.getElementById('prizeConfigModal');
        
        if (!batchModal.classList.contains('hidden')) {
            hideBatchImport();
        } else if (!prizeModal.classList.contains('hidden')) {
            hidePrizeConfig();
        }
    }
});

// ==================== 奖项配置功能 ====================

// 显示奖项配置模态框
function showPrizeConfig() {
    document.getElementById('prizeConfigModal').classList.remove('hidden');
    renderPrizeConfig();
}

// 隐藏奖项配置模态框
function hidePrizeConfig() {
    document.getElementById('prizeConfigModal').classList.add('hidden');
}

// 渲染奖项配置列表
function renderPrizeConfig() {
    const prizeConfigList = document.getElementById('prizeConfigList');
    prizeConfigList.innerHTML = '';
    
    // 按指定顺序排列奖项
    prizeOrder.forEach(prizeName => {
        const config = prizeConfig[prizeName];
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-4 bg-gray-100 rounded-lg';
        
        div.innerHTML = `
            <div class="flex items-center">
                <span class="text-2xl mr-3">${config.icon}</span>
                <span class="font-semibold text-gray-700">${prizeName}</span>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="changePrizeCount('${prizeName}', -1)" 
                        class="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 flex items-center justify-center">
                    <i class="fas fa-minus text-sm"></i>
                </button>
                <span class="w-12 text-center font-bold text-lg" id="count-${prizeName}">${config.count}</span>
                <button onclick="changePrizeCount('${prizeName}', 1)" 
                        class="w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200 flex items-center justify-center">
                    <i class="fas fa-plus text-sm"></i>
                </button>
                <span class="text-gray-600 ml-2">人</span>
            </div>
        `;
        
        prizeConfigList.appendChild(div);
    });
}

// 修改奖项人数
function changePrizeCount(prizeName, change) {
    const currentCount = prizeConfig[prizeName].count;
    const newCount = Math.max(1, currentCount + change); // 最少1人
    
    prizeConfig[prizeName].count = newCount;
    
    // 更新显示
    document.getElementById(`count-${prizeName}`).textContent = newCount;
}

// 保存奖项配置
function savePrizeConfig() {
    // 更新奖项选择下拉框
    updatePrizeSelect();
    
    // 隐藏模态框
    hidePrizeConfig();
    
    // 显示成功消息
    showMessage('奖项配置已保存！', 'success');
}

// 奖项配置模态框点击外部关闭
document.getElementById('prizeConfigModal').addEventListener('click', function(e) {
    if (e.target === this) {
        hidePrizeConfig();
    }
}); 