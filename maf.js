(() => {
    // …

    const spaceCanvas = document.getElementById("spaceCanvas");
    const ctx = spaceCanvas.getContext('2d');
    const circles = [];
    const W = 800
    const H = W
    const ROT_THRUST = 0.0003
    spaceCanvas.width = W
    spaceCanvas.height = H
    let stabilize = true
    let isRotationThrustOff = true
    let colorAngle = 180
    let fuel = 3000
    const fuelCap = 6000

    // state variables
    let rotationThrust = 0.0
    let rotationRate = 0.0
    let rotationAngle = Math.PI / 2
    let thrust = 0.0
    let rate = [0.0, 0.0]
    let position = [0.0, 0.0]
    let lx, ly = null

    const queue = CircularList(20);
    let repelForce = [0, 0]

    const init = () => {
        stabilize = true
        isRotationThrustOff = true
        colorAngle = 180
        fuel = 3000

        // state variables
        rotationThrust = 0.0
        rotationRate = 0.0
        rotationAngle = Math.PI / 2
        thrust = 0.0
        rate = [0.0, 0.0]
        position = [0.0, 0.0]

        repelForce = [0, 0]

        // Initialize the wormhole (circles)
        lx = null 
        ly = null
        queue.clear()
        for (let i = 0; i < 18; i++) {
            if (ly !== null) {
                lx = -300
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
    }

    init()

    function drawScene(deltaT, elapsedT) {
        ctx.save();
        ctx.clearRect(0, 0, spaceCanvas.width, spaceCanvas.height);
        ctx.translate(spaceCanvas.width / 2, spaceCanvas.height / 2); // translate to center
        // ship in the center of the screen 
        ctx.save()

        ctx.rotate(rotationAngle); // rotate


        ctx.strokeStyle = `rgb(0, 0, 250)`;
        ctx.beginPath();
        const minW = -spaceCanvas.width + position[0]
        const maxW = spaceCanvas.width + position[0]
        const minH = -spaceCanvas.height + position[1]
        const maxH = spaceCanvas.height + position[1]
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


        let distance = 255 + (deltaT / 110)
        // console.log(distance)
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
        ctx.moveTo(-6, 10);

        // main thruster nozzle
        ctx.lineTo(-1, 10);
        ctx.lineTo(-3, 15);
        ctx.lineTo(3, 15);
        ctx.lineTo(1, 10);

        ctx.lineTo(6, 10);

        // rotation nozzle rb
        ctx.lineTo(10, 10);
        ctx.lineTo(6, 10);
        

        ctx.lineTo(10, 6);
        ctx.lineTo(10, -6);

        // rotation nozzle rt
        ctx.lineTo(6, -10);
        ctx.lineTo(10, -10);

        ctx.lineTo(6, -10);
        ctx.lineTo(-6, -10);

        // rotation nozzle lt
        ctx.lineTo(-10, -10);
        ctx.lineTo(-6, -10);
        
        ctx.lineTo(-10, -6);
        ctx.lineTo(-10, 6);

        // rotation nozzle rt
        ctx.lineTo(-6, 10);
        ctx.lineTo(-10, 10);
        
        ctx.lineTo(-6, 10);
        ctx.stroke();
        // draw the fuel level
        ctx.fillStyle = `rgb(20, 255, 20)`
        ctx.strokeStyle = `rgb(20, 255, 20)`
//        ctx.save();
        ctx.fillRect(-2, 10, 4, -fuel / fuelCap * 20);
//        ctx.restore();

        if (fuel > 0) {
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
                ctx.moveTo(r3, 15);
                ctx.lineTo(0 + r2 + r3*2, 30 * r1);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    function thrustOn(e) {
        e.preventDefault();
        thrust = 0.01
    }
    function thrustOff(e) {
        e.preventDefault();
        thrust = 0.0
    }
    function setRotStabilize() {
        // e.preventDefault();
        stabilize = !stabilize
        console.log("stabilize", stabilize)
    }

    function rotateClockwiseThrustOn(e) {
        e.preventDefault();
        rotationThrust = -ROT_THRUST
        isRotationThrustOff = false
    }
    function rotateThrustOff(e) {
        e.preventDefault();
        rotationThrust = 0.0
        isRotationThrustOff = true
    }
    function rotateCounterClockwiseThrustOn(e) {
        e.preventDefault();
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
        // go
        if (fuel > 0) {
            rotationRate += rotationThrust
            rotationAngle += rotationRate
            // console.log(rotationThrust, thrust)
            fuel = fuel - Math.abs(thrust * 100) - Math.abs(rotationThrust * 100)
            rate = [rate[0] + Math.sin(rotationAngle) * thrust,
            rate[1] + Math.cos(rotationAngle) * thrust]
            rate = [rate[0] + repelForce[0], rate[1] + repelForce[1]]
        }
        position = [position[0] + rate[0], position[1] + rate[1]]
        drawScene(deltaT, elapsedT);
    }

    const distance = (dx, dy) => Math.sqrt(dx*dx + dy*dy)

    const new_circle = () => {
        queue.dequeue()
        const x = lx + (Math.random() * 100 - 50)
        const y = ly + (Math.random() * 100 - 50)
        // console.log(position[0] + x, position[1] + y)
        queue.enqueue({
            x,
            y,
        });

        queue.resetIterate()
        let circle = queue.nextItem()
        let radius = 180
        let points = 1
        repelForce = [0, 0]
        const rf = 0.0008 // repulse factor
        // console.log("-----------")
        while (circle) {
            // console.log(radius)
            if (distance(position[0] + circle.x, position[1] + circle.y) < radius) {
                if (fuel <= fuelCap) {
                    fuel = Math.min(fuel + points, fuelCap)
                }
                // console.log(points)
                repelForce = [
                    repelForce[0] + (1 / radius) * rf * (position[0] + circle.x),
                    repelForce[1] + (1 / radius) * rf * (position[1] + circle.y)]
            }
            circle = queue.nextItem()
            radius -= 9
            points += 1
        }
        if (distance(position[0] + x, position[1] + y) < 10) {
            fuel += 800
        }


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
        // frames++
        if (deltaT > 2000) { // (frames % 80 === 0) { 
            // console.log("deltaT, elapsed", deltaT, elapsed);
            new_circle()
            previousTimeStamp = timeStamp;
            // console.log(position, rotationAngle)
            const scoreBoard = document.getElementById("score")
            scoreBoard.innerText = Math.round(fuel) + ""
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
                console.log("(viewportWidthRatio < viewportHeightRatio) viewportWidth, Math.floor(H * viewportWidthRatio)", viewportWidth, Math.floor(spaceCanvas.height * viewportWidthRatio))
                changeCanvasSize(viewportWidth, Math.floor(H * viewportWidthRatio));
            }
            else {
                console.log("!(viewportWidthRatio < viewportHeightRatio) Math.floor(W * viewportHeightRatio), viewportHeight", Math.floor(spaceCanvas.width * viewportHeightRatio), viewportHeight)
                changeCanvasSize(Math.floor(W * viewportHeightRatio), viewportHeight);
            }
            drawScene();
        }
    }

    function changeCanvasSize(newWidth, newHeight) {
        // var spaceCanvas = document.getElementById("space-spaceCanvas");
        // Update spaceCanvas size
        spaceCanvas.width = newWidth;
        spaceCanvas.height = newHeight;
    }

    handleResize()
    drawScene();
    animate();
    function handleKeyDown(event) {
        if (event.keyCode === 37) {
            rotateCounterClockwiseThrustOn(event)
        }
        if (event.keyCode === 38) {
            thrustOn(event)
        }
        if (event.keyCode === 39) {
            rotateClockwiseThrustOn(event)
        }
        if (event.keyCode === 40) {
            thrustOff(event)
        }
    }
    function handleKeyUp(event) {
        if (event.keyCode === 37) {
            rotateThrustOff(event)
        }
        if (event.keyCode === 38) {
            thrustOff(event)
        }
        if (event.keyCode === 39) {
            rotateThrustOff(event)
        }
        if (event.keyCode === 40) {
            thrustOff(event)
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        console.log("DOMContentLoaded")
        // Attach the event listener to the resize event
        window.addEventListener('resize', handleResize)

        document.getElementById("RESET").addEventListener("click", init)
        document.getElementById("RotStabilize").addEventListener("change", setRotStabilize);
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
    })


})();