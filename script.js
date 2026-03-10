document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const form = document.getElementById('orderForm');
    const userNameInput = document.getElementById('userName');
    const careLevelSelect = document.getElementById('careLevel');
    const careManagerInput = document.getElementById('careManager');
    const diseaseOtherInput = document.getElementById('diseaseOther');
    const restrictionRadio = document.getElementById('exerciseRestriction');
    const restrictionDetailsContainer = document.getElementById('restrictionDetailsContainer');
    const restrictionDetailsTextarea = document.getElementById('restrictionDetails');
    const goalTable = document.getElementById('goalTable');
    const goalOtherTextarea = document.getElementById('goalOther');
    const infoSharingTextarea = document.getElementById('infoSharing');
    const staffNotesTextarea = document.getElementById('staffNotes');
    
    const saveBtn = document.getElementById('saveBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const searchResultsDiv = document.getElementById('searchResults');

    const STORAGE_KEY = 'rehaUsers';

    // --- イベントリスナー ---

    restrictionRadio.addEventListener('change', (e) => {
        if (e.target.value === 'あり') {
            restrictionDetailsContainer.style.display = 'block';
        } else {
            restrictionDetailsContainer.style.display = 'none';
            restrictionDetailsTextarea.value = '';
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveUserData();
    });

    searchBtn.addEventListener('click', searchUsers);
    clearBtn.addEventListener('click', () => clearForm(true));
    deleteBtn.addEventListener('click', deleteUserData);
    exportCsvBtn.addEventListener('click', exportCsv);

    searchResultsDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-btn')) {
            const userId = e.target.getAttribute('data-id');
            loadUserData(userId);
        }
    });

    // --- 関数 ---

    function saveUserData() {
        const userName = userNameInput.value.trim();
        if (!userName) {
            alert('利用者氏名を入力してください。');
            return;
        }

        const editingUserId = userNameInput.getAttribute('data-user-id');
        const userData = {
            id: editingUserId || Date.now().toString(),
            userName,
            careLevel: careLevelSelect.value,
            careManager: careManagerInput.value.trim(),
            diseases: Array.from(document.querySelectorAll('input[name="disease"]:checked')).map(el => el.value),
            diseaseOther: diseaseOtherInput.value.trim(),
            paralysis: Array.from(document.querySelectorAll('input[name="paralysis"]:checked')).map(el => el.value),
            pains: Array.from(document.querySelectorAll('input[name="pain"]:checked')).map(el => el.value),
            restriction: document.querySelector('input[name="restriction"]:checked').value,
            restrictionDetails: restrictionDetailsTextarea.value.trim(),
            goals: Array.from(goalTable.querySelectorAll('tbody tr')).map(row => ({
                checked: row.querySelector('input[name="goal"]').checked,
                course: row.cells[1].textContent,
                target: row.cells[2].textContent,
                priority: row.querySelector('.priority-input').value
            })),
            goalOther: goalOtherTextarea.value.trim(),
            infoSharing: infoSharingTextarea.value.trim(),
            staffNotes: staffNotesTextarea.value.trim(),
        };

        let users = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const existingUserIndex = users.findIndex(user => user.id === userData.id);

        if (existingUserIndex > -1) {
            users[existingUserIndex] = userData;
            alert('利用者データを更新しました。');
        } else {
            if (users.some(user => user.userName === userName)) {
                if (!confirm('同姓同名の利用者が既に存在します。新しい利用者として登録しますか？')) return;
            }
            users.push(userData);
            alert('新しい利用者データを保存しました。');
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        clearForm(false);
        searchUsers();
    }

    function searchUsers() {
        const query = searchInput.value.trim().toLowerCase();
        const users = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const filteredUsers = users.filter(user => user.userName.toLowerCase().includes(query));

        searchResultsDiv.innerHTML = '';
        if (filteredUsers.length > 0) {
            const list = document.createElement('ul');
            list.style.cssText = 'list-style-type: none; padding: 0;';
            filteredUsers.forEach(user => {
                const item = document.createElement('li');
                item.style.cssText = 'margin-bottom: 10px; padding: 10px; background-color: #f0f0f0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;';
                item.innerHTML = `<span>${user.userName}</span> <button class="view-btn" data-id="${user.id}">表示</button>`;
                list.appendChild(item);
            });
            searchResultsDiv.appendChild(list);
        } else if (query) {
            searchResultsDiv.innerHTML = '<p>該当する利用者はいません。</p>';
        }
    }

    function loadUserData(userId) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const userData = users.find(user => user.id === userId);
        if (!userData) {
            alert('利用者データが見つかりません。');
            return;
        }

        clearForm(false);

        userNameInput.value = userData.userName;
        userNameInput.setAttribute('data-user-id', userData.id);
        careLevelSelect.value = userData.careLevel;
        careManagerInput.value = userData.careManager;
        
        document.querySelectorAll('input[name="disease"]').forEach(el => el.checked = userData.diseases.includes(el.value));
        diseaseOtherInput.value = userData.diseaseOther;
        document.querySelectorAll('input[name="paralysis"]').forEach(el => el.checked = userData.paralysis.includes(el.value));
        document.querySelectorAll('input[name="pain"]').forEach(el => el.checked = userData.pains.includes(el.value));

        document.querySelector(`input[name="restriction"][value="${userData.restriction}"]`).checked = true;
        restrictionDetailsTextarea.value = userData.restrictionDetails;
        if (userData.restriction === 'あり') {
            restrictionDetailsContainer.style.display = 'block';
        }

        goalTable.querySelectorAll('tbody tr').forEach((row, index) => {
            if(userData.goals[index]) {
                row.querySelector('input[name="goal"]').checked = userData.goals[index].checked;
                row.querySelector('.priority-input').value = userData.goals[index].priority;
            }
        });
        goalOtherTextarea.value = userData.goalOther;

        infoSharingTextarea.value = userData.infoSharing;
        staffNotesTextarea.value = userData.staffNotes;

        deleteBtn.style.display = 'inline-block';
        searchResultsDiv.innerHTML = '';
        searchInput.value = '';
    }

    function deleteUserData() {
        const editingUserId = userNameInput.getAttribute('data-user-id');
        if (!editingUserId) {
            alert('削除する利用者が選択されていません。');
            return;
        }

        if (confirm(`「${userNameInput.value}」さんのデータを本当に削除しますか？`)) {
            let users = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            users = users.filter(user => user.id !== editingUserId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
            alert('利用者データを削除しました。');
            clearForm(false);
            searchUsers();
        }
    }

    function clearForm(showAlert = true) {
        form.reset();
        restrictionDetailsContainer.style.display = 'none';
        deleteBtn.style.display = 'none';
        userNameInput.removeAttribute('data-user-id');
        searchResultsDiv.innerHTML = '';
        searchInput.value = '';
        if (showAlert) {
            alert('入力フォームをクリアしました。');
        }
    }

    function exportCsv() {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        if (users.length === 0) {
            alert('エクスポートするデータがありません。');
            return;
        }

        const escapeCsv = (val) => {
            if (val === null || val === undefined) return '';
            let str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                str = `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const headers = [
            '利用者ID', '利用者氏名', '介護度', '担当ケアマネ', '主疾患', '主疾患(その他)',
            '麻痺', '痛み', '医師からの運動制限', '制限内容', '目標', '目標(その他)',
            '情報共有事項', '職員記入欄'
        ];

        const rows = users.map(user => {
            const selectedGoals = user.goals
                .filter(g => g.checked)
                .map(g => `${g.course}(優先度: ${g.priority || '未設定'})`)
                .join(' | ');

            return [
                user.id,
                user.userName,
                user.careLevel,
                user.careManager,
                user.diseases.join(' | '),
                user.diseaseOther,
                user.paralysis.join(' | '),
                user.pains.join(' | '),
                user.restriction,
                user.restrictionDetails,
                selectedGoals,
                user.goalOther,
                user.infoSharing,
                user.staffNotes
            ].map(escapeCsv).join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reha_order_data_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});

