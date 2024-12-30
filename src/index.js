import { assert } from "./assert.js";
import { render } from "./render.js";
import {
  generateBinTreeMaze as generateBinTreeMazeGPU,
  generateHardcodedMaze as generateHardcodedMazeGPU,
} from "./gpuMaze.js";
import {
  generateBinTreeMaze as generateBinTreeMazeCPU,
  generateHardcodedMaze as generateHardcodedMazeCPU,
} from "./maze.js";
import { round } from "remeda";

const maxSize = 65535;

const main = async () => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  assert(device, new Error("Failed to get WebGPU device"));
  // const mazeCPU = await generateHardcodedMaze();
  // const mazeGPU = await generateHardcodedMazeGPU();

  const params = new URLSearchParams(window.location.search);
  const height = Number(params.get("height")) || 10;
  const width = Number(params.get("width")) || 10;
  const seed = Number(params.get("seed")) || Math.random() * maxSize;
  const size = height * width;
  if (size > maxSize) {
    throw new Error(`Size (${size}) too large, max size is ${maxSize} (height * width)`);
  }
  const maze = await generateBinTreeMazeGPU(device, height, width, seed);
  // const maze = await generateBinTreeMazeCPU(height, width);
  // debugMazes({ mazeGPU, mazeCPU });

  await render(device, maze);
  // await render(mazeCPU);
  // await compute();
};
main();

const debugMazes = ({ mazeGPU, mazeCPU }) => {
  for (let i = 0; i < mazeCPU.quads.length; i++) {
    console.log("quad: ", i);
    const quadCPU = mazeCPU.quads[i];
    const quadGPU = mazeGPU.quads[i];

    for (let j = 0; j < quadCPU.length; j++) {
      const coordCPU = quadCPU[j];
      const coordGPU = quadGPU[j];

      const xCPU = round(coordCPU[0], 2);
      const yCPU = round(coordCPU[1], 2);
      const xGPU = round(coordGPU[0], 2);
      const yGPU = round(coordGPU[1], 2);

      console.log("coord: ", j);
      console.log({ xCPU, yCPU });
      console.log({ xGPU, yGPU });
    }
  }
};
