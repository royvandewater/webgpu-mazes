import { chunk } from "remeda";
import { assert } from "./assert.js";
import { resolveShader } from "./resolveShader.js";

export const generateBinTreeMaze = async (width, height) => {
  const shaderPath = "src/shaders/generateBinTreeMaze.wgsl";

  const { quads } = await compute(shaderPath, width * height, 1);

  return { quads };
};

export const generateHardcodedMaze = async () => {
  const shaderPath = "src/shaders/generateHardcodedMaze.wgsl";

  const { quads } = await compute(shaderPath, 9, 1);

  return { quads };
};

export const compute = async (shaderPath, size, seed) => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  assert(device, new Error("Failed to get WebGPU device"));

  const module = await device.createShaderModule({
    label: "doubling compute module",
    code: await resolveShader(shaderPath),
  });

  const pipeline = device.createComputePipeline({
    label: "doubling compute pipeline",
    layout: "auto",
    compute: {
      module,
      entryPoint: "generate", // optional if there is only one entry point in the shader code
    },
  });

  // size * 2 * 6 * 4 because we have 2 coordinates per vertex, 6 vertices per quad, and potentially 4 quads per cell
  const input = new Float32Array(size * 2 * 6 * 4).fill(seed);
  // const input = new Float32Array([1, 3, 5]);

  const workBuffer = device.createBuffer({
    label: "work buffer",
    size: input.byteLength,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(workBuffer, 0, input);

  const resultBuffer = device.createBuffer({
    label: "result buffer",
    size: input.byteLength,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    label: "bind group for work buffer",
    layout: pipeline.getBindGroupLayout(0),
    // binding 0 corresponds to the @group(0) @binding(0) in the compute shader
    entries: [{ binding: 0, resource: { buffer: workBuffer } }],
  });

  const encoder = device.createCommandEncoder({ label: "maze encoder" });
  const pass = encoder.beginComputePass({ label: "maze compute pass" });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(size);
  pass.end();

  encoder.copyBufferToBuffer(workBuffer, 0, resultBuffer, 0, resultBuffer.size);
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);

  await resultBuffer.mapAsync(GPUMapMode.READ);
  const result = new Float32Array(resultBuffer.getMappedRange());

  // console.log("input", input);
  // console.log("result", result);

  const vertexCoordinates = Array.from(result).filter((v) => v >= -1);
  resultBuffer.unmap();

  const vertices = chunk(vertexCoordinates, 2);
  const quads = chunk(vertices, 6);

  return { quads };
};
