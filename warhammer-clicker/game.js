let score = 0;
let clickPower = 1;
let upgradeLevel = 0;
const upgradeBaseCost = 50;

let currentHero = 'guardsman';
let komissarBought = false;

const scoreElem = document.getElementById('score');
const characterElem = document.getElementById('character');
const upgradeBtn = document.getElementById('upgrade-click');
const buyKomissarBtn = document.getElementById('buy-komissar');
const heroGuardsmanCard = document.getElementById('hero-guardsman');
const heroKomissarCard = document.getElementById('hero-komissar');

function updateUI() {
    scoreElem.textContent = `Очки: ${score}`;
    const nextCost = upgradeBaseCost + upgradeLevel * 50;
    upgradeBtn.textContent = `+1 клик (${nextCost} очков)`;
    upgradeBtn.disabled = score < nextCost;

    // Покупка комиссара
    if (!komissarBought && currentHero === 'guardsman' && score >= 1000) {
        buyKomissarBtn.disabled = false;
    } else {
        buyKomissarBtn.disabled = true;
    }
    // Стилизация карточек
    if (currentHero === 'guardsman') {
        heroGuardsmanCard.classList.add('selected');
        heroKomissarCard.classList.remove('selected');
    } else {
        heroGuardsmanCard.classList.remove('selected');
        heroKomissarCard.classList.add('selected');
    }
    // Статус комиссара
    if (komissarBought) {
        buyKomissarBtn.style.display = 'none';
        heroKomissarCard.querySelector('.hero-status')?.remove();
        const status = document.createElement('div');
        status.className = 'hero-status';
        status.textContent = 'Куплен';
        heroKomissarCard.appendChild(status);
    }
}

characterElem.addEventListener('click', () => {
    score += clickPower;
    updateUI();
});

upgradeBtn.addEventListener('click', () => {
    const nextCost = upgradeBaseCost + upgradeLevel * 50;
    if (score >= nextCost) {
        score -= nextCost;
        clickPower += 1;
        upgradeLevel += 1;
        updateUI();
    }
});

buyKomissarBtn.addEventListener('click', () => {
    if (!komissarBought && currentHero === 'guardsman' && score >= 1000) {
        score -= 1000;
        komissarBought = true;
        currentHero = 'komissar';
        characterElem.src = 'sprites/komissar.gif';
        characterElem.alt = 'Комиссар';
        updateUI();
    }
});

updateUI();
