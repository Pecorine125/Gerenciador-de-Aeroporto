// === Estado do Jogo ===
let money = 500;
let runways = 1; // máximo 2
let upgradeCount = 0; // número de upgrades feitos
let planesInAir = [];
let nextPlaneId = 1;
let goldenPlaneUnlocked = false;
let brokenPlanesCount = 0;

// Vagas normais: começa com 2
let normalGateIds = ['N1', 'N2'];
const normalGates = {};
normalGateIds.forEach(id => normalGates[id] = null);

// Vagas de conserto: começa com 2
let repairGateIds = ['R1', 'R2'];
const repairGates = {};
repairGateIds.forEach(id => repairGates[id] = null);

// === Atualiza interface ===
function updateUI() {
  document.getElementById('money').textContent = money.toLocaleString('pt-BR');
  document.getElementById('runways').textContent = runways;
  document.getElementById('terminalLevel').textContent = upgradeCount;
  document.getElementById('brokenPlanes').textContent = brokenPlanesCount;

  // Botões
  document.getElementById('buyRunway').disabled = (runways >= 2 || money < 3000);
  document.getElementById('upgradeTerminal').disabled = (money < 500);

  // Fila de aviões no céu
  const queueEl = document.getElementById('skyQueue');
  queueEl.innerHTML = '';
  planesInAir.forEach(plane => {
    if (!plane.landed) {
      const el = document.createElement('div');
      el.className = 'aircraft-sky';
      el.innerHTML = `✈️ ${plane.type} ${plane.isBroken ? '(quebrado)' : ''}`;
      queueEl.appendChild(el);
    }
  });

  // Atualiza estado das vagas normais
  normalGateIds.forEach(id => {
    const gateEl = document.querySelector(`.gate[data-id="${id}"]`);
    if (gateEl) {
      gateEl.className = 'gate';
      if (normalGates[id]) {
        gateEl.classList.add('occupied');
        if (normalGates[id].status === 'refueling') {
          gateEl.classList.add('refueling');
        }
      }
    }
  });

  // Atualiza estado das vagas de conserto
  repairGateIds.forEach(id => {
    const gateEl = document.querySelector(`.gate[data-id="${id}"]`);
    if (gateEl) {
      gateEl.className = 'gate';
      if (repairGates[id]) {
        gateEl.classList.add('occupied', 'broken');
        if (repairGates[id].status === 'repairing') {
          gateEl.classList.add('refueling');
        }
      }
    }
  });
}

// Gerar novo avião (1 a 5 segundos)
function spawnPlane() {
  const type = ['small', 'medium', 'large'][Math.floor(Math.random() * 3)];
  const isBroken = Math.random() < 0.1; // 10% chance

  const plane = {
    id: nextPlaneId++,
    type,
    isBroken,
    landed: false,
    at: null,
    refuelTime: type === 'small' ? 2000 : type === 'medium' ? 4000 : 7000,
    repairTime: 6000
  };

  planesInAir.push(plane);
  updateUI();

  // Agendar pouso
  setTimeout(() => landPlane(plane), 1500);
}

// === Pousar avião ===
function landPlane(plane) {
  if (plane.landed || !planesInAir.some(p => p.id === plane.id)) return;

  let targetGate = null;
  let targetGates = null;
  let isRepair = false;

  if (plane.isBroken) {
    // Procurar vaga de conserto
    targetGate = repairGateIds.find(id => repairGates[id] === null);
    if (!targetGate) {
      // Sem vaga → remove avião
      planesInAir = planesInAir.filter(p => p.id !== plane.id);
      updateUI();
      return;
    }
    targetGates = repairGates;
    isRepair = true;
    brokenPlanesCount++;
  } else {
    // Procurar vaga normal
    targetGate = normalGateIds.find(id => normalGates[id] === null);
    if (!targetGate) {
      // Sem vaga → remove avião
      planesInAir = planesInAir.filter(p => p.id !== plane.id);
      updateUI();
      return;
    }
    targetGates = normalGates;
  }

  // Marcar como pousado
  plane.landed = true;
  plane.at = targetGate;
  targetGates[targetGate] = { planeId: plane.id, status: 'parked' };
  updateUI();

  if (plane.isBroken) {
    // Rebocador visual
    showTug(targetGate);
    // Iniciar reparo após 1s
    setTimeout(() => startRepair(plane, targetGate), 1000);
  } else {
    // Reabastecer
    setTimeout(() => {
      if (targetGates[targetGate] && targetGates[targetGate].planeId === plane.id) {
        targetGates[targetGate].status = 'refueling';
        updateUI();
        setTimeout(() => {
          if (targetGates[targetGate] && targetGates[targetGate].planeId === plane.id) {
            targetGates[targetGate].status = 'ready';
            prepareForTakeoff(plane, targetGate, targetGates);
          }
        }, plane.refuelTime);
      }
    }, 800);
  }
}

