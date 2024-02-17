const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const circles = [];
const W = 500
const H = W
const ROT_THRUST = 0.0003
canvas.width = W
canvas.height = H

let stabilize = false
let isRotationThrustOff = true
let colorAngle = 0

// state variables
let rotationThrust = 0.0
let rotationRate = 0.0
let rotationAngle = Math.PI / 2
let thrust = 0.0
let rate = [0.0, 0.0]
let position = [0.0, 0.0]


function CircularList(size) {
    const items = new Array(size);
    let headIndex = 0;
    let tailIndex = 0;
    let iterationIndex = 0;
    let length = 0;

    const nextIndex = (index) => (index + 1) % size;

    const enqueue = (item) => {
        if (nextIndex(tailIndex) !== headIndex) {
            items[tailIndex] = item;
            tailIndex = nextIndex(tailIndex);
            length++
        } else {
            throw new Error('Circular list is full. Cannot enqueue.');
        }
    };

    const dequeue = () => {
        if (headIndex !== tailIndex) {
            const item = items[headIndex];
            headIndex = nextIndex(headIndex);
            length--
            return item;
        } else {
            throw new Error('Circular list is empty. Cannot dequeue.');
        }
    };

    const resetIterate = () => {
        iterationIndex = headIndex; //(headIndex - 1 + size) % (size || 1);
    };

    const nextItem = () => {
        if (iterationIndex === tailIndex) {
            return null;
        }
        const currentItem = items[iterationIndex];
        iterationIndex = (iterationIndex + 1) % (size || 1);
        return currentItem;
    };

    return {
        nextItem,
        resetIterate,
        enqueue,
        dequeue
    };

}

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
    ctx.clearRect(0, 0, W, H);
    ctx.translate(W / 2, H / 2); // translate to center
    // ship in the center of the screen 
    ctx.save()

    ctx.rotate(rotationAngle); // rotate


    ctx.strokeStyle = `rgb(0, 0, 250)`;
    ctx.beginPath();
    const minW = -W + position[0]
    const maxW = W + position[0]
    const minH = -H + position[1]
    const maxH = H + position[1]
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
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, distance, 0, 2 * Math.PI);
        ctx.fillStyle = `hsla(${ca}deg 100% 33% / ${((255 - distance)/2.55)}%)`;
        ctx.fill();
        // ctx.strokeStyle = `rgb(${distance},${distance},${distance})`;
        // ctx.stroke();
        distance -= 18
        ca += 360/36
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

    if (rotationThrust > 0.000002) {
        ctx.beginPath();
        ctx.moveTo(10, -9);
        ctx.lineTo(10 + 30000*rotationThrust, -9);
        ctx.moveTo(-10, 9);
        ctx.lineTo(-10 + -30000*rotationThrust, 9);
        ctx.stroke();
    }
    if (rotationThrust < -0.000002) {
        ctx.beginPath();
        ctx.moveTo(-10, -9);
        ctx.lineTo(-10 + 30000*rotationThrust, -9);
        ctx.moveTo(10, 9);
        ctx.lineTo(10 + -30000*rotationThrust, 9);
        ctx.stroke();
    }
    if (Math.abs(thrust) > 0.000001) {
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(0, 20);
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
        const pidrRotationThrust = rotationalStabilizerSystem(error, deltaT/1000)
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

let frames = 0
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
    if (frames % 80 === 0) {
        new_circle()
        previousTimeStamp = timeStamp;
        // console.log(position, rotationAngle)
    }
    requestAnimationFrame(animate);
}

// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;
    drawScene();
});

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
