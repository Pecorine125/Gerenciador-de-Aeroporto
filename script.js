let score = 0;
let planesInAir = 0;
let nextPlaneId = 1;

// Estado das vagas: { id: null ou { planeId, status: 'parked' | 'refueling' | 'ready' } }
const parkingSpots = {};
['U1','U2','U3','U4','U5','U6','U7','U8','U9','U10','L1','L2','L3','L4','L5','L6','L7','L8','L9','L10']
  .forEach(id => parkingSpots[id] = null);

const elements = {
  score: document.getElementById('score'),
  inAir: document.getElementById('inAir'),
  freeSpots: document.getElementById('freeSpots'),
  landingRunway: document.getElementById('landingRunway'),
  takeoffRunway: document.getElementById('takeoffRunway'),
  upperParking: document.getElementById('upperParking'),
  lowerParking: document.getElementById('lowerParking')
};

function updateStats() {
  elements.score.textContent = score;
  elements.inAir.textContent = planesInAir;
  const free = Object.values(parkingSpots).filter(s => s === null).length;
  elements.freeSpots.textContent = free;
}

// Encontrar vaga livre
function findFreeSpot() {
  for (const id in parkingSpots) {
    if (parkingSpots[id] === null) return id;
  }
  return null;
}

// Animação: mover elemento de A para B
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

// Função principal: avião pousa
async function landPlane() {
  const planeId = nextPlaneId++;
  planesInAir++;
  updateStats();

  const spotId = findFreeSpot();
  if (!spotId) {
    alert("⚠️ Nenhuma vaga disponível! Avião desviado.");
    planesInAir--;
    updateStats();
    return;
  }

  // 1. Avião aparece na pista de pouso
  const planeEl = document.createElement('div');
  planeEl.className = 'tug';
  planeEl.textContent = '✈️';
  const landingRect = elements.landingRunway.getBoundingClientRect();
  document.body.appendChild(planeEl);
  planeEl.style.left = (landingRect.left + landingRect.width) + 'px';
  planeEl.style.top = (landingRect.top + landingRect.height / 2) + 'px';

  // 2. Move para vaga
  const spotEl = document.querySelector(`.spot[data-id="${spotId}"]`);
  const spotRect = spotEl.getBoundingClientRect();
  await moveElement(planeEl, landingRect, spotRect);

  // 3. Ocupar vaga
  parkingSpots[spotId] = { planeId, status: 'parked' };
  spotEl.classList.add('occupied');

  // 4. Iniciar reabastecimento (simulado)
  setTimeout(() => {
    if (parkingSpots[spotId]) {
      spotEl.classList.remove('occupied');
      spotEl.classList.add('refueling');
      parkingSpots[spotId].status = 'refueling';

      // 5. Após reabastecimento, ficar pronto para decolagem
      setTimeout(() => {
        if (parkingSpots[spotId]) {
          spotEl.classList.remove('refueling');
          spotEl.classList.add('occupied');
          parkingSpots[spotId].status = 'ready';
          scheduleTakeoff(spotId);
        }
      }, 5000); // 5s de reabastecimento
    }
  }, 2000); // 2s após estacionar
}

// Agendar decolagem quando estiver pronto
async function scheduleTakeoff(spotId) {
  const spotEl = document.querySelector(`.spot[data-id="${spotId}"]`);
  const spotData = parkingSpots[spotId];
  if (!spotData || spotData.status !== 'ready') return;

  // Criar rebocador
  const tugEl = document.createElement('div');
  tugEl.className = 'tug';
  tugEl.textContent = '🚜';

  const spotRect = spotEl.getBoundingClientRect();
  const takeoffRect = elements.takeoffRunway.getBoundingClientRect();

  // Mover avião da vaga para pista de decolagem
  const planeEl = document.createElement('div');
  planeEl.className = 'tug';
  planeEl.textContent = '✈️';

  await moveElement(planeEl, spotRect, takeoffRect, 4000);

  // Decolar
  setTimeout(() => {
    planeEl.remove();
    spotEl.classList.remove('occupied');
    parkingSpots[spotId] = null;
    score += 20;
    planesInAir--;
    updateStats();
  }, 1000);
}

// Botão de teste
document.getElementById('spawnPlaneBtn').addEventListener('click', landPlane);

// Gerar aviões automaticamente (opcional)
// setInterval(() => {
//   if (Math.random() < 0.2) landPlane();
// }, 8000);

updateStats();