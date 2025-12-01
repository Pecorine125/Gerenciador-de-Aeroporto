// === Estado do Jogo ===
let score = 0;
let money = 100;
let planesInAir = 0;
let nextPlaneId = 1;
let refuelTime = 5000;
let maxLandingPlanes = 1;
let currentLandingPlanes = 0;
let goldenPlaneUnlocked = false;

// Vagas
const gateIds = [
  'U1','U2','U3','U4','U5','U6','U7','U8','U9','U10',
  'L1','L2','L3','L4','L5','L6','L7','L8','L9','L10'
];
const gates = {};
gateIds.forEach(id => gates[id] = null);

// Caminhos
const taxiInCells = ['taxiIn1', 'taxiIn2', 'taxiIn3'];
const taxiOutCells = ['taxiOut3', 'taxiOut2', 'taxiOut1']; // ordem inversa

// Elementos
const el = {
  score: document.getElementById('score'),
  inAir: document.getElementById('inAir'),
  freeSpots: document.getElementById('freeSpots'),
  money: document.getElementById('money'),
  landing: document.getElementById('landingCell'),
  takeoff: document.getElementById('takeoffCell')
};

// Atualiza estatísticas
function updateStats() {
  el.score.textContent = score;
  el.inAir.textContent = planesInAir;
  el.money.textContent = money;
  const free = Object.values(gates).filter(g => g === null).length;
  el.freeSpots.textContent = free;
}

// Encontra vaga livre
function findFreeGate() {
  for (const id of gateIds) {
    if (gates[id] === null) return id;
  }
  return null;
}

// Cria avião visual em uma célula
function placePlane(cellId, isGolden = false) {
  const cell = document.getElementById(cellId) || document.querySelector(`.cell[data-id="${cellId}"]`);
  if (!cell) return;
  const plane = document.createElement('div');
  plane.className = `tug ${isGolden ? 'gold' : ''}`;
  plane.textContent = '✈️';
  cell.appendChild(plane);
}

// Remove avião de uma célula
function removePlane(cellId) {
  const cell = document.getElementById(cellId) || document.querySelector(`.cell[data-id="${cellId}"]`);
  if (cell) {
    const plane = cell.querySelector('.tug');
    if (plane) plane.remove();
  }
}

// === Movimenta avião passo a passo (entrada) ===
async function movePlaneToGate(planeData) {
  const { id, isGolden } = planeData;

  // Etapa 1: pouso
  placePlane('landingCell', isGolden);
  await wait(800);

  // Etapa 2: taxi in
  for (const cell of taxiInCells) {
    removePlane('landingCell');
    if (taxiInCells.indexOf(cell) > 0) {
      removePlane(taxiInCells[taxiInCells.indexOf(cell) - 1]);
    }
    placePlane(cell, isGolden);
    await wait(600);
  }

  // Etapa 3: encontrar vaga e ir até ela
  const gateId = findFreeGate();
  if (!gateId) {
    // Desvia (remove avião)
    removePlane(taxiInCells[taxiInCells.length - 1]);
    planesInAir--;
    updateStats();
    return;
  }

  // Mover da última célula do taxi para a vaga
  removePlane(taxiInCells[taxiInCells.length - 1]);
  placePlane(gateId, isGolden);
  gates[gateId] = { id, isGolden, status: 'parked' };

  // Reabastecimento
  gates[gateId].status = 'refueling';
  removePlane(gateId);
  const gateEl = document.querySelector(`.cell[data-id="${gateId}"]`);
  gateEl.classList.add('refueling');
  await wait(refuelTime);

  // Pronto para sair
  gates[gateId].status = 'ready';
  gateEl.classList.remove('refueling');
  gateEl.classList.add('occupied');
  placePlane(gateId, isGolden);

  // Iniciar saída
  movePlaneToTakeoff(gateId);
}

// === Movimenta avião para decolagem (saída) ===
async function movePlaneToTakeoff(gateId) {
  const gateData = gates[gateId];
  if (!gateData || gateData.status !== 'ready') return;

  // Sai da vaga
  removePlane(gateId);
  document.querySelector(`.cell[data-id="${gateId}"]`).classList.remove('occupied');

  // Move pelo taxi out
  for (const cell of taxiOutCells) {
    placePlane(cell, gateData.isGolden);
    await wait(600);
    removePlane(cell);
  }

  // Decolagem
  placePlane('takeoffCell', gateData.isGolden);
  await wait(800);
  removePlane('takeoffCell');

  // Finaliza
  gates[gateId] = null;
  if (gateData.isGolden) {
    score += 200;
    money += 100;
  } else {
    score += 20;
    money += 10;
  }
  planesInAir--;
  updateStats();
}

// Função de espera
function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// === Geração automática ===
async function spawnPlane() {
  if (currentLandingPlanes >= maxLandingPlanes) return;
  if (findFreeGate() === null) return;

  currentLandingPlanes++;
  const isGolden = goldenPlaneUnlocked && Math.random() < 0.3;
  planesInAir++;
  updateStats();

  const planeData = { id: nextPlaneId++, isGolden };
  await movePlaneToGate(planeData);

  currentLandingPlanes--;
}

// === Upgrades (sem alerta) ===
document.getElementById('upgradeRefuel').addEventListener('click', () => {
  if (money >= 50 && refuelTime > 1000) {
    money -= 50;
    refuelTime = Math.max(1000, refuelTime - 1000);
    updateStats();
  }
});

document.getElementById('upgradeRunway').addEventListener('click', () => {
  if (money >= 80) {
    money -= 80;
    maxLandingPlanes++;
    updateStats();
  }
});

// === Código Secreto (sem notificação) ===
let inputSequence = '';
document.addEventListener('keydown', (e) => {
  if (/^\d$/.test(e.key)) {
    inputSequence = (inputSequence + e.key).slice(-8);
    if (inputSequence === '25082003') {
      money += 1000000000;
      goldenPlaneUnlocked = true;
      updateStats();
      inputSequence = '';
    }
  }
});

// === Iniciar ===
updateStats();
function scheduleNext() {
  const delay = Math.floor(Math.random() * (5000 - 500 + 1)) + 500;
  setTimeout(() => {
    spawnPlane();
    scheduleNext();
  }, delay);
}
scheduleNext();