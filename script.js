const planesContainer = document.getElementById("planes-container");
const queueBox = document.getElementById("queue");

const tug1 = document.getElementById("tug1");
const tug2 = document.getElementById("tug2");
const robot = document.getElementById("robot");

let landingQueue = [];
let activePlanes = [];
let planeCounter = 1;

// -------------------------------------------------------------
function addPlaneToQueue() {
    landingQueue.push({
        id: planeCounter++,
        state: "waiting"
    });
    updateQueueUI();
}

// cria 3 aviões iniciais
addPlaneToQueue();
addPlaneToQueue();
addPlaneToQueue();

// -------------------------------------------------------------
function updateQueueUI() {
    queueBox.innerHTML = landingQueue
        .map(p => "A" + p.id)
        .join(" | ");
}

// -------------------------------------------------------------
function authorizeLanding() {
    if (landingQueue.length === 0) return;

    const planeData = landingQueue.shift();
    updateQueueUI();
    spawnPlane(planeData);
}

// -------------------------------------------------------------
function spawnPlane(data) {
    const plane = document.createElement("div");
    plane.className = "plane";
    plane.dataset.id = data.id;

    plane.style.top = "-80px";
    plane.style.left = "400px";
    plane.style.backgroundImage =
        "url('https://cdn-icons-png.flaticon.com/512/2983/2983788.png')";

    planesContainer.appendChild(plane);

    activePlanes.push({
        id: data.id,
        element: plane,
        state: "landing",
        x: 400,
        y: -80
    });

    animateLanding(plane);
}

// -------------------------------------------------------------
function animateLanding(plane) {
    setTimeout(() => {
        plane.style.top = "240px";
        plane.style.left = "400px";
    }, 200);

    setTimeout(() => {
        startService(plane);
    }, 2000);
}

// -------------------------------------------------------------
function startService(plane) {