// === Mostrar rebocador ===
function showTug(gateId) {
  const tug = document.getElementById('tug');
  const gateEl = document.querySelector(`.gate[data-id="${gateId}"]`);
  if (!gateEl || !tug) return;

  const rect = gateEl.getBoundingClientRect();
  tug.style.display = 'block';
  tug.style.left = `${rect.left + rect.width / 2}px`;
  tug.style.top = `${rect.top + rect.height / 2}px`;

  setTimeout(() => {
    tug.style.display = 'none';
  }, 800);
}

// === Iniciar reparo ===
function startRepair(plane, gateId) {
  if (!repairGates[gateId] || repairGates[gateId].planeId !== plane.id) return;

  repairGates[gateId].status = 'repairing';
  updateUI();

  setTimeout(() => {
    if (repairGates[gateId] && repairGates[gateId].planeId === plane.id) {
      repairGates[gateId].status = 'ready';
      brokenPlanesCount--;
      prepareForTakeoff(plane, gateId, repairGates);
    }
  }, plane.repairTime);
}

// === Decolagem ===
function prepareForTakeoff(plane, gateId, gates) {
  gates[gateId] = null;
  updateUI();

  // Simular decolagem
  setTimeout(() => {
    planesInAir = planesInAir.filter(p => p.id !== plane.id);
    const reward = plane.type === 'small' ? 200 : plane.type === 'medium' ? 500 : 1500;
    money += reward;
    updateUI();
  }, 1500);
}

// === Comprar 2ª pista ===
document.getElementById('buyRunway').addEventListener('click', () => {
  if (runways < 2 && money >= 3000) {
    money -= 3000;
    runways = 2;
    updateUI();
  }
});

// === Melhorar terminal: +1 normal + +1 conserto ===
document.getElementById('upgradeTerminal').addEventListener('click', () => {
  if (money >= 500) {
    money -= 500;
    upgradeCount++;

    // Adicionar 1 vaga normal
    const newNormalId = `N${normalGateIds.length + 1}`;
    normalGateIds.push(newNormalId);
    normalGates[newNormalId] = null;

    // Adicionar 1 vaga de conserto
    const newRepairId = `R${repairGateIds.length + 1}`;
    repairGateIds.push(newRepairId);
    repairGates[newRepairId] = null;

    renderGates();
    updateUI();
  }
});

// === Renderizar vagas ===
function renderGates() {
  // Vagas normais
  const normalContainer = document.getElementById('normalGatesContainer');
  normalContainer.innerHTML = '';
  normalGateIds.forEach(id => {
    const gate = document.createElement('div');
    gate.className = 'gate';
    gate.dataset.id = id;
    gate.textContent = '🪑';
    normalContainer.appendChild(gate);
  });

  // Vagas de conserto
  const repairContainer = document.getElementById('repairGatesContainer');
  repairContainer.innerHTML = '';
  repairGateIds.forEach(id => {
    const gate = document.createElement('div');
    gate.className = 'gate';
    gate.dataset.id = id;
    gate.textContent = '🔧';
    repairContainer.appendChild(gate);
  });
}

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
renderGates();

// Gerar aviões continuamente
function scheduleNextPlane() {
  const delay = 1000 + Math.floor(Math.random() * 4000); // 1 a 5 segundos
  setTimeout(() => {
    spawnPlane();
    scheduleNextPlane();
  }, delay);
}
scheduleNextPlane();