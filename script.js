// --- データの初期化 ---
let inventory = JSON.parse(localStorage.getItem('myInventory')) || [];
let openCategories = JSON.parse(localStorage.getItem('openCategories')) || ["キッチン"];
let categories = JSON.parse(localStorage.getItem('myCategories')) || ["キッチン", "バスルーム", "ランドリー", "トイレ", "消耗品"];

// 要素の取得
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const categoryEditList = document.getElementById('categoryEditList');

// --- アプリ全体の更新・保存 ---
function updateApp() {
    localStorage.setItem('myInventory', JSON.stringify(inventory));
    localStorage.setItem('openCategories', JSON.stringify(openCategories));
    localStorage.setItem('myCategories', JSON.stringify(categories));
    render();
}

// --- 描画処理（メイン画面） ---
function render() {
    renderAlerts();
    renderCategorySelect(); 
    renderCategories();     
}

function renderAlerts() {
    const alertArea = document.getElementById('alertArea');
    const lowItems = inventory.filter(i => i.count <= (i.threshold || 1));
    if (lowItems.length > 0) {
        alertArea.innerHTML = `<div class="alert-box">⚠️ 不足：${lowItems.map(i => i.name).join(', ')}</div>`;
    } else {
        alertArea.innerHTML = '';
    }
}

function renderCategorySelect() {
    const select = document.getElementById('itemCategory');
    if (!select) return;
    select.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function renderCategories() {
    const container = document.getElementById('categoryContainer');
    container.innerHTML = '';

    categories.forEach(cat => {
        const items = inventory.filter(i => i.category === cat);
        if (items.length === 0) return;

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
                    const isLow = item.count <= (item.threshold || 1);
                    return `
                    <div class="item-row">
                        <div class="item-main">
                            <span class="${isLow ? 'low-stock' : ''}">${item.name}</span>
                            <span class="threshold-info">目安: ${item.threshold || 1}</span>
                        </div>
                        <div class="controls">
                            <button class="btn-count" onclick="changeCount(${idx}, -1)">-</button>
                            <span style="min-width:20px; text-align:center">${item.count}</span>
                            <button class="btn-count" onclick="changeCount(${idx}, 1)">+</button>
                            <button onclick="removeItem(${idx})" class="btn-delete">×</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        `;
        container.appendChild(section);
    });
}

// --- 設定モーダル内の描画・操作 ---

// カテゴリー編集リストの描画
function renderCategoryEditor() {
    categoryEditList.innerHTML = categories.map(cat => `
        <div class="item-row" style="background:#f9f9f9; padding:10px; border-radius:8px; margin-bottom:8px; border:none;">
            <span>${cat}</span>
            <div class="controls">
                <button onclick="renameCategory('${cat}')" style="color:var(--primary); border:none; background:none; font-size:0.8rem;">改名</button>
                <button onclick="deleteCategory('${cat}')" style="color:var(--danger); border:none; background:none; font-size:0.8rem; margin-left:10px;">削除</button>
            </div>
        </div>
    `).join('');
}

// 新規カテゴリー追加
window.addNewCategory = function() {
    const name = prompt("新しいカテゴリー名を入力してください");
    if (name && !categories.includes(name)) {
        categories.push(name);
        updateApp();
        renderCategoryEditor();
    }
};

// カテゴリー名の変更
window.renameCategory = function(oldName) {
    const newName = prompt(`${oldName} を何に変更しますか？`);
    if (newName && newName !== oldName) {
        // 在庫データのカテゴリー名も一括更新
        inventory.forEach(i => { if (i.category === oldName) i.category = newName; });
        categories = categories.map(c => c === oldName ? newName : c);
        updateApp();
        renderCategoryEditor();
    }
};

// カテゴリーの削除
window.deleteCategory = function(cat) {
    if (confirm(`カテゴリー「${cat}」を削除しますか？\n※このカテゴリー内の商品は削除されません（未分類になります）。`)) {
        inventory.forEach(i => { if (i.category === cat) i.category = "未分類"; });
        if (!categories.includes("未分類")) categories.push("未分類");
        categories = categories.filter(c => c !== cat);
        updateApp();
        renderCategoryEditor();
    }
};

// --- イベントハンドラ（メイン画面用） ---

window.toggleCategory = function(cat) {
    if (openCategories.includes(cat)) {
        openCategories = openCategories.filter(c => c !== cat);
    } else {
        openCategories.push(cat);
    }
    updateApp();
};

window.addItem = function() {
    const nameEl = document.getElementById('itemName');
    const catEl = document.getElementById('itemCategory');
    const countEl = document.getElementById('itemCount');
    const thresholdEl = document.getElementById('itemThreshold');
    
    if (nameEl.value.trim()) {
        inventory.push({ 
            name: nameEl.value.trim(), 
            category: catEl.value, 
            count: parseInt(countEl.value),
            threshold: parseInt(thresholdEl.value) || 1
        });
        nameEl.value = '';
        thresholdEl.value = '1';
        if (!openCategories.includes(catEl.value)) openCategories.push(catEl.value);
        updateApp();
    }
};

window.changeCount = function(idx, delta) {
    if (inventory[idx]) {
        inventory[idx].count += delta;
        if (inventory[idx].count < 0) inventory[idx].count = 0;
        updateApp();
    }
};

window.removeItem = function(idx) {
    if (confirm('削除しますか？')) {
        inventory.splice(idx, 1);
        updateApp();
    }
};

// --- モーダル制御 ---

settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
    renderCategoryEditor();
});

closeSettings.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.style.display = 'none';
});

// --- 初期実行 ---
document.getElementById('addBtn').addEventListener('click', addItem);
render();