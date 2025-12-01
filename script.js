// === Estado do Jogo ===
let score = 0;
let money = 100;
let planesInAir = 0;
let nextPlaneId = 1;
let refuelTime = 5000;
let maxLandingPlanes = 1;
let currentLandingPlanes = 0;
let goldenPlaneUnlocked = false; // Novo: controla se o avião dourado está disponível

const spotIds = [
  'U1','U2','U3','U4','U5','U6','U7','U8','U9','U10',
  'L1','L2','L3','L4','L5','L6','L7','L8','L9','L10'
];
const parkingSpots = {};
spotIds.forEach(id => parkingSpots[id] = null);

const el = {
  score: document.getElementById('score'),
  inAir: document.getElementById('inAir'),
  freeSpots: document.getElementById('freeSpots'),
  money: document.getElementById('money'),
  landingRunway: document.getElementById('landingRunway'),
  takeoffRunway: document.getElementById('takeoffRunway')
};

function updateStats() {
  el.score.textContent = score;
  el.inAir.textContent = planesInAir;
  el.money.textContent = money;
  const free = Object.values(parkingSpots).filter(s => s === null).length;
  el.freeSpots.textContent = free;
}

function findFreeSpot() {
  for (const id of spotIds) {
    if (parkingSpots[id] === null) return id;
  }
  return null;
}

function moveElement(element, fromRect, toRect, duration = 3000) {
  return new Promise((resolve) => {
    const startX = fromRect.left + fromRect.width / 2;
    const startY = fromRect.top + fromRect.height / 2;
    const endX = toRect.left + toRect.width / 2;
    const endY = toRect.top + toRect.height / 2;

    element.style.position = 'fixed';
    element.style.left = startX + 'px';
    element.style.top = startY + 'px';
    element.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
    document.body.appendChild(element);

    setTimeout(() => {
      element.style.left = endX + 'px';
      element.style.top = endY + 'px';
    }, 10);

    setTimeout(() => {
      element.remove();
      resolve();
    }, duration);
  });
}

// === Pouso automático (pode gerar avião dourado se desbloqueado) ===
async function autoLandPlane() {
  if (currentLandingPlanes >= maxLandingPlanes) return;
  const spotId = findFreeSpot();
  if (!spotId) return;

  currentLandingPlanes++;
  const planeId = nextPlaneId++;
  planesInAir++;
  updateStats();

  // Decidir se é avião dourado (só se desbloqueado)
  const isGolden = goldenPlaneUnlocked && Math.random() < 0.3; // 30% de chance após desbloqueio

  const planeEl = document.createElement('div');
  planeEl.className = `tug ${isGolden ? 'gold' : ''}`;
  planeEl.textContent = '✈️';
  const landingRect = el.landingRunway.getBoundingClientRect();

  planeEl.style.left = (landingRect.right + 150) + 'px';
  planeEl.style.top = (landingRect.top + landingRect.height / 2 - 12) + 'px';
  document.body.appendChild(planeEl);

  setTimeout(() => {
    planeEl.style.transition = 'left 2s ease-out';
    planeEl.style.left = (landingRect.left - 60) + 'px';
  }, 100);

  await new Promise(r => setTimeout(r, 2100));

  const spotEl = document.querySelector(`.spot[data-id="${spotId}"]`);
  const spotRect = spotEl.getBoundingClientRect();
  await moveElement(planeEl, landingRect, spotRect, 2500);

  parkingSpots[spotId] = { planeId, status: 'parked', isGolden };
  spotEl.classList.add('occupied');
  currentLandingPlanes--;

  setTimeout(() => {
    if (parkingSpots[spotId]?.status === 'parked') {
      spotEl.classList.remove('occupied');
      spotEl.classList.add('refueling');
      parkingSpots[spotId].status = 'refueling';

      setTimeout(() => {
        if (parkingSpots[spotId]) {
          spotEl.classList.remove('refueling');
          spotEl.classList.add('occupied');
          parkingSpots[spotId].status = 'ready';
          prepareForTakeoff(spotId);
        }
      }, refuelTime);
    }
  }, 1500);
}

async function prepareForTakeoff(spotId) {
  const spotEl = document.querySelector(`.spot[data-id="${spotId}"]`);
  const spotData = parkingSpots[spotId];
  if (!spotData || spotData.status !== 'ready') return;

  const spotRect = spotEl.getBoundingClientRect();
  const takeoffRect = el.takeoffRunway.getBoundingClientRect();

  const planeEl = document.createElement('div');
  planeEl.className = `tug ${spotData.isGolden ? 'gold' : ''}`;
  planeEl.textContent = '✈️';

  await moveElement(planeEl, spotRect, takeoffRect, 3000);

  setTimeout(() => {
    planeEl.remove();
    spotEl.classList.remove('occupied');
    parkingSpots[spotId] = null;
    
    // Bônus maior para avião dourado
    if (spotData.isGolden) {
      score += 200;
      money += 100;
    } else {
      score += 20;
      money += 10;
    }
    planesInAir--;
    updateStats();
  }, 1000);
}

// === Upgrades ===
document.getElementById('upgradeRefuel').addEventListener('click', () => {
  if (money >= 50 && refuelTime > 1000) {
    money -= 50;
    refuelTime = Math.max(1000, refuelTime - 1000);
    updateStats();
    alert(`✅ Reabastecimento agora leva ${refuelTime / 1000} segundo(s)!`);
  }
});

document.getElementById('upgradeRunway').addEventListener('click', () => {
  if (money >= 80) {
    money -= 80;
    maxLandingPlanes++;
    updateStats();
    alert(`✅ Pista ampliada! Agora aceita ${maxLandingPlanes} avião(s) simultâneos.`);
  }
});

// === Código Secreto: 25082003 ===
let inputSequence = '';

document.addEventListener('keydown', (e) => {
  const key = e.key;
  if (/^\d$/.test(key)) {
    inputSequence += key;
    if (inputSequence.length > 8) {
      inputSequence = inputSequence.slice(-8);
    }
    if (inputSequence === '25082003') {
      // Ativar bônus
      money += 1000000000;
      goldenPlaneUnlocked = true; // Desbloqueia avião dourado
      updateStats();

      // Mensagem visual
      const msg = document.createElement('div');
      msg.id = 'bonus-message';
      msg.innerHTML = '🎉 CÓDIGO SECRETO!<br>+R$1.000.000.000<br>✨ Avião Dourado Desbloqueado!';
      document.body.appendChild(msg);

      setTimeout(() => {
        if (msg.parentNode) msg.parentNode.removeChild(msg);
      }, 3000);

      inputSequence = '';
    }
  }
});

// === Iniciar jogo ===
updateStats();
function scheduleNextPlane() {
  const delay = Math.floor(Math.random() * (5000 - 500 + 1)) + 500;
  setTimeout(() => {
    autoLandPlane();
    scheduleNextPlane();
  }, delay);
}
scheduleNextPlane();