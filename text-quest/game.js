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
    let gnomeInteracted = false; // Флаг для однократного взаимодействия с гномом
    let inventory = [];
    const MAX_ITEMS = 20;
    let coins = 0;
    let currentLocation = 'city'; // Новая переменная: стартовая локация — город
    let fortChiefQuestAccepted = false;
    let fortChiefQuestCompleted = false;
    let fortChiefInteracted = false;
    let goblinsDefeated = false;

    function getInitialInventory(char) {
        if (char === 'warrior') {
            return [
                { name: 'Лёгкая броня', desc: '-1 к получаемому урону' },
                { name: 'Хлипкий меч', desc: '1 урона за удар' },
                { name: 'Щит', desc: '-1 к получаемому урону в бою при защите' }
            ];
        } else if (char === 'archer') {
            return [
                { name: 'Короткий лук', desc: '1 к урону за атаку, дальность 4 клетки (не может атаковать вблизи)' },
                { name: 'Стрелы', desc: '10 стрел', count: 10 },
            ];
        } else if (char === 'mage') {
            return [
                { name: 'Посох', desc: '1 урон за атаку' }
            ];
        }
        return [];
    }

    function countInventoryItems(inv) {
        let count = 0;
        for (const item of inv) {
            if (item.name === 'Стрелы') {
                count += Math.ceil(item.count / 10); // 10 стрел = 1 предмет
            } else {
                count++;
            }
        }
        return count;
    }

    function renderInventory() {
        const modal = document.getElementById('inventory-modal');
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';
        if (inventory.length === 0) {
            list.textContent = 'Инвентарь пуст.';
        } else {
            inventory.forEach(item => {
                if (item.name === 'Стрелы') {
                    const stack = Math.ceil(item.count / 10);
                    for (let i = 0; i < stack; i++) {
                        const arrows = (i === stack - 1) ? (item.count - i * 10) : 10;
                        const div = document.createElement('div');
                        div.textContent = `${item.name}: ${arrows} шт.`;
                        list.appendChild(div);
                    }
                } else {
                    const div = document.createElement('div');
                    div.textContent = `${item.name}${item.desc ? ' (' + item.desc + ')' : ''}`;
                    list.appendChild(div);
                }
            });
        }
        const countDiv = document.createElement('div');
        countDiv.style.marginTop = '12px';
        countDiv.style.fontSize = '0.95em';
        countDiv.textContent = `Всего предметов: ${countInventoryItems(inventory)} / ${MAX_ITEMS}`;
        list.appendChild(countDiv);
        modal.style.display = 'block';
    }

    function setInitialCoins(char) {
        if (char === 'warrior' || char === 'archer') return 10;
        if (char === 'mage') return 5;
        return 0;
    }

    function updateCoinsBar() {
        document.getElementById('coins-value').textContent = coins;
    }

    document.getElementById('inventory-btn').onclick = function() {
        renderInventory();
    };
    document.getElementById('close-inventory').onclick = function() {
        document.getElementById('inventory-modal').style.display = 'none';
    };

    const characterBtn = document.getElementById('character-btn');
    const characterModal = document.getElementById('character-modal');
    const charNameInput = document.getElementById('char-name-input');
    const mainEquipSelect = document.getElementById('main-equip-select');
    const extraEquipSelect = document.getElementById('extra-equip-select');
    const saveCharacterBtn = document.getElementById('save-character');
    const closeCharacterBtn = document.getElementById('close-character');

    let characterName = 'Герой';
    let mainEquip = null;
    let extraEquip = null;

    characterBtn.onclick = function() {
        renderCharacterModal();
        characterModal.style.display = 'block';
    };
    closeCharacterBtn.onclick = function() {
        characterModal.style.display = 'none';
    };

    function renderCharacterModal() {
        charNameInput.value = characterName;
        // Список экипировки (без молотка)
        const availableItems = inventory.filter(item => item.name !== 'Молоток');
        mainEquipSelect.innerHTML = '';
        extraEquipSelect.innerHTML = '';
        availableItems.forEach(item => {
            const opt1 = document.createElement('option');
            opt1.value = item.name;
            opt1.textContent = item.name + (item.desc ? ' (' + item.desc + ')' : '');
            mainEquipSelect.appendChild(opt1);
            const opt2 = document.createElement('option');
            opt2.value = item.name;
            opt2.textContent = item.name + (item.desc ? ' (' + item.desc + ')' : '');
            extraEquipSelect.appendChild(opt2);
        });
        if (mainEquip) mainEquipSelect.value = mainEquip;
        if (extraEquip) extraEquipSelect.value = extraEquip;
    }

    saveCharacterBtn.onclick = function() {
        characterName = charNameInput.value.trim() || 'Герой';
        mainEquip = mainEquipSelect.value;
        extraEquip = extraEquipSelect.value;
        characterModal.style.display = 'none';
    };

    function addChat(text) {
        chatWindow.innerHTML += `<div>${text.replace(/\{name\}/g, characterName)}</div>`;
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Структура NPC на локации
    const locations = {
        city: {
            npcs: [
                { id: 'gnome', name: 'Гном', interacted: () => gnomeInteracted },
                { id: 'fort-chief', name: 'Начальник форта', interacted: () => fortChiefQuestCompleted },
            ]
        },
        // Пример для других локаций
        forest: { npcs: [] },
        village: { npcs: [] },
        mountains: { npcs: [] },
        cave: { npcs: [] }
    };

    function getCurrentNpcs() {
        return locations[currentLocation]?.npcs || [];
    }

    function showInteractionButtons() {
        gameArea.innerHTML = '';
        const npcs = getCurrentNpcs().filter(npc => !npc.interacted || !npc.interacted());
        const interactBtn = document.createElement('button');
        interactBtn.textContent = 'Взаимодействие';
        interactBtn.className = 'action-btn';
        interactBtn.onclick = function() {
            if (npcs.length > 1) {
                showNpcModal(npcs);
            } else if (npcs.length === 1) {
                onInteract(npcs[0]);
            } else {
                addChat('Здесь не с кем взаимодействовать.');
            }
        };
        if (npcs.length === 1 && npcs[0].interacted && npcs[0].interacted()) {
            interactBtn.disabled = true;
        }
        const moveBtn = document.createElement('button');
        moveBtn.textContent = 'Движение';
        moveBtn.className = 'action-btn';
        moveBtn.onclick = onMove;
        gameArea.appendChild(interactBtn);
        gameArea.appendChild(moveBtn);
        if (currentLocation === 'city') {
            const marketBtn = document.createElement('button');
            marketBtn.textContent = 'Рынок';
            marketBtn.className = 'action-btn';
            marketBtn.onclick = showMarketWindow;
            gameArea.appendChild(marketBtn);
        }
    }

    function showNpcModal(npcs) {
        const npcModal = document.getElementById('npc-modal');
        const npcListDiv = document.getElementById('npc-list');
        npcListDiv.innerHTML = '';
        npcs.forEach(npc => {
            const btn = document.createElement('button');
            btn.textContent = npc.name;
            btn.className = 'action-btn';
            btn.onclick = function() {
                npcModal.style.display = 'none';
                onInteract(npc);
            };
            npcListDiv.appendChild(btn);
        });
        document.getElementById('close-npc-modal').onclick = function() {
            npcModal.style.display = 'none';
        };
        npcModal.style.display = 'flex';
    }

    function onInteract(npc) {
        if (inRepair || (npc && npc.id === 'gnome' && gnomeInteracted)) return;
        if (npc && npc.id === 'gnome') {
            addChat('Вас приветствует гном и просит помочь починить его повозку.');
            showHelpChoice();
        } else if (npc && npc.id === 'fort-chief') {
            showFortChiefDialog();
        } else if (npc && npc.id === 'goblins') {
            if (fortChiefQuestAccepted && !goblinsDefeated) {
                startGoblinBattle();
            } else {
                addChat('В лесу тихо, гоблинов не видно.');
            }
        } else {
            addChat('Пока нет сценария для этого персонажа.');
        }
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
                    gnomeInteracted = true;
                    // Добавить молоток в инвентарь, если есть место
                    if (countInventoryItems(inventory) < MAX_ITEMS) {
                        inventory.push({ name: 'Молоток', desc: 'Можно использовать для починки или в квестах' });
                        addChat('Вы получили: Молоток!');
                    } else {
                        addChat('Инвентарь полон, вы не можете взять молоток.');
                    }
                    showInteractionButtons(); // Обновить кнопки
                }
            }, 1000);
        };
        const noBtn = document.createElement('button');
        noBtn.textContent = 'Нет';
        noBtn.className = 'action-btn';
        noBtn.onclick = function() {
            addChat('Гном разочарован: "Жаль, что ты бросаешь меня в беде..."');
            choiceDiv.remove();
            gnomeInteracted = true;
            showInteractionButtons(); // Обновить кнопки
        };
        choiceDiv.appendChild(yesBtn);
        choiceDiv.appendChild(noBtn);
        chatWindow.appendChild(choiceDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function showFortChiefDialog() {
        if (!fortChiefQuestAccepted) {
            addChat(`Начальник форта: "${characterName}, у меня есть задание для тебя. Пойдёшь поохотиться на гоблинов в лесу за награду?"`);
            const choiceDiv = document.createElement('div');
            choiceDiv.style.marginTop = '16px';
            const yesBtn = document.createElement('button');
            yesBtn.textContent = 'Принять';
            yesBtn.className = 'action-btn';
            yesBtn.onclick = function() {
                fortChiefQuestAccepted = true;
                // Добавляем гоблинов в лес, если их ещё нет
                if (!locations.forest.npcs.some(npc => npc.id === 'goblins')) {
                    locations.forest.npcs.push({
                        id: 'goblins',
                        name: 'Гоблины',
                        interacted: () => !fortChiefQuestAccepted || goblinsDefeated
                    });
                }
                addChat('Начальник форта: "Отлично! Направляйся в лес и разберись с гоблинами."');
                choiceDiv.remove();
            };
            const noBtn = document.createElement('button');
            noBtn.textContent = 'Отказаться';
            noBtn.className = 'action-btn';
            noBtn.onclick = function() {
                addChat('Начальник форта: "Зачем ты тогда подошёл?"');
                choiceDiv.remove();
            };
            choiceDiv.appendChild(yesBtn);
            choiceDiv.appendChild(noBtn);
            chatWindow.appendChild(choiceDiv);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        } else if (!goblinsDefeated) {
            addChat(`Начальник форта: "${characterName}, задание в силе. Гоблины всё ещё в лесу!"`);
        } else if (!fortChiefQuestCompleted) {
            addChat('Начальник форта: "Ты отлично справился! Вот твоя награда — 10 монет. Спасибо за службу!"');
            coins += 10;
            updateCoinsBar();
            fortChiefQuestCompleted = true;
            // Делаем начальника форта недоступным для взаимодействия
            const idx = locations.city.npcs.findIndex(npc => npc.id === 'fort-chief');
            if (idx !== -1) locations.city.npcs.splice(idx, 1);
        } else {
            addChat('Начальник форта больше не доступен для взаимодействия.');
        }
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
                currentLocation = loc.id; // Сохраняем текущую локацию
                document.body.removeChild(moveModal);
                moveModal = null;
                showInteractionButtons(); // Обновляем кнопки после перемещения
            };
            box.appendChild(btn);
        });
        moveModal.appendChild(box);
        document.body.appendChild(moveModal);
    }

    function showMarketWindow() {
        // Удаляем предыдущее окно рынка, если оно есть
        let oldModal = document.getElementById('market-modal');
        if (oldModal) oldModal.remove();
        const modal = document.createElement('div');
        modal.id = 'market-modal';
        modal.style.position = 'fixed';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.7)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '1000';
        const box = document.createElement('div');
        box.style.background = '#232526';
        box.style.padding = '32px 24px';
        box.style.borderRadius = '16px';
        box.style.boxShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.37)';
        box.style.textAlign = 'center';
        box.style.minWidth = '320px';
        const title = document.createElement('div');
        title.textContent = 'Рынок';
        title.style.fontSize = '1.3rem';
        title.style.marginBottom = '18px';
        box.appendChild(title);
        // Ассортимент
        const goods = [
            { name: 'Молоток', desc: '', price: 5, class: 'all' },
            { name: 'Средний меч', desc: '2 урона за удар', price: 50, class: 'warrior' },
            { name: 'Средний лук', desc: '2 урона за выстрел, дальность 5 клеток', price: 65, class: 'archer' },
            { name: 'Стрелы (10 шт.)', desc: '', price: 10, class: 'archer' },
            { name: 'Посох мага', desc: '2 урона за удар', price: 50, class: 'mage' },
            { name: 'Волшебная палочка', desc: '+1 урона к маг атакам', price: 50, class: 'mage' },
        ];
        goods.forEach(item => {
            if (item.class !== 'all' && item.class !== player) return;
            const row = document.createElement('div');
            row.style.margin = '10px 0';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            const info = document.createElement('span');
            info.textContent = item.name + (item.desc ? ' (' + item.desc + ')' : '') + ' — ' + item.price + ' монет';
            row.appendChild(info);
            const buyBtn = document.createElement('button');
            buyBtn.textContent = 'Купить';
            buyBtn.className = 'action-btn';
            buyBtn.style.marginLeft = '12px';
            buyBtn.onclick = function() {
                if (coins < item.price) {
                    addChat('Недостаточно монет для покупки.');
                    return;
                }
                if (countInventoryItems(inventory) >= MAX_ITEMS && item.name !== 'Стрелы (10 шт.)') {
                    addChat('Инвентарь полон, вы не можете купить этот предмет.');
                    return;
                }
                // Проверка на уникальность оружия (меч, лук, посох)
                if ([
                    'Средний меч', 'Средний лук', 'Посох мага', 'Волшебная палочка'
                ].includes(item.name)) {
                    if (inventory.some(i => i.name === item.name)) {
                        addChat('У вас уже есть этот предмет.');
                        return;
                    }
                }
                // Покупка
                coins -= item.price;
                updateCoinsBar();
                if (item.name === 'Стрелы (10 шт.)') {
                    let arrows = inventory.find(i => i.name === 'Стрелы');
                    if (arrows) {
                        arrows.count = (arrows.count || 0) + 10;
                    } else {
                        inventory.push({ name: 'Стрелы', desc: '10 стрел', count: 10 });
                    }
                    addChat('Вы купили 10 стрел.');
                } else if (item.name === 'Молоток') {
                    inventory.push({ name: 'Молоток', desc: 'Можно использовать для починки или в квестах' });
                    addChat('Вы купили молоток.');
                } else if (item.name === 'Средний меч') {
                    inventory.push({ name: 'Средний меч', desc: '2 урона за удар' });
                    addChat('Вы купили средний меч.');
                } else if (item.name === 'Средний лук') {
                    inventory.push({ name: 'Средний лук', desc: '2 урона за выстрел, дальность 5 клеток' });
                    addChat('Вы купили средний лук.');
                } else if (item.name === 'Посох мага') {
                    inventory.push({ name: 'Посох мага', desc: '2 урона за удар' });
                    addChat('Вы купили посох мага.');
                } else if (item.name === 'Волшебная палочка') {
                    inventory.push({ name: 'Волшебная палочка', desc: '+1 урона к маг атакам' });
                    addChat('Вы купили волшебную палочку.');
                }
                renderInventory();
            };
            row.appendChild(buyBtn);
            box.appendChild(row);
        });
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Закрыть';
        closeBtn.className = 'action-btn';
        closeBtn.style.marginTop = '18px';
        closeBtn.onclick = function() {
            modal.remove();
        };
        box.appendChild(closeBtn);
        modal.appendChild(box);
        document.body.appendChild(modal);
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
            inventory = getInitialInventory(player);
            coins = setInitialCoins(player);
            document.getElementById('coins-bar').style.display = '';
            updateCoinsBar();
            showInteractionButtons();
        };
    });

    function startGoblinBattle() {
        // Создаём модальное окно битвы
        let battleModal = document.getElementById('battle-modal');
        if (!battleModal) {
            battleModal = document.createElement('div');
            battleModal.id = 'battle-modal';
            battleModal.style.position = 'fixed';
            battleModal.style.left = '0';
            battleModal.style.top = '0';
            battleModal.style.width = '100vw';
            battleModal.style.height = '100vh';
            battleModal.style.background = '#232526';
            battleModal.style.zIndex = '3000';
            battleModal.style.display = 'flex';
            battleModal.style.alignItems = 'center';
            battleModal.style.justifyContent = 'center';
            battleModal.innerHTML = '<div id="battle-content" style="background:#181a1b; border-radius:16px; padding:32px; min-width:400px; min-height:400px; box-shadow:0 8px 32px 0 rgba(31,38,135,0.37);"></div>';
            document.body.appendChild(battleModal);
        }
        battleModal.style.display = 'flex';
        runGoblinBattle();
    }

    function runGoblinBattle() {
        const rows = 5, cols = 7;
        let playerHP = 3;
        let goblins = [];
        let playerPos = null;
        let turn = 'player';
        let message = '';
        // Генерируем стартовые позиции гоблинов
        goblins = [
            { hp: 1, pos: randomEmptyCell([], rows, cols) },
            { hp: 1, pos: randomEmptyCell([], rows, cols) }
        ];
        // Выбор стартовой клетки игрока
        renderBattleGrid();
        setBattleMessage('Выберите стартовую клетку в левом ряду');

        function randomEmptyCell(occupied, r, c) {
            let pos;
            do {
                pos = { x: Math.floor(Math.random()*r), y: 0 };
            } while (occupied.some(o => o.x === pos.x && o.y === pos.y));
            return pos;
        }

        function renderBattleGrid() {
            const content = document.getElementById('battle-content');
            content.innerHTML = '';
            const grid = document.createElement('div');
            grid.style.display = 'grid';
            grid.style.gridTemplateRows = `repeat(${rows}, 48px)`;
            grid.style.gridTemplateColumns = `repeat(${cols}, 48px)`;
            grid.style.gap = '4px';
            for (let x = 0; x < rows; x++) {
                for (let y = 0; y < cols; y++) {
                    const cell = document.createElement('div');
                    cell.style.width = '44px';
                    cell.style.height = '44px';
                    cell.style.background = '#2e3336';
                    cell.style.borderRadius = '8px';
                    cell.style.display = 'flex';
                    cell.style.alignItems = 'center';
                    cell.style.justifyContent = 'center';
                    cell.style.position = 'relative';
                    // Гоблины
                    const goblinHere = goblins.find(g => g.pos.x === x && g.pos.y === y && g.hp > 0);
                    if (goblinHere) {
                        const gob = document.createElement('div');
                        gob.style.width = '32px';
                        gob.style.height = '32px';
                        gob.style.background = 'green';
                        gob.style.borderRadius = '50%';
                        gob.style.border = '2px solid #0f0';
                        gob.title = 'Гоблин';
                        cell.appendChild(gob);
                    }
                    // Игрок
                    if (playerPos && playerPos.x === x && playerPos.y === y) {
                        const hero = document.createElement('div');
                        hero.style.width = '32px';
                        hero.style.height = '32px';
                        hero.style.background = '#ffd700';
                        hero.style.borderRadius = '50%';
                        hero.style.border = '2px solid #fff';
                        hero.title = 'Вы';
                        cell.appendChild(hero);
                    }
                    // Клик по клетке для выбора старта
                    if (!playerPos && y === 0) {
                        cell.style.cursor = 'pointer';
                        cell.onclick = () => {
                            playerPos = { x, y };
                            renderBattleGrid();
                            setTimeout(playerTurn, 300);
                        };
                    }
                    grid.appendChild(cell);
                }
            }
            content.appendChild(grid);
            // Панель состояния
            const status = document.createElement('div');
            status.style.marginTop = '16px';
            status.innerHTML = `<b>Здоровье:</b> ${playerHP} / 3`;
            content.appendChild(status);
            // Сообщение
            const msg = document.createElement('div');
            msg.id = 'battle-message';
            msg.style.marginTop = '12px';
            msg.style.minHeight = '32px';
            msg.style.color = '#fff';
            msg.textContent = message;
            content.appendChild(msg);
        }

        function setBattleMessage(msg) {
            message = msg;
            const m = document.getElementById('battle-message');
            if (m) m.textContent = msg;
        }

        function playerTurn() {
            turn = 'player';
            setBattleMessage('Ваш ход: выберите действие.');
            renderBattleGrid();
            // Клик по соседним клеткам — движение, по гоблину — атака
            const content = document.getElementById('battle-content');
            const gridDivs = content.querySelectorAll('div[style*="grid"] > div');
            gridDivs.forEach((cell, idx) => {
                const x = Math.floor(idx / cols);
                const y = idx % cols;
                if (playerPos && isNeighbor(playerPos, { x, y })) {
                    // Гоблин — атака
                    if (goblins.some(g => g.pos.x === x && g.pos.y === y && g.hp > 0)) {
                        cell.style.cursor = 'pointer';
                        cell.onclick = () => {
                            attackGoblin(x, y);
                        };
                    } else if (!goblins.some(g => g.pos.x === x && g.pos.y === y)) {
                        // Пустая клетка — движение
                        cell.style.cursor = 'pointer';
                        cell.onclick = () => {
                            playerPos = { x, y };
                            renderBattleGrid();
                            setTimeout(goblinsTurn, 300);
                        };
                    }
                }
            });
        }

        function isNeighbor(a, b) {
            return Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1 && !(a.x === b.x && a.y === b.y);
        }

        function attackGoblin(x, y) {
            // Урон по основному оружию
            let dmg = 1;
            if (mainEquip) {
                const item = inventory.find(i => i.name === mainEquip);
                if (item && item.desc && item.desc.match(/(\d+)/)) {
                    dmg = parseInt(item.desc.match(/(\d+)/)[1]);
                }
            }
            goblins.forEach(g => {
                if (g.pos.x === x && g.pos.y === y && g.hp > 0) {
                    g.hp -= dmg;
                }
            });
            renderBattleGrid();
            setTimeout(goblinsTurn, 300);
        }

        function goblinsTurn() {
            turn = 'goblins';
            // Атакуют, если рядом
            let attacked = false;
            goblins.forEach(g => {
                if (g.hp > 0 && isNeighbor(g.pos, playerPos)) {
                    playerHP -= 1;
                    attacked = true;
                }
            });
            if (playerHP <= 0) {
                endBattle(false);
                return;
            }
            // Двигаются к игроку, если не атаковали
            goblins.forEach(g => {
                if (g.hp > 0 && !isNeighbor(g.pos, playerPos)) {
                    // Простое приближение
                    if (g.pos.x < playerPos.x) g.pos.x++;
                    else if (g.pos.x > playerPos.x) g.pos.x--;
                    if (g.pos.y < playerPos.y) g.pos.y++;
                    else if (g.pos.y > playerPos.y) g.pos.y--;
                }
            });
            renderBattleGrid();
            setTimeout(checkBattleState, 400);
        }

        function checkBattleState() {
            if (goblins.every(g => g.hp <= 0)) {
                endBattle(true);
            } else {
                playerTurn();
            }
        }

        function endBattle(win) {
            setBattleMessage(win ? 'Вы победили гоблинов!' : 'Вы погибли. Игра окончена.');
            setTimeout(() => {
                document.getElementById('battle-modal').style.display = 'none';
                if (win) {
                    goblinsDefeated = true;
                    addChat('Гоблины побеждены! Возвращайтесь к начальнику форта за наградой.');
                } else {
                    addChat('Вы были убиты гоблинами. Квест провален.');
                    // Можно реализовать рестарт игры
                }
            }, 2000);
        }
    }
}); 