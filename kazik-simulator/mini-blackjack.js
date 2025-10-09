// Мини-игра: Блэкджек
let balance = 1000;
let bet = 50;
let playerCards = [];
let dealerCards = [];
let gameActive = false;

const balanceSpan = document.getElementById('player-balance');
const betInput = document.getElementById('bet-input');
const betBtn = document.getElementById('bet-btn');
const gameArea = document.getElementById('game-area');
const playerCardsSpan = document.getElementById('player-cards');
const dealerCardsSpan = document.getElementById('dealer-cards');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const blackjackMsg = document.getElementById('blackjack-message');
const playerSumSpan = document.getElementById('player-sum');
const dealerSumSpan = document.getElementById('dealer-sum');
const returnBtn = document.getElementById('return-btn');

function updateBalance() {
    balanceSpan.textContent = balance;
}

function isValidBet(val) {
    return val >= 50 && val <= 100 && val % 10 === 0 && val <= balance;
}

betInput.addEventListener('input', () => {
    let v = parseInt(betInput.value);
    if (!isValidBet(v)) betInput.value = 50;
});

betBtn.addEventListener('click', startGame);

function startGame() {
    bet = parseInt(betInput.value);
    if (!isValidBet(bet)) {
        alert('Ставка от 50 до 100 и кратна 10!');
        return;
    }
    balance -= bet;
    syncBalance();
    gameActive = true;
    playerCards = [drawCard(), drawCard()];
    dealerCards = [drawCard(), drawCard()];
    showHands();
    gameArea.style.display = '';
    blackjackMsg.textContent = '';
    betBtn.disabled = true;
}

const cardSuits = ["♠","♥","♦","♣"];
const cardSuitNames = {
  '♠':'spades', '♣':'clubs', '♥':'hearts', '♦':'diamonds'
};
const cardValues = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
function drawCard() {
    const v = cardValues[Math.floor(Math.random()*cardValues.length)];
    const s = cardSuits[Math.floor(Math.random()*cardSuits.length)];
    return {value:v, suit:s};
}
function calcSum(cards) {
    let sum = 0, aces = 0;
    for (let c of cards) {
        if (c.value==='A') { aces++; sum += 11; }
        else if(['K','Q','J'].includes(c.value)) sum += 10;
        else sum += parseInt(c.value);
    }
    while (sum > 21 && aces) { sum -= 10; aces--; }
    return sum;
}
function cardDiv(card, isBack=false) {
    if (isBack) return '<div class="card-back"></div>';
    if (!card || !card.value || !card.suit) return '<div class="card-face"></div>';
    let red = (card.suit==='♥' || card.suit==='♦');
    return `<div class="card-face premium ${red?'red':''}"> <div class="card-corner tl">${card.value}<span>${card.suit}</span></div><div class="card-suit">${card.suit}</div><div class="card-corner br">${card.value}<span>${card.suit}</span></div></div>`;
}
function showHands(showAllDealerCards=false) {
    let dealerDiv = document.getElementById('dealer-cards');
    let playerDiv = document.getElementById('player-cards');
    dealerDiv.innerHTML = '';
    if (!showAllDealerCards) {
        dealerDiv.innerHTML = cardDiv(dealerCards[0]) + cardDiv({}, true);
        dealerSumSpan.textContent = '-';
    } else {
        dealerDiv.innerHTML = dealerCards.map(c=>cardDiv(c)).join('');
        dealerSumSpan.textContent = calcSum(dealerCards);
    }
    playerDiv.innerHTML = playerCards.map(c=>cardDiv(c)).join('');
    playerSumSpan.textContent = calcSum(playerCards);
}

hitBtn.addEventListener('click', () => {
    if (!gameActive) return;
    playerCards.push(drawCard());
    showHands();
    if (calcSum(playerCards) > 21) endGame('Перебор! Вы проиграли.');
});
standBtn.addEventListener('click', dealerTurn);

function dealerTurn() {
    if (!gameActive) return;
    while (calcSum(dealerCards) < 17) dealerCards.push(drawCard());
    showHands(true);
    let playerSum = calcSum(playerCards);
    let dealerSum = calcSum(dealerCards);
    if (dealerSum > 21 || playerSum > dealerSum) endGame('Вы выиграли!');
    else if (playerSum === dealerSum) endGame('Ничья!');
    else endGame('Вы проиграли.');
}

function endGame(msg) {
    gameActive = false;
    blackjackMsg.textContent = msg;
    if (msg === 'Вы выиграли!') balance += bet*2;
    if (msg === 'Ничья!') balance += bet;
    syncBalance();
    betBtn.disabled = false;
    returnBtn.style.display = '';
}

returnBtn.addEventListener('click', () => {
    gameArea.style.display = 'none';
    playerCards = [];
    dealerCards = [];
    returnBtn.style.display = 'none';
    syncBalance();
});

// --- Баланс через localStorage и через пост-сообщения ---
function loadExternalBalance() {
    try {
        let data = JSON.parse(localStorage.getItem('kazik-balance')||'{}');
        if (!data.amount) data.amount = 100;
        balance = data.amount;
    } catch { balance = 1000; }
    updateBalance();
}
function saveExternalBalance() {
    let data = JSON.parse(localStorage.getItem('kazik-balance')||'{}');
    data.amount = balance;
    localStorage.setItem('kazik-balance', JSON.stringify(data));
    // Сообщить о новом балансе во внешнюю страницу
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({type:'blackjack-balance-update', amount: balance}, '*');
    }
}
window.addEventListener('message',function(event){
    if(event.data && event.data.type==="update-balance" && typeof event.data.amount==='number') {
        balance = event.data.amount;
        updateBalance();
    }
});

// в начале мини-игры всегда подгружаем баланс
loadExternalBalance();

// после каждой смены баланса/депа/выигрыша — синхронизируем
function syncBalance() {
    updateBalance();
    saveExternalBalance();
}
