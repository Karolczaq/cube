import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
//@ts-expect-error missing types
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  generateTemperatureGrid,
  updateTemperatureGrid,
} from "./HeatSimulation";

const CubeRenderer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  const [initialCubeTemp, setInitialCubeTemp] = useState(25);
  const [initialWaterTemp, setInitialWaterTemp] = useState(100);
  const [timeStep, setTimeStep] = useState(0.1);
  const [totalCubes, setTotalCubes] = useState(7);
  const [isRunning, setIsRunning] = useState(false);
  const [timePassed, setTimePassed] = useState(0);

  const [thermalConductivity, setThermalConductivity] = useState(2);
  const [density, setDensity] = useState(2400);
  const [specificHeat, setSpecificHeat] = useState(1000);
  const [cubeLength, setCubeLength] = useState(1);

  useEffect(() => {
    const mount = mountRef.current;

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

    camera.position.z = totalCubes;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controls.update();

    const cubeSize = 1;
    const gap = 0.05;

    const alpha =
      (thermalConductivity * timeStep) /
      (density * specificHeat * (cubeSize / totalCubes) ** 2);

    console.log(alpha);

    const temperatureToColor = (temp: number) => {
      const t = Math.min(Math.max(temp / 200, 0), 1);
      const r = t;
      const g = 0;
      const b = 1 - t;
      return new THREE.Color(r, g, b);
    };

    const createTextTexture = (temp: number) => {
      const canvas = document.createElement("canvas");
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");

      if (context) {
        context.clearRect(0, 0, size, size);
        context.fillStyle = "#000000";
        context.font = "bold 64px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(`${temp.toFixed(2)}°C`, size / 2, size / 2);
      }

      return new THREE.CanvasTexture(canvas);
    };

    let temperatureGrid = generateTemperatureGrid(totalCubes, initialCubeTemp);

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

          smallCube.position.set(
            x * (cubeSize + gap) - ((cubeSize + gap) * (totalCubes - 1)) / 2,
            y * (cubeSize + gap) - ((cubeSize + gap) * (totalCubes - 1)) / 2,
            z * (cubeSize + gap) - ((cubeSize + gap) * (totalCubes - 1)) / 2
          );

          const tempTexture = createTextTexture(temperatureGrid[x][y][z]);
          const labelMaterial = new THREE.MeshBasicMaterial({
            map: tempTexture,
            transparent: true,
          });
          const labelGeometry = new THREE.PlaneGeometry(cubeSize, cubeSize);

          const frontLabel = new THREE.Mesh(labelGeometry, labelMaterial);
          frontLabel.position.copy(smallCube.position);
          frontLabel.position.z += cubeSize / 2 + 0.01;
          scene.add(frontLabel);

          const backLabel = new THREE.Mesh(labelGeometry, labelMaterial);
          backLabel.position.copy(smallCube.position);
          backLabel.position.z -= cubeSize / 2 + 0.01;
          backLabel.rotation.y = Math.PI;
          scene.add(backLabel);

          const topLabel = new THREE.Mesh(labelGeometry, labelMaterial);
          topLabel.position.copy(smallCube.position);
          topLabel.position.y += cubeSize / 2 + 0.01;
          topLabel.rotation.x = -Math.PI / 2;
          scene.add(topLabel);

          const bottomLabel = new THREE.Mesh(labelGeometry, labelMaterial);
          bottomLabel.position.copy(smallCube.position);
          bottomLabel.position.y -= cubeSize / 2 + 0.01;
          bottomLabel.rotation.x = Math.PI / 2;
          scene.add(bottomLabel);

          const leftLabel = new THREE.Mesh(labelGeometry, labelMaterial);
          leftLabel.position.copy(smallCube.position);
          leftLabel.position.x -= cubeSize / 2 + 0.01;
          leftLabel.rotation.y = -Math.PI / 2;
          scene.add(leftLabel);

          const rightLabel = new THREE.Mesh(labelGeometry, labelMaterial);
          rightLabel.position.copy(smallCube.position);
          rightLabel.position.x += cubeSize / 2 + 0.01;
          rightLabel.rotation.y = Math.PI / 2;
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

    const animate = () => {
      if (!isRunning) return;

      controls.update();

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

      const center = new THREE.Vector3(0, 0, 0);
      const cameraDistance = Math.sqrt(camera.position.lengthSq());

      let index = 0;
      for (let x = 1; x < totalCubes - 1; x++) {
        for (let y = 1; y < totalCubes - 1; y++) {
          for (let z = 1; z < totalCubes - 1; z++) {
            const cube = cubes[index];
            const temp = temperatureGrid[x][y][z];

            const cubePosition = new THREE.Vector3(
              x * (cubeSize + gap) - ((cubeSize + gap) * (totalCubes - 1)) / 2,
              y * (cubeSize + gap) - ((cubeSize + gap) * (totalCubes - 1)) / 2,
              z * (cubeSize + gap) - ((cubeSize + gap) * (totalCubes - 1)) / 2
            );
            const distance = cubePosition.distanceTo(center);

            if (distance <= cameraDistance - 2) {
              cube.visible = true;
              (cube.material as THREE.MeshBasicMaterial).color =
                temperatureToColor(temp);

              for (let j = 0; j < 6; j++) {
                const label = labels[index * 6 + j];
                label.visible = true;

                const material = label.material as THREE.MeshBasicMaterial;
                const canvas = material.map?.image as HTMLCanvasElement;
                const context = canvas?.getContext("2d");
                if (context) {
                  context.clearRect(0, 0, canvas.width, canvas.height);
                  context.fillText(
                    `${temp.toFixed(4)}°C`,
                    canvas.width / 2,
                    canvas.height / 2
                  );
                  material.map!.needsUpdate = true;
                }
              }
            } else {
              cube.visible = false;

              for (let j = 0; j < 6; j++) {
                const label = labels[index * 6 + j];
                label.visible = false;
              }
            }
            index++;
          }
        }
      }
      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);
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
    isRunning,
    density,
    specificHeat,
    thermalConductivity,
  ]);

  return (
    <div>
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
            min="1"
            max="9"
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
                setTimePassed(0);
              }
              return !prev;
            });
          }}
        >
          {isRunning ? "Stop Simulation" : "Start Simulation"}
        </button>
        <p>Time Elapsed: {timePassed.toFixed(1)} s </p>
      </div>
      <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />
    </div>
  );
};

export default CubeRenderer;
