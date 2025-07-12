// Управление меню игры
class GameMenu {
    constructor() {
        this.menuElement = document.getElementById('gameMenu');
        this.gameArea = document.getElementById('gameArea');
        this.playButton = document.getElementById('playButton');
        this.menuMusicBtn = document.getElementById('menuMusicBtn');
        this.menuMusicWasPlaying = false; // Запоминаем состояние музыки меню
        
        this.init();
    }

    init() {
        // Показываем меню при загрузке
        this.showMenu();
        
        // Добавляем обработчик для кнопки "Играть"
        this.playButton.addEventListener('click', () => {
            this.startGame();
        });

        // Добавляем обработчик для кнопки музыки в меню
        this.menuMusicBtn.addEventListener('click', () => {
            this.toggleMenuMusic();
        });

        // Добавляем обработчик для клавиши Enter
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.menuElement.style.display !== 'none') {
                this.startGame();
            }
        });
    }

    showMenu() {
        this.menuElement.style.display = 'flex';
        this.gameArea.style.display = 'none';
        
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

    hideMenu() {
        this.menuElement.style.display = 'none';
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