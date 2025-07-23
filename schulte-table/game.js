const startBtn = document.getElementById('start-btn');
const gameScreen = document.getElementById('game-screen');
const startScreen = document.getElementById('start-screen');
const winScreen = document.getElementById('win-screen');
const menuBtn = document.getElementById('menu-btn');
const timerEl = document.getElementById('timer');
const recordLabel = document.getElementById('record-label');
const finalTime = document.getElementById('final-time');
const finalRecord = document.getElementById('final-record');
const newRecordModal = document.getElementById('new-record-modal');
const oldRecordEl = document.getElementById('old-record');
const newRecordEl = document.getElementById('new-record');
const closeRecordModal = document.getElementById('close-record-modal');
const soundBtn = document.getElementById('sound-btn');
const menuMusic = document.getElementById('menu-music');
const gameMusic = document.getElementById('game-music');
let soundOn = false;
let currentMusic = null;

let currentNumber = 1;
let cells = [];
let timer = 0;
let timerInterval = null;
let record = null;
let gameStarted = false;
let plus2Timeout = null;

// --- Web Audio API музыка для Schulte Table ---
let audioCtx = null;
let musicEnabled = true;
let menuMusicInterval = null;
let gameMusicInterval = null;
let menuNoteIdx = 0;
let gameNoteIdx = 0;

function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playTone(freq, duration, type = 'triangle', gainVal = 0.12) {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = gainVal;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
}

// Мелодия меню (задумчивая, медленная)
const menuMelody = [
    { freq: 294, dur: 0.5 }, // D4
    { freq: 349, dur: 0.5 }, // F4
    { freq: 440, dur: 0.5 }, // A4
    { freq: 392, dur: 0.5 }, // G4
    { freq: 349, dur: 0.5 }, // F4
    { freq: 294, dur: 0.5 }, // D4
    { freq: 262, dur: 0.5 }, // C4
    { freq: 220, dur: 0.7 }, // A3
];

function playMenuMusic() {
    stopMusic();
    if (!soundOn) return;
    menuNoteIdx = 0;
    menuMusicInterval = setInterval(() => {
        const note = menuMelody[menuNoteIdx];
        playTone(note.freq, note.dur, 'triangle', 0.13);
        menuNoteIdx = (menuNoteIdx + 1) % menuMelody.length;
    }, 650);
}

// Мелодия игры (тикающая, ритмичная)
const gameMelody = [
    { freq: 523, dur: 0.13 }, // C5 тик
    { freq: 0, dur: 0.12 },  // пауза
    { freq: 392, dur: 0.13 }, // G4 так
    { freq: 0, dur: 0.12 },  // пауза
];

function playGameMusic() {
    stopMusic();
    if (!soundOn) return;
    gameNoteIdx = 0;
    gameMusicInterval = setInterval(() => {
        const note = gameMelody[gameNoteIdx];
        if (note.freq > 0) playTone(note.freq, note.dur, 'sine', 0.11);
        gameNoteIdx = (gameNoteIdx + 1) % gameMelody.length;
    }, 250);
}

function stopMusic() {
    if (menuMusicInterval) { clearInterval(menuMusicInterval); menuMusicInterval = null; }
    if (gameMusicInterval) { clearInterval(gameMusicInterval); gameMusicInterval = null; }
}

// --- ДОБАВЛЕНО: элементы для уровней и окон ---
const levelModal = document.getElementById('level-modal');
const levelBtns = document.querySelectorAll('.level-btn');
const closeLevelModal = document.getElementById('close-level-modal');
const winBest = document.getElementById('final-best');
let loseScreen = document.getElementById('lose-screen');
const loseMenuBtn = document.getElementById('lose-menu-btn');

// --- Удаляем рекорды ---
// (recordLabel, finalRecord, newRecordModal, oldRecordEl, newRecordEl, closeRecordModal)
// ---

let currentLevel = 1;
let bestTimes = JSON.parse(localStorage.getItem('schulte_best_times') || '{}');
let levelConfig = {
    1: { size: 3, max: 9, time: 30 },
    2: { size: 5, max: 25, time: 40 },
    3: { size: 5, max: 25, time: 45 },
    4: { size: 5, max: 25, time: 45 },
    5: { size: 5, max: 25, time: 50 },
};

function saveBestTime(level, time) {
    bestTimes[level] = time;
    localStorage.setItem('schulte_best_times', JSON.stringify(bestTimes));
}

function getBestTime(level) {
    return bestTimes[level] || null;
}

// --- МОДАЛЬНОЕ ОКНО ВЫБОРА УРОВНЯ ---
startBtn.onclick = () => {
    levelModal.style.display = '';
};
closeLevelModal.onclick = () => {
    levelModal.style.display = 'none';
};
levelBtns.forEach(btn => {
    btn.onclick = () => {
        currentLevel = +btn.dataset.level;
        levelModal.style.display = 'none';
        startGame();
    };
});

// --- КНОПКА "В МЕНЮ" из окна поражения ---
loseMenuBtn.onclick = () => {
    loseScreen.style.display = 'none';
    startScreen.style.display = '';
    gameScreen.innerHTML = '';
    currentNumber = 1;
    timer = 0;
    clearInterval(timerInterval);
    timerEl.textContent = '';
    if (soundOn) playMenuMusic();
};

// --- КНОПКА "В МЕНЮ" из окна победы ---
if (menuBtn) menuBtn.onclick = () => {
    winScreen.style.display = 'none';
    startScreen.style.display = '';
    gameScreen.innerHTML = '';
    currentNumber = 1;
    timer = 0;
    clearInterval(timerInterval);
    timerEl.textContent = '';
    if (soundOn) playMenuMusic();
};

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(2).padStart(5, '0');
    return m > 0 ? `${m}:${s}` : s;
}

function loadRecord() {
    const rec = localStorage.getItem('schulte_record');
    record = rec ? parseFloat(rec) : null;
    updateRecordLabels();
}

function saveRecord(newRec) {
    record = newRec;
    localStorage.setItem('schulte_record', String(newRec));
    updateRecordLabels();
}

function updateRecordLabels() {
    if (record !== null) {
        recordLabel.style.display = '';
        recordLabel.textContent = `Рекорд: ${formatTime(record)}`;
        if (finalRecord) finalRecord.textContent = `Рекорд: ${formatTime(record)}`;
    } else {
        recordLabel.style.display = 'none';
        if (finalRecord) finalRecord.textContent = '';
    }
}

soundBtn.onclick = () => {
    soundOn = !soundOn;
    setSoundIcon();
    if (!soundOn) {
        stopMusic();
    } else {
        if (startScreen.style.display !== 'none') {
            playMenuMusic();
        } else if (gameScreen.style.display !== 'none') {
            playGameMusic();
        }
    }
};

function setSoundIcon() {
    const icon = soundBtn.querySelector('i');
    if (soundOn) {
        icon.className = 'fa-solid fa-volume-high';
        soundBtn.title = 'Звук вкл';
        soundBtn.setAttribute('aria-label', 'Звук вкл');
    } else {
        icon.className = 'fa-solid fa-volume-xmark';
        soundBtn.title = 'Звук выкл';
        soundBtn.setAttribute('aria-label', 'Звук выкл');
    }
}

function startGame() {
    startScreen.style.display = 'none';
    winScreen.style.display = 'none';
    loseScreen.style.display = 'none';
    gameScreen.style.display = '';
    currentNumber = 1;
    renderGrid();
    timer = 0;
    timerEl.textContent = formatTime(timer);
    gameStarted = true;
    clearInterval(timerInterval);
    let timeLimit = levelConfig[currentLevel].time;
    timerInterval = setInterval(() => {
        timer += 0.05;
        timerEl.textContent = formatTime(timer) + ` / ${timeLimit}s`;
        if (timer >= timeLimit) {
            clearInterval(timerInterval);
            gameStarted = false;
            showLose();
        }
    }, 50);
    if (soundOn) playGameMusic();
}

function renderGrid() {
    const conf = levelConfig[currentLevel];
    const numbers = shuffle(Array.from({length: conf.max}, (_, i) => i + 1));
    gameScreen.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'schulte-grid' + (currentLevel === 1 ? ' level-1' : '');
    grid.style.gridTemplateColumns = `repeat(${conf.size}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${conf.size}, 1fr)`;
    cells = [];
    numbers.forEach(num => {
        const cell = document.createElement('div');
        cell.className = 'schulte-cell';
        cell.textContent = num;
        // --- Особые стили для уровней ---
        if (currentLevel === 1 || currentLevel === 2 || currentLevel === 4) {
            cell.style.background = '#111';
            cell.style.border = '2px solid #fff2';
            cell.style.boxShadow = '0 2px 8px 0 #0004';
        }
        if (currentLevel === 3 || currentLevel === 5) {
            cell.style.background = Math.random() > 0.5 ? '#fff' : '#111';
            cell.style.color = cell.style.background === '#fff' ? '#111' : '#fff';
            cell.style.border = '2px solid #fff2';
            cell.style.boxShadow = '0 2px 8px 0 #0004';
        }
        if (currentLevel === 4 || currentLevel === 5) {
            // Случайный цвет цифры
            cell.style.color = randomColor();
        } else if (currentLevel === 1 || currentLevel === 2 || currentLevel === 3) {
            // Серый цвет для 1-3 уровней
            cell.style.color = '#6b7280';
        }
        if (currentLevel === 5) {
            animateCellColor(cell);
        }
        cell.onclick = () => handleCellClick(cell, num);
        grid.appendChild(cell);
        cells.push(cell);
    });
    gameScreen.appendChild(timerEl);
    gameScreen.appendChild(grid);
}

function randomColor() {
    const colors = ['#e11d48','#f59e42','#fbbf24','#22d3ee','#10b981','#6366f1','#8b5cf6','#f472b6','#facc15','#14b8a6'];
    return colors[Math.floor(Math.random()*colors.length)];
}

function animateCellColor(cell) {
    let hue = Math.floor(Math.random()*360);
    cell.style.transition = 'color 0.5s';
    setInterval(() => {
        hue = (hue + 30) % 360;
        cell.style.color = `hsl(${hue}, 90%, 60%)`;
    }, 400);
}

function handleCellClick(cell, num) {
    if (cell.classList.contains('correct')) return;
    if (num === currentNumber) {
        cell.classList.add('correct');
        cell.onclick = null;
        // --- Зеленый фон после правильного нажатия ---
        cell.style.background = '#22c55e';
        cell.style.color = '#fff';
        currentNumber++;
        if (currentNumber > levelConfig[currentLevel].max) {
            finishGame();
        }
    } else {
        addPenalty();
        cell.classList.add('wrong');
        setTimeout(() => cell.classList.remove('wrong'), 300);
    }
}

function addPenalty() {
    timer += 2;
    showPlus2();
    timerEl.textContent = formatTime(timer);
    // Проверяем превышение лимита сразу после штрафа
    let timeLimit = levelConfig[currentLevel].time;
    if (timer >= timeLimit) {
        clearInterval(timerInterval);
        gameStarted = false;
        showLose();
    }
}

function showPlus2() {
    const old = timerEl.querySelector('.plus2');
    if (old) old.remove();
    let plus2 = document.createElement('span');
    plus2.className = 'plus2';
    plus2.textContent = '+2';
    timerEl.appendChild(plus2);
    setTimeout(() => {
        plus2.remove();
    }, 1000);
}

function finishGame() {
    clearInterval(timerInterval);
    gameStarted = false;
    setTimeout(() => {
        const time = parseFloat(timer.toFixed(2));
        finalTime.textContent = `Время: ${formatTime(time)}`;
        let best = getBestTime(currentLevel);
        if (best === null || time < best) {
            saveBestTime(currentLevel, time);
            best = time;
        }
        winBest.textContent = `Лучший результат: ${best ? formatTime(best) : '—'}`;
        winScreen.style.display = '';
        gameScreen.style.display = 'none';
        stopMusic();
    }, 400);
}

function showLose() {
    // Получаем элементы заново, чтобы избежать проблем с областью видимости
    const loseScreen = document.getElementById('lose-screen');
    if (!loseScreen) {
        alert('Окно поражения не найдено!');
        return;
    }
    loseScreen.style.display = '';
    gameScreen.style.display = 'none';
    stopMusic();
    // Не назначаем обработчик loseMenuBtn здесь, он уже назначен глобально
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Инициализация
// loadRecord();
// updateRecordLabels();
setSoundIcon();
stopMusic(); 