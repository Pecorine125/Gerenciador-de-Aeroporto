// ============================
// CONFIGURAÇÃO DO CANVAS
// ============================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// ============================
// CONTROLES
// ============================
let mostrarPontos = false;

document.getElementById("btnMostrar").onclick = () => mostrarPontos = true;
document.getElementById("btnEsconder").onclick = () => mostrarPontos = false;

// ============================
// CLIMA
// ============================
const estadosClima = ["Claro", "Chuva", "Neblina"];
let climaAtual = 0;

function atualizarClima() {
    climaAtual = Math.floor(Math.random() * estadosClima.length);
    document.getElementById("climaTxt").textContent = estadosClima[climaAtual];
}
setInterval(atualizarClima, 15000);

// ============================
// ÁREAS DO CENÁRIO (1366x786)
// ============================

// PISTA DE POUSO (horizontal esquerda)
const pontoEntrada = { x: 80, y: 380 };

// Ponto onde avião deve parar após pouso
const fimPouso = { x: 350, y: 380 };

// Pistas, vagas e taxiamento
const vagas = [
    { x: 500, y: 500, ocupada: false },
    { x: 600, y: 500, ocupada: false },
    { x: 700, y: 500, ocupada: false },
    { x: 800, y: 500, ocupada: false },
    { x: 900, y: 500, ocupada: false }
];

// Ponto de decolagem (lado direito)
const pistaDecolagem = { x: 1250, y: 380 };

// Base dos rebocadores
const baseRebocador = { x: 1150, y: 650 };

// Base do robô de abastecimento
const baseRobo = { x: 1050, y: 650 };

// ============================
// OBJETOS DO JOGO
// ============================
class Entidade {
    constructor(x, y, icon, velocidade) {
        this.x = x;
        this.y = y;
        this.icon = icon;
        this.vel = velocidade;
        this.raio = 18; // Para colisão
    }

    moverPara(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 2) {
            this.x += (dx / dist) * this.vel;
            this.y += (dy / dist) * this.vel;
        }
    }

    desenhar() {
        ctx.font = "28px Arial";
        ctx.fillText(this.icon, this.x, this.y);
    }
}

// ============================
// AVIÕES
// ============================

function gerarAviao() {
    const tipo = Math.floor(Math.random() * 3);

    if (tipo === 0)
        return new Entidade(pontoEntrada.x, pontoEntrada.y, "✈️", 1.0); // Grande
    if (tipo === 1)
        return new Entidade(pontoEntrada.x, pontoEntrada.y, "🛩️", 1.8); // Médio

    return new Entidade(pontoEntrada.x, pontoEntrada.y, "🛫", 2.5); // Pequeno
}

let aviaoAtual = null;
let aviõesRestantes = 5;

// ============================
// REBOCADORES
// ============================
const rebocador1 = new Entidade(baseRebocador.x, baseRebocador.y, "🚜", 2);
const rebocador2 = new Entidade(baseRebocador.x - 30, baseRebocador.y, "🚜", 2);

// ============================
// ROBÔ DE COMBUSTÍVEL
// ============================
const roboCombustivel = new Entidade(baseRobo.x, baseRobo.y, "🤖", 2);

// ============================
// TORRE DE CONTROLE
// ============================

let estado = "AGUARDANDO_AVIAO";
let vagaAtual = null;
let abastecendo = false;

function torre() {

    switch (estado) {

        case "AGUARDANDO_AVIAO":
            if (aviõesRestantes > 0) {
                aviaoAtual = gerarAviao();
                aviõesRestantes--;
                estado = "POUSANDO";
                atualizarStatus("Avião pousando…");
            }
            break;

        case "POUSANDO":
            aviaoAtual.moverPara(fimPouso.x, fimPouso.y);

            if (dist(aviaoAtual, fimPouso) < 10) {
                atualizarStatus("Rebocador 1 indo buscar avião.");
                vagaAtual = vagas.find(v => !v.ocupada);
                vagaAtual.ocupada = true;
                estado = "REBOQUE_ENTRADA";
            }
            break;

        case "REBOQUE_ENTRADA":
            rebocador1.moverPara(aviaoAtual.x, aviaoAtual.y);

            if (dist(rebocador1, aviaoAtual) < 10) {
                estado = "LEVANDO_VAGA";
                atualizarStatus("Rebocando até a vaga…");
            }
            break;

        case "LEVANDO_VAGA":
            aviaoAtual.moverPara(vagaAtual.x, vagaAtual.y);
            rebocador1.moverPara(vagaAtual.x, vagaAtual.y);

            if (dist(aviaoAtual, vagaAtual) < 10) {
                estado = "ABASTECER";
                atualizarStatus("Robô indo abastecer…");
            }
            break;

        case "ABASTECER":
            roboCombustivel.moverPara(aviaoAtual.x, aviaoAtual.y);

            if (!abastecendo && dist(roboCombustivel, aviaoAtual) < 15) {
                abastecendo = true;
                atualizarStatus("Abastecendo (3s)…");

                setTimeout(() => {
                    abastecendo = false;
                    estado = "REBOQUE_SAIDA";
                    atualizarStatus("Rebocador 2 levando para decolagem");
                }, 3000);
            }
            break;

        case "REBOQUE_SAIDA":
            rebocador2.moverPara(aviaoAtual.x, aviaoAtual.y);

            if (dist(rebocador2, aviaoAtual) < 10) {
                estado = "PARA_PISTA";
            }
            break;

        case "PARA_PISTA":
            aviaoAtual.moverPara(pistaDecolagem.x, pistaDecolagem.y);
            rebocador2.moverPara(pistaDecolagem.x, pistaDecolagem.y);

            if (dist(aviaoAtual, pistaDecolagem) < 10) {
                estado = "DECOLANDO";
                atualizarStatus("Avião decolando ➜");
            }
            break;

        case "DECOLANDO":
            aviaoAtual.x += 6;

            if (aviaoAtual.x > 1400) {
                estado = "AGUARDANDO_AVIAO";
            }
            break;
    }
}

// ============================
// SISTEMA DE COLISÃO
// ============================
function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

// ============================
// LOOP DO JOGO
// ============================
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    torre();

    if (aviaoAtual) aviaoAtual.desenhar();
    rebocador1.desenhar();
    rebocador2.desenhar();
    roboCombustivel.desenhar();

    requestAnimationFrame(loop);
}

loop();

// ============================
function atualizarStatus(msg) {
    document.getElementById("status").textContent = msg;
}
