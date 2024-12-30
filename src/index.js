import { assert } from "./assert.js";
import { render } from "./render.js";
import {
  generateBinTreeMaze as generateBinTreeMazeGPU,
  generateHardcodedMaze as generateHardcodedMazeGPU,
} from "./gpuMaze.js";

// we're limited by the size of the work buffer. Am not sure if this is GPU specific or not.
// ChatGPT says we can work around this by running our compute shader in batches. However,
// that will not allow us to bind a single buffer to both the compute shader and the render pass.
// we can't use fp16 because most browsers don't support Float16Array, which is necessary to be able
// to write our data to the GPU. We could technically use a Float32Array, but that would require
// a bunch of bit masking magic that I don't want to deal with.
const maxSize = 134217728 / 96;
// const maxSize = Infinity;

const main = async () => {
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

  await render(device, maze);
};
main();

const windowAspectRatio = () => {
  return window.innerWidth / window.innerHeight;
};

const defaultNumCellsForWidthOfWindow = () => {
  return Math.floor(window.innerWidth / 10);
};
