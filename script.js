// script.js — Sistema completo: aviões + 2 rebocadores + robô de abastecimento
// Projetado para: canvas 1366x768, fundo em /assets/cenario.png (raw github OK)

// ---------- Inicialização ----------
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 1366;
canvas.height = 768;

const BG_SRC = "https://raw.githubusercontent.com/Pecorine125/Gerenciador-de-Aeroporto/main/assets/cenario.png";
const background = new Image();
background.src = BG_SRC;

// controles (existem no index.html)
const btnIniciar = document.getElementById("btnIniciar");
const btnEditar = document.getElementById("btnEditarPontos");
const btnSalvar = document.getElementById("btnSalvarPontos");

// flags
let running = false;
let lastTS = 0;
let showPoints = false; // se você quiser visualizar pontos
let pontosGlob = null; // será preenchido por pontos.json ou valores padrão

// ---------- Defaults (caso pontos.json não exista) ----------
const DEFAULT_PONTOS = {
  pousoInicio: { x: 80, y: 380 },
  pousoFim: { x: 350, y: 380 },

  decolagemInicio: { x: 1200, y: 380 },
  decolagemFim: { x: 1350, y: 380 },

  rebocador1Base: { x: 1150, y: 650 },
  rebocador2Base: { x: 1180, y: 650 },

  rebocador1Busca: { x: 420, y: 380 },
  rebocador2Busca: { x: 420, y: 420 },

  rebocador1Entrega: { x: 1150, y: 620 },
  rebocador2Entrega: { x: 1180, y: 620 },

  roboBase: { x: 1050, y: 650 },
  pontoAbastecimento: { x: 700, y: 360 },

  vagas: [
    { x: 800, y: 500 },
    { x: 900, y: 500 },
    { x: 1000, y: 500 },
    { x: 1100, y: 500 },
    { x: 1200, y: 500 }
  ]
};

// ---------- Entidades ----------
class Entity {
  constructor(x, y, emoji, speed=100) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
    this.speed = speed; // pixels/segundo
    this.angle = 0;
    this.attached = false;
    this.target = null;
    this.state = "idle";
    this.radius = 18; // para colisão simples
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    // vertical centering tweak
    ctx.font = (this.radius*1.6) + "px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, 0, 0);
    ctx.restore();
  }
  moveToward(tx, ty, dt, slowFactor = 1) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) {
      this.x = tx; this.y = ty;
      return true;
    }
    const vel = this.speed * slowFactor;
    const vx = (dx / dist) * vel * dt;
    const vy = (dy / dist) * vel * dt;
    this.x += vx; this.y += vy;
    this.angle = Math.atan2(dy, dx);
    return false;
  }
  distanceTo(obj) { return Math.hypot(this.x - obj.x, this.y - obj.y); }
}

// ---------- Game objects ----------
// tugs (rebocadores)
let tugs = []; // will hold 2 Entity
// robot
let robot = null;
// planes array
let planes = []; // objects created dynamically
const MAX_PLANES = 5;
let spawnedCount = 0;

// parameters for behavior
const PLANE_TYPES = [
  { emoji: "✈️", landingSpeed: 60, taxiSpeed: 80 }, // large (slower)
  { emoji: "🛩️", landingSpeed: 110, taxiSpeed: 140 }, // medium
  { emoji: "🛫", landingSpeed: 170, taxiSpeed: 220 }  // small (fast)
];

// simple state machine names used for planes:
// approaching -> landed -> assigned -> being_towed -> parked -> refueling -> ready_to_go -> being_towed_out -> departing -> finished

// ---------- Load pontos.json ----------
async function loadPontos() {
  try {
    const r = await fetch("pontos.json", { cache: "no-store" });
    if (!r.ok) throw new Error("no pontos.json");
    const data = await r.json();
    // normalize: ensure vagas exists array
    if (!data.vagas && data.vaga1) {
      data.vagas = [data.vaga1, data.vaga2, data.vaga3, data.vaga4, data.vaga5].filter(Boolean);
    }
    // fill missing with defaults
    pontosGlob = Object.assign({}, DEFAULT_PONTOS, data);
    // if vagas length < 5 pad with defaults
    if (!pontosGlob.vagas || pontosGlob.vagas.length < 5) pontosGlob.vagas = DEFAULT_PONTOS.vagas.slice();
  } catch (e) {
    console.warn("Não encontrou pontos.json — usando padrões", e);
    pontosGlob = JSON.parse(JSON.stringify(DEFAULT_PONTOS));
  }
}
loadPontos().then(initEntities);

// ---------- Init tugs, robot ----------
function initEntities() {
  // tugs
  tugs = [];
  tugs.push(new Entity(pontosGlob.rebocador1Base.x, pontosGlob.rebocador1Base.y, "🚜", 160)); // velocidade px/s tuned
  tugs.push(new Entity(pontosGlob.rebocador2Base.x, pontosGlob.rebocador2Base.y, "🚜", 160));
  // robot
  robot = new Entity(pontosGlob.roboBase.x, pontosGlob.roboBase.y, "🤖", 160);
  // ensure clear planes
  planes = [];
  spawnedCount = 0;
}

// ---------- Utility helpers ----------
function chooseNearestFreeVaga(px, py) {
  let bestIdx = -1;
  let bestD = 1e9;
  for (let i = 0; i < pontosGlob.vagas.length; i++) {
    const v = pontosGlob.vagas[i];
    // check if occupied by any plane
    const occupied = planes.some(p => p.assignedVaga === i && p.state !== "finished");
    if (occupied) continue;
    const d = Math.hypot(px - v.x, py - v.y);
    if (d < bestD) { bestD = d; bestIdx = i; }
  }
  return bestIdx;
}

function spawnPlaneIfPossible() {
  if (spawnedCount >= MAX_PLANES) return;
  // spawn only if no approaching/landed/unhandled plane (one at a time)
  const busy = planes.some(p => ["approaching", "landed", "assigned", "being_towed", "parked", "refueling", "ready_to_go", "being_towed_out"].includes(p.state));
  if (busy) return;
  // find free vaga
  const free = pontosGlob.vagas.find((v, idx) => !planes.some(p => p.assignedVaga === idx && p.state !== "finished"));
  if (!free) return;
  // choose random type
  const r = Math.random();
  let typeIdx = 1;
  if (r < 0.25) typeIdx = 0;
  else if (r < 0.65) typeIdx = 1;
  else typeIdx = 2;
  const cfg = PLANE_TYPES[typeIdx];
  const start = pontosGlob.pousoInicio;
  const pl = {
    id: Date.now() + Math.random(),
    emoji: cfg.emoji,
    landingSpeed: cfg.landingSpeed,
    taxiSpeed: cfg.taxiSpeed,
    x: start.x - 120, // start left off-screen
    y: start.y,
    angle: 0,
    state: "approaching",
    assignedVaga: null,
    attachedTug: null,
    fuel: 0
  };
  planes.push(pl);
  spawnedCount++;
}

// ---------- Behavior functions ----------
let refuelTimers = {}; // planeId -> timer

function updateEntities(dt) {
  // 1) spawn logic
  spawnPlaneIfPossible();

  // 2) update planes
  for (const pl of planes) {
    switch (pl.state) {
      case "approaching": {
        // move to pousoFim
        const done = movePlaneTowardPoint(pl, pontosGlob.pousoFim, pl.landingSpeed, dt);
        if (done) {
          pl.state = "landed";
        }
        break;
      }
      case "landed": {
        // assign nearest vaga
        const idx = chooseNearestFreeVaga(pl.x, pl.y);
        if (idx !== -1) {
          pl.assignedVaga = idx;
          pl.state = "assigned";
        }
        break;
      }
      case "assigned": {
        // wait for tug to attach (tug logic will set being_towed)
        break;
      }
      case "being_towed": {
        // when attached, plane follows tug position offset
        if (pl.attachedTug) {
          const tug = pl.attachedTug;
          pl.x = tug.x + Math.cos(tug.angle) * 34;
          pl.y = tug.y + Math.sin(tug.angle) * 34;
        }
        break;
      }
      case "parked": {
        // waiting for robot to refuel (robot logic)
        break;
      }
      case "refueling": {
        // refuel timer handled in robot logic
        break;
      }
      case "ready_to_go": {
        // waiting for second tug to pick up (tug logic)
        break;
      }
      case "being_towed_out": {
        // follows tug to takeoff
        if (pl.attachedTug) {
          const tug = pl.attachedTug;
          pl.x = tug.x + Math.cos(tug.angle) * 34;
          pl.y = tug.y + Math.sin(tug.angle) * 34;
        }
        break;
      }
      case "departing": {
        // accelerate to right
        pl.x += pl.taxiSpeed * dt * 1.6;
        pl.y -= 0.5 * dt; // small lift
        if (pl.x > canvas.width + 100) pl.state = "finished";
        break;
      }
    }
  }

  // 3) tugs logic: there are 2 tugs; we'll give priority tasks
  // Tug A: handles incoming (attach to landed->tow to vaga)
  // Tug B: handles outgoing (after refuel->tow to takeoff)
  // assign tasks if idle
  // TUG 0 = rebocador1, TUG1 = rebocador2
  // A) Tug0 behavior
  const tugA = tugs[0];
  const tugB = tugs[1];

  // find candidate for tugA: plane in "assigned" and not being handled
  if (!tugA.busy) {
    const candidate = planes.find(p => p.state === "assigned" && !p._handler);
    if (candidate) {
      // assign tugA to pick up candidate
      tugA.busy = true;
      tugA._task = "goto_plane_attach";
      tugA._targetPlane = candidate;
      candidate._handler = true;
    }
  }

  // tugA task machine
  if (tugA._task === "goto_plane_attach") {
    const p = tugA._targetPlane;
    const attachPoint = { x: p.x - 30, y: p.y + 20 };
    const arrived = tugA.moveToward(attachPoint.x, attachPoint.y, dt);
    if (arrived) {
      // attach
      p.attachedTug = tugA;
      p.state = "being_towed";
      tugA._task = "tow_to_parking";
      // build final target: vaga center
      tugA._destination = pontosGlob.vagas[p.assignedVaga];
    }
  } else if (tugA._task === "tow_to_parking") {
    const dest = tugA._destination;
    const done = tugA.moveToward(dest.x, dest.y, dt);
    // while moving, plane follows (done in plane update)
    if (done) {
      // drop off
      const pl = tugA._targetPlane;
      if (pl) {
        pl.attachedTug = null;
        pl.state = "parked";
        pl.x = dest.x; pl.y = dest.y;
        // free tug
        tugA._task = null; tugA.busy = false; tugA._targetPlane = null;
        // notify robot to refuel this plane
        // mark plane to be refueled (robot will pick it)
        pl._needsRefuel = true;
      }
    }
  }

  // B) Robot logic: find parked plane needing refuel
  if (!robot._task) {
    const candidate = planes.find(p => p.state === "parked" && p._needsRefuel && !p._refuelAssigned);
    if (candidate) {
      robot._task = "goto_refuel";
      robot._targetPlane = candidate;
      candidate._refuelAssigned = true;
    }
  }

  if (robot._task === "goto_refuel") {
    const p = robot._targetPlane;
    const arrived = robot.moveToward(p.x, p.y, dt);
    if (arrived) {
      // start refuel
      robot._task = "refueling";
      p.state = "refueling";
      refuelTimers[p.id] = 0;
    }
  } else if (robot._task === "refueling") {
    const p = robot._targetPlane;
    refuelTimers[p.id] += dt;
    p.fuel = Math.min(100, (refuelTimers[p.id] / 3) * 100);
    if (refuelTimers[p.id] >= 3) {
      // done
      p.state = "ready_to_go";
      p._needsRefuel = false;
      delete refuelTimers[p.id];
      robot._task = "return_base";
      robot._targetPlane = null;
      // mark plane ready for tugB to pick up
    }
  } else if (robot._task === "return_base") {
    const base = pontosGlob.roboBase;
    const done = robot.moveToward(base.x, base.y, dt);
    if (done) robot._task = null;
  }

  // C) TugB (outgoing tug) picks a plane in ready_to_go
  if (!tugB.busy) {
    const candidate = planes.find(p => p.state === "ready_to_go" && !p._outHandler);
    if (candidate) {
      // assign tugB
      tugB.busy = true;
      tugB._task = "goto_plane_attach_out";
      tugB._targetPlane = candidate;
      candidate._outHandler = true;
    }
  }

  if (tugB._task === "goto_plane_attach_out") {
    const p = tugB._targetPlane;
    const attachPoint = { x: p.x - 30, y: p.y + 20 };
    const arrived = tugB.moveToward(attachPoint.x, attachPoint.y, dt);
    if (arrived) {
      p.attachedTug = tugB;
      p.state = "being_towed_out";
      tugB._task = "tow_to_takeoff";
      tugB._destination = pontosGlob.decolagemInicio;
    }
  } else if (tugB._task === "tow_to_takeoff") {
    const dest = tugB._destination;
    const done = tugB.moveToward(dest.x, dest.y, dt);
    if (tugB._targetPlane) {
      const pl = tugB._targetPlane;
      pl.x = tugB.x + Math.cos(tugB.angle) * 34;
      pl.y = tugB.y + Math.sin(tugB.angle) * 34;
    }
    if (done) {
      // detach and let plane depart to decolagemFim direction (to right)
      const pl = tugB._targetPlane;
      if (pl) {
        pl.attachedTug = null;
        pl.state = "departing";
        // free vaga assigned earlier (plane leaving)
        pl.assignedVaga = null;
      }
      tugB._task = "return_base";
      tugB._targetPlane = null;
    }
  } else if (tugB._task === "return_base") {
    const base = pontosGlob.rebocador2Base;
    const done = tugB.moveToward(base.x, base.y, dt);
    if (done) { tugB._task = null; tugB.busy = false; }
  }

  // D) Simple collision avoidance
  // if two tugs are too close, slightly steer one
  const dTugs = Math.hypot(tugA.x - tugB.x, tugA.y - tugB.y);
  if (dTugs < 36) {
    // separate them slightly
    const nx = (tugA.x - tugB.x) / dTugs;
    tugA.x += nx * 2; tugB.x -= nx * 2;
  }

  // planes collision: if two planes too close, small separation
  for (let i=0;i<planes.length;i++){
    for (let j=i+1;j<planes.length;j++){
      const a = planes[i], b = planes[j];
      if (a.state === "finished" || b.state === "finished") continue;
      const d = Math.hypot(a.x-b.x, a.y-b.y);
      if (d < 30) {
        const nx = (a.x-b.x)/d, ny = (a.y-b.y)/d;
        a.x += nx*1.5; a.y += ny*1.5;
        b.x -= nx*1.5; b.y -= ny*1.5;
      }
    }
  }

  // cleanup finished planes
  for (let i=planes.length-1;i>=0;i--) if (planes[i].state === "finished") planes.splice(i,1);
}

// helper move for plane using px/sec from config
function movePlaneTowardPoint(pl, point, pxPerSec, dt) {
  const dx = point.x - pl.x;
  const dy = point.y - pl.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) { pl.x = point.x; pl.y = point.y; return true; }
  const vx = (dx / dist) * pxPerSec * dt;
  const vy = (dy / dist) * pxPerSec * dt;
  pl.x += vx; pl.y += vy; pl.angle = Math.atan2(dy, dx);
  return false;
}

// ---------- Drawing ----------
function render() {
  // draw background first
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // optionally draw points (dbg)
  if (showPoints && pontosGlob) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "14px Arial";
    // pouso points
    ctx.beginPath(); ctx.arc(pontosGlob.pousoInicio.x,pontosGlob.pousoInicio.y,6,0,Math.PI*2); ctx.fill();
    ctx.fillText("pousoInicio", pontosGlob.pousoInicio.x+8,pontosGlob.pousoInicio.y);
    ctx.beginPath(); ctx.arc(pontosGlob.pousoFim.x,pontosGlob.pousoFim.y,6,0,Math.PI*2); ctx.fill();
    ctx.fillText("pousoFim", pontosGlob.pousoFim.x+8,pontosGlob.pousoFim.y);
    // vagas
    for (let i=0;i<pontosGlob.vagas.length;i++){
      const v = pontosGlob.vagas[i];
      ctx.fillStyle = "rgba(130,200,255,0.9)";
      ctx.fillRect(v.x-22, v.y-12, 44, 24);
      ctx.fillStyle = "#000"; ctx.fillText("V"+(i+1), v.x-4, v.y+4);
    }
    ctx.restore();
  }

  // draw tugs under planes (visual choice)
  for (const t of tugs) t.draw();

  // draw robot
  robot.draw();

  // draw planes
  for (const pl of planes) {
    ctx.save();
    ctx.translate(pl.x, pl.y);
    ctx.font = "28px Arial";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(pl.emoji, 0, 0);
    ctx.restore();
  }

  // HUD status
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(8, 8, 320, 70);
  ctx.fillStyle = "#fff";
  ctx.font = "14px Arial";
  ctx.fillText("Planes active: " + planes.length + " / " + spawnedCount, 16, 28);
  ctx.fillText("Tugs busy: " + (tugs.filter(t=>t.busy).length) + " | Robot task: " + (robot._task||"idle"), 16, 50);
  ctx.restore();
}

// ---------- Game loop ----------
function gameLoop(ts) {
  if (!running) return;
  if (!lastTS) lastTS = ts;
  const dt = Math.min(0.05, (ts - lastTS) / 1000); // clamp dt
  lastTS = ts;

  updateEntities(dt);
  render();

  requestAnimationFrame(gameLoop);
}

// ---------- Controls ----------
btnIniciar.onclick = async () => {
  if (!pontosGlob) await loadPontos();
  if (!tugs.length) initEntities();
  running = true;
  lastTS = 0;
  requestAnimationFrame(gameLoop);
};

btnEditar.onclick = () => {
  // simple toggle to show points (we left editor disabled for now)
  showPoints = !showPoints;
  btnEditar.textContent = showPoints ? "Ocultar pontos (editar off)" : "Modificar Pontos";
};

// btnSalvar is for editor-save flow (not used here)
btnSalvar.onclick = () => { alert("Salvar pontos via editor não ativado nesta versão."); };

// ---------- Expose small helpers to console ----------
window._game = {
  pontos: () => pontosGlob,
  spawnPlane: () => { spawnPlaneIfPossible(); },
  tugs,
  planes,
  robot
};

// ---------- End of script ----------
