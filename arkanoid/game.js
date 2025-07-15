const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Размеры
const paddleWidth = 75;
const paddleHeight = 10;
const ballRadius = 8;
const brickRowCount = 5;
const brickColumnCount = 7;
const brickWidth = 55;
const brickHeight = 20;
const brickPadding = 5;
const brickOffsetTop = 30;
const brickOffsetLeft = (canvas.width - (brickColumnCount * brickWidth + (brickColumnCount - 1) * brickPadding)) / 2;

// Платформа
let paddleX = (canvas.width - paddleWidth) / 2;
let rightPressed = false;
let leftPressed = false;

// Шарик
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 3;
let dy = -3;

// Блоки
let bricks = [];

// Функция загрузки уровня
function loadLevel(level) {
    bricks = [];
    for(let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for(let r = 0; r < brickRowCount; r++) {
            let status = 1; // По умолчанию блок активен
            
            // Уровень 2: убираем среднюю вертикальную полосу
            if (level === 2) {
                const middleColumn = Math.floor(brickColumnCount / 2); // 3-я колонка (индекс 3)
                if (c === middleColumn) {
                    status = 0; // Блок неактивен
                }
            }
            // Уровень 3: убираем угловые блоки
            else if (level === 3) {
                if ((c === 0 && r === 0) || (c === brickColumnCount - 1 && r === 0) ||
                    (c === 0 && r === brickRowCount - 1) || (c === brickColumnCount - 1 && r === brickRowCount - 1)) {
                    status = 0;
                }
            }
            // Уровень 4: убираем центральный крест
            else if (level === 4) {
                const centerColumn = Math.floor(brickColumnCount / 2);
                const centerRow = Math.floor(brickRowCount / 2);
                if (c === centerColumn || r === centerRow) {
                    status = 0;
                }
            }
            // Уровень 5: убираем все блоки кроме границ
            else if (level === 5) {
                if (c > 0 && c < brickColumnCount - 1 && r > 0 && r < brickRowCount - 1) {
                    status = 0;
                }
            }
            
            bricks[c][r] = { x: 0, y: 0, status: status };
        }
    }
}

// Массив частиц
let particles = [];

// Флаг для запуска салюта
let fireworksActive = false;
let fireworksTimer = 0;

// Жизни
let lives = 3;
let lastHeartLoss = 0; // Время последней потери сердца
let heartShineTimer = 0; // Таймер для эффекта блика

// Система уровней
let currentLevel = 1;
let totalLevels = 5;

let startTime = Date.now();
let gameOver = false;
let finalTime = 0;
let victoryTime = -1;
let gameWon = false;
let score = 0;

function showGameOver() {
    const gameoverDiv = document.getElementById('gameover');
    if (!gameoverDiv) return;
    gameoverDiv.innerHTML = `
        <h1>Game Over</h1>
        <div style='color:#fff;font-size:20px;margin-bottom:16px;'>Время: ${formatTime(finalTime)}</div>
        <button onclick='playAgain()' style='margin-bottom: 10px;'>Играть снова</button>
        <button onclick='returnToMenu()' style='font-size: 18px; padding: 10px 25px; border: 2px solid #fff; border-radius: 50px; background: #fff; color: #000; cursor: pointer; font-family: Arial, sans-serif; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s ease; display: block; margin: 0 auto;'>В меню</button>
    `;
    gameoverDiv.style.display = 'flex';
    
    // Грустный звук Game Over
    if (typeof audioManager !== 'undefined') {
        audioManager.playGameOver();
    }
}

function showVictory() {
    const gameoverDiv = document.getElementById('gameover');
    if (!gameoverDiv) return;
    gameoverDiv.innerHTML = `
        <h1 style='color:#4caf50;'>Вы Победили!</h1>
        <div style='color:#fff;font-size:20px;margin-bottom:16px;'>Время: ${formatTime(victoryTime)}</div>
        <button onclick='playAgain()' style='margin-bottom: 10px;'>Играть снова</button>
        <button onclick='returnToMenu()' style='font-size: 18px; padding: 10px 25px; border: 2px solid #fff; border-radius: 50px; background: #fff; color: #000; cursor: pointer; font-family: Arial, sans-serif; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s ease; display: block; margin: 0 auto;'>В меню</button>
    `;
    gameoverDiv.style.display = 'flex';
}
function formatTime(totalSeconds) {
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function renderLives() {
    const livesDiv = document.getElementById('lives');
    if (!livesDiv) return;
    livesDiv.innerHTML = '';
    
    // Добавляем градиент для сердечек
    const svgDefs = `
        <svg width="0" height="0" style="position: absolute;">
            <defs>
                <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ff1744;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#d50000;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#b71c1c;stop-opacity:1" />
                </linearGradient>
            </defs>
        </svg>
    `;
    livesDiv.insertAdjacentHTML('beforeend', svgDefs);
    
    for (let i = 0; i < 3; i++) {
        const heart = document.createElement('span');
        heart.className = 'heart' + (i >= lives ? ' lost' : '');
        heart.innerHTML = `
            <svg viewBox="0 0 32 32">
                <path d="M23.6,4.6c-2.1,0-4,1-5.6,2.7C16.4,5.6,14.5,4.6,12.4,4.6C8.1,4.6,4.6,8.1,4.6,12.4c0,7.2,10.2,13.2,11.1,13.7 c0.2,0.1,0.5,0.1,0.7,0c0.9-0.5,11.1-6.5,11.1-13.7C27.4,8.1,23.9,4.6,23.6,4.6z"/>
            </svg>
        `;
        livesDiv.appendChild(heart);
    }
    
    // Добавляем эффект вспышки для только что потерянных сердечек
    const currentTime = Date.now();
    if (currentTime - lastHeartLoss < 1000) { // В течение 1 секунды после потери
        const lostHearts = livesDiv.querySelectorAll('.heart.lost');
        if (lostHearts.length > 0) {
            const lastLostHeart = lostHearts[lostHearts.length - 1];
            const flashElement = document.createElement('div');
            flashElement.className = 'crack-flash';
            lastLostHeart.appendChild(flashElement);
            setTimeout(() => {
                if (flashElement.parentNode) {
                    flashElement.parentNode.removeChild(flashElement);
                }
            }, 300);
        }
    }
    
    // Эффект блика каждые 3 секунды
    heartShineTimer++;
    if (heartShineTimer >= 180) { // 180 кадров = 3 секунды при 60 FPS
        heartShineTimer = 0;
        const hearts = livesDiv.querySelectorAll('.heart:not(.lost)');
        hearts.forEach(heart => {
            heart.classList.add('shine');
            setTimeout(() => {
                heart.classList.remove('shine');
            }, 600);
        });
    }
    
    // Отладочная информация
    console.log('Lives:', lives, 'Lost hearts:', livesDiv.querySelectorAll('.heart.lost').length);
}

function renderTimer() {
    const timerDiv = document.getElementById('timer');
    if (!timerDiv) return;
    let elapsed;
    if (gameOver) {
        elapsed = finalTime;
    } else if ((gameWon || fireworksActive) && victoryTime >= 0) {
        elapsed = victoryTime;
    } else {
        elapsed = Math.floor((Date.now() - startTime) / 1000);
    }
    let minutes = Math.floor(elapsed / 60);
    let seconds = elapsed % 60;
    timerDiv.textContent = `Уровень ${currentLevel} | ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Функция генерации частиц для блока
function createParticles(x, y, color) {
    const count = 25;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = 1 + Math.random() * 2;
        particles.push({
            x: x + brickWidth / 2,
            y: y + brickHeight / 2,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            life: 30 + Math.random() * 20,
            color: color
        });
    }
}

// Функция генерации частиц для сердечка
function createHeartParticles() {
    const livesDiv = document.getElementById('lives');
    if (!livesDiv) return;
    
    const hearts = livesDiv.querySelectorAll('.heart');
    if (hearts.length > lives) {
        const lostHeart = hearts[lives]; // Сердечко, которое только что потеряли
        const rect = lostHeart.getBoundingClientRect();
        const gameArea = document.getElementById('gameArea');
        const gameRect = gameArea.getBoundingClientRect();
        
        const heartX = rect.left - gameRect.left + rect.width / 2;
        const heartY = rect.top - gameRect.top + rect.height / 2;
        
        const count = 12;
        const colors = ['#ff1744', '#d50000', '#b71c1c', '#ff6b6b', '#ff8a80'];
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const speed = 1.5 + Math.random() * 2.5;
            particles.push({
                x: heartX + (Math.random() - 0.5) * 10, // Небольшой разброс от центра
                y: heartY + (Math.random() - 0.5) * 10,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                life: 35 + Math.random() * 25,
                color: colors[Math.floor(Math.random() * colors.length)],
                type: 'heart' // Маркируем как частицу сердечка
            });
        }
    }
}

// Функция запуска салюта
function launchFireworks() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const colors = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#00bcd4', '#fff'];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 40; j++) {
            const angle = (Math.PI * 2 / 40) * j;
            const speed = 2 + Math.random() * 2;
            particles.push({
                x: centerX,
                y: centerY,
                dx: Math.cos(angle) * speed * (0.7 + Math.random() * 0.6),
                dy: Math.sin(angle) * speed * (0.7 + Math.random() * 0.6),
                life: 50 + Math.random() * 30,
                color: colors[i % colors.length]
            });
        }
    }
    fireworksActive = true;
    fireworksTimer = 120; // длительность салюта
    victoryTime = Math.floor((Date.now() - startTime) / 1000);
    console.log('Победа! Время зафиксировано:', victoryTime);
}

// Цвета для строк блоков
const brickColors = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5'];

// Управление
function keyDownHandler(e) {
    if(e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if(e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    }
}
function keyUpHandler(e) {
    if(e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if(e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}
document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

// Отрисовка блоков
function drawBricks() {
    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            if(bricks[c][r].status === 1) {
                let brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                let brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = brickColors[r % brickColors.length];
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// Отрисовка и обновление частиц
function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Определяем, является ли частица сердечком
        const isHeartParticle = p.type === 'heart' || ['#ff1744', '#d50000', '#b71c1c', '#ff6b6b', '#ff8a80'].includes(p.color);
        
        if (isHeartParticle) {
            // Рисуем маленькое сердечко
            const size = Math.max(0.8, p.life / 12);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.scale(size * 0.08, size * 0.08);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.moveTo(0, -1);
            ctx.bezierCurveTo(-1, -2, -2, -1, -2, 0);
            ctx.bezierCurveTo(-2, 1, -1, 2, 0, 1);
            ctx.bezierCurveTo(1, 2, 2, 1, 2, 0);
            ctx.bezierCurveTo(2, -1, 1, -2, 0, -1);
            ctx.fill();
            ctx.restore();
        } else {
            // Обычная частица
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 2, 2);
        }
        
        p.x += p.dx;
        p.y += p.dy;
        p.dy += 0.06; // гравитация (меньше для частиц сердечек)
        p.life--;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Отрисовка шарика
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = '#ffeb3b';
    ctx.fill();
    ctx.closePath();
}

// Отрисовка платформы
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight - 5, paddleWidth, paddleHeight);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
}

// Проверка столкновений с блоками
function collisionDetection() {
    let allBricksDestroyed = true;
    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if(b.status === 1) {
                allBricksDestroyed = false;
                if(x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    score += 10; // Увеличиваем счет на 10 очков за блок
                    createParticles(b.x, b.y, brickColors[r % brickColors.length]);
                    // Звук разрушения блока
                    if (typeof audioManager !== 'undefined') {
                        audioManager.playBlockDestroy();
                    }
                }
            }
        }
    }
    // Если все блоки уничтожены и салют ещё не запущен
    if(allBricksDestroyed && !fireworksActive) {
        // Останавливаем игру
        gameOver = true;
        
        // Фиксируем время победы
        victoryTime = Math.floor((Date.now() - startTime) / 1000);
        
        // Звук победы
        if (typeof audioManager !== 'undefined') {
            audioManager.playVictory();
        }
        
        // Показываем окно победы
        if (typeof gameMenu !== 'undefined') {
            gameMenu.showVictoryWindow(currentLevel, formatTime(victoryTime), score);
        }
    }
}

function resetBallAndPaddle() {
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = 3 * (Math.random() > 0.5 ? 1 : -1);
    dy = -3;
    paddleX = (canvas.width - paddleWidth) / 2;
}

// Основной цикл игры
function draw() {
    if (gameOver) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawParticles();
    drawBall();
    drawPaddle();
    collisionDetection();
    renderLives();
    renderTimer();
    
    // Если салют активен, не перезапускать игру
    if (fireworksActive) {
        fireworksTimer--;
        if (fireworksTimer <= 0 && particles.length === 0) {
            fireworksActive = false;
            gameWon = true; // Останавливаем игру после завершения салюта
            // Останавливаем фоновую музыку
            if (typeof audioManager !== 'undefined') {
                audioManager.stopBackgroundMusic();
            }
            setTimeout(showVictory, 1000);
            return; // Прерываем цикл
        }
    }
    
    if (!fireworksActive && !gameWon) {
        // Движение шарика и платформы только если нет салюта и игра не выиграна
        if(x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
            dx = -dx;
            // Звук отскока шарика от стен
            if (typeof audioManager !== 'undefined') {
                audioManager.playBallBounce();
            }
        }
        if(y + dy < ballRadius) {
            dy = -dy;
            // Звук отскока шарика от потолка
            if (typeof audioManager !== 'undefined') {
                audioManager.playBallBounce();
            }
        } else if(y + dy > canvas.height - ballRadius - paddleHeight - 5) {
            if(x > paddleX && x < paddleX + paddleWidth) {
                dy = -dy;
                // Звук отскока шарика от платформы
                if (typeof audioManager !== 'undefined') {
                    audioManager.playBallBounce();
                }
                            } else if(y + dy > canvas.height - ballRadius) {
                    lives--;
                    lastHeartLoss = Date.now();
                    // Звук потери жизни
                    if (typeof audioManager !== 'undefined') {
                        audioManager.playLifeLost();
                    }
                    // Создаем частицы сердечка
                    setTimeout(() => {
                        createHeartParticles();
                    }, 200); // Увеличиваем задержку, чтобы трещина появилась сначала
                    if (lives > 0) {
                        resetBallAndPaddle();
                    } else {
                        finalTime = Math.floor((Date.now() - startTime) / 1000);
                        gameOver = true;
                        // Останавливаем фоновую музыку
                        if (typeof audioManager !== 'undefined') {
                            audioManager.stopBackgroundMusic();
                        }
                        renderTimer();
                        setTimeout(showGameOver, 400);
                        return; // Прерываем цикл
                    }
                }
        }
        x += dx;
        y += dy;
        if(rightPressed && paddleX < canvas.width - paddleWidth) {
            paddleX += 5;
        } else if(leftPressed && paddleX > 0) {
            paddleX -= 5;
        }
    }
    
    requestAnimationFrame(draw);
}

// Функция инициализации игры
function initGame() {
    // Сброс всех переменных игры
    lives = 3;
    lastHeartLoss = 0;
    heartShineTimer = 0;
    // currentLevel устанавливается из меню
    gameOver = false;
    gameWon = false;
    fireworksActive = false;
    fireworksTimer = 0;
    particles = [];
    victoryTime = -1;
    finalTime = 0;
    score = 0;
    startTime = Date.now();
    
    // Сброс позиций
    resetBallAndPaddle();
    
    // Загружаем выбранный уровень
    loadLevel(currentLevel);
    
    // Запуск игрового цикла
    draw();
}

// Запускаем игру только если меню не активно
if (document.getElementById('gameMenu').style.display === 'none') {
    initGame();
}

// Тестовая функция для проверки трещин
function testHeartCrack() {
    if (lives > 0) {
        lives--;
        lastHeartLoss = Date.now();
        console.log('Тест: потеряна жизнь, осталось:', lives);
        renderLives();
        
        // Создаем частицы через 200мс
        setTimeout(() => {
            createHeartParticles();
        }, 200);
    }
}

// Добавляем обработчик для тестовой кнопки
document.addEventListener('DOMContentLoaded', function() {
    const testButton = document.getElementById('testCrack');
    if (testButton) {
        testButton.addEventListener('click', testHeartCrack);
    }
    
    const switchLevelButton = document.getElementById('switchLevel');
    if (switchLevelButton) {
        switchLevelButton.addEventListener('click', switchLevel);
    }
});

// Функция переключения уровня
function switchLevel() {
    currentLevel = currentLevel === 1 ? 2 : 1;
    console.log(`Переключение на уровень ${currentLevel}`);
    
    // Загружаем новый уровень
    loadLevel(currentLevel);
    
    // Сбрасываем позиции
    resetBallAndPaddle();
    
    // Обновляем отображение
    renderTimer();
} 