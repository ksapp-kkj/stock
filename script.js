// --- データの初期値 ---
let inventory = JSON.parse(localStorage.getItem('myInventory')) || [];
let openCategories = JSON.parse(localStorage.getItem('openCategories')) || ["キッチン"];
let categories = JSON.parse(localStorage.getItem('myCategories')) || ["キッチン", "バスルーム", "ランドリー", "トイレ", "消耗品"];

const changeLogs = [
    { date: "2024.05.20", text: "📄 変更履歴の確認機能を追加しました。" },
    { date: "2024.05.19", text: "⚙️ 設定画面をモーダル化し、カテゴリーの改名・削除に対応。" },
    { date: "2024.05.18", text: "📦 商品ごとに「目安（基準在庫）」を設定できる機能を追加。" },
    { date: "2024.05.17", text: "🚀 在庫管理アプリを GitHub で公開しました。" }
];

// --- 要素の取得 ---
const settingsBtn = document.getElementById('settingsBtn');
const historyBtn = document.getElementById('historyBtn');
const settingsModal = document.getElementById('settingsModal');
const historyModal = document.getElementById('historyModal');
const closeSettings = document.getElementById('closeSettings');
const closeHistory = document.getElementById('closeHistory');
const categoryEditList = document.getElementById('categoryEditList');
const historyList = document.getElementById('historyList');

// --- 保存・同期 ---
function updateApp() {
    localStorage.setItem('myInventory', JSON.stringify(inventory));
    localStorage.setItem('openCategories', JSON.stringify(openCategories));
    localStorage.setItem('myCategories', JSON.stringify(categories));
    render();
}

// --- メイン描画 ---
function render() {
    renderAlerts();
    renderCategorySelect();
    renderCategories();
}

function renderAlerts() {
    const alertArea = document.getElementById('alertArea');
    const lowItems = inventory.filter(i => i.count <= (i.threshold || 1));
    alertArea.innerHTML = lowItems.length > 0 ? 
        `<div class="alert-box">⚠️ 不足：${lowItems.map(i => i.name).join(', ')}</div>` : '';
}

function renderCategorySelect() {
    const select = document.getElementById('itemCategory');
    if (select) select.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
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
            <div class="category-header" onclick="toggleCategory('${cat}')">${cat} (${items.length})</div>
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
            </div>`;
        container.appendChild(section);
    });
}

// --- 操作ハンドラ ---
window.toggleCategory = (cat) => {
    openCategories = openCategories.includes(cat) ? openCategories.filter(c => c !== cat) : [...openCategories, cat];
    updateApp();
};

window.addItem = () => {
    const name = document.getElementById('itemName').value.trim();
    const cat = document.getElementById('itemCategory').value;
    const count = parseInt(document.getElementById('itemCount').value);
    const threshold = parseInt(document.getElementById('itemThreshold').value) || 1;
    if (name) {
        inventory.push({ name, category: cat, count, threshold });
        document.getElementById('itemName').value = '';
        if (!openCategories.includes(cat)) openCategories.push(cat);
        updateApp();
    }
};

window.changeCount = (idx, delta) => {
    if (inventory[idx]) {
        inventory[idx].count += delta;
        if (inventory[idx].count < 0) inventory[idx].count = 0;
        updateApp();
    }
};

window.removeItem = (idx) => { if (confirm('削除しますか？')) { inventory.splice(idx, 1); updateApp(); } };

// --- モーダル内操作 ---
function renderCategoryEditor() {
    categoryEditList.innerHTML = categories.map(cat => `
        <div class="item-row" style="background:#f9f9f9; padding:10px; border-radius:8px; margin-bottom:8px; border:none;">
            <span>${cat}</span>
            <div class="controls">
                <button onclick="renameCategory('${cat}')" style="color:var(--primary); border:none; background:none; font-size:0.8rem;">改名</button>
                <button onclick="deleteCategory('${cat}')" style="color:var(--danger); border:none; background:none; font-size:0.8rem; margin-left:10px;">削除</button>
            </div>
        </div>`).join('');
}

window.addNewCategory = () => {
    const name = prompt("新しいカテゴリー名");
    if (name && !categories.includes(name)) { categories.push(name); updateApp(); renderCategoryEditor(); }
};

window.renameCategory = (oldName) => {
    const newName = prompt(`${oldName} を何に変更しますか？`);
    if (newName && newName !== oldName) {
        inventory.forEach(i => { if (i.category === oldName) i.category = newName; });
        categories = categories.map(c => c === oldName ? newName : c);
        updateApp(); renderCategoryEditor();
    }
};

window.deleteCategory = (cat) => {
    if (confirm(`${cat} を削除しますか？`)) {
        inventory.forEach(i => { if (i.category === cat) i.category = "未分類"; });
        if (!categories.includes("未分類")) categories.push("未分類");
        categories = categories.filter(c => c !== cat);
        updateApp(); renderCategoryEditor();
    }
};

// --- モーダル制御イベント ---
settingsBtn.addEventListener('click', () => { settingsModal.style.display = 'flex'; renderCategoryEditor(); });
historyBtn.addEventListener('click', () => {
    historyList.innerHTML = changeLogs.map(log => `<div class="history-item"><span class="history-date">${log.date}</span><div class="history-text">${log.text}</div></div>`).join('');
    historyModal.style.display = 'flex';
});

closeSettings.addEventListener('click', () => settingsModal.style.display = 'none');
closeHistory.addEventListener('click', () => historyModal.style.display = 'none');
window.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.style.display = 'none';
    if (e.target === historyModal) historyModal.style.display = 'none';
});

document.getElementById('addBtn').addEventListener('click', addItem);
render();
