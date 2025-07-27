/**
 * 任务管理系统 - JavaScript逻辑
 * 遵循Clean Code原则的实现
 */

// 任务数据结构类
class Task {
    constructor({
        id = null,
        title = '',
        description = '',
        priority = 'medium',
        status = 'pending',
        createdDate = new Date(),
        dueDate = null
    }) {
        this.id = id || this.generateId();
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.status = status;
        this.createdDate = new Date(createdDate);
        this.dueDate = dueDate ? new Date(dueDate) : null;
    }

    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 获取优先级颜色类
    getPriorityColor() {
        const colors = {
            high: 'bg-red-100 text-red-800 border-red-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-green-100 text-green-800 border-green-200'
        };
        return colors[this.priority] || colors.medium;
    }

    // 获取状态颜色类
    getStatusColor() {
        const colors = {
            pending: 'bg-gray-100 text-gray-800',
            'in-progress': 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800'
        };
        return colors[this.status] || colors.pending;
    }

    // 获取状态中文名称
    getStatusText() {
        const texts = {
            pending: '待办',
            'in-progress': '进行中',
            completed: '已完成'
        };
        return texts[this.status] || '待办';
    }

    // 获取优先级中文名称
    getPriorityText() {
        const texts = {
            high: '高优先级',
            medium: '中优先级',
            low: '低优先级'
        };
        return texts[this.priority] || '中优先级';
    }

    // 检查任务是否过期
    isOverdue() {
        if (!this.dueDate || this.status === 'completed') return false;
        return new Date() > this.dueDate;
    }

    // 格式化截止日期
    getFormattedDueDate() {
        if (!this.dueDate) return '';
        return this.dueDate.toLocaleDateString('zh-CN');
    }
}

// 任务管理器类
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = {
            status: 'all',
            priority: 'all',
            search: ''
        };
        this.init();
    }

    init() {
        this.loadTasks();
        this.bindEvents();
        this.renderTasks();
        this.updateStatistics();
    }

    // 从localStorage加载任务
    loadTasks() {
        try {
            const tasksData = localStorage.getItem('taskManagerTasks');
            if (tasksData) {
                const parsedTasks = JSON.parse(tasksData);
                this.tasks = parsedTasks.map(taskData => new Task(taskData));
            }
        } catch (error) {
            console.error('加载任务失败:', error);
            this.tasks = [];
        }
    }

    // 保存任务到localStorage
    saveTasks() {
        try {
            localStorage.setItem('taskManagerTasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('保存任务失败:', error);
        }
    }

    // 添加新任务
    addTask(taskData) {
        const task = new Task(taskData);
        this.tasks.unshift(task); // 新任务添加到最前面
        this.saveTasks();
        this.renderTasks();
        this.updateStatistics();
        this.showNotification('任务添加成功！', 'success');
        return task;
    }

    // 更新任务
    updateTask(id, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            Object.assign(this.tasks[taskIndex], updates);
            this.saveTasks();
            this.renderTasks();
            this.updateStatistics();
            this.showNotification('任务更新成功！', 'success');
        }
    }

    // 删除任务
    deleteTask(id) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            this.tasks.splice(taskIndex, 1);
            this.saveTasks();
            this.renderTasks();
            this.updateStatistics();
            this.showNotification('任务删除成功！', 'info');
        }
    }

    // 根据ID获取任务
    getTaskById(id) {
        return this.tasks.find(task => task.id === id);
    }

    // 筛选任务
    filterTasks() {
        return this.tasks.filter(task => {
            // 状态筛选
            if (this.currentFilter.status !== 'all' && task.status !== this.currentFilter.status) {
                return false;
            }

            // 优先级筛选
            if (this.currentFilter.priority !== 'all' && task.priority !== this.currentFilter.priority) {
                return false;
            }

            // 关键词搜索
            if (this.currentFilter.search) {
                const searchText = this.currentFilter.search.toLowerCase();
                const titleMatch = task.title.toLowerCase().includes(searchText);
                const descMatch = task.description.toLowerCase().includes(searchText);
                if (!titleMatch && !descMatch) {
                    return false;
                }
            }

            return true;
        });
    }

    // 更新统计信息
    updateStatistics() {
        const total = this.tasks.length;
        const pending = this.tasks.filter(task => task.status === 'pending').length;
        const inProgress = this.tasks.filter(task => task.status === 'in-progress').length;
        const completed = this.tasks.filter(task => task.status === 'completed').length;

        document.getElementById('total-tasks').textContent = total;
        document.getElementById('pending-tasks').textContent = pending;
        document.getElementById('in-progress-tasks').textContent = inProgress;
        document.getElementById('completed-tasks').textContent = completed;
    }

    // 渲染任务列表
    renderTasks() {
        const container = document.getElementById('tasks-container');
        const noTasksMessage = document.getElementById('no-tasks');
        const filteredTasks = this.filterTasks();

        if (filteredTasks.length === 0) {
            container.innerHTML = '';
            noTasksMessage.classList.remove('hidden');
        } else {
            noTasksMessage.classList.add('hidden');
            container.innerHTML = filteredTasks.map(task => this.createTaskCard(task)).join('');
        }
    }

    // 创建任务卡片HTML
    createTaskCard(task) {
        const isOverdue = task.isOverdue();
        const overdueClass = isOverdue ? 'border-l-4 border-red-500' : '';
        
        return `
            <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${overdueClass}" 
                 data-task-id="${task.id}">
                <!-- 任务头部 -->
                <div class="flex items-start justify-between mb-3">
                    <h3 class="text-lg font-semibold text-gray-800 flex-1 mr-2">${this.escapeHtml(task.title)}</h3>
                    <div class="flex space-x-1">
                        <button onclick="taskManager.editTask('${task.id}')" 
                                class="text-blue-600 hover:text-blue-800 transition-colors">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="taskManager.deleteTaskWithConfirm('${task.id}')" 
                                class="text-red-600 hover:text-red-800 transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                <!-- 任务描述 -->
                ${task.description ? `
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${this.escapeHtml(task.description)}</p>
                ` : ''}

                <!-- 标签区域 -->
                <div class="flex flex-wrap gap-2 mb-3">
                    <span class="px-2 py-1 text-xs font-medium rounded-full border ${task.getPriorityColor()}">
                        ${task.getPriorityText()}
                    </span>
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${task.getStatusColor()}">
                        ${task.getStatusText()}
                    </span>
                    ${isOverdue ? '<span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">已过期</span>' : ''}
                </div>

                <!-- 截止日期 -->
                ${task.dueDate ? `
                    <div class="text-xs text-gray-500 mb-3">
                        <i class="fas fa-calendar mr-1"></i>
                        截止: ${task.getFormattedDueDate()}
                    </div>
                ` : ''}

                <!-- 状态切换按钮 -->
                <div class="flex space-x-2">
                    ${task.status === 'pending' ? `
                        <button onclick="taskManager.updateTaskStatus('${task.id}', 'in-progress')" 
                                class="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded hover:bg-blue-700 transition-colors">
                            <i class="fas fa-play mr-1"></i>开始
                        </button>
                    ` : ''}
                    
                    ${task.status === 'in-progress' ? `
                        <button onclick="taskManager.updateTaskStatus('${task.id}', 'completed')" 
                                class="flex-1 bg-green-600 text-white text-xs py-2 px-3 rounded hover:bg-green-700 transition-colors">
                            <i class="fas fa-check mr-1"></i>完成
                        </button>
                        <button onclick="taskManager.updateTaskStatus('${task.id}', 'pending')" 
                                class="flex-1 bg-gray-600 text-white text-xs py-2 px-3 rounded hover:bg-gray-700 transition-colors">
                            <i class="fas fa-pause mr-1"></i>暂停
                        </button>
                    ` : ''}
                    
                    ${task.status === 'completed' ? `
                        <button onclick="taskManager.updateTaskStatus('${task.id}', 'pending')" 
                                class="flex-1 bg-yellow-600 text-white text-xs py-2 px-3 rounded hover:bg-yellow-700 transition-colors">
                            <i class="fas fa-undo mr-1"></i>重新开始
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 更新任务状态
    updateTaskStatus(id, newStatus) {
        this.updateTask(id, { status: newStatus });
    }

    // 编辑任务
    editTask(id) {
        const task = this.getTaskById(id);
        if (!task) return;

        // 填充编辑表单
        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-description').value = task.description;
        document.getElementById('edit-task-priority').value = task.priority;
        document.getElementById('edit-task-due-date').value = 
            task.dueDate ? task.dueDate.toISOString().split('T')[0] : '';

        // 显示编辑模态框
        document.getElementById('edit-modal').classList.remove('hidden');
    }

    // 删除任务（带确认）
    deleteTaskWithConfirm(id) {
        if (confirm('确定要删除这个任务吗？此操作无法撤销。')) {
            this.deleteTask(id);
        }
    }

    // 设置筛选条件
    setFilter(type, value) {
        this.currentFilter[type] = value;
        this.renderTasks();
    }

    // 清除所有筛选
    clearFilters() {
        this.currentFilter = {
            status: 'all',
            priority: 'all',
            search: ''
        };
        
        // 重置表单
        document.getElementById('search-input').value = '';
        document.getElementById('status-filter').value = 'all';
        document.getElementById('priority-filter').value = 'all';
        
        this.renderTasks();
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white transition-opacity duration-300 ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // 绑定事件监听器
    bindEvents() {
        // 任务添加表单
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskFormSubmit();
        });

        // 编辑表单
        document.getElementById('edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditFormSubmit();
        });

        // 模态框控制
        document.getElementById('close-modal').addEventListener('click', () => {
            document.getElementById('edit-modal').classList.add('hidden');
        });

        document.getElementById('cancel-edit').addEventListener('click', () => {
            document.getElementById('edit-modal').classList.add('hidden');
        });

        // 点击模态框背景关闭
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                document.getElementById('edit-modal').classList.add('hidden');
            }
        });

        // 表单折叠切换
        document.getElementById('toggle-form').addEventListener('click', () => {
            const form = document.getElementById('task-form');
            const icon = document.querySelector('#toggle-form i');
            
            if (form.style.display === 'none') {
                form.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
            } else {
                form.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
            }
        });

        // 搜索输入
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.setFilter('search', e.target.value);
        });

        // 筛选器
        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.setFilter('status', e.target.value);
        });

        document.getElementById('priority-filter').addEventListener('change', (e) => {
            this.setFilter('priority', e.target.value);
        });

        // 清除筛选按钮
        document.getElementById('clear-filters').addEventListener('click', () => {
            this.clearFilters();
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('edit-modal').classList.add('hidden');
            }
        });
    }

    // 处理任务添加表单提交
    handleTaskFormSubmit() {
        const formData = {
            title: document.getElementById('task-title').value.trim(),
            description: document.getElementById('task-description').value.trim(),
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-due-date').value || null
        };

        if (!formData.title) {
            this.showNotification('请输入任务标题', 'error');
            return;
        }

        this.addTask(formData);
        
        // 重置表单
        document.getElementById('task-form').reset();
        document.getElementById('task-priority').value = 'medium';
    }

    // 处理编辑表单提交
    handleEditFormSubmit() {
        const id = document.getElementById('edit-task-id').value;
        const updates = {
            title: document.getElementById('edit-task-title').value.trim(),
            description: document.getElementById('edit-task-description').value.trim(),
            priority: document.getElementById('edit-task-priority').value,
            dueDate: document.getElementById('edit-task-due-date').value || null
        };

        if (!updates.title) {
            this.showNotification('请输入任务标题', 'error');
            return;
        }

        this.updateTask(id, updates);
        document.getElementById('edit-modal').classList.add('hidden');
    }
}

// 初始化任务管理器
const taskManager = new TaskManager();

// 防止意外离开页面时丢失数据
window.addEventListener('beforeunload', () => {
    taskManager.saveTasks();
});

// 添加一些示例样式类
const additionalStyles = `
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
`;

// 将样式添加到页面
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

console.log('任务管理系统初始化完成！'); 