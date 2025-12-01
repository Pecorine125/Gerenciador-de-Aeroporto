// === Estado do Jogo ===
let money = 500;
let gold = 10;
let passengers = 0;
let nextPlaneId = 1;

// Grade: 5 linhas x 6 colunas
const ROWS = 5;
const COLS = 6;
const grid = Array(ROWS).fill().map(() => Array(COLS).fill(null));

// Tipos de edifício
const buildings = {
  terminal: { icon: '🏢', capacity: 1, name: 'Terminal' },
  fuel: { icon: '⛽', capacity: 1, name: 'Posto' },
  hangar: { icon: '✈️', capacity: 2, name: 'Hangar' }
};

// Aviões no ar
let planesInAir = [];

// === Atualiza interface ===
function updateUI() {
  document.getElementById('money').textContent = money;
  document.getElementById('gold').textContent = gold;
  document.getElementById('passengers').textContent = passengers;
  
  // Atualiza fila de aviões
  const queueEl = document.getElementById('airQueue');
  queueEl.innerHTML = '';
  planesInAir.forEach(plane => {
    const el = document.createElement('div');
    el.className = 'aircraft';
    el.textContent = `✈️ ${plane.destination} (em ${plane.arrival}s)`;
    queueEl.appendChild(el);
  });
}

// === Renderiza grade ===
function renderGrid() {
  const gridEl = document.getElementById('airportGrid');
  gridEl.innerHTML = '';
  
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      
      if (grid[r][c]) {
        cell.classList.add('occupied');
        cell.textContent = buildings[grid[r][c].type].icon;
      }
      
      cell.addEventListener('click', () => handleCellClick(r, c));
      gridEl.appendChild(cell);
    }
  }
}

// === Clique na célula (remover edifício) ===
function handleCellClick(row, col) {
  if (grid[row][col]) {
    // Devolve 50% do custo
    const type = grid[row][col].type;
    const refund = Math.floor(getBuildingCost(type) * 0.5);
    money += refund;
    grid[row][col] = null;
    updateUI();
    renderGrid();
  }
}

// === Custo dos edifícios ===
function getBuildingCost(type) {
  return type === 'terminal' ? 200 : type === 'fuel' ? 150 : 300;
}

// === Botões de construção ===
document.querySelectorAll('.build-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const cost = parseInt(btn.dataset.cost);
    
    if (money >= cost) {
      // Ativar modo construção
      alertBuildingMode(type, cost); // Apenas para seleção visual — opcional
      // (Neste caso, vamos permitir construir no próximo clique)
      window.pendingBuild = type;
    }
  });
});

// Melhor: construir no clique da célula
// Vamos reescrever handleCellClick para suportar construção pendente
function handleCellClick(row, col) {
  if (window.pendingBuild) {
    const type = window.pendingBuild;
    const cost = getBuildingCost(type);
    if (money >= cost && grid[row][col] === null) {
      money -= cost;
      grid[row][col] = { type, level: 1 };
      window.pendingBuild = null;
      updateUI();
      renderGrid();
    }
    return;
  }
  
  // Remover (como antes)
  if (grid[row][col]) {
    const refund = Math.floor(getBuildingCost(grid[row][col].type) * 0.5);
    money += refund;
    grid[row][col] = null;
    updateUI();
    renderGrid();
  }
}

// === Gerar aviões (como no Airport City) ===
const destinations = ['NYC', 'LON', 'TKY', 'PAR', 'DXB'];
function spawnPlane() {
  const destination = destinations[Math.floor(Math.random() * destinations.length)];
  const arrival = 10 + Math.floor(Math.random() * 20); // 10 a 30s
  
  const plane = {
    id: nextPlaneId++,
    destination,
    arrival,
    landed: false
  };
  
  planesInAir.push(plane);
  updateUI();
  
  // Contagem regressiva
  const interval = setInterval(() => {
    plane.arrival--;
    if (plane.arrival <= 0) {
      clearInterval(interval);
      landPlane(plane);
    }
    updateUI();
  }, 1000);
}

// === Pousar avião ===
function landPlane(plane) {
  // Procurar terminal ou hangar livre
  let found = false;
  for (let r = 0; r < ROWS && !found; r++) {
    for (let c = 0; c < COLS && !found; c++) {
      if (grid[r][c] && (grid[r][c].type === 'terminal' || grid[r][c].type === 'hangar')) {
        // Aceita avião (simplificado)
        passengers += 20;
        money += 50;
        gold += 1;
        found = true;
      }
    }
  }
  
  // Se não encontrar, perde passageiros (penalidade)
  if (!found) {
    // Nada acontece (ou pode penalizar)
  }
  
  // Remover da lista
  planesInAir = planesInAir.filter(p => p.id !== plane.id);
  updateUI();
}

// === Iniciar jogo ===
renderGrid();
updateUI();

// Gerar aviões a cada 15-30s
setInterval(spawnPlane, 20000);

// Permitir construção com clique
// Reescrevemos handleCellClick acima, mas precisamos reatribuir
// Solução: usar evento delegado ou redefinir após renderGrid
// Vamos usar evento no grid inteiro
document.getElementById('airportGrid').addEventListener('click', (e) => {
  const cell = e.target.closest('.cell');
  if (!cell) return;
  
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  handleCellClick(row, col);
});

// Função auxiliar (opcional)
function alertBuildingMode(type, cost) {
  // Não usamos alert! Só sinal visual (ex: borda)
  document.body.style.outline = '4px solid gold';
  setTimeout(() => document.body.style.outline = '', 500);
}