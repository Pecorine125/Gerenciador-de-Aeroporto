// === Estado do Jogo ===
let money = 500;
let runways = 1; // máximo = 2
let terminalLevel = 1; // nível 1, 2 ou 3
let planesInAir = [];
let nextPlaneId = 1;
let goldenPlaneUnlocked = false;

// Atualiza interface
function updateUI() {
  document.getElementById('money').textContent = money.toLocaleString('pt-BR');
  document.getElementById('runways').textContent = runways;
  document.getElementById('terminalLevel').textContent = terminalLevel;
  document.getElementById('terminalLevelDisplay').textContent = terminalLevel;

  // Botões desativados se sem dinheiro
  document.getElementById('buyRunway').disabled = (runways >= 2 || money < 3000);
  document.getElementById('upgradeTerminal').disabled = (terminalLevel >= 3 || money < 2000);

  // Atualiza fila de aviões
  const queueEl = document.getElementById('skyQueue');
  queueEl.innerHTML = '';
  planesInAir.forEach(plane => {
    if (!plane.landed) {
      const el = document.createElement('div');
      el.className = 'aircraft-sky';
      el.innerHTML = `✈️ ${plane.type} →`;
      queueEl.appendChild(el);
    }
  });

  // Atualiza conteúdo do terminal (aviões estacionados)
  const terminalContent = document.getElementById('terminalContent');
  terminalContent.innerHTML = '';
  const parkedPlanes = planesInAir.filter(p => p.landed && p.at === 'terminal');
  if (parkedPlanes.length > 0) {
    const last = parkedPlanes[parkedPlanes.length - 1];
    terminalContent.textContent = last.type === 'small' ? '✈️' : last.type === 'medium' ? '✈️✈️' : '✈️✈️✈️';
  }
}

// === Tipos de aviões por nível de terminal ===
function getAvailablePlaneTypes() {
  if (terminalLevel >= 3) return ['small', 'medium', 'large'];
  if (terminalLevel >= 2) return ['small', 'medium'];
  return ['small'];
}

// === Gerar novo avião (a cada 10-20s) ===
function spawnPlane() {
  const types = getAvailablePlaneTypes();
  const type = types[Math.floor(Math.random() * types.length)];
  
  const plane = {
    id: nextPlaneId++,
    type,
    landed: false,
    at: null,
    refuelTime: type === 'small' ? 3000 : type === 'medium' ? 5000 : 8000
  };

  planesInAir.push(plane);
  updateUI();

  // Simular pouso (ir para pista)
  setTimeout(() => landPlane(plane), 2000);
}

// === Pousar avião (vai para terminal) ===
function landPlane(plane) {
  if (plane.landed) return;
  
  plane.landed = true;
  plane.at = 'terminal';
  updateUI();

  // Reabastecimento
  setTimeout(() => {
    if (planesInAir.some(p => p.id === plane.id)) {
      prepareForTakeoff(plane);
    }
  }, plane.refuelTime);
}

// === Preparar decolagem ===
function prepareForTakeoff(plane) {
  plane.at = 'departing';
  updateUI();

  // Decolar (sair do terminal)
  setTimeout(() => {
    planesInAir = planesInAir.filter(p => p.id !== plane.id);
    
    // Recompensa
    const reward = plane.type === 'small' ? 200 : plane.type === 'medium' ? 500 : 1500;
    money += reward;
    updateUI();
  }, 2000);
}

// === Comprar 2ª pista ===
document.getElementById('buyRunway').addEventListener('click', () => {
  if (runways < 2 && money >= 3000) {
    money -= 3000;
    runways = 2;
    
    // Adiciona visualmente a 2ª pista
    const container = document.getElementById('runwaysContainer');
    if (!document.getElementById('runway2')) {
      const runway2 = document.createElement('div');
      runway2.className = 'runway';
      runway2.id = 'runway2';
      runway2.textContent = '✈️ PISTA 2';
      container.appendChild(runway2);
    }
    updateUI();
  }
});

// === Melhorar terminal ===
document.getElementById('upgradeTerminal').addEventListener('click', () => {
  if (terminalLevel < 3 && money >= 2000) {
    money -= 2000;
    terminalLevel++;
    updateUI();
  }
});

// === Código secreto 25082003 ===
let inputSequence = '';
document.addEventListener('keydown', (e) => {
  if (/^\d$/.test(e.key)) {
    inputSequence = (inputSequence + e.key).slice(-8);
    if (inputSequence === '25082003') {
      money += 1000000000;
      goldenPlaneUnlocked = true;
      updateUI();
      inputSequence = '';
    }
  }
});

// === Iniciar jogo ===
updateUI();

// Gerar aviões continuamente
setInterval(() => {
  if (planesInAir.filter(p => !p.landed).length < 3) {
    spawnPlane();
  }
}, 12000);