// Аудио система для игры Арканоид
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.musicEnabled = true;
        this.soundEnabled = true;
        this.backgroundMusic = null;
        this.currentNote = 0;
        this.musicInterval = null;
        
        this.initAudio();
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Пытаемся активировать аудио контекст
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        } catch (e) {
            console.log('Web Audio API не поддерживается');
        }
    }

    // Генерация тона для звуковых эффектов
    createTone(frequency, duration, type = 'sine') {
        if (!this.audioContext || !this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Генерация тона для музыки
    createMusicTone(frequency, duration, type = 'sine') {
        if (!this.audioContext || !this.musicEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Звук разрушения блока
    playBlockDestroy() {
        const frequencies = [523, 659, 784, 1047]; // C, E, G, C
        const randomFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
        this.createTone(randomFreq, 0.1, 'square');
    }

    // Звук отскока шарика
    playBallBounce() {
        this.createTone(440, 0.05, 'sine'); // A4
    }

    // Звук потери жизни
    playLifeLost() {
        const frequencies = [220, 196, 174]; // A3, G3, F3
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.2, 'sawtooth');
            }, index * 100);
        });
    }

    // Грустный звук Game Over
    playGameOver() {
        // Создаем грустную нисходящую мелодию
        const sadMelody = [
            { freq: 440, duration: 0.4 }, // A4
            { freq: 415, duration: 0.4 }, // Ab4
            { freq: 392, duration: 0.4 }, // G4
            { freq: 370, duration: 0.4 }, // F#4
            { freq: 349, duration: 0.4 }, // F4
            { freq: 330, duration: 0.4 }, // E4
            { freq: 311, duration: 0.4 }, // Eb4
            { freq: 294, duration: 0.8 }  // D4
        ];
        
        // Воспроизводим грустную мелодию
        sadMelody.forEach((note, index) => {
            setTimeout(() => {
                this.createTone(note.freq, note.duration, 'sawtooth');
            }, index * 400);
        });
        
        // Добавляем низкий гудящий звук в конце
        setTimeout(() => {
            this.createTone(110, 1.5, 'sine'); // A2 - низкий звук
        }, 3200);
    }

    // Звук победы
    playVictory() {
        const victoryMelody = [
            { freq: 523, duration: 0.3 }, // C
            { freq: 659, duration: 0.3 }, // E
            { freq: 784, duration: 0.3 }, // G
            { freq: 1047, duration: 0.6 }, // C
            { freq: 784, duration: 0.3 }, // G
            { freq: 1047, duration: 0.6 }  // C
        ];
        
        victoryMelody.forEach((note, index) => {
            setTimeout(() => {
                this.createTone(note.freq, note.duration, 'sine');
            }, index * 300);
        });
    }

    // Звук аплодисментов
    playApplause() {
        if (!this.audioContext || !this.soundEnabled) return;
        
        // Создаем серию хлопков в стиле аплодисментов
        const applauseNotes = [
            { freq: 150, duration: 0.1 },
            { freq: 200, duration: 0.1 },
            { freq: 180, duration: 0.1 },
            { freq: 220, duration: 0.1 },
            { freq: 160, duration: 0.1 },
            { freq: 190, duration: 0.1 },
            { freq: 170, duration: 0.1 },
            { freq: 210, duration: 0.1 }
        ];
        
        // Воспроизводим аплодисменты в течение 3 секунд
        for (let i = 0; i < 24; i++) {
            setTimeout(() => {
                const note = applauseNotes[i % applauseNotes.length];
                // Добавляем случайность в частоту для более реалистичного звука
                const randomFreq = note.freq + (Math.random() - 0.5) * 50;
                this.createTone(randomFreq, note.duration, 'square');
            }, i * 125); // Хлопки каждые 125мс
        }
        
        // Добавляем дополнительные случайные хлопки
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const randomFreq = 100 + Math.random() * 200;
                this.createTone(randomFreq, 0.08, 'square');
            }, Math.random() * 3000); // В течение 3 секунд
        }
    }

    // Фоновая музыка для игры
    startBackgroundMusic() {
        if (!this.audioContext || !this.musicEnabled) return;
        
        this.stopBackgroundMusic();
        
        const melody = [
            { freq: 262, duration: 0.4 }, // C
            { freq: 330, duration: 0.4 }, // E
            { freq: 392, duration: 0.4 }, // G
            { freq: 523, duration: 0.8 }, // C
            { freq: 392, duration: 0.4 }, // G
            { freq: 330, duration: 0.4 }, // E
            { freq: 262, duration: 0.8 }, // C
            { freq: 330, duration: 0.4 }, // E
            { freq: 392, duration: 0.4 }, // G
            { freq: 523, duration: 0.8 }, // C
            { freq: 659, duration: 0.4 }, // E
            { freq: 523, duration: 0.8 }  // C
        ];
        
        this.currentNote = 0;
        this.musicInterval = setInterval(() => {
            if (this.currentNote >= melody.length) {
                this.currentNote = 0;
            }
            
            const note = melody[this.currentNote];
            this.createMusicTone(note.freq, note.duration, 'triangle');
            this.currentNote++;
        }, 400);
    }

    // Веселая музыка для меню
    startMenuMusic() {
        if (!this.audioContext || !this.musicEnabled) return;
        
        this.stopBackgroundMusic();
        
        // Веселая мелодия в стиле 8-bit
        const menuMelody = [
            { freq: 523, duration: 0.3 }, // C5
            { freq: 659, duration: 0.3 }, // E5
            { freq: 784, duration: 0.3 }, // G5
            { freq: 1047, duration: 0.6 }, // C6
            { freq: 784, duration: 0.3 }, // G5
            { freq: 659, duration: 0.3 }, // E5
            { freq: 523, duration: 0.6 }, // C5
            { freq: 440, duration: 0.3 }, // A4
            { freq: 523, duration: 0.3 }, // C5
            { freq: 659, duration: 0.3 }, // E5
            { freq: 784, duration: 0.6 }, // G5
            { freq: 659, duration: 0.3 }, // E5
            { freq: 523, duration: 0.3 }, // C5
            { freq: 440, duration: 0.3 }, // A4
            { freq: 392, duration: 0.3 }, // G4
            { freq: 440, duration: 0.6 }, // A4
            { freq: 523, duration: 0.3 }, // C5
            { freq: 659, duration: 0.3 }, // E5
            { freq: 784, duration: 0.3 }, // G5
            { freq: 1047, duration: 0.6 }, // C6
            { freq: 1175, duration: 0.3 }, // D6
            { freq: 1047, duration: 0.6 }  // C6
        ];
        
        this.currentNote = 0;
        this.musicInterval = setInterval(() => {
            if (this.currentNote >= menuMelody.length) {
                this.currentNote = 0;
            }
            
            const note = menuMelody[this.currentNote];
            // Используем разные типы волн для более веселого звука
            const waveType = this.currentNote % 3 === 0 ? 'square' : 'triangle';
            this.createMusicTone(note.freq, note.duration, waveType);
            this.currentNote++;
        }, 300); // Более быстрый темп для веселой музыки
    }

    stopBackgroundMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }

    // Переключение музыки
    toggleMusic() {
        this.toggleMusicOnly();
    }

    // Переключение звуков
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.updateSoundButton();
    }

    // Переключение только музыки
    toggleMusicOnly() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            // Проверяем, в меню мы или в игре
            const menuElement = document.getElementById('gameMenu');
            if (menuElement && menuElement.style.display !== 'none') {
                // В меню - не запускаем автоматически, пользователь сам нажмет кнопку
            } else {
                this.startBackgroundMusic();
            }
        } else {
            this.stopBackgroundMusic();
        }
        this.updateMusicButton();
        
        // Обновляем кнопку в меню если она существует
        if (typeof gameMenu !== 'undefined' && gameMenu.restoreMenuMusic) {
            gameMenu.restoreMenuMusic();
        }
    }

    // Обновление кнопки музыки
    updateMusicButton() {
        const musicBtn = document.getElementById('musicBtn');
        if (musicBtn) {
            musicBtn.textContent = this.musicEnabled ? '🎵 Музыка ВКЛ' : '🔇 Музыка ВЫКЛ';
        }
    }

    // Обновление кнопки звуков
    updateSoundButton() {
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            soundBtn.textContent = this.soundEnabled ? '🔊 Эффекты ВКЛ' : '🔇 Эффекты ВЫКЛ';
        }
    }

    // Создание элементов управления
    createControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            z-index: 1001;
        `;

        const musicBtn = document.createElement('button');
        musicBtn.id = 'musicBtn';
        musicBtn.textContent = '🎵 Музыка ВКЛ';
        musicBtn.onclick = () => this.toggleMusic();
        musicBtn.style.cssText = `
            padding: 8px 12px;
            border: none;
            border-radius: 5px;
            background: #4CAF50;
            color: white;
            cursor: pointer;
            font-size: 12px;
            font-family: Arial, sans-serif;
        `;

        const soundBtn = document.createElement('button');
        soundBtn.id = 'soundBtn';
        soundBtn.textContent = '🔊 Эффекты ВКЛ';
        soundBtn.onclick = () => this.toggleSound();
        soundBtn.style.cssText = `
            padding: 8px 12px;
            border: none;
            border-radius: 5px;
            background: #2196F3;
            color: white;
            cursor: pointer;
            font-size: 12px;
            font-family: Arial, sans-serif;
        `;

        controlsDiv.appendChild(musicBtn);
        controlsDiv.appendChild(soundBtn);
        document.body.appendChild(controlsDiv);
    }
}

// Создание глобального экземпляра аудио менеджера
const audioManager = new AudioManager();

// Инициализация после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    audioManager.createControls();
    
    // Просто активируем аудио контекст при загрузке
    if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
        audioManager.audioContext.resume();
    }
}); 