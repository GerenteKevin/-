import { init } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    await init();
    
    // 事件委托处理动态生成的元素
    document.getElementById('knowledgeItems').addEventListener('click', (e) => {
        const item = e.target.closest('.knowledge-item');
        if (item) {
            const id = parseInt(item.getAttribute('data-id'));
            openKnowledgeModal(id);
        }
        
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            e.stopPropagation();
            handleEditItem(Number(editBtn.dataset.id));
        }
        
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            e.stopPropagation();
            handleDeleteItem(Number(deleteBtn.dataset.id));
        }
    });
});

// 全局函数
function openKnowledgeModal(id) {
    const modal = document.getElementById('knowledgeModal');
    modal.style.display = 'block';
    
    // 触发UI更新
    const event = new CustomEvent('knowledgeModalOpened', { detail: { id } });
    document.dispatchEvent(event);
}

function handleEditItem(id) {
    const event = new CustomEvent('editKnowledgeItem', { detail: { id } });
    document.dispatchEvent(event);
}

function handleDeleteItem(id) {
    const event = new CustomEvent('deleteKnowledgeItem', { detail: { id } });
    document.dispatchEvent(event);
}