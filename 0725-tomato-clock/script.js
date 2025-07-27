// 番茄时钟核心类
class PomodoroTimer {
    constructor() {
        // 默认时间配置（分钟）
        this.config = {
            workDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15,
            soundEnabled: true
        };
        
        // 状态枚举
        this.STATES = {
            READY: 'ready',
            WORK: 'work',
            SHORT_BREAK: 'short_break',
            LONG_BREAK: 'long_break',
            PAUSED: 'paused'
        };
        
        // 当前状态
        this.currentState = this.STATES.READY;
        this.previousState = null;
        this.isRunning = false;
        this.currentSession = 1; // 当前番茄钟会话 (1-4)
        this.remainingSeconds = this.config.workDuration * 60;
        this.totalSeconds = this.config.workDuration * 60;
        
        // DOM 元素引用
        this.initializeDOM();
        
        // 定时器
        this.timer = null;
        
        // 音效上下文
        this.audioContext = null;
        
        // 专注模式定时器
        this.focusModeTimer = null;
        
        // 初始化
        this.init();
    }
    
    // 初始化DOM元素引用
    initializeDOM() {
        this.elements = {
            body: document.getElementById('app-body'),
            timerDisplay: document.getElementById('timer-display'),
            statusText: document.getElementById('status-text'),
            statusDot: document.getElementById('status-dot'),
            phaseDescription: document.getElementById('phase-description'),
            progressRing: document.getElementById('progress-ring'),
            playPauseBtn: document.getElementById('play-pause-btn'),
            playPauseIcon: document.getElementById('play-pause-icon'),
            resetBtn: document.getElementById('reset-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            settingsModal: document.getElementById('settings-modal'),
            sessionIndicators: document.getElementById('session-indicators'),
            workDuration: document.getElementById('work-duration'),
            shortBreakDuration: document.getElementById('short-break-duration'),
            longBreakDuration: document.getElementById('long-break-duration'),
            soundEnabled: document.getElementById('sound-enabled'),
            saveSettings: document.getElementById('save-settings'),
            cancelSettings: document.getElementById('cancel-settings')
        };
    }
    
    // 初始化应用
    init() {
        this.loadSettings();
        this.updateUI();
        this.bindEvents();
        this.updateSessionIndicators();
        console.log('番茄时钟初始化完成');
    }
    
    // 绑定事件监听器
    bindEvents() {
        // 按钮事件
        this.elements.playPauseBtn.addEventListener('click', () => this.toggleTimer());
        this.elements.resetBtn.addEventListener('click', () => this.resetTimer());
        this.elements.settingsBtn.addEventListener('click', () => this.showSettings());
        this.elements.saveSettings.addEventListener('click', () => this.saveSettings());
        this.elements.cancelSettings.addEventListener('click', () => this.hideSettings());
        
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // 模态框点击外部关闭
        this.elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.hideSettings();
            }
        });
        
        // 页面可见性变化（防止后台计时不准确）
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isRunning) {
                // 页面重新可见时重新同步时间
                this.syncTime();
            }
        });
    }
    
    // 键盘控制
    handleKeyboard(e) {
        if (this.elements.settingsModal.classList.contains('show')) {
            if (e.key === 'Escape') {
                this.hideSettings();
            }
            return;
        }
        
        switch (e.key) {
            case ' ':
            case 'Enter':
                e.preventDefault();
                this.toggleTimer();
                break;
            case 'r':
            case 'R':
                e.preventDefault();
                this.resetTimer();
                break;
            case 'Escape':
                e.preventDefault();
                this.showSettings();
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                this.toggleFocusMode();
                break;
        }
    }
    
    // 开始/暂停计时器
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    // 开始计时器
    startTimer() {
        if (this.currentState === this.STATES.READY) {
            this.startWork();
        } else if (this.currentState === this.STATES.PAUSED) {
            this.resumeTimer();
        }
        
        this.isRunning = true;
        this.timer = setInterval(() => this.tick(), 1000);
        this.updatePlayPauseButton();
        this.elements.timerDisplay.classList.remove('timer-paused');
        
        // 启用专注模式
        setTimeout(() => this.enableFocusMode(), 3000);
    }
    
    // 暂停计时器
    pauseTimer() {
        this.isRunning = false;
        clearInterval(this.timer);
        this.previousState = this.currentState;
        this.currentState = this.STATES.PAUSED;
        this.updateUI();
        this.updatePlayPauseButton();
        this.elements.timerDisplay.classList.add('timer-paused');
        this.disableFocusMode();
    }
    
    // 恢复计时器
    resumeTimer() {
        this.currentState = this.previousState;
        this.updateUI();
    }
    
    // 重置计时器
    resetTimer() {
        this.isRunning = false;
        clearInterval(this.timer);
        this.currentState = this.STATES.READY;
        this.currentSession = 1;
        this.remainingSeconds = this.config.workDuration * 60;
        this.totalSeconds = this.config.workDuration * 60;
        this.updateUI();
        this.updatePlayPauseButton();
        this.updateSessionIndicators();
        this.elements.timerDisplay.classList.remove('timer-paused');
        this.disableFocusMode();
        this.saveState();
    }
    
    // 开始工作阶段
    startWork() {
        this.currentState = this.STATES.WORK;
        this.remainingSeconds = this.config.workDuration * 60;
        this.totalSeconds = this.config.workDuration * 60;
        this.updateUI();
    }
    
    // 计时器滴答
    tick() {
        this.remainingSeconds--;
        this.updateTimerDisplay();
        this.updateProgressRing();
        
        if (this.remainingSeconds <= 0) {
            this.completeCurrentPhase();
        }
        
        // 每10秒保存一次状态
        if (this.remainingSeconds % 10 === 0) {
            this.saveState();
        }
    }
    
    // 完成当前阶段
    completeCurrentPhase() {
        this.playNotificationSound();
        this.showCelebration();
        
        if (this.currentState === this.STATES.WORK) {
            this.completeWorkSession();
        } else {
            this.completeBreakSession();
        }
    }
    
    // 完成工作会话
    completeWorkSession() {
        if (this.currentSession === 4) {
            // 第4个番茄钟后是长休息
            this.startLongBreak();
        } else {
            // 否则是短休息
            this.startShortBreak();
        }
    }
    
    // 完成休息会话
    completeBreakSession() {
        if (this.currentState === this.STATES.LONG_BREAK) {
            // 长休息后重置会话计数
            this.currentSession = 1;
        } else {
            // 短休息后进入下一个工作会话
            this.currentSession++;
        }
        
        this.startWork();
        this.updateSessionIndicators();
    }
    
    // 开始短休息
    startShortBreak() {
        this.currentState = this.STATES.SHORT_BREAK;
        this.remainingSeconds = this.config.shortBreakDuration * 60;
        this.totalSeconds = this.config.shortBreakDuration * 60;
        this.updateUI();
    }
    
    // 开始长休息
    startLongBreak() {
        this.currentState = this.STATES.LONG_BREAK;
        this.remainingSeconds = this.config.longBreakDuration * 60;
        this.totalSeconds = this.config.longBreakDuration * 60;
        this.updateUI();
    }
    
    // 更新UI
    updateUI() {
        this.updateBackgroundTheme();
        this.updateStatusIndicator();
        this.updateTimerDisplay();
        this.updateProgressRing();
        this.updatePhaseDescription();
    }
    
    // 更新背景主题
    updateBackgroundTheme() {
        const themes = ['work-mode', 'short-break-mode', 'long-break-mode', 'ready-mode', 'paused-mode'];
        themes.forEach(theme => this.elements.body.classList.remove(theme));
        
        switch (this.currentState) {
            case this.STATES.WORK:
                this.elements.body.classList.add('work-mode');
                break;
            case this.STATES.SHORT_BREAK:
                this.elements.body.classList.add('short-break-mode');
                break;
            case this.STATES.LONG_BREAK:
                this.elements.body.classList.add('long-break-mode');
                break;
            case this.STATES.PAUSED:
                this.elements.body.classList.add('paused-mode');
                break;
            default:
                this.elements.body.classList.add('ready-mode');
        }
    }
    
    // 更新状态指示器
    updateStatusIndicator() {
        const statusClasses = ['status-dot-work', 'status-dot-short-break', 'status-dot-long-break', 'status-dot-ready'];
        statusClasses.forEach(cls => this.elements.statusDot.classList.remove(cls));
        
        let statusText = '';
        let statusClass = '';
        
        switch (this.currentState) {
            case this.STATES.WORK:
                statusText = '专注工作';
                statusClass = 'status-dot-work';
                break;
            case this.STATES.SHORT_BREAK:
                statusText = '短休息';
                statusClass = 'status-dot-short-break';
                break;
            case this.STATES.LONG_BREAK:
                statusText = '长休息';
                statusClass = 'status-dot-long-break';
                break;
            case this.STATES.PAUSED:
                statusText = '已暂停';
                statusClass = 'status-dot-ready';
                break;
            default:
                statusText = '准备开始';
                statusClass = 'status-dot-ready';
        }
        
        this.elements.statusText.textContent = statusText;
        this.elements.statusDot.classList.add(statusClass);
    }
    
    // 更新时间显示
    updateTimerDisplay() {
        const minutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.elements.timerDisplay.textContent = timeString;
        
        // 更新页面标题
        document.title = `${timeString} - 极简番茄时钟`;
    }
    
    // 更新进度环
    updateProgressRing() {
        const circumference = 2 * Math.PI * 140; // r=140
        const progress = (this.totalSeconds - this.remainingSeconds) / this.totalSeconds;
        const offset = circumference - (progress * circumference);
        this.elements.progressRing.style.strokeDashoffset = offset;
    }
    
    // 更新阶段描述
    updatePhaseDescription() {
        let description = '';
        
        switch (this.currentState) {
            case this.STATES.WORK:
                description = '专注工作时间';
                break;
            case this.STATES.SHORT_BREAK:
                description = '短暂休息片刻';
                break;
            case this.STATES.LONG_BREAK:
                description = '享受长时间休息';
                break;
            case this.STATES.PAUSED:
                description = '计时器已暂停';
                break;
            default:
                description = '准备开始专注';
        }
        
        this.elements.phaseDescription.textContent = description;
    }
    
    // 更新播放/暂停按钮
    updatePlayPauseButton() {
        const icon = this.elements.playPauseIcon;
        if (this.isRunning) {
            icon.className = 'fas fa-pause text-2xl text-white group-hover:scale-110 transition-transform';
        } else {
            icon.className = 'fas fa-play text-2xl text-white group-hover:scale-110 transition-transform';
        }
    }
    
    // 更新会话指示器
    updateSessionIndicators() {
        const indicators = this.elements.sessionIndicators.children;
        for (let i = 0; i < indicators.length; i++) {
            indicators[i].classList.remove('session-active');
            if (i < this.currentSession) {
                indicators[i].classList.add('session-active');
            }
        }
    }
    
    // 播放通知音效
    playNotificationSound() {
        if (!this.config.soundEnabled) return;
        
        try {
            // 使用Web Audio API生成音效
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 工作结束用高频音，休息结束用低频音
            const frequency = this.currentState === this.STATES.WORK ? 800 : 400;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            // 音量淡入淡出
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
            
        } catch (error) {
            console.log('音效播放失败:', error);
        }
    }
    
    // 显示庆祝动画
    showCelebration() {
        this.elements.timerDisplay.classList.add('celebration');
        setTimeout(() => {
            this.elements.timerDisplay.classList.remove('celebration');
        }, 600);
    }
    
    // 专注模式
    enableFocusMode() {
        if (this.isRunning) {
            this.elements.body.classList.add('focus-mode');
            this.focusModeTimer = setTimeout(() => {
                this.elements.body.classList.add('hide-cursor');
            }, 5000);
        }
    }
    
    disableFocusMode() {
        this.elements.body.classList.remove('focus-mode', 'hide-cursor');
        clearTimeout(this.focusModeTimer);
    }
    
    toggleFocusMode() {
        if (this.elements.body.classList.contains('focus-mode')) {
            this.disableFocusMode();
        } else {
            this.enableFocusMode();
        }
    }
    
    // 设置管理
    showSettings() {
        this.elements.workDuration.value = this.config.workDuration;
        this.elements.shortBreakDuration.value = this.config.shortBreakDuration;
        this.elements.longBreakDuration.value = this.config.longBreakDuration;
        this.elements.soundEnabled.checked = this.config.soundEnabled;
        
        this.elements.settingsModal.classList.add('show');
    }
    
    hideSettings() {
        this.elements.settingsModal.classList.remove('show');
    }
    
    saveSettings() {
        this.config.workDuration = parseInt(this.elements.workDuration.value);
        this.config.shortBreakDuration = parseInt(this.elements.shortBreakDuration.value);
        this.config.longBreakDuration = parseInt(this.elements.longBreakDuration.value);
        this.config.soundEnabled = this.elements.soundEnabled.checked;
        
        // 保存到localStorage
        localStorage.setItem('pomodoro_settings', JSON.stringify(this.config));
        
        // 如果当前是就绪状态，更新时间
        if (this.currentState === this.STATES.READY) {
            this.remainingSeconds = this.config.workDuration * 60;
            this.totalSeconds = this.config.workDuration * 60;
            this.updateTimerDisplay();
            this.updateProgressRing();
        }
        
        this.hideSettings();
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('pomodoro_settings');
            if (saved) {
                this.config = { ...this.config, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.log('设置加载失败:', error);
        }
        
        // 加载保存的状态
        this.loadState();
    }
    
    // 状态持久化
    saveState() {
        const state = {
            currentState: this.currentState,
            currentSession: this.currentSession,
            remainingSeconds: this.remainingSeconds,
            totalSeconds: this.totalSeconds,
            isRunning: this.isRunning,
            timestamp: Date.now()
        };
        
        localStorage.setItem('pomodoro_state', JSON.stringify(state));
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem('pomodoro_state');
            if (saved) {
                const state = JSON.parse(saved);
                const now = Date.now();
                const elapsed = Math.floor((now - state.timestamp) / 1000);
                
                // 如果距离上次保存超过5分钟，重置状态
                if (elapsed > 300) {
                    return;
                }
                
                this.currentState = state.currentState;
                this.currentSession = state.currentSession;
                this.remainingSeconds = Math.max(0, state.remainingSeconds - elapsed);
                this.totalSeconds = state.totalSeconds;
                
                // 如果时间耗尽，完成当前阶段
                if (this.remainingSeconds <= 0 && state.isRunning) {
                    this.completeCurrentPhase();
                } else if (state.isRunning && this.remainingSeconds > 0) {
                    // 如果之前在运行且时间未耗尽，继续运行
                    this.startTimer();
                }
            }
        } catch (error) {
            console.log('状态加载失败:', error);
        }
    }
    
    // 时间同步（处理页面后台运行）
    syncTime() {
        const saved = localStorage.getItem('pomodoro_state');
        if (saved && this.isRunning) {
            const state = JSON.parse(saved);
            const now = Date.now();
            const elapsed = Math.floor((now - state.timestamp) / 1000);
            
            this.remainingSeconds = Math.max(0, state.remainingSeconds - elapsed);
            
            if (this.remainingSeconds <= 0) {
                this.completeCurrentPhase();
            } else {
                this.updateTimerDisplay();
                this.updateProgressRing();
            }
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.pomodoroTimer = new PomodoroTimer();
    
    // 注册 Service Worker (可选，用于离线支持)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => {
            console.log('Service Worker注册失败:', err);
        });
    }
});

// 防止页面刷新时丢失状态
window.addEventListener('beforeunload', () => {
    if (window.pomodoroTimer && window.pomodoroTimer.isRunning) {
        window.pomodoroTimer.saveState();
    }
});

// 处理页面可见性变化
document.addEventListener('visibilitychange', () => {
    if (window.pomodoroTimer) {
        if (document.hidden) {
            window.pomodoroTimer.saveState();
        } else {
            window.pomodoroTimer.syncTime();
        }
    }
}); 