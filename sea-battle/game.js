// Открытие и закрытие модального окна профиля
const profileBtn = document.getElementById('profile-btn');
const profileModal = document.getElementById('profile-modal');
const closeProfileModal = document.getElementById('close-profile-modal');
const saveProfileBtn = document.getElementById('save-profile-btn');
const playerNameInput = document.getElementById('player-name');

// Загрузка имени игрока из localStorage
window.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('sea-battle-player-name');
    if (savedName) {
        playerNameInput.value = savedName;
    }
});

profileBtn.onclick = () => {
    profileModal.style.display = 'flex';
    playerNameInput.focus();
};
closeProfileModal.onclick = () => {
    profileModal.style.display = 'none';
};
saveProfileBtn.onclick = () => {
    const name = playerNameInput.value.trim();
    if (name.length > 0) {
        localStorage.setItem('sea-battle-player-name', name);
        profileModal.style.display = 'none';
    }
};

// Закрытие модального окна по клику вне окна
window.onclick = (event) => {
    if (event.target === profileModal) {
        profileModal.style.display = 'none';
    }
};

// Кнопка "Играть онлайн" — подключение к серверу и поиск соперника
const playOnlineBtn = document.getElementById('play-online-btn');
let ws = null;
let searchingModal = null;
let isMyTurn = false;

playOnlineBtn.onclick = () => {
    // Показываем окно поиска соперника
    showSearchingModal();
    // Подключаемся к серверу
    ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
        // Отправляем имя игрока
        const name = localStorage.getItem('sea-battle-player-name') || 'Игрок';
        ws.send(JSON.stringify({ type: 'set_name', name }));
    };

    ws.onmessage = wsOnMessage;

    ws.onclose = () => {
        closeSearchingModal();
    };
    ws.onerror = () => {
        closeSearchingModal();
        alert('Ошибка соединения с сервером!');
    };
};

// Модальное окно поиска соперника
function showSearchingModal() {
    if (!searchingModal) {
        searchingModal = document.createElement('div');
        searchingModal.className = 'modal';
        searchingModal.innerHTML = '<div class="modal-content"><h2>Поиск соперника...</h2><p id="searching-status">Подключение...</p></div>';
        document.body.appendChild(searchingModal);
    }
    searchingModal.style.display = 'flex';
    updateSearchingModal('Подключение...');
}
function updateSearchingModal(text) {
    if (searchingModal) {
        const status = searchingModal.querySelector('#searching-status');
        if (status) status.textContent = text;
    }
}
function closeSearchingModal() {
    if (searchingModal) searchingModal.style.display = 'none';
}

function chatAddMessage(text) {
    const chat = document.getElementById('chat-messages');
    if (!chat) return;
    const div = document.createElement('div');
    div.textContent = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function onBattleStart(data) {
    document.getElementById('setup-controls').style.display = 'none';
    document.getElementById('setup-timer').style.display = 'none';
    document.getElementById('game-title').textContent = 'Бой!';
    enemyBoardState = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    renderEnemyBoard();
    isMyTurn = !!data.yourTurn;
    updateTurnInfo();
    // Представление игроков в чате
    chatAddMessage(`Играют: ${data.yourName} против ${data.enemyName}`);
}

function renderEnemyBoard() {
    let enemyBoard = document.getElementById('enemy-board');
    if (!enemyBoard) {
        enemyBoard = document.createElement('div');
        enemyBoard.id = 'enemy-board';
        document.getElementById('game-container').appendChild(enemyBoard);
    }
    enemyBoard.innerHTML = '<h3>Поле противника</h3>';
    const table = document.createElement('table');
    table.className = 'sea-board';
    for (let y = 0; y < BOARD_SIZE; y++) {
        const tr = document.createElement('tr');
        for (let x = 0; x < BOARD_SIZE; x++) {
            const td = document.createElement('td');
            td.className = 'sea-cell';
            td.dataset.x = x;
            td.dataset.y = y;
            if (enemyBoardState[y][x] === 1) td.classList.add('miss');
            if (enemyBoardState[y][x] === 2) td.classList.add('hit');
            if (enemyBoardState[y][x] === 3) td.classList.add('killed');
            td.onclick = () => onEnemyCellClick(x, y, td);
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    enemyBoard.appendChild(table);
}

function showTurnPopup() {
    let popup = document.getElementById('turn-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'turn-popup';
        popup.textContent = 'Ваш ход!';
        popup.style.position = 'fixed';
        popup.style.left = '50%';
        popup.style.top = '30%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.background = 'rgba(40,60,180,0.95)';
        popup.style.color = '#fff';
        popup.style.fontSize = '2.2em';
        popup.style.fontWeight = 'bold';
        popup.style.padding = '32px 48px';
        popup.style.borderRadius = '18px';
        popup.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)';
        popup.style.zIndex = '2000';
        document.body.appendChild(popup);
    }
    popup.style.display = 'block';
    setTimeout(() => { popup.style.display = 'none'; }, 1000);
}

function updateTurnInfo() {
    let info = document.getElementById('turn-info');
    if (!info) {
        info = document.createElement('div');
        info.id = 'turn-info';
        info.style.margin = '16px 0';
        document.getElementById('game-container').insertBefore(info, document.getElementById('player-board'));
    }
    // Показываем всплывающую надпись только при смене на ваш ход
    if (isMyTurn && updateTurnInfo.lastTurn !== true) {
        showTurnPopup();
    }
    info.textContent = isMyTurn ? 'Ваш ход!' : 'Ход соперника...';
    updateTurnInfo.lastTurn = isMyTurn;
}

function onEnemyCellClick(x, y, td) {
    if (!isMyTurn) return;
    if (enemyBoardState[y][x] !== 0) return; // Уже стреляли
    // Отправляем выстрел на сервер
    ws.send(JSON.stringify({ type: 'shot', x, y }));
    isMyTurn = false;
    updateTurnInfo();
}

// Обработка сообщений от сервера
wsOnMessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'wait') {
        updateSearchingModal('Ожидание второго игрока...');
    } else if (data.type === 'start') {
        closeSearchingModal();
        startSetupPhase();
    } else if (data.type === 'end') {
        closeSearchingModal();
        alert(data.message);
        ws.close();
    } else if (data.type === 'battle_start') {
        onBattleStart(data);
    } else if (data.type === 'shot_result') {
        // Ваш выстрел: результат
        if (data.hit) {
            data.shipCells.forEach(cell => {
                enemyBoardState[cell.y][cell.x] = data.killed ? 3 : 2;
            });
        } else {
            enemyBoardState[data.y][data.x] = 1;
        }
        renderEnemyBoard();
        isMyTurn = data.yourTurn;
        updateTurnInfo();
        if (data.gameOver) showEndWindow(true);
    } else if (data.type === 'enemy_shot') {
        // Враг стреляет по вашему полю
        markPlayerShot(data);
        isMyTurn = data.yourTurn;
        updateTurnInfo();
        if (data.gameOver) showEndWindow(false);
    } else if (data.type === 'chat') {
        chatAddMessage(`${data.name}: ${data.text}`);
    }
};

