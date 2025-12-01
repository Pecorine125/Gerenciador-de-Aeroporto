// === Estado do Jogo ===
let money = 500;
let runways = 1; // máximo 2
let terminalLevel = 1; // 1, 2, 3
let planesInAir = [];
let nextPlaneId = 1;
let goldenPlaneUnlocked = false;

// Vagas
const gateIds = ['G1','G2','G3','G4','G5','G6'];
const gates = {};
gateIds.forEach(id => gates[id] = null);

function updateUI() {
  document.getElementById('money').textContent = money.toLocaleString('pt-BR');
  document.getElementById('runways').textContent = runways;
  document.getElementById('terminalLevel').textContent = terminalLevel;

  // Botões
  document.getElementById('buyRunway').disabled = (runways >= 2 || money < 3000);
  document.getElementById('upgradeTerminal').disabled = (terminalLevel >= 3 || money < 2000);

  // Fila de aviões
  const queueEl = document.getElementById('skyQueue');
  queueEl.innerHTML = '';
  planesInAir.forEach(plane => {
    if (!plane.landed) {
      const el = document.createElement('div');
      el.className = 'aircraft-sky';
      el.innerHTML = `✈️ ${plane.type}`;
      queueEl.appendChild(el);
    }
  });

  // Atualiza estado das vagas
  gateIds.forEach(id => {
    const gateEl = document.querySelector(`.gate[data-id="${id}"]`);
    if (gates[id]) {
      gateEl.classList.add('occupied');
      if (gates[id].status === 'refueling') {
        gateEl.classList.add('refueling');
      } else {
        gateEl.classList.remove('refueling');
      }
    } else {
      gateEl.classList.remove('occupied', 'refueling');
    }
  });
}

// Tipos de avião por nível do terminal
function getAvailablePlaneTypes() {
  if (terminalLevel >= 3) return ['small', 'medium', 'large'];
  if (terminalLevel >= 2) return ['small', 'medium'];
  return ['small'];
}

// Gerar novo avião
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

  setTimeout(() => landPlane(plane), 2000);
}

// Pousar (vai para vaga)
function landPlane(plane) {
  if (plane.landed) return;

  // Encontrar vaga livre
  const freeGate = gateIds.find(id => gates[id] === null);
  if (!freeGate) {
    // Sem vaga — cancela
    planesInAir = planesInAir.filter(p => p.id !== plane.id);
    updateUI();
    return;
  }

  plane.landed = true;
  plane.at = freeGate;
  gates[freeGate] = { planeId: plane.id, status: 'parked' };
  updateUI();

  // Reabastecer
  setTimeout(() => {
    if (gates[freeGate] && gates[freeGate].planeId === plane.id) {
      gates[freeGate].status = 'refueling';
      updateUI();

      setTimeout(() => {
        if (gates[freeGate] && gates[freeGate].planeId === plane.id) {
          gates[freeGate].status = 'ready';
          prepareForTakeoff(plane, freeGate);
        }
      }, plane.refuelTime);
    }
  }, 1000);
}

// Preparar decolagem (saída)
function prepareForTakeoff(plane, gateId) {
  gates[gateId] = null;
  updateUI();

  // Decolar (simulação)
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

// Melhorar terminal
document.getElementById('upgradeTerminal').addEventListener('click', () => {
  if (terminalLevel < 3 && money >= 2000) {
    money -= 2000;
    terminalLevel++;
    updateUI();
  }
});

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
setInterval(spawnPlane, 12000);