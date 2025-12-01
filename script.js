// === Estado do Jogo ===
let score = 0;
let money = 100;
let planesInAir = 0;
let nextPlaneId = 1;
let refuelTime = 5000; // 5 segundos
let maxLandingPlanes = 1;
let currentLandingPlanes = 0;

// Vagas
const spotIds = [
  'U1','U2','U3','U4','U5','U6','U7','U8','U9','U10',
  'L1','L2','L3','L4','L5','L6','L7','L8','L9','L10'
];
const parkingSpots = {};
spotIds.forEach(id => parkingSpots[id] = null);

// Elementos
const el = {
  score: document.getElementById('score'),
  inAir: document.getElementById('inAir'),
  freeSpots: document.getElementById('freeSpots'),
  money: document.getElementById('money'),
  landingRunway: document.getElementById('landingRunway'),
  takeoffRunway: document.getElementById('takeoffRunway')
};

// === Atualiza interface ===
function updateStats() {
  el.score.textContent = score;
  el.inAir.textContent = planesInAir;
  el.money.textContent = money;
  const free = Object.values(parkingSpots).filter(s => s === null).length;
  el.freeSpots.textContent = free;
}

// === Encontrar vaga livre ===
function findFreeSpot() {
  for (const id of spotIds) {
    if (parkingSpots[id] === null) return id;
  }
  return null;
}

// === Movimento suave ===
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
    element.style.zIndex = '200';
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

// === Pouso automático ===
async function autoLandPlane() {
  if (currentLandingPlanes >= maxLandingPlanes) return;
  const spotId = findFreeSpot();
  if (!spotId) return;

  currentLandingPlanes++;
  const planeId = nextPlaneId++;
  planesInAir++;
  updateStats();

  const planeEl = document.createElement('div');
  planeEl.className = 'tug';
  planeEl.textContent = '✈️';
  const landingRect = el.landingRunway.getBoundingClientRect();

  // Aparece vindo da direita
  planeEl.style.left = (landingRect.right + 150) + 'px';
  planeEl.style.top = (landingRect.top + landingRect.height / 2 - 12) + 'px';
  document.body.appendChild(planeEl);

  // Desliza para pista
  setTimeout(() => {
    planeEl.style.transition = 'left 2s ease-out';
    planeEl.style.left = (landingRect.left - 60) + 'px';
  }, 100);

  await new Promise(r => setTimeout(r, 2100));

  // Vai para vaga
  const spotEl = document.querySelector(`.spot[data-id="${spotId}"]`);
  const spotRect = spotEl.getBoundingClientRect();
  await moveElement(planeEl, landingRect, spotRect, 2500);

  // Ocupa vaga
  parkingSpots[spotId] = { planeId, status: 'parked' };
  spotEl.classList.add('occupied');

  currentLandingPlanes--;

  // Reabastecimento
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

// === Decolagem ===
async function prepareForTakeoff(spotId) {
  const spotEl = document.querySelector(`.spot[data-id="${spotId}"]`);
  const spotData = parkingSpots[spotId];
  if (!spotData || spotData.status !== 'ready') return;

  const spotRect = spotEl.getBoundingClientRect();
  const takeoffRect = el.takeoffRunway.getBoundingClientRect();

  const planeEl = document.createElement('div');
  planeEl.className = 'tug';
  planeEl.textContent = '✈️';

  await moveElement(planeEl, spotRect, takeoffRect, 3000);

  setTimeout(() => {
    planeEl.remove();
    spotEl.classList.remove('occupied');
    parkingSpots[spotId] = null;
    score += 20;
    money += 10;
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
    alert(`✅ Pista ampliada! Agora aceita ${maxLandingPlanes} avião(s) pousando ao mesmo tempo.`);
  }
});

// === Iniciar ===
updateStats();

// Geração automática de aviões
setInterval(() => {
  if (Math.random() < 0.35) autoLandPlane();
}, 7000);