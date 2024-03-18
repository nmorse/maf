const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const circles = [];
const W = 400
const H = W
const ROT_THRUST = 0.0003
canvas.width = W
canvas.height = H

let stabilize = true
let isRotationThrustOff = true
let colorAngle = 0
let score = 1000

// state variables
let rotationThrust = 0.0
let rotationRate = 0.0
let rotationAngle = Math.PI / 2
let thrust = 0.0
let rate = [0.0, 0.0]
let position = [0.0, 0.0]


const queue = CircularList(19);

// Initialize the wormhole (circles)
let lx, ly = null
for (let i = 0; i < 18; i++) {
    if (ly !== null) {
        lx = 0
        ly = 0
    }
    const x = lx + (Math.random() * 50 - 25)
    const y = ly + (Math.random() * 50 - 25)
    queue.enqueue({
        x,
        y,
    });
    lx = x
    ly = y
}

function drawScene(deltaT, elapsedT) {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2); // translate to center
    // ship in the center of the screen 
    ctx.save()

    ctx.rotate(rotationAngle); // rotate


    ctx.strokeStyle = `rgb(0, 0, 250)`;
    ctx.beginPath();
    const minW = -canvas.width + position[0]
    const maxW = canvas.width + position[0]
    const minH = -canvas.height + position[1]
    const maxH = canvas.height + position[1]
    for (let x = minW; x < maxW; x += 50) {
        ctx.moveTo(x, minH);
        ctx.lineTo(x, maxH);
    }
    for (let y = minH; y < maxH; y += 50) {
        ctx.moveTo(minW, y);
        ctx.lineTo(maxW, y);
    }
    ctx.stroke(); // Render the path


    ctx.translate(position[0], position[1]);


    let distance = 255 + (deltaT / 70)
    queue.resetIterate()
    let circle = queue.nextItem()
    ctx.globalCompositeOperation = "lighten" // "lighten" "difference"
    colorAngle += 0.1
    colorAngle %= 360
    ca = Math.floor(colorAngle)
    while (circle) {
        if (distance <= 0) {
            break
        }
        // if (Math.abs(position[0]-circle.x) < distance/2 && Math.abs(position[1]-circle.y) < distance/2) {
        //     score++
        // }

        ctx.beginPath();
        ctx.arc(circle.x, circle.y, distance, 0, 2 * Math.PI);
        ctx.fillStyle = `hsla(${ca}deg 100% 33% / ${((255 - distance) / 2.55)}%)`;
        ctx.fill();
        // ctx.strokeStyle = `rgb(${distance},${distance},${distance})`;
        // ctx.stroke();
        distance -= 18
        ca += 10
        ca = ca % 360
        circle = queue.nextItem()
    }
    ctx.restore();
    // draw the Vessel
    ctx.strokeStyle = `rgb(200, 0, 0)`;
    ctx.beginPath();
    ctx.moveTo(-10, 10);
    ctx.lineTo(10, 10);
    ctx.lineTo(10, -10);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-10, 10);
    ctx.stroke();
    const r1 = Math.random() * 0.4 + 0.8
    const r2 = Math.random() * 6 - 3
    const r3 = Math.random() * 6 - 3
    if (rotationThrust > 0.000002) {
        ctx.beginPath();
        ctx.moveTo(10, -9);
        ctx.lineTo((10 + 30000 * rotationThrust) * r1, -9 + r2);
        ctx.moveTo(-10, 9);
        ctx.lineTo((-10 + -30000 * rotationThrust) * r1, 9 + r3);
        ctx.stroke();
    }
    if (rotationThrust < -0.000002) {
        ctx.beginPath();
        ctx.moveTo(-10, -9);
        ctx.lineTo((-10 + 30000 * rotationThrust) * r1, -9 + r2);
        ctx.moveTo(10, 9);
        ctx.lineTo((10 + -30000 * rotationThrust) * r1, 9) + r3;
        ctx.stroke();
    }
    if (Math.abs(thrust) > 0.000001) {
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(0 + r2, 30 * r1);
        ctx.stroke();
    }


    ctx.restore();
}

function thrustOn() {
    thrust = 0.01
}
function thrustOff() {
    thrust = 0.0
}
function setRotStabilize() {
    stabilize = !stabilize
}

function rotateClockwiseThrustOn() {
    rotationThrust = -ROT_THRUST
    isRotationThrustOff = false
}
function rotateThrustOff() {
    rotationThrust = 0.0
    isRotationThrustOff = true
}
function rotateCounterClockwiseThrustOn() {
    rotationThrust = ROT_THRUST
    isRotationThrustOff = false
}

function createPDController(kp, kd) {
    let prevError = 0;

    return function calculate(error, dt) {
        // Proportional term
        const p = kp * error;

        // Derivative term
        const derivative = (error - prevError) / dt;
        const d = kd * derivative;

        // Total output
        const output = p + d;

        // Update previous error for the next iteration
        prevError = error;

        return output;
    };
}

const rotationalStabilizerSystem = createPDController(0.1, 0.05);

function updateState(deltaT, elapsedT) {
    if (stabilize && rotationRate) {
        const error = -rotationRate
        const pidrRotationThrust = rotationalStabilizerSystem(error, deltaT / 1000)
        if (isRotationThrustOff) {
            rotationThrust = Math.min(Math.max(pidrRotationThrust, -ROT_THRUST), ROT_THRUST)
            // console.log(error.toFixed(5), pidrRotationThrust.toFixed(5))
        }
    }
    rotationRate += rotationThrust
    rotationAngle += rotationRate

    rate = [rate[0] + Math.sin(rotationAngle) * thrust,
    rate[1] + Math.cos(rotationAngle) * thrust]
    position = [position[0] + rate[0], position[1] + rate[1]]
    drawScene(deltaT, elapsedT);
}

const new_circle = () => {
    queue.dequeue()
    const x = lx + (Math.random() * 100 - 50)
    const y = ly + (Math.random() * 100 - 50)
    queue.enqueue({
        x,
        y,
    });
    lx = x
    ly = y
}

// let frames = 0
let previousTimeStamp, start
function animate(timeStamp) {
    if (previousTimeStamp === undefined) {
        previousTimeStamp = timeStamp;
    }
    const deltaT = timeStamp - previousTimeStamp;
    if (start === undefined) {
        start = timeStamp;
    }
    const elapsed = timeStamp - start;

    updateState(deltaT, elapsed);
    frames++
    if  (frames % 80 === 0) { // (deltaT > 4000) {
        new_circle()
        previousTimeStamp = timeStamp;
        // console.log(position, rotationAngle)
        // const scoreBoard = document.getElementById("score") 
        // scoreBoard.innerText = score+""
    }
    requestAnimationFrame(animate);
}

const heightOutput = document.querySelector("#height");
const widthOutput = document.querySelector("#width");

// Function to handle resize events
function handleResize() {
    heightOutput.textContent = window.innerHeight;
    widthOutput.textContent = window.innerWidth;
      // Get the updated width and height of the viewport
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidthRatio = viewportWidth / W;
    const viewportHeightRatio = viewportHeight / H;

    if (viewportWidthRatio < 1.0 || viewportHeightRatio < 1.5) {
        if (viewportWidthRatio < viewportHeightRatio) {
            //console.log("viewportWidth, Math.floor(H * viewportWidthRatio)", viewportWidth, Math.floor(canvas.height * viewportWidthRatio))
            changeCanvasSize(viewportWidth, Math.floor(H * viewportWidthRatio));
        }
        else {
            //console.log("Math.floor(W * viewportHeightRatio), viewportHeight", Math.floor(canvas.width * viewportHeightRatio), viewportHeight)
            changeCanvasSize(Math.floor(W * viewportHeightRatio), viewportHeight);
        }
        drawScene();
    }
}

function changeCanvasSize(newWidth, newHeight) {
    var canvas = document.getElementById("canvas");
    // Update canvas size
    canvas.width = newWidth;
    canvas.height = newHeight;
}

// Attach the event listener to the resize event
window.addEventListener('resize', handleResize);


handleResize()
drawScene();
animate();
function handleKeyDown(event) {
    if (event.keyCode === 37) {
        rotateCounterClockwiseThrustOn()
    }
    if (event.keyCode === 38) {
        thrustOn()
    }
    if (event.keyCode === 39) {
        rotateClockwiseThrustOn()
    }
    if (event.keyCode === 40) {
        thrustOff()
    }
}
function handleKeyUp(event) {
    if (event.keyCode === 37) {
        rotateThrustOff()
    }
    if (event.keyCode === 38) {
        thrustOff()
    }
    if (event.keyCode === 39) {
        rotateThrustOff()
    }
    if (event.keyCode === 40) {
        thrustOff()
    }
}
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

document.getElementById('leftArrow').addEventListener("mousedown", rotateCounterClockwiseThrustOn);
document.getElementById('upArrow').addEventListener("mousedown", thrustOn);
document.getElementById('rightArrow').addEventListener("mousedown", rotateClockwiseThrustOn);
document.getElementById('leftArrow').addEventListener("mouseup", rotateThrustOff);
document.getElementById('upArrow').addEventListener("mouseup", thrustOff);
document.getElementById('rightArrow').addEventListener("mouseup", rotateThrustOff);
document.getElementById('leftArrow').addEventListener("mouseout", rotateThrustOff);
document.getElementById('upArrow').addEventListener("mouseout", thrustOff);
document.getElementById('rightArrow').addEventListener("mouseout", rotateThrustOff);

document.getElementById('leftArrow').addEventListener("touchstart", rotateCounterClockwiseThrustOn);
document.getElementById('upArrow').addEventListener("touchstart", thrustOn);
document.getElementById('rightArrow').addEventListener("touchstart", rotateClockwiseThrustOn);
document.getElementById('leftArrow').addEventListener("touchend", rotateThrustOff);
document.getElementById('upArrow').addEventListener("touchend", thrustOff);
document.getElementById('rightArrow').addEventListener("touchend", rotateThrustOff);
