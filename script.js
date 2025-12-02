// === Estado do Jogo ===
let money = 500;
let runways = 1; // máximo 2
let terminalLevel = 1; // nível agora representa quantidade de upgrades
let planesInAir = [];
let nextPlaneId = 1;
let goldenPlaneUnlocked = false;
let brokenPlanesCount = 0;

// Vagas normais (começa com 6)
let normalGateIds = ['N1','N2','N3','N4','N5','N6'];
const normalGates = {};
normalGateIds.forEach(id => normalGates[id] = null);

// Vagas de conserto (começa com 3)
let repairGateIds = ['R1','R2','R3'];
const repairGates = {};
repairGateIds.forEach(id => repairGates[id] = null);

function updateUI() {
  document.getElementById('money').textContent = money.toLocaleString('pt-BR');
  document.getElementById('runways').textContent = runways;
  document.getElementById('terminalLevel').textContent = terminalLevel;
  document.getElementById('brokenPlanes').textContent = brokenPlanesCount;

  // Botões: upgrade custa 500 por vaga (1 normal + 1 conserto)
  document.getElementById('buyRunway').disabled = (runways >= 2 || money < 3000);
  document.getElementById('upgradeTerminal').disabled = (money < 500);

  // Fila de aviões
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

  // Atualiza vagas normais
  normalGateIds.forEach(id => {
    const gateEl = document.querySelector(`.gate[data-id="${id}"]`);
    if (normalGates[id]) {
      gateEl.classList.add('occupied');
      if (normalGates[id].status === 'refueling') {
        gateEl.classList.add('refueling');
      } else {
        gateEl.classList.remove('refueling');
      }
    } else {
      gateEl.classList.remove('occupied', 'refueling');
    }
  });

  // Atualiza vagas de conserto
  repairGateIds.forEach(id => {
    const gateEl = document.querySelector(`.gate[data-id="${id}"]`);
    if (repairGates[id]) {
      gateEl.classList.add('occupied', 'broken');
      if (repairGates[id].status === 'repairing') {
        gateEl.classList.add('refueling');
      } else {
        gateEl.classList.remove('refueling');
      }
    } else {
      gateEl.classList.remove('occupied', 'broken', 'refueling');
    }
  });
}

// Tipos de avião (baseado no número de vagas, não nível)
function getAvailablePlaneTypes() {
  // Sempre permite todos os tipos (ou ajuste conforme desejar)
  return ['small', 'medium', 'large'];
}

// Gerar novo avião (a cada 1-5 segundos)
function spawnPlane() {
  const types = getAvailablePlaneTypes();
  const type = types[Math.floor(Math.random() * types.length)];
  const isBroken = Math.random() < 0.1;

  const plane = {
    id: nextPlaneId++,
    type,
    isBroken,
    landed: false,
    at: null,
    refuelTime: type === 'small' ? 3000 : type === 'medium' ? 5000 : 8000,
    repairTime: 8000
  };

  planesInAir.push(plane);
  updateUI();
  setTimeout(() => landPlane(plane), 2000);
}

// Pousar avião
function landPlane(plane) {
  if (plane.landed) return;

  let targetGate = null;
  let targetGates = null;
  let isRepair = false;

  if (plane.isBroken) {
    targetGate = repairGateIds.find(id => repairGates[id] === null);
    if (!targetGate) {
      planesInAir = planesInAir.filter(p => p.id !== plane.id);
      updateUI();
      return;
    }
    targetGates = repairGates;
    isRepair = true;
    brokenPlanesCount++;
  } else {
    targetGate = normalGateIds.find(id => normalGates[id] === null);
    if (!targetGate) {
      planesInAir = planesInAir.filter(p => p.id !== plane.id);
      updateUI();
      return;
    }
    targetGates = normalGates;
  }

  plane.landed = true;
  plane.at = targetGate;
  targetGates[targetGate] = { planeId: plane.id, status: 'parked' };
  updateUI();

  if (plane.isBroken) {
    moveTugToGate(targetGate);
    setTimeout(() => startRepair(plane, targetGate), 1500);
  } else {
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
    }, 1000);
  }
}

// Rebocador (visual simples)
function moveTugToGate(gateId) {
  const tug = document.getElementById('tug');
  const gateEl = document.querySelector(`.gate[data-id="${gateId}"]`);
  const rect = gateEl.getBoundingClientRect();
  
  tug.style.display = 'block';
  tug.style.left = `${rect.left + rect.width/2}px`;
  tug.style.top = `${rect.top + rect.height/2}px`;

  // Remove após curto tempo (simula ação)
  setTimeout(() => {
    tug.style.display = 'none';
  }, 800);
}

// Iniciar reparo
function startRepair(plane, gateId) {
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

// Decolagem
function prepareForTakeoff(plane, gateId, gates) {
  gates[gateId] = null;
  updateUI();
  setTimeout(() => {
    planesInAir = planesInAir.filter(p => p.id !== plane.id);
    const reward = plane.type === 'small' ? 200 : plane.type === 'medium' ? 500 : 1500;
    money += reward;
    updateUI();
  }, 2000);
}

// Comprar 2ª pista
document.getElementById('buyRunway').addEventListener('click', () => {
  if (runways < 2 && money >= 3000) {
    money -= 3000;
    runways = 2;
    updateUI();
  }
});

// === Upgrade individual: +1 vaga normal + +1 vaga conserto ===
document.getElementById('upgradeTerminal').addEventListener('click', () => {
  if (money >= 500) {
    money -= 500;
    terminalLevel++; // agora conta número de upgrades

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

// Renderizar vagas
function renderGates() {
  const normalContainer = document.getElementById('normalGatesContainer');
  normalContainer.innerHTML = '';
  normalGateIds.forEach(id => {
    const gate = document.createElement('div');
    gate.className = 'gate';
    gate.dataset.id = id;
    gate.textContent = '🪑';
    normalContainer.appendChild(gate);
  });

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

// Código secreto 25082003
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

// Iniciar jogo
updateUI();
renderGates();
setInterval(spawnPlane, () => 1000 + Math.random() * 4000);