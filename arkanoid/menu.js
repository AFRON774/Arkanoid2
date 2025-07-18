// Управление меню игры
class GameMenu {
    constructor() {
        this.menuElement = document.getElementById('gameMenu');
        this.gameArea = document.getElementById('gameArea');
        this.levelMap = document.getElementById('levelMap');
        this.skinsWindow = document.getElementById('skinsWindow');
        this.playButton = document.getElementById('playButton');
        this.skinsButton = document.getElementById('skinsButton');
        this.menuMusicBtn = document.getElementById('menuMusicBtn');
        this.backToMenuBtn = document.getElementById('backToMenu');
        this.closeSkinsBtn = document.getElementById('closeSkins');
        this.backToMenuFromSkinsBtn = document.getElementById('backToMenuFromSkins');
        this.victoryWindow = document.getElementById('victoryWindow');
        this.nextLevelBtn = document.getElementById('nextLevelBtn');
        this.replayLevelBtn = document.getElementById('replayLevelBtn');
        this.backToMenuFromVictoryBtn = document.getElementById('backToMenuFromVictory');
        this.menuMusicWasPlaying = false; // Запоминаем состояние музыки меню
        this.selectedLevel = 1; // По умолчанию выбран уровень 1
        this.closeLevelMapBtn = document.getElementById('closeLevelMap');
        
        // Скины
        this.selectedPaddleSkin = 'classic';
        this.selectedBallSkin = 'classic';
        this.unlockedSkins = {
            paddle: ['classic', 'green', 'red', 'blue'],
            ball: ['classic']
        };
        
        // Проверка наличия всех важных элементов
        if (!this.menuElement || !this.gameArea || !this.levelMap || !this.skinsWindow || !this.playButton || !this.skinsButton || !this.menuMusicBtn) {
            console.error('Ошибка инициализации GameMenu: отсутствует один из важных элементов меню!');
            return;
        }
        this.init();
    }

    init() {
        // Показываем меню при загрузке
        this.showMenu();
        
        // Добавляем обработчик для кнопки "Играть"
        if (this.playButton) {
            this.playButton.addEventListener('click', () => {
                this.showLevelMap();
            });
        }

        // Добавляем обработчик для кнопки "Скины"
        if (this.skinsButton) {
            this.skinsButton.addEventListener('click', () => {
                this.showSkinsWindow();
            });
        }

        // Добавляем обработчик для кнопки "Назад в меню" (на карте уровней)
        if (this.backToMenuBtn) {
            this.backToMenuBtn.addEventListener('click', () => {
                this.showMenu();
                this.levelMap.style.display = 'none'; // Явно скрываем карту уровней
            });
        }

        // Добавляем обработчики для окна скинов
        if (this.closeSkinsBtn) {
            this.closeSkinsBtn.addEventListener('click', () => {
                this.showMenu();
            });
        }

        if (this.backToMenuFromSkinsBtn) {
            this.backToMenuFromSkinsBtn.addEventListener('click', () => {
                this.showMenu();
            });
        }

        // Добавляем обработчики для окна победы
        if (this.nextLevelBtn) {
            this.nextLevelBtn.addEventListener('click', () => {
                this.nextLevel();
            });
        }

        if (this.replayLevelBtn) {
            this.replayLevelBtn.addEventListener('click', () => {
                this.replayLevel();
            });
        }

        if (this.backToMenuFromVictoryBtn) {
            this.backToMenuFromVictoryBtn.addEventListener('click', () => {
                this.showMenu();
            });
        }

        // Добавляем обработчики для уровней на карте
        this.addLevelMapHandlers();

        // Добавляем обработчики для скинов
        this.addSkinsHandlers();

        // Добавляем обработчик для кнопки музыки в меню
        if (this.menuMusicBtn) {
            this.menuMusicBtn.addEventListener('click', () => {
                this.toggleMenuMusic();
            });
        }

        // Добавляем обработчик для клавиши Enter
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.menuElement.style.display !== 'none') {
                this.showLevelMap();
            }
        });

        // Кнопка закрытия карты уровней (крестик)
        if (this.closeLevelMapBtn) {
            this.closeLevelMapBtn.addEventListener('click', () => {
                this.showMenu();
            });
        }
    }

    showMenu() {
        this.menuElement.style.display = 'flex';
        this.gameArea.style.display = 'none';
        this.levelMap.style.display = 'none'; // Явно скрываем карту уровней
        this.skinsWindow.style.display = 'none';
        this.victoryWindow.style.display = 'none';
        
        // Останавливаем игру если она была запущена
        if (typeof game !== 'undefined' && game.isRunning) {
            game.stop();
        }
        
        // Восстанавливаем состояние музыки меню
        this.restoreMenuMusic();
    }

    toggleMenuMusic() {
        if (typeof audioManager !== 'undefined') {
            if (audioManager.musicInterval) {
                // Музыка играет - останавливаем
                audioManager.stopBackgroundMusic();
                this.menuMusicWasPlaying = false;
                this.menuMusicBtn.textContent = '🔇';
                this.menuMusicBtn.classList.add('disabled');
            } else {
                // Музыка не играет - запускаем
                if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
                    audioManager.audioContext.resume();
                }
                audioManager.startMenuMusic();
                this.menuMusicWasPlaying = true;
                this.menuMusicBtn.textContent = '🎵';
                this.menuMusicBtn.classList.remove('disabled');
            }
        }
    }

    restoreMenuMusic() {
        if (typeof audioManager !== 'undefined' && audioManager.musicEnabled) {
            if (this.menuMusicWasPlaying) {
                // Если музыка была включена, запускаем её снова
                if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
                    audioManager.audioContext.resume();
                }
                audioManager.startMenuMusic();
                this.menuMusicBtn.textContent = '🎵';
                this.menuMusicBtn.classList.remove('disabled');
            } else {
                // Если музыка была выключена, показываем выключенное состояние
                this.menuMusicBtn.textContent = '🔇';
                this.menuMusicBtn.classList.add('disabled');
            }
        } else {
            // Если музыка отключена глобально
            this.menuMusicBtn.textContent = '🔇';
            this.menuMusicBtn.classList.add('disabled');
        }
    }

    updateMenuMusicButton() {
        if (typeof audioManager !== 'undefined') {
            if (audioManager.musicInterval) {
                this.menuMusicBtn.textContent = '🎵';
                this.menuMusicBtn.classList.remove('disabled');
            } else {
                this.menuMusicBtn.textContent = '🔇';
                this.menuMusicBtn.classList.add('disabled');
            }
        }
    }

    showLevelMap() {
        this.menuElement.style.display = 'none';
        this.levelMap.style.display = 'flex';
    }

    addLevelMapHandlers() {
        const levelNodes = document.querySelectorAll('.level-node');
        levelNodes.forEach(node => {
            node.addEventListener('click', () => {
                const level = parseInt(node.dataset.level);
                if (level <= 5) { // Пока доступны все 5 уровней
                    this.selectedLevel = level;
                    console.log(`Выбран уровень ${level}`);
                    this.startGame();
                }
            });
        });
    }

    showSkinsWindow() {
        this.menuElement.style.display = 'none';
        this.skinsWindow.style.display = 'flex';
        this.updateSkinsDisplay();
    }

    addSkinsHandlers() {
        const skinItems = document.querySelectorAll('.skin-item');
        skinItems.forEach(item => {
            item.addEventListener('click', () => {
                if (!item.classList.contains('locked')) {
                    const type = item.dataset.type;
                    const skin = item.dataset.skin;
                    this.selectSkin(type, skin);
                }
            });
        });
    }

    selectSkin(type, skin) {
        if (type === 'paddle') {
            this.selectedPaddleSkin = skin;
        } else if (type === 'ball') {
            this.selectedBallSkin = skin;
        }

        // Обновляем активные элементы
        document.querySelectorAll(`.skin-item[data-type="${type}"]`).forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.skin-item[data-type="${type}"][data-skin="${skin}"]`).classList.add('active');

        // Обновляем превью
        this.updatePreview();
    }

    updatePreview() {
        const previewPaddle = document.getElementById('previewPaddle');
        const previewBall = document.getElementById('previewBall');

        // Обновляем превью доски
        previewPaddle.className = `preview-paddle ${this.selectedPaddleSkin}-paddle`;

        // Обновляем превью шара
        previewBall.className = `preview-ball ${this.selectedBallSkin}-ball`;
    }

    updateSkinsDisplay() {
        // Проверяем, какие скины разблокированы
        const maxUnlockedLevel = this.getMaxUnlockedLevel();
        // Разблокируем скин улыбки после 2 уровня
        if (maxUnlockedLevel >= 2 && !this.unlockedSkins['ball'].includes('smiley')) {
            this.unlockSkin('ball', 'smiley');
        }
        // Обновляем отображение скинов
        document.querySelectorAll('.skin-item').forEach(item => {
            const type = item.dataset.type;
            const skin = item.dataset.skin;
            const requirement = item.dataset.requirement;
            // Удаляю overlay, если он был
            let overlay = item.querySelector('.overlay');
            if (overlay) overlay.remove();
            // Скрываю скин 'улыбка', если он есть в DOM, но не разблокирован
            if (skin === 'smiley' && !this.unlockedSkins[type].includes('smiley')) {
                item.style.display = 'none';
            } else {
                item.style.display = '';
            }
        });
        // Если скин 'улыбка' разблокирован, но его нет в DOM — добавляю
        if (this.unlockedSkins['ball'].includes('smiley')) {
            // Ищем .skin-category, где h3 содержит 'Шар'
            const categories = document.querySelectorAll('.skin-category');
            let grid = null;
            categories.forEach(cat => {
                const h3 = cat.querySelector('h3');
                if (h3 && h3.textContent.trim().toLowerCase().includes('шар')) {
                    grid = cat.querySelector('.skin-grid');
                }
            });
            if (grid && !grid.querySelector('.skin-item[data-skin="smiley"]')) {
                const smiley = document.createElement('div');
                smiley.className = 'skin-item';
                smiley.dataset.type = 'ball';
                smiley.dataset.skin = 'smiley';
                smiley.innerHTML = '<div class="skin-ball smiley-ball"></div><span>Улыбка</span>';
                grid.appendChild(smiley);
                // Добавить обработчик выбора
                smiley.addEventListener('click', () => {
                    this.selectSkin('ball', 'smiley');
                });
            }
        }
        this.updatePreview();
    }

    unlockSkin(type, skin) {
        if (!this.unlockedSkins[type].includes(skin)) {
            this.unlockedSkins[type].push(skin);
            this.updateSkinsDisplay(); // Добавлено: обновить отображение после разблокировки
        }
    }

    getMaxUnlockedLevel() {
        // Читаем прогресс из localStorage
        return parseInt(localStorage.getItem('arkanoid_max_level') || '1', 10);
    }

    showVictoryWindow(level, time, score) {
        this.gameArea.style.display = 'none';
        this.victoryWindow.style.display = 'flex';
        // Сохраняем прогресс (максимальный достигнутый уровень)
        const prev = parseInt(localStorage.getItem('arkanoid_max_level') || '1', 10);
        if (level > prev) {
            localStorage.setItem('arkanoid_max_level', String(level));
        }
        
        // Обновляем статистику
        document.getElementById('victoryTime').textContent = time;
        document.getElementById('victoryScore').textContent = score;
        
        // Сохраняем текущий уровень
        this.currentVictoryLevel = level;
        
        // Проверяем, есть ли следующий уровень
        if (level >= 5) {
            this.nextLevelBtn.style.display = 'none';
        } else {
            this.nextLevelBtn.style.display = 'block';
        }
    }

    nextLevel() {
        if (this.currentVictoryLevel < 5) {
            this.selectedLevel = this.currentVictoryLevel + 1;
            this.hideMenu();
            // Сброс показа окна скина
            window._skinRewardShown = false;
            // Устанавливаем выбранный уровень
            if (typeof currentLevel !== 'undefined') {
                currentLevel = this.selectedLevel;
            }
            // Запускаем игру
            if (typeof initGame === 'function') {
                initGame();
            }
        }
    }

    replayLevel() {
        this.hideMenu();
        // Сброс показа окна скина
        window._skinRewardShown = false;
        // Устанавливаем текущий уровень
        if (typeof currentLevel !== 'undefined') {
            currentLevel = this.currentVictoryLevel;
        }
        // Запускаем игру
        if (typeof initGame === 'function') {
            initGame();
        }
    }

    hideMenu() {
        this.menuElement.style.display = 'none';
        this.levelMap.style.display = 'none';
        this.skinsWindow.style.display = 'none';
        this.victoryWindow.style.display = 'none';
        this.gameArea.style.display = 'block';
    }

    startGame() {
        // Запоминаем состояние музыки меню перед переходом в игру
        if (typeof audioManager !== 'undefined') {
            this.menuMusicWasPlaying = audioManager.musicInterval !== null;
        }
        
        this.hideMenu();
        this.levelMap.style.display = 'none'; // Явно скрываем карту уровней при старте игры
        
        // Останавливаем меню музыку и запускаем игровую музыку
        if (typeof audioManager !== 'undefined') {
            audioManager.stopBackgroundMusic();
            if (audioManager.musicEnabled) {
                audioManager.startBackgroundMusic();
            }
        }
        
        // Устанавливаем выбранный уровень
        if (typeof currentLevel !== 'undefined') {
            currentLevel = this.selectedLevel;
        }
        
        // Запускаем игру
        if (typeof startGame === 'function') {
            startGame();
        } else {
            // Если функция startGame не определена, просто инициализируем игру
            if (typeof initGame === 'function') {
                initGame();
            }
        }
    }

    // Метод для возврата в меню (например, после проигрыша)
    returnToMenu() {
        // Скрываем окно Game Over
        const gameoverDiv = document.getElementById('gameover');
        if (gameoverDiv) {
            gameoverDiv.style.display = 'none';
        }
        
        // Останавливаем игровую музыку
        if (typeof audioManager !== 'undefined') {
            audioManager.stopBackgroundMusic();
        }
        
        this.showMenu();
    }
}

// Создаем глобальный экземпляр меню
let gameMenu;
document.addEventListener('DOMContentLoaded', () => {
    gameMenu = new GameMenu();
});

// Функция для возврата в меню из игры
function returnToMenu() {
    gameMenu.returnToMenu();
}

// Функция для игры снова
function playAgain() {
    // Скрываем окно Game Over
    const gameoverDiv = document.getElementById('gameover');
    if (gameoverDiv) {
        gameoverDiv.style.display = 'none';
    }
    
    // Запускаем игровую музыку
    if (typeof audioManager !== 'undefined' && audioManager.musicEnabled) {
        audioManager.startBackgroundMusic();
    }
    
    if (typeof initGame === 'function') {
        initGame();
    }
} 