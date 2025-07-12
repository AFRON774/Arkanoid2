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
        this.menuMusicWasPlaying = false; // Запоминаем состояние музыки меню
        this.selectedLevel = 1; // По умолчанию выбран уровень 1
        
        // Скины
        this.selectedPaddleSkin = 'classic';
        this.selectedBallSkin = 'classic';
        this.unlockedSkins = {
            paddle: ['classic'],
            ball: ['classic']
        };
        
        this.init();
    }

    init() {
        // Показываем меню при загрузке
        this.showMenu();
        
        // Добавляем обработчик для кнопки "Играть"
        this.playButton.addEventListener('click', () => {
            this.showLevelMap();
        });

        // Добавляем обработчик для кнопки "Скины"
        this.skinsButton.addEventListener('click', () => {
            this.showSkinsWindow();
        });

        // Добавляем обработчик для кнопки "Назад в меню"
        this.backToMenuBtn.addEventListener('click', () => {
            this.showMenu();
        });

        // Добавляем обработчики для окна скинов
        this.closeSkinsBtn.addEventListener('click', () => {
            this.showMenu();
        });

        this.backToMenuFromSkinsBtn.addEventListener('click', () => {
            this.showMenu();
        });

        // Добавляем обработчики для уровней на карте
        this.addLevelMapHandlers();

        // Добавляем обработчики для скинов
        this.addSkinsHandlers();

        // Добавляем обработчик для кнопки музыки в меню
        this.menuMusicBtn.addEventListener('click', () => {
            this.toggleMenuMusic();
        });

        // Добавляем обработчик для клавиши Enter
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.menuElement.style.display !== 'none') {
                this.showLevelMap();
            }
        });
    }

    showMenu() {
        this.menuElement.style.display = 'flex';
        this.gameArea.style.display = 'none';
        this.levelMap.style.display = 'none';
        this.skinsWindow.style.display = 'none';
        
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
        if (maxUnlockedLevel >= 2) {
            this.unlockSkin('ball', 'smiley');
        }

        // Обновляем отображение скинов
        document.querySelectorAll('.skin-item').forEach(item => {
            const type = item.dataset.type;
            const skin = item.dataset.skin;
            const requirement = item.dataset.requirement;

            if (requirement) {
                const requiredLevel = parseInt(requirement.replace('level', ''));
                if (maxUnlockedLevel >= requiredLevel) {
                    item.classList.remove('locked');
                    if (!this.unlockedSkins[type].includes(skin)) {
                        this.unlockedSkins[type].push(skin);
                    }
                } else {
                    item.classList.add('locked');
                }
            }
        });

        this.updatePreview();
    }

    unlockSkin(type, skin) {
        if (!this.unlockedSkins[type].includes(skin)) {
            this.unlockedSkins[type].push(skin);
        }
    }

    getMaxUnlockedLevel() {
        // В реальной игре это должно читаться из сохранений
        // Пока возвращаем 2 для демонстрации
        return 2;
    }

    hideMenu() {
        this.menuElement.style.display = 'none';
        this.levelMap.style.display = 'none';
        this.skinsWindow.style.display = 'none';
        this.gameArea.style.display = 'block';
    }

    startGame() {
        // Запоминаем состояние музыки меню перед переходом в игру
        if (typeof audioManager !== 'undefined') {
            this.menuMusicWasPlaying = audioManager.musicInterval !== null;
        }
        
        this.hideMenu();
        
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
const gameMenu = new GameMenu();

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