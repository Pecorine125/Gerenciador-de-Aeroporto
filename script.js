// ========================
// CONFIGURAÇÃO INICIAL
// ========================

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let background = new Image();
background.src = "https://raw.githubusercontent.com/Pecorine125/Gerenciador-de-Aeroporto/main/assets/cenario.png";

let EDITANDO = false;
let pontos = {};
let pontosLista = [];
let indiceEdicao = 0;

// Lista oficial de pontos editáveis
const nomePontos = [
    "pousoInicio",
    "pousoFim",
    "decolagemInicio",
    "decolagemFim",
    "rebocador1Base",
    "rebocador2Base",
    "rebocador1Busca",
    "rebocador2Busca",
    "rebocador1Entrega",
    "rebocador2Entrega",
    "roboBase",
    "pontoAbastecimento",
    "vaga1",
    "vaga2",
    "vaga3",
    "vaga4",
    "vaga5"
];


// ========================
// CARREGAR PONTOS.JSON
// ========================
async function carregarPontos() {
    const resp = await fetch("pontos.json");
    pontos = await resp.json();

    // Transformar vagas[] em vagas individuais
    pontos.vaga1 = pontos.vagas[0];
    pontos.vaga2 = pontos.vagas[1];
    pontos.vaga3 = pontos.vagas[2];
    pontos.vaga4 = pontos.vagas[3];
    pontos.vaga5 = pontos.vagas[4];

    delete pontos.vagas;
}

carregarPontos();


// ========================
// DESENHO PRINCIPAL
// ========================
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    if (EDITANDO) desenharPontos();

    requestAnimationFrame(loop);
}

loop();


// ========================
// EDITOR DE PONTOS
// ========================
function iniciarEdicao() {
    EDITANDO = true;
    indiceEdicao = 0;
    pontosLista = {};

    alert("Modo edição ativado! Clique no mapa para definir: " + nomePontos[indiceEdicao]);
    document.getElementById("btnSalvarPontos").style.display = "block";
}

function desenharPontos() {
    ctx.fillStyle = "red";
    ctx.font = "18px Arial";

    for (const nome in pontosLista) {
        const p = pontosLista[nome];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(nome, p.x + 10, p.y - 10);
    }
}

canvas.addEventListener("click", function (e) {
    if (!EDITANDO) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nome = nomePontos[indiceEdicao];
    pontosLista[nome] = { x, y };

    indiceEdicao++;

    if (indiceEdicao < nomePontos.length) {
        alert("Defina agora: " + nomePontos[indiceEdicao]);
    } else {
        alert("Todos os pontos definidos! Clique em SALVAR.");
    }
});


// ========================
// SALVAR NO GITHUB
// ========================
async function salvarPontosNoGithub() {
    let salvar = {};

    for (const nome of nomePontos) {
        salvar[nome] = pontosLista[nome];
    }

    const resposta = await fetch("/api/salvarPontos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pontos: salvar })
    });

    const dados = await resposta.json();

    alert("Pontos salvos com sucesso no GitHub!");

    EDITANDO = false;
    document.getElementById("btnSalvarPontos").style.display = "none";
}


// ========================
// BOTÕES
// ========================
document.getElementById("btnEditarPontos").onclick = iniciarEdicao;
document.getElementById("btnSalvarPontos").onclick = salvarPontosNoGithub;
