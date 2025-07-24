const quest = [
    {
        text: 'Вы просыпаетесь в темной комнате. Перед вами две двери. Куда пойдёте?',
        choices: [
            { text: 'Влево', next: 1 },
            { text: 'Вправо', next: 2 }
        ]
    },
    {
        text: 'Вы вошли в комнату с сундуком. Открыть его?',
        choices: [
            { text: 'Да', next: 3 },
            { text: 'Нет', next: 4 }
        ]
    },
    {
        text: 'Вы попали в ловушку! Игра окончена.',
        choices: [
            { text: 'Начать сначала', next: 0 }
        ]
    },
    {
        text: 'В сундуке сокровища! Вы победили!',
        choices: [
            { text: 'Сыграть ещё раз', next: 0 }
        ]
    },
    {
        text: 'Вы вернулись обратно. Перед вами снова две двери.',
        choices: [
            { text: 'Влево', next: 1 },
            { text: 'Вправо', next: 2 }
        ]
    }
];

let current = 0;

function render() {
    const q = quest[current];
    document.getElementById('quest-text').textContent = q.text;
    const choicesDiv = document.getElementById('choices');
    choicesDiv.innerHTML = '';
    q.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.textContent = choice.text;
        btn.onclick = () => {
            current = choice.next;
            render();
        };
        choicesDiv.appendChild(btn);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('start-btn');
    const charSelect = document.getElementById('character-select');
    const mainGame = document.getElementById('main-game');
    const chatWindow = document.getElementById('chat-window');
    const gameArea = document.getElementById('game-area');
    let player = null;
    let inRepair = false;
    let moveModal = null;

    function addChat(msg) {
        const p = document.createElement('div');
        p.textContent = msg;
        chatWindow.appendChild(p);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function showInteractionButtons() {
        gameArea.innerHTML = '';
        const interactBtn = document.createElement('button');
        interactBtn.textContent = 'Взаимодействие';
        interactBtn.className = 'action-btn';
        interactBtn.onclick = onInteract;
        const moveBtn = document.createElement('button');
        moveBtn.textContent = 'Движение';
        moveBtn.className = 'action-btn';
        moveBtn.onclick = onMove;
        gameArea.appendChild(interactBtn);
        gameArea.appendChild(moveBtn);
    }

    function onInteract() {
        if (inRepair) return;
        addChat('Вас приветствует гном и просит помочь починить его повозку.');
        showHelpChoice();
    }

    function showHelpChoice() {
        const choiceDiv = document.createElement('div');
        choiceDiv.style.marginTop = '16px';
        const yesBtn = document.createElement('button');
        yesBtn.textContent = 'Да';
        yesBtn.className = 'action-btn';
        yesBtn.onclick = function() {
            addChat('Вы решили помочь гному. Починка займёт 5 секунд...');
            choiceDiv.remove();
            inRepair = true;
            let seconds = 5;
            const timerMsg = document.createElement('div');
            timerMsg.textContent = 'Починка: 5 секунд';
            chatWindow.appendChild(timerMsg);
            const interval = setInterval(() => {
                seconds--;
                timerMsg.textContent = 'Починка: ' + seconds + ' секунд';
                if (seconds === 0) {
                    clearInterval(interval);
                    timerMsg.remove();
                    addChat('Гном благодарит вас и говорит: "Оставь молоток себе, он тебе пригодится!"');
                    inRepair = false;
                }
            }, 1000);
        };
        const noBtn = document.createElement('button');
        noBtn.textContent = 'Нет';
        noBtn.className = 'action-btn';
        noBtn.onclick = function() {
            addChat('Гном разочарован: "Жаль, что ты бросаешь меня в беде..."');
            choiceDiv.remove();
        };
        choiceDiv.appendChild(yesBtn);
        choiceDiv.appendChild(noBtn);
        chatWindow.appendChild(choiceDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function onMove() {
        if (moveModal) return;
        moveModal = document.createElement('div');
        moveModal.style.position = 'fixed';
        moveModal.style.left = '0';
        moveModal.style.top = '0';
        moveModal.style.width = '100vw';
        moveModal.style.height = '100vh';
        moveModal.style.background = 'rgba(0,0,0,0.7)';
        moveModal.style.display = 'flex';
        moveModal.style.alignItems = 'center';
        moveModal.style.justifyContent = 'center';
        moveModal.style.zIndex = '1000';
        const box = document.createElement('div');
        box.style.background = '#232526';
        box.style.padding = '32px 24px';
        box.style.borderRadius = '16px';
        box.style.boxShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.37)';
        box.style.textAlign = 'center';
        const title = document.createElement('div');
        title.textContent = 'Куда идти?';
        title.style.fontSize = '1.3rem';
        title.style.marginBottom = '24px';
        box.appendChild(title);
        const locations = [
            { name: 'Лес', id: 'forest' },
            { name: 'Город', id: 'city' },
            { name: 'Деревня', id: 'village' },
            { name: 'Горы', id: 'mountains' },
            { name: 'Пещера', id: 'cave' }
        ];
        locations.forEach(loc => {
            const btn = document.createElement('button');
            btn.textContent = loc.name;
            btn.className = 'action-btn';
            btn.style.margin = '8px 12px';
            btn.onclick = function() {
                addChat('Вы переместились: ' + loc.name);
                document.body.removeChild(moveModal);
                moveModal = null;
            };
            box.appendChild(btn);
        });
        moveModal.appendChild(box);
        document.body.appendChild(moveModal);
    }

    startBtn.onclick = function() {
        startBtn.style.display = 'none';
        charSelect.style.display = '';
    };

    document.querySelectorAll('.char-btn').forEach(btn => {
        btn.onclick = function() {
            player = btn.dataset.char;
            charSelect.style.display = 'none';
            mainGame.style.display = 'flex';
            gameArea.textContent = '';
            chatWindow.innerHTML = '';
            addChat('Вы выбрали персонажа: ' + (player === 'warrior' ? 'Воин' : player === 'archer' ? 'Лучник' : 'Маг'));
            addChat('Игра началась!');
            showInteractionButtons();
        };
    });
}); 