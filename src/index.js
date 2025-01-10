import { assert } from "./assert.js";
import { render } from "./render.js";
import {
  generateBinTreeMaze as generateBinTreeMazeGPU,
  generateHardcodedMaze as generateHardcodedMazeGPU,
} from "./gpuMaze.js";
import { registerPinchZoom } from "./registerPinchZoom.js";
import { registerPan } from "./registerPan.js";

// we're limited by the size of the work buffer. Am not sure if this is GPU specific or not.
// ChatGPT says we can work around this by running our compute shader in batches. However,
// that will not allow us to bind a single buffer to both the compute shader and the render pass.
// we can't use fp16 because most browsers don't support Float16Array, which is necessary to be able
// to write our data to the GPU. We could technically use a Float32Array, but that would require
// a bunch of bit masking magic that I don't want to deal with.
// 96 comes from 8 * 2 * 6 * 1, I think. That's 8 bytes per vertex, 2 vertices per cell, 6 cells per quad, and 1 quad per cell.
const maxSize = 134217728 / 48;
// const maxSize = Infinity;

const main = async () => {
  assert(window.navigator, new Error("WebGPU not supported in this browser"));
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  assert(device, new Error("Failed to get WebGPU device"));

  const params = new URLSearchParams(window.location.search);
  const width = Number(params.get("width")) || defaultNumCellsForWidthOfWindow();
  const height = Number(params.get("height")) || Math.floor(width * windowAspectRatio());
  const thickness = Number(params.get("thickness")) || 0.5;
  const seed = Number(params.get("seed")) || Math.random() * maxSize;
  const size = height * width;
  if (size > maxSize) {
    throw new Error(`Size (${size}) too large, max size is ${maxSize} (height * width)`);
  }
  const maze = await generateBinTreeMazeGPU(device, height, width, seed, thickness);
  const options = { zoom: 1, position: { x: 0, y: 0 } };

  await render(device, maze, options);

  registerPinchZoom(document.querySelector("canvas#maze"), (amount) => {
    options.zoom *= 1 + amount / 100;
  });

  registerPan(document.querySelector("canvas#maze"), ({ dx, dy }) => {
    const scale = Math.sqrt(size) * 0.001;
    options.position.x += dx * scale;
    options.position.y += dy * scale;
  });
};
main();

const windowAspectRatio = () => {
  return window.innerWidth / window.innerHeight;
};

const defaultNumCellsForWidthOfWindow = () => {
  return Math.floor(window.innerWidth / 10);
};
