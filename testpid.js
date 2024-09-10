function createPIDController(kp, ki, kd) {
    let prevError = 0;
    let integral = 0;
  
    return function calculate(error, dt) {
      // Proportional term
      const P = kp * error;
  
      // Integral term
      integral += error * dt;
      const I = ki * integral;
  
      // Derivative term
      const derivative = (error - prevError) / dt;
      const D = kd * derivative;
  
      // Total output
      const output = P + I + D;
  
      // Update previous error for the next iteration
      prevError = error;
  
      return output;
    };
  }
  
  // Example usage
//   const pidController = createPIDController(0.1, 0.01, 0.05);
    const pidController = createPIDController(0.1, 0, 0);
  
  // Setpoint (desired value)
  const setpoint = 0;
  
  // Initial process variable (current value)
  let currentPoint = 10;
  
  // Time step (in seconds)
  const dt = 0.1;
  
  // Number of iterations
  const iterations = 100;
  
  // Run the PID loop for a number of iterations
  for (let i = 0; i < iterations; i++) {
    // Calculate the error
    const error = setpoint - currentPoint;
  
    // Use the PID controller to compute the control output
    const controlOutput = pidController(error, dt);
  
    // Apply the control output to the process (in this example, just updating the process variable)
    currentPoint += controlOutput;
  
    // Display the results
    console.log(`Iteration ${i + 1}: Process Variable = ${currentPoint.toFixed(4)}`);
  }
  