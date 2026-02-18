let inventory = JSON.parse(localStorage.getItem('myInventory')) || [];
let openCategories = JSON.parse(localStorage.getItem('openCategories')) || ["キッチン"];

function updateApp() {
    localStorage.setItem('myInventory', JSON.stringify(inventory));
    localStorage.setItem('openCategories', JSON.stringify(openCategories));
    render();
}

function render() {
    renderAlerts();
    renderCategories();
}

function renderAlerts() {
    const alertArea = document.getElementById('alertArea');
    const lowItems = inventory.filter(i => i.count <= 1);
    if (lowItems.length > 0) {
        alertArea.innerHTML = `<div class="alert-box">⚠️ 不足：${lowItems.map(i => i.name).join(', ')}</div>`;
    } else {
        alertArea.innerHTML = '';
    }
}

function renderCategories() {
    const container = document.getElementById('categoryContainer');
    container.innerHTML = '';

    // カテゴリーごとにグループ化
    const categories = ["キッチン", "バスルーム", "ランドリー" ,"トイレ" ,"消耗品"];
    
    categories.forEach(cat => {
        const items = inventory.filter(i => i.category === cat);
        if (items.length === 0) return; // 空のカテゴリーは表示しない

        const isOpen = openCategories.includes(cat);
        const section = document.createElement('div');
        section.className = `category-section ${isOpen ? 'open' : ''}`;
        
        section.innerHTML = `
            <div class="category-header" onclick="toggleCategory('${cat}')">
                ${cat} (${items.length})
            </div>
            <div class="category-content">
                ${items.map(item => {
                    const idx = inventory.indexOf(item);
                    return `
                    <div class="item-row">
                        <span class="${item.count <= 1 ? 'low-stock' : ''}">${item.name}</span>
                        <div class="controls">
                            <button class="btn-count" onclick="changeCount(${idx}, -1)">-</button>
                            <span style="min-width:20px; text-align:center">${item.count}</span>
                            <button class="btn-count" onclick="changeCount(${idx}, 1)">+</button>
                            <button onclick="removeItem(${idx})" style="border:none; background:none; color:#ccc; margin-left:10px;">×</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        `;
        container.appendChild(section);
    });
}

window.toggleCategory = function(cat) {
    if (openCategories.includes(cat)) {
        openCategories = openCategories.filter(c => c !== cat);
    } else {
        openCategories.push(cat);
    }
    updateApp();
};

window.addItem = function() {
    const name = document.getElementById('itemName').value.trim();
    const cat = document.getElementById('itemCategory').value;
    const count = parseInt(document.getElementById('itemCount').value);
    
    if (name) {
        inventory.push({ name, category: cat, count });
        document.getElementById('itemName').value = '';
        if (!openCategories.includes(cat)) openCategories.push(cat);
        updateApp();
    }
};

document.getElementById('addBtn').addEventListener('click', addItem);

window.changeCount = function(idx, delta) {
    inventory[idx].count += delta;
    if (inventory[idx].count < 0) inventory[idx].count = 0;
    updateApp();
};

window.removeItem = function(idx) {
    if (confirm('削除しますか？')) {
        inventory.splice(idx, 1);
        updateApp();
    }
};

// 初期描画
render();