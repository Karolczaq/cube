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
  const [middleTemp, setMiddleTemp] = useState(0);

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
    const middle = Math.floor((totalCubes - 2) / 2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controls.update();

    const cubeSize = 1;
    const gap = 0.05;
    const renderedCubes = totalCubes - 2;

    const alpha =
      (thermalConductivity * timeStep) /
      (density * specificHeat * (cubeLength / (totalCubes - 2)) ** 2);

    console.log(alpha);

    // const createTextTexture = (text: string) => {
    //   const canvas = document.createElement("canvas");
    //   const size = 256; // Canvas size for better resolution
    //   canvas.width = size;
    //   canvas.height = size;
    //   const context = canvas.getContext("2d");

    //   if (context) {
    //     context.clearRect(0, 0, size, size);
    //     context.fillStyle = "black";
    //     context.font = "bold 48px Arial";
    //     context.textAlign = "center";
    //     context.textBaseline = "middle";
    //     context.fillText(text, size / 2, size / 2);
    //   }

    //   return new THREE.CanvasTexture(canvas);
    // };

    const temperatureToColor = (temp: number) => {
      const t = Math.min(Math.max(temp / 200, 0), 1);
      const r = t;
      const g = 0;
      const b = 1 - t;
      return new THREE.Color(r, g, b);
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
    const material = new THREE.MeshBasicMaterial();
    const instancedMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
      material,
      renderedCubes ** 3
    );
    let index = 0;
    for (let x = 0; x < renderedCubes; x++) {
      for (let y = 0; y < renderedCubes; y++) {
        for (let z = 0; z < renderedCubes; z++) {
          const matrix = new THREE.Matrix4();
          matrix.setPosition(
            x * (cubeSize + gap) - ((cubeSize + gap) * (renderedCubes - 1)) / 2,
            y * (cubeSize + gap) - ((cubeSize + gap) * (renderedCubes - 1)) / 2,
            z * (cubeSize + gap) - ((cubeSize + gap) * (renderedCubes - 1)) / 2
          );
          instancedMesh.setMatrixAt(index, matrix);

          const color = temperatureToColor(
            temperatureGrid[x + 1][y + 1][z + 1]
          );
          instancedMesh.setColorAt(index, color);

          index++;
        }
      }
    }
    instancedMesh.instanceColor!.needsUpdate = true;
    scene.add(instancedMesh);

    const animate = () => {
      if (!isRunning) return;

      controls.update();

      temperatureGrid = updateTemperatureGrid(
        temperatureGrid,
        totalCubes,
        alpha
      );
      setMiddleTemp(temperatureGrid[middle][middle][middle]);
      setTimePassed((prev) => {
        const newTimePassed = prev + timeStep;
        return newTimePassed;
      });
      let index = 0;
      for (let x = 0; x < renderedCubes; x++) {
        for (let y = 0; y < renderedCubes; y++) {
          for (let z = 0; z < renderedCubes; z++) {
            const color = temperatureToColor(
              temperatureGrid[x + 1][y + 1][z + 1]
            );
            instancedMesh.setColorAt(index, color);
            index++;
          }
        }
      }
      instancedMesh.instanceColor!.needsUpdate = true;
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
    cubeLength,
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
            disabled={isRunning}
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
            disabled={isRunning}
          />
        </label>
        <br />
        <label>
          Cube Discretization: {totalCubes - 2}
          <input
            type="range"
            min="1"
            max="30"
            value={totalCubes - 2}
            onChange={(e) => setTotalCubes(Number(e.target.value) + 2)}
            disabled={isRunning}
          />
        </label>
        <br />
        <label>
          Cube length: {cubeLength} m
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={cubeLength}
            onChange={(e) => setCubeLength(Number(e.target.value))}
            disabled={isRunning}
          />
        </label>
        <br />
        <label>
          Time Step: {timeStep} s
          <input
            type="range"
            min="0.01"
            max="0.1"
            step="0.001"
            value={timeStep}
            onChange={(e) => setTimeStep(Number(e.target.value))}
            disabled={isRunning}
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
            disabled={isRunning}
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
            disabled={isRunning}
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
            disabled={isRunning}
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
        <p>Middle Cube Temparature: {middleTemp.toFixed(2)}</p>
      </div>
      <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />
    </div>
  );
};

export default CubeRenderer;
