import { assert } from "./assert.js";
import { render } from "./render.js";
import { generateBinTreeMaze, generateHardcodedMaze } from "./gpuMaze.js";
import { registerPinchZoom } from "./registerPinchZoom.js";
import { registerPan } from "./registerPan.js";

const windowAspectRatio = () => {
  return window.innerWidth / window.innerHeight;
};

const defaultNumCellsForWidthOfWindow = () => {
  return Math.floor(window.innerWidth / 10);
};

const main = async () => {
  const params = new URLSearchParams(window.location.search);
  const width = Number(params.get("width")) || defaultNumCellsForWidthOfWindow();
  const height = Number(params.get("height")) || Math.floor(width * windowAspectRatio());
  const thickness = Number(params.get("thickness")) || 0.5;
  const seed = Number(params.get("seed")) || Math.random() * Float32Array.MAX_VALUE;
  const size = height * width;

  assert(window.navigator, new Error("WebGPU not supported in this browser"));
  const adapter = await navigator.gpu.requestAdapter();

  // we need a buffer that is 48 * width * height (48 bytes per quad in each interior wall)
  // 48 comes from 8 * 6. That's 8 bytes per vertex, 3 vertices per triangle, 2 triangles per quad, and 1 quad per cell.
  const minBufferSize = 48 * size;
  const maxBufferSize = adapter.limits.maxBufferSize;
  const maxStorageBufferBindingSize = adapter.limits.maxStorageBufferBindingSize;
  assert(
    maxBufferSize >= minBufferSize,
    new Error(
      `Max buffer size (${maxBufferSize}) is too small, need at least ${minBufferSize} for maze of current size`
    )
  );
  assert(
    maxStorageBufferBindingSize >= minBufferSize,
    new Error(
      `Max storage buffer binding size (${maxStorageBufferBindingSize}) is too small, need at least ${minBufferSize} for maze of current size`
    )
  );

  const device = await adapter.requestDevice({
    requiredLimits: {
      maxBufferSize: minBufferSize,
      maxStorageBufferBindingSize: minBufferSize,
    },
  });
  assert(device, new Error("Failed to get WebGPU device"));

  // const maze = await generateBinTreeMaze(device, height, width, seed, thickness);
  const maze = await generateHardcodedMaze(device, thickness);
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
