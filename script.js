const plane   = document.getElementById("plane");
const tug1    = document.getElementById("tug1");
const tug2    = document.getElementById("tug2");
const robot   = document.getElementById("robot");

let planeState = "air"; // air, landed, gate, ready-takeoff

document.getElementById("btn-land").onclick = landPlane;
document.getElementById("btn-refuel").onclick = refuelPlane;
document.getElementById("btn-move-to-gate").onclick = moveToGate;
document.getElementById("btn-takeoff").onclick = sendToTakeoff;

// ---------------------------------------------------------------
function updateUI() {
    if (planeState === "air") {
        plane.style.top = "-60px";
    }

    if (planeState === "landed") {
        plane.style.top = "210px";
        plane.style.left = "360px";
    }

    if (planeState === "gate") {
        plane.style.top = "350px";
        plane.style.left = "240px";
    }

    if (planeState === "ready-takeoff") {
        plane.style.top = "210px";
        plane.style.left = "550px";
    }
}
// ---------------------------------------------------------------

function landPlane() {
    if (planeState !== "air") return;
    planeState = "landed";
    updateUI();
}

function refuelPlane() {
    if (planeState !== "landed" && planeState !== "gate") return;

    robot.style.top = plane.style.top;
    robot.style.left = (parseInt(plane.style.left) + 90) + "px";
}

function moveToGate() {
    if (planeState !== "landed") return;

    tug1.style.top = plane.style.top;
    tug1.style.left = (parseInt(plane.style.left) - 50) + "px";

    planeState = "gate";
    updateUI();
}

function sendToTakeoff() {
    if (planeState !== "gate") return;

    tug2.style.top = plane.style.top;
    tug2.style.left = (parseInt(plane.style.left) + 110) + "px";

    planeState = "ready-takeoff";
    updateUI();
}