function markPlayerShot(data) {
    // Помечаем попадания/промахи/убитые корабли на своём поле
    const board = document.getElementById('player-board');
    const table = board.querySelector('table');
    if (!table) return;
    if (data.hit) {
        data.shipCells.forEach(cell => {
            const td = table.rows[cell.y].cells[cell.x];
            td.classList.remove('ship');
            td.classList.add(data.killed ? 'killed' : 'hit');
        });
    } else {
        const td = table.rows[data.y].cells[data.x];
        td.classList.add('miss');
    }
}

function showEndWindow(win) {
    const endDiv = document.createElement('div');
    endDiv.className = 'modal';
    endDiv.innerHTML = `<div class="modal-content"><h2>${win ? 'Победа!' : 'Поражение'}</h2><button id="to-menu-btn">В меню</button></div>`;
    document.body.appendChild(endDiv);
    document.getElementById('to-menu-btn').onclick = () => {
        window.location.reload();
    };
}

// Размеры и состав флота
const BOARD_SIZE = 10;
const SHIPS = [
    { size: 4, count: 1 }, // 1 четырёхпалубный
    { size: 3, count: 2 }, // 2 трёхпалубных
    { size: 2, count: 3 }, // 3 двухпалубных
    { size: 1, count: 4 }, // 4 однопалубных
];

let playerBoardState = null; // 2D-массив состояния поля (0 — пусто, 1 — корабль)
let enemyBoardState = null; // 2D-массив: 0 — неизвестно, 1 — промах, 2 — попадание, 3 — убит

let selectedShipSize = 4;
let selectedShipCount = 1;
let selectedShipIndex = 0;
let selectedOrientation = true; // true — горизонтально, false — вертикально
let shipsToPlace = [];

function startSetupPhase() {
    document.querySelector('.main-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    playerBoardState = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    // Список кораблей для ручной расстановки
    shipsToPlace = [];
    SHIPS.forEach(ship => {
        for (let i = 0; i < ship.count; i++) shipsToPlace.push(ship.size);
    });
    selectedShipSize = shipsToPlace[0];
    renderPlayerBoard();
    renderSetupControls();
    startSetupTimer(120); // 2 минуты
}

function renderSetupControls() {
    const controls = document.getElementById('setup-controls');
    controls.innerHTML = '';
    // Кнопка автоматической расстановки
    const autoBtn = document.createElement('button');
    autoBtn.textContent = 'Расставить автоматически';
    autoBtn.onclick = autoPlaceShips;
    controls.appendChild(autoBtn);
    // Выбор корабля
    const shipsDiv = document.createElement('div');
    shipsDiv.style.margin = '16px 0';
    shipsDiv.textContent = 'Корабли для размещения: ';
    shipsToPlace.forEach((size, idx) => {
        const btn = document.createElement('button');
        btn.textContent = '■'.repeat(size);
        btn.style.marginRight = '8px';
        btn.className = (selectedShipIndex === idx ? 'selected-ship-btn' : '');
        btn.onclick = () => {
            selectedShipSize = size;
            selectedShipIndex = idx;
            renderSetupControls();
        };
        shipsDiv.appendChild(btn);
    });
    controls.appendChild(shipsDiv);
    // Кнопка поворота
    const rotateBtn = document.createElement('button');
    rotateBtn.textContent = selectedOrientation ? 'Повернуть: Гориз.' : 'Повернуть: Вертик.';
    rotateBtn.onclick = () => {
        selectedOrientation = !selectedOrientation;
        renderSetupControls();
    };
    controls.appendChild(rotateBtn);
    // Кнопка "Готово"
    if (shipsToPlace.length === 0) {
        const readyBtn = document.createElement('button');
        readyBtn.textContent = 'Готово';
        readyBtn.style.marginLeft = '16px';
        readyBtn.onclick = onReadyClick;
        controls.appendChild(readyBtn);
    }
}

function onReadyClick() {
    // Блокируем поле и кнопки
    document.getElementById('player-board').style.pointerEvents = 'none';
    document.getElementById('setup-controls').style.pointerEvents = 'none';
    // Отправляем серверу сообщение о готовности (заглушка)
    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'ready', board: playerBoardState }));
    }
    // Можно показать сообщение или индикатор ожидания соперника
    alert('Ожидание соперника...');
}

function renderPlayerBoard() {
    const board = document.getElementById('player-board');
    board.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'sea-board';
    for (let y = 0; y < BOARD_SIZE; y++) {
        const tr = document.createElement('tr');
        for (let x = 0; x < BOARD_SIZE; x++) {
            const td = document.createElement('td');
            td.className = 'sea-cell';
            td.dataset.x = x;
            td.dataset.y = y;
            if (playerBoardState && playerBoardState[y][x] === 1) {
                td.classList.add('ship');
            }
            td.onclick = () => onCellClick(x, y, td);
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    board.appendChild(table);
}

function onCellClick(x, y, td) {
    // Ручная установка корабля
    if (shipsToPlace.length === 0) return;
    if (canPlaceShip(x, y, selectedShipSize, selectedOrientation, playerBoardState)) {
        placeShip(x, y, selectedShipSize, selectedOrientation, playerBoardState);
        shipsToPlace.splice(selectedShipIndex, 1);
        // Сбросить выбор на следующий корабль
        if (shipsToPlace.length > 0) {
            selectedShipIndex = 0;
            selectedShipSize = shipsToPlace[0];
        }
        renderPlayerBoard();
        renderSetupControls();
    }
}

function autoPlaceShips() {
    // Очищаем поле
    playerBoardState = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    // Для каждого типа корабля
    for (const ship of SHIPS) {
        for (let i = 0; i < ship.count; i++) {
            let placed = false;
            for (let attempt = 0; attempt < 1000 && !placed; attempt++) {
                const isHorizontal = Math.random() < 0.5;
                const x = Math.floor(Math.random() * (isHorizontal ? BOARD_SIZE - ship.size + 1 : BOARD_SIZE));
                const y = Math.floor(Math.random() * (isHorizontal ? BOARD_SIZE : BOARD_SIZE - ship.size + 1));
                if (canPlaceShip(x, y, ship.size, isHorizontal, playerBoardState)) {
                    placeShip(x, y, ship.size, isHorizontal, playerBoardState);
                    placed = true;
                }
            }
        }
    }
    renderPlayerBoard();
    alert('Корабли расставлены автоматически!');
    // После этого — переход к следующему этапу
}

function canPlaceShip(x, y, size, isHorizontal, board) {
    for (let i = 0; i < size; i++) {
        const nx = x + (isHorizontal ? i : 0);
        const ny = y + (isHorizontal ? 0 : i);
        if (board[ny][nx] !== 0) return false;
        // Проверяем соседние клетки
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const cx = nx + dx;
                const cy = ny + dy;
                if (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE) {
                    if (board[cy][cx] === 1) return false;
                }
            }
        }
    }
    return true;
}

function placeShip(x, y, size, isHorizontal, board) {
    for (let i = 0; i < size; i++) {
        const nx = x + (isHorizontal ? i : 0);
        const ny = y + (isHorizontal ? 0 : i);
        board[ny][nx] = 1;
    }
}

function startSetupTimer(seconds) {
    const timerValue = document.getElementById('timer-value');
    let timeLeft = seconds;
    timerValue.textContent = formatTime(timeLeft);
    const interval = setInterval(() => {
        timeLeft--;
        timerValue.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(interval);
            autoPlaceShips();
        }
    }, 1000);
}
function formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
}

// Обработка отправки чата
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
if (chatForm && chatInput) {
    chatForm.onsubmit = function(e) {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text && ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'chat', text }));
            chatInput.value = '';
        }
    };
} 