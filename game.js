const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ------ CONFIGURAÇÕES ------
const pista = {
    x: 150,
    y: 100,
    w: 1066,
    h: 568
};

// posições simples da pista para os veículos andarem
const path = [
    {x: 200, y: 150},
    {x: 800, y: 150},
    {x: 1100, y: 300},
    {x: 800, y: 500},
    {x: 200, y: 500},
    {x: 150, y: 300}
];

// objetos do jogo
class Veiculo {
    constructor(x, y, cor) {
        this.x = x;
        this.y = y;
        this.cor = cor;
        this.speed = 2;
        this.target = 0;
    }

    mover() {
        let t = path[this.target];
        let dx = t.x - this.x;
        let dy = t.y - this.y;
        let dist = Math.hypot(dx, dy);

        if (dist < 4) {
            this.target = (this.target + 1) % path.length;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    desenhar() {
        ctx.fillStyle = this.cor;
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
    }
}

class Aviao extends Veiculo {
    constructor() {
        super(300, 150, "#77b7ff");
        this.estado = "aguardando";
    }
}

class Rebocador extends Veiculo {
    constructor(cor) {
        super(150, 300, cor);
    }
}

class Robo extends Veiculo {
    constructor() {
        super(1100, 300, "#ffcd50");
    }
}

// Instâncias
let avioes = [new Aviao()];
let rebocador1 = new Rebocador("#5cff8a");
let rebocador2 = new Rebocador("#00ffbf");
let robo = new Robo();

// ----- DESENHO DO CENÁRIO -----
function desenharCenario() {
    ctx.fillStyle = "#b8b9bb";
    ctx.fillRect(pista.x, pista.y, pista.w, pista.h);

    ctx.fillStyle = "#99c7ff";
    for (let i = 0; i < 7; i++) {
        ctx.fillRect(360 + i * 120, 250, 80, 120);
    }

    ctx.strokeStyle = "#bbbbbb";
    ctx.lineWidth = 40;
    ctx.strokeRect(100, 50, 1166, 668);
}

// ----- LOOP DO JOGO -----
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // cenário
    desenharCenario();

    // movimento
    avioes.forEach(a => a.mover());
    rebocador1.mover();
    rebocador2.mover();
    robo.mover();

    // desenho
    avioes.forEach(a => a.desenhar());
    rebocador1.desenhar();
    rebocador2.desenhar();
    robo.desenhar();

    requestAnimationFrame(loop);
}

loop();
