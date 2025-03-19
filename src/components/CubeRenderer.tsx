import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
//@ts-expect-error missing types
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  generateTemperatureGrid,
  updateTemperatureGrid,
} from "./HeatSimulation";

const RubiksCubeWithTemperature: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  // State for user-controlled parameters
  const [initialCubeTemp, setInitialCubeTemp] = useState(25);
  const [initialWaterTemp, setInitialWaterTemp] = useState(100);
  const [timeStep, setTimeStep] = useState(0.1); // Time step for simulation
  const [totalCubes, setTotalCubes] = useState(7); // Number of smaller cubes along one dimension
  const [isRunning, setIsRunning] = useState(false); // State to control simulation
  const [timePassed, setTimePassed] = useState(0); // Time passed since simulation start

  // State for thermal properties
  const [thermalConductivity, setThermalConductivity] = useState(2); // W/(m·K)
  const [density, setDensity] = useState(2400); // kg/m³
  const [specificHeat, setSpecificHeat] = useState(1000); // J/(kg·K)
  const [cubeLength, setCubeLength] = useState(1); // m

  useEffect(() => {
    const mount = mountRef.current;

    // Scene, Camera, and Renderer setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount?.appendChild(renderer.domElement);

    // Camera positioning
    camera.position.z = totalCubes;

    // OrbitControls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controls.update();

    // Cube parameters
    const cubeSize = 1; // Fixed size of each smaller cube
    const gap = 0.05; // Gap between cubes

    // Precompute alpha once at the beginning of the simulation
    const alpha =
      (thermalConductivity * timeStep) /
      (density * specificHeat * (cubeSize / totalCubes) ** 2);

    console.log(alpha);

    // Function to map temperature to a color
    const temperatureToColor = (temp: number) => {
      const t = Math.min(Math.max(temp / 200, 0), 1); // Normalize temp to [0, 1]
      const r = t; // Red increases with temperature
      const g = 0; // Green remains constant
      const b = 1 - t; // Blue decreases with temperature
      return new THREE.Color(r, g, b);
    };

    // Function to create a text texture for temperature
    const createTextTexture = (temp: number) => {
      const canvas = document.createElement("canvas");
      const size = 512; // Increase canvas size for better resolution
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");

      if (context) {
        // Transparent background
        context.clearRect(0, 0, size, size);

        // Text color and style
        context.fillStyle = "#000000"; // Black text
        context.font = "bold 64px Arial"; // Smaller font size for better fit
        context.textAlign = "center";
        context.textBaseline = "middle";

        // Draw the temperature with fractional part
        context.fillText(`${temp.toFixed(2)}°C`, size / 2, size / 2);
      }

      return new THREE.CanvasTexture(canvas);
    };

    // Generate the initial temperature grid
    let temperatureGrid = generateTemperatureGrid(totalCubes, initialCubeTemp);

    // Set boundary temperatures
    for (let x = 0; x < totalCubes; x++) {
      for (let y = 0; y < totalCubes; y++) {
        for (let z = 0; z < totalCubes; z++) {
          if (
            x === 0 ||
            y === 0 ||
            z === 0 ||
            x === totalCubes - 1 ||
            y === totalCubes - 1 ||
            z === totalCubes - 1
          ) {
            temperatureGrid[x][y][z] = initialWaterTemp;
          }
        }
      }
    }

    // Create smaller cubes with temperature-based coloring and labels
    const cubes: THREE.Mesh[] = [];
    const labels: THREE.Mesh[] = [];
    for (let x = 0; x < totalCubes; x++) {
      for (let y = 0; y < totalCubes; y++) {
        for (let z = 0; z < totalCubes; z++) {
          if (
            x === 0 ||
            y === 0 ||
            z === 0 ||
            x === totalCubes - 1 ||
            y === totalCubes - 1 ||
            z === totalCubes - 1
          ) {
            continue;
          }

          const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
          const material = new THREE.MeshBasicMaterial({
            color: temperatureToColor(temperatureGrid[x][y][z]),
          });
          const smallCube = new THREE.Mesh(geometry, material);

          // Position the smaller cubes
          smallCube.position.set(
            x * (cubeSize + gap) - ((cubeSize + gap) * (totalCubes - 1)) / 2,
            y * (cubeSize + gap) - ((cubeSize + gap) * (totalCubes - 1)) / 2,
            z * (cubeSize + gap) - ((cubeSize + gap) * (totalCubes - 1)) / 2
          );

          // Create and attach labels for each face
          const tempTexture = createTextTexture(temperatureGrid[x][y][z]);
          const labelMaterial = new THREE.MeshBasicMaterial({
            map: tempTexture,
            transparent: true,
          });
          const labelGeometry = new THREE.PlaneGeometry(cubeSize, cubeSize);

          // Front
          const frontLabel = new THREE.Mesh(labelGeometry, labelMaterial);
          frontLabel.position.copy(smallCube.position);
          frontLabel.position.z += cubeSize / 2 + 0.01; // Slightly offset in front
          scene.add(frontLabel);

          // Back
          const backLabel = new THREE.Mesh(labelGeometry, labelMaterial);
          backLabel.position.copy(smallCube.position);
          backLabel.position.z -= cubeSize / 2 + 0.01; // Slightly offset behind
          backLabel.rotation.y = Math.PI; // Rotate to face outward
          scene.add(backLabel);

          // Top
          const topLabel = new THREE.Mesh(labelGeometry, labelMaterial);
          topLabel.position.copy(smallCube.position);
          topLabel.position.y += cubeSize / 2 + 0.01; // Slightly offset above
          topLabel.rotation.x = -Math.PI / 2; // Rotate to face upward
          scene.add(topLabel);

          // Bottom
          const bottomLabel = new THREE.Mesh(labelGeometry, labelMaterial);
          bottomLabel.position.copy(smallCube.position);
          bottomLabel.position.y -= cubeSize / 2 + 0.01; // Slightly offset below
          bottomLabel.rotation.x = Math.PI / 2; // Rotate to face downward
          scene.add(bottomLabel);

          // Left
          const leftLabel = new THREE.Mesh(labelGeometry, labelMaterial);
          leftLabel.position.copy(smallCube.position);
          leftLabel.position.x -= cubeSize / 2 + 0.01; // Slightly offset to the left
          leftLabel.rotation.y = -Math.PI / 2; // Rotate to face outward
          scene.add(leftLabel);

          // Right
          const rightLabel = new THREE.Mesh(labelGeometry, labelMaterial);
          rightLabel.position.copy(smallCube.position);
          rightLabel.position.x += cubeSize / 2 + 0.01; // Slightly offset to the right
          rightLabel.rotation.y = Math.PI / 2; // Rotate to face outward
          scene.add(rightLabel);

          cubes.push(smallCube);
          labels.push(
            frontLabel,
            backLabel,
            topLabel,
            bottomLabel,
            leftLabel,
            rightLabel
          );
          scene.add(smallCube);
        }
      }
    }

    // Animation loop
    const animate = () => {
      if (!isRunning) return; // Stop the simulation if not running

      controls.update();

      // Update the temperature grid
      temperatureGrid = updateTemperatureGrid(
        temperatureGrid,
        totalCubes,
        alpha
      );
      setTimePassed((prev) => {
        const newTimePassed = prev + timeStep;
        console.log(`Time passed: ${newTimePassed.toFixed(2)}s`);
        return newTimePassed;
      });

      // Update cube temperatures and labels
      let index = 0;
      for (let x = 1; x < totalCubes - 1; x++) {
        for (let y = 1; y < totalCubes - 1; y++) {
          for (let z = 1; z < totalCubes - 1; z++) {
            const cube = cubes[index];
            const temp = temperatureGrid[x][y][z];

            // Update color
            (cube.material as THREE.MeshBasicMaterial).color =
              temperatureToColor(temp);

            // Update label textures for all six sides
            for (let j = 0; j < 6; j++) {
              const label = labels[index * 6 + j];
              const material = label.material as THREE.MeshBasicMaterial; // Explicitly cast to MeshBasicMaterial
              const canvas = material.map?.image as HTMLCanvasElement; // Safely access the map property
              const context = canvas?.getContext("2d");
              if (context) {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.fillText(
                  `${temp.toFixed(4)}°C`,
                  canvas.width / 2,
                  canvas.height / 2
                );
                material.map!.needsUpdate = true; // Use non-null assertion operator
              }
            }

            index++;
          }
        }
      }

      // Render the scene
      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    // Cleanup on unmount
    return () => {
      renderer.setAnimationLoop(null);
      controls.dispose();
      mount?.removeChild(renderer.domElement);
    };
  }, [
    initialCubeTemp,
    initialWaterTemp,
    timeStep,
    totalCubes,
    isRunning, // Re-run effect when simulation state changes
    density,
    specificHeat,
    thermalConductivity,
  ]);

  return (
    <div>
      {/* Menu for user input */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1,
          background: "white",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        <h3>Simulation Controls</h3>
        <label>
          Initial Cube Temp: {initialCubeTemp}°C
          <input
            type="range"
            min="0"
            max="100"
            value={initialCubeTemp}
            onChange={(e) => setInitialCubeTemp(Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Initial Water Temp: {initialWaterTemp}°C
          <input
            type="range"
            min="0"
            max="200"
            value={initialWaterTemp}
            onChange={(e) => setInitialWaterTemp(Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Cube Discretization: {totalCubes - 2}
          <input
            type="range"
            min="3"
            max="20"
            value={totalCubes - 2}
            onChange={(e) => setTotalCubes(Number(e.target.value) + 2)}
          />
        </label>
        <br />
        <label>
          Cube length: {cubeLength} m
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={cubeLength}
            onChange={(e) => setCubeLength(Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Time Step: {timeStep} s
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={timeStep}
            onChange={(e) => setTimeStep(Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Thermal Conductivity: {thermalConductivity} W/(m·K)
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={thermalConductivity}
            onChange={(e) => setThermalConductivity(Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Density: {density} kg/m³
          <input
            type="range"
            min="500"
            max="5000"
            step="100"
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Specific Heat: {specificHeat} J/(kg·K)
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={specificHeat}
            onChange={(e) => setSpecificHeat(Number(e.target.value))}
          />
        </label>
        <br />
        <button
          onClick={() => {
            setIsRunning((prev) => {
              if (!prev) {
                setTimePassed(0); // Reset timePassed when starting the simulation
              }
              return !prev;
            });
          }}
        >
          {isRunning ? "Stop Simulation" : "Start Simulation"}
        </button>
        <p>Time Elapsed: {timePassed.toFixed(1)} s </p>
      </div>

      {/* 3D Scene */}
      <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />
    </div>
  );
};

export default RubiksCubeWithTemperature;
