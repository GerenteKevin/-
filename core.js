import { getKnowledgeBase, saveKnowledgeBaseToFirebase } from './auth.js';

// core.js
function addKnowledgeItem(item) {
    if (!item.category) {
        throw new Error('必须选择分类');
    }
    
    const knowledgeBase = getKnowledgeBase();
    const newId = knowledgeBase.items.length > 0 ? 
        Math.max(...knowledgeBase.items.map(i => i.id)) + 1 : 1;
    
    const newItem = { id: newId, ...item };
    knowledgeBase.items.push(newItem);
    saveKnowledgeBaseToFirebase(knowledgeBase);
    return newItem;
}

function updateKnowledgeItem(id, updates) {
    const knowledgeBase = getKnowledgeBase();
    const index = knowledgeBase.items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    knowledgeBase.items[index] = { ...knowledgeBase.items[index], ...updates };
    saveKnowledgeBaseToFirebase(knowledgeBase);
    return knowledgeBase.items[index];
}

function deleteKnowledgeItem(id) {
    const knowledgeBase = getKnowledgeBase();
    const index = knowledgeBase.items.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    knowledgeBase.items.splice(index, 1);
    saveKnowledgeBaseToFirebase(knowledgeBase);
    return true;
}

function getKnowledgeItem(id) {
    return getKnowledgeBase().items.find(item => item.id === id);
}

function getAllKnowledgeItems(filterCategory = null) {
    const items = getKnowledgeBase().items;
    return filterCategory 
        ? items.filter(item => item.category === filterCategory)
        : items;
}

function getAllCategories() {
    return getKnowledgeBase().categories;
}

export {
    addKnowledgeItem,
    updateKnowledgeItem,
    deleteKnowledgeItem,
    getKnowledgeItem,
    getAllKnowledgeItems,
    getAllCategories
};