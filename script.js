let score = 0;
let planesInAir = 0;
let planeId = 0;

const scoreEl = document.getElementById('score');
const inAirEl = document.getElementById('inAir');
const runwayEl = document.getElementById('runway');
const airSpaceEl = document.getElementById('airSpace');

// Função para atualizar estatísticas
function updateStats() {
  scoreEl.textContent = score;
  inAirEl.textContent = planesInAir;
}

// Adicionar avião à área de espera
function addWaitingPlane() {
  const plane = document.createElement('div');
  plane.className = 'waiting-plane';
  plane.textContent = '✈️';
  plane.dataset.id = planeId++;
  airSpaceEl.appendChild(plane);
  planesInAir++;
  updateStats();
}

// Pousar avião (mover da área de espera para a pista)
document.getElementById('landBtn').onclick = () => {
  const waitingPlanes = document.querySelectorAll('.waiting-plane');
  if (waitingPlanes.length === 0) return;

  const plane = waitingPlanes[0];
  const planeEl = document.createElement('div');
  planeEl.className = 'plane';
  planeEl.textContent = '✈️';
  planeEl.style.left = '100%';
  planeEl.style.top = '50%';
  runwayEl.appendChild(planeEl);

  // Animação de pouso
  setTimeout(() => {
    planeEl.style.left = '-50px';
  }, 100);

  // Remover após animação
  setTimeout(() => {
    planeEl.remove();
    plane.remove();
    score += 10;
    planesInAir--;
    updateStats();
  }, 3100);
};

// Decolar avião (simular saída da pista)
document.getElementById('takeoffBtn').onclick = () => {
  const planeEl = document.createElement('div');
  planeEl.className = 'plane';
  planeEl.textContent = '✈️';
  planeEl.style.left = '-50px';
  planeEl.style.top = '50%';
  runwayEl.appendChild(planeEl);

  // Animação de decolagem
  setTimeout(() => {
    planeEl.style.left = '100%';
  }, 100);

  setTimeout(() => {
    planeEl.remove();
    score += 5;
    updateStats();
  }, 3100);
};

// Gerar aviões automaticamente (opcional)
setInterval(() => {
  if (Math.random() < 0.3) {
    addWaitingPlane();
  }
}, 5000);