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

// we're limited by the size of the work buffer. Am not sure if this is GPU specific or not.
// ChatGPT says we can work around this by running our compute shader in batches. However,
// that will not allow us to bind a single buffer to both the compute shader and the render pass.
// An alternative would be to optimize the compute shader cell layout. We're currently assuming it
// returns 4 quads per cell, but we could return 2 quads per cell and then draw the border quads
// in a separate buffer.
// we can't use fp16 because most browsers don't support Float16Array, which is necessary to be able
// to write our data to the GPU. We could technically use a Float32Array, but that would require
// a bunch of bit masking magic that I don't want to deal with.
const maxSize = 134217728 / 192;
// const maxSize = Infinity;

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
