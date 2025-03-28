import { 
    verifyPassword, 
    changePassword, 
    toggleEditMode, 
    isEditMode,
    getKnowledgeBase,
    loadKnowledgeBaseFromFirebase,
    setupRealtimeListener,
    addCategory,
    deleteCategory
} from './auth.js';
import { 
    addKnowledgeItem, 
    updateKnowledgeItem, 
    deleteKnowledgeItem, 
    getKnowledgeItem, 
    getAllKnowledgeItems,
    getAllCategories
} from './core.js';

const elements = {
    addKnowledgeBtn: document.getElementById('addKnowledgeBtn'),
    changePasswordBtn: document.getElementById('changePasswordBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    editKnowledgeModal: document.getElementById('editKnowledgeModal'),
    closeEditModal: document.getElementById('closeEditModal'),
    knowledgeForm: document.getElementById('knowledgeForm'),
    passwordModal: document.getElementById('passwordModal'),
    closePasswordModal: document.getElementById('closePasswordModal'),
    passwordForm: document.getElementById('passwordForm'),
    passwordInput: document.getElementById('passwordInput'),
    newPasswordInput: document.getElementById('newPasswordInput'),
    confirmPasswordInput: document.getElementById('confirmPasswordInput'),
    newPasswordGroup: document.getElementById('newPasswordGroup'),
    confirmPasswordGroup: document.getElementById('confirmPasswordGroup'),
    passwordSubmitBtn: document.getElementById('passwordSubmitBtn'),
    passwordModalTitle: document.getElementById('passwordModalTitle'),
    knowledgeItemsContainer: document.getElementById('knowledgeItems'),
    categoryTabsContainer: document.getElementById('categoryTabs'),
    searchInput: document.getElementById('search'),
    clearSearchBtn: document.getElementById('clearSearch'),
    searchResultsContainer: document.getElementById('searchResults'),
    knowledgeModal: document.getElementById('knowledgeModal'),
    closeModal: document.getElementById('closeModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody')
};

async function init() {
    try {
        await loadKnowledgeBaseFromFirebase();
        renderKnowledgeItems();
        renderCategoryTabs();
        setupEventListeners();
        
        setupRealtimeListener(() => {
            renderKnowledgeItems();
            renderCategoryTabs();
        });
        
        // 初始化编辑按钮状态
        updateUIForEditMode();
    } catch (error) {
        console.error('初始化错误:', error);
        alert('初始化失败: ' + error.message);
    }
}

function setupEventListeners() {
    elements.addKnowledgeBtn.addEventListener('click', onAddKnowledgeClick);
    elements.changePasswordBtn.addEventListener('click', onChangePasswordClick);
    elements.logoutBtn.addEventListener('click', onLogoutClick);
    elements.closeEditModal.addEventListener('click', closeEditModal);
    elements.closePasswordModal.addEventListener('click', closePasswordModal);
    elements.closeModal.addEventListener('click', closeKnowledgeModal);
    elements.passwordForm.addEventListener('submit', onPasswordSubmit);
    elements.knowledgeForm.addEventListener('submit', onKnowledgeFormSubmit);
    elements.searchInput.addEventListener('input', onSearchInput);
    elements.clearSearchBtn.addEventListener('click', onClearSearchClick);
    window.addEventListener('click', onWindowClick);
    
    // 添加新的事件监听
    document.addEventListener('editKnowledgeItem', (e) => {
        const item = getKnowledgeItem(e.detail.id);
        if (item) {
            closeKnowledgeModal();
            openEditModal(item);
        }
    });
    
    document.addEventListener('deleteKnowledgeItem', async (e) => {
        if (confirm('确定要删除此条目吗？')) {
            const success = await deleteKnowledgeItem(e.detail.id);
            if (success) {
                renderKnowledgeItems();
                renderCategoryTabs();
                closeKnowledgeModal();
            } else {
                alert('删除失败');
            }
        }
    });
    
    document.addEventListener('knowledgeModalOpened', (e) => {
        const item = getKnowledgeItem(e.detail.id);
        if (!item) return;
        
        elements.modalTitle.textContent = item.title;
        elements.modalBody.innerHTML = `
            <div class="modal-meta">
                <span class="modal-category">${item.category}</span>
                ${item.tags?.length > 0 ? `
                <div class="modal-tags">
                    ${item.tags.map(tag => `<span class="modal-tag">${tag}</span>`).join('')}
                </div>` : ''}
            </div>
            <div class="modal-content-text">${item.content}</div>
            ${isEditMode ? `
            <div class="modal-actions">
                <button class="btn edit-from-modal" data-id="${item.id}">编辑</button>
                <button class="btn delete-from-modal" data-id="${item.id}">删除</button>
            </div>` : ''}
        `;
        
        if (isEditMode) {
            document.querySelector('.edit-from-modal').addEventListener('click', () => {
                closeKnowledgeModal();
                openEditModal(item);
            });
            
            document.querySelector('.delete-from-modal').addEventListener('click', () => {
                if (confirm('确定要删除此条目吗？')) {
                    deleteKnowledgeItem(item.id);
                    closeKnowledgeModal();
                    renderKnowledgeItems();
                    renderCategoryTabs();
                }
            });
        }
    });
}

function renderKnowledgeItems(category = null) {
    const items = getAllKnowledgeItems(category);
    elements.knowledgeItemsContainer.innerHTML = items.map(item => `
        <div class="knowledge-item" data-id="${item.id}">
            <div class="item-header">
                <h3>${item.title}</h3>
                ${isEditMode ? `
                <div class="item-actions">
                    <button class="item-action-btn edit-btn" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="item-action-btn delete-btn" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>` : ''}
            </div>
            <div class="item-body">
                <div class="item-meta">
                    <span class="item-category">${item.category}</span>
                    ${item.tags?.length > 0 ? `
                    <div class="item-tags">
                        ${item.tags.map(tag => `<span class="item-tag">${tag}</span>`).join('')}
                    </div>` : ''}
                </div>
                <p>${item.content.substring(0, 100)}...</p>
            </div>
        </div>
    `).join('');
}

function renderCategoryTabs() {
    const categories = getAllCategories();
    const categoryCounts = {};
    getAllKnowledgeItems().forEach(item => {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });
    
    elements.categoryTabsContainer.innerHTML = `
        <div class="category-tab active" data-category="全部" data-count="(${getKnowledgeBase().items.length})">全部</div>
        ${categories.map(category => `
            <div class="category-tab" 
                 data-category="${category}" 
                 data-count="(${categoryCounts[category] || 0})">
                ${category}
            </div>
        `).join('')}
    `;
    
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const category = tab.dataset.category === "全部" ? null : tab.dataset.category;
            renderKnowledgeItems(category);
        });
    });
}

function openKnowledgeModal(id) {
    const item = getKnowledgeItem(id);
    if (!item) return;
    
    elements.modalTitle.textContent = item.title;
    elements.modalBody.innerHTML = `
        <div class="modal-meta">
            <span class="modal-category">${item.category}</span>
            ${item.tags?.length > 0 ? `
            <div class="modal-tags">
                ${item.tags.map(tag => `<span class="modal-tag">${tag}</span>`).join('')}
            </div>` : ''}
        </div>
        <div class="modal-content-text">${item.content}</div>
        ${isEditMode ? `
        <div class="modal-actions">
            <button class="btn edit-from-modal" data-id="${item.id}">编辑</button>
        </div>` : ''}
    `;
    
    elements.knowledgeModal.style.display = 'block';
    
    if (isEditMode) {
        document.querySelector('.edit-from-modal').addEventListener('click', () => {
            closeKnowledgeModal();
            openEditModal(item);
        });
    }
}

function closeKnowledgeModal() {
    elements.knowledgeModal.style.display = 'none';
}

function openEditModal(item = null) {
    elements.editKnowledgeModal.style.display = 'block';
    elements.knowledgeForm.reset();
    
    const categorySelect = document.getElementById('knowledgeCategory');
    categorySelect.innerHTML = `
        <option value="">-- 请选择分类 --</option>
        ${getAllCategories().map(category => `
            <option value="${category}">${category}</option>
        `).join('')}
    `;
    
    if (item) {
        document.getElementById('editModalTitle').textContent = '编辑知识';
        document.getElementById('knowledgeId').value = item.id;
        document.getElementById('knowledgeTitle').value = item.title;
        document.getElementById('knowledgeCategory').value = item.category;
        document.getElementById('knowledgeTags').value = item.tags?.join(', ') || '';
        document.getElementById('knowledgeContent').value = item.content;
    } else {
        document.getElementById('editModalTitle').textContent = '添加新知识';
    }
}

function closeEditModal() {
    elements.editKnowledgeModal.style.display = 'none';
}

function openPasswordModal(isChangePassword = false) {
    elements.passwordModalTitle.textContent = isChangePassword ? '修改密码' : '请输入编辑密码';
    elements.newPasswordGroup.style.display = isChangePassword ? 'block' : 'none';
    elements.confirmPasswordGroup.style.display = isChangePassword ? 'block' : 'none';
    elements.passwordModal.style.display = 'block';
}

function closePasswordModal() {
    elements.passwordModal.style.display = 'none';
    elements.passwordForm.reset();
}

function onAddKnowledgeClick() {
    if (!isEditMode) {
        openPasswordModal(false);
        return;
    }
    openEditModal();
}

function onChangePasswordClick() {
    openPasswordModal(true);
}

async function onPasswordSubmit(e) {
    e.preventDefault();
    
    try {
        const password = elements.passwordInput.value;
        const isChangePassword = elements.newPasswordGroup.style.display === 'block';
        
        if (isChangePassword) {
            const newPassword = elements.newPasswordInput.value;
            const confirmPassword = elements.confirmPasswordInput.value;
            
            if (newPassword !== confirmPassword) {
                throw new Error('新密码与确认密码不一致');
            }
            
            await changePassword(password, newPassword);
            alert('密码修改成功');
        } else {
            const isValid = await verifyPassword(password);
            if (!isValid) {
                throw new Error('密码错误');
            }
            
            toggleEditMode(true);
            updateUIForEditMode();
        }
        
        closePasswordModal();
    } catch (error) {
        alert(error.message);
    }
}

function onKnowledgeFormSubmit(e) {
    e.preventDefault();
    
    try {
        const id = document.getElementById('knowledgeId').value;
        const title = document.getElementById('knowledgeTitle').value;
        const category = document.getElementById('knowledgeCategory').value;
        const tags = document.getElementById('knowledgeTags').value.split(',').map(t => t.trim()).filter(t => t);
        const content = document.getElementById('knowledgeContent').value;
        
        if (!title || !category || !content) {
            throw new Error('请填写所有必填字段');
        }
        
        const itemData = { title, category, tags, content };
        
        if (id) {
            updateKnowledgeItem(Number(id), itemData);
        } else {
            addKnowledgeItem(itemData);
        }
        
        closeEditModal();
        renderKnowledgeItems();
        renderCategoryTabs();
    } catch (error) {
        alert(error.message);
    }
}

function onLogoutClick() {
    toggleEditMode(false);
    updateUIForEditMode();
    renderKnowledgeItems();
}

function updateUIForEditMode() {
    elements.changePasswordBtn.style.display = isEditMode ? 'flex' : 'none';
    elements.logoutBtn.style.display = isEditMode ? 'flex' : 'none';
    
    // 立即重新渲染知识条目以显示编辑按钮
    renderKnowledgeItems();
    
    // 添加分类管理按钮
    if (isEditMode) {
        if (!document.getElementById('manageCategoriesBtn')) {
            const manageBtn = document.createElement('div');
            manageBtn.id = 'manageCategoriesBtn';
            manageBtn.className = 'admin-btn';
            manageBtn.title = '管理分类';
            manageBtn.innerHTML = '<i class="fas fa-tags"></i>';
            manageBtn.addEventListener('click', openCategoryManagementModal);
            elements.addKnowledgeBtn.parentNode.insertBefore(manageBtn, elements.changePasswordBtn);
        }
    } else {
        const manageBtn = document.getElementById('manageCategoriesBtn');
        if (manageBtn) {
            manageBtn.remove();
        }
    }
}

// 添加分类管理模态框
function openCategoryManagementModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>管理分类</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="newCategoryName">添加新分类</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="newCategoryName" class="form-control" placeholder="输入分类名称">
                        <button id="addCategoryBtn" class="btn">添加</button>
                    </div>
                </div>
                <div class="category-list" style="margin-top: 20px;">
                    <h3>现有分类</h3>
                    <ul id="categoriesList" style="list-style: none; padding: 0; margin-top: 10px;"></ul>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // 关闭按钮事件
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // 填充现有分类
    const categoriesList = modal.querySelector('#categoriesList');
    renderCategoriesList(categoriesList);
    
    // 添加分类事件
    modal.querySelector('#addCategoryBtn').addEventListener('click', async () => {
        const nameInput = modal.querySelector('#newCategoryName');
        const name = nameInput.value.trim();
        
        try {
            await addCategory(name);
            nameInput.value = '';
            renderCategoriesList(categoriesList);
            renderCategoryTabs(); // 更新分类标签
        } catch (error) {
            alert(error.message);
        }
    });
}

function renderCategoriesList(container) {
    const categories = getAllCategories();
    container.innerHTML = categories.map(category => `
        <li style="padding: 8px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <span>${category}</span>
            <button class="btn delete-category-btn" data-category="${category}" style="padding: 5px 10px; background-color: var(--danger-color);">
                <i class="fas fa-trash"></i>
            </button>
        </li>
    `).join('');
    
    // 添加删除事件
    container.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const category = btn.dataset.category;
            if (confirm(`确定要删除分类 "${category}" 吗？`)) {
                try {
                    await deleteCategory(category);
                    renderCategoriesList(container);
                    renderCategoryTabs(); // 更新分类标签
                    renderKnowledgeItems(); // 更新知识条目
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    });
}

function onSearchInput(e) {
    const query = e.target.value.toLowerCase().trim();
    elements.clearSearchBtn.style.display = query.length > 0 ? 'block' : 'none';
    
    if (query.length < 2) {
        elements.searchResultsContainer.style.display = 'none';
        return;
    }
    
    const results = getAllKnowledgeItems().filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.content.toLowerCase().includes(query) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
    );
    
    if (results.length > 0) {
        elements.searchResultsContainer.innerHTML = results.map(item => `
            <div class="search-result-item" data-id="${item.id}">
                <h4>${item.title}</h4>
                <div>
                    <span class="search-result-category">${item.category}</span>
                    ${item.tags?.length > 0 ? `
                    <div class="search-result-tags">
                        ${item.tags.map(tag => `<span class="search-result-tag">${tag}</span>`).join('')}
                    </div>` : ''}
                </div>
                <p>${item.content.substring(0, 120)}...</p>
            </div>
        `).join('');
        
        elements.searchResultsContainer.style.display = 'block';
        
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                openKnowledgeModal(id);
                elements.searchResultsContainer.style.display = 'none';
                elements.searchInput.value = '';
                elements.clearSearchBtn.style.display = 'none';
            });
        });
    } else {
        elements.searchResultsContainer.innerHTML = '<div class="search-result-item">没有找到匹配的结果</div>';
        elements.searchResultsContainer.style.display = 'block';
    }
}

function onClearSearchClick() {
    elements.searchInput.value = '';
    elements.searchResultsContainer.style.display = 'none';
    elements.clearSearchBtn.style.display = 'none';
}

function onWindowClick(e) {
    if (e.target === elements.editKnowledgeModal) closeEditModal();
    if (e.target === elements.passwordModal) closePasswordModal();
    if (e.target === elements.knowledgeModal) closeKnowledgeModal();
}

export { init };