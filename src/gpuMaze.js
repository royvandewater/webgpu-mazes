import { resolveShader } from "./resolveShader.js";

export const generateBinTreeMaze = async (device, width, height, seed, thickness) => {
  const shaderPath = "src/shaders/generateBinTreeMaze.wgsl";
  const size = width * height;

  const { cellBuffer, borderBuffer } = await compute(device, shaderPath, size, seed, width, height, thickness);

  return { cellBuffer, borderBuffer, width, height };
};

export const generateHardcodedMaze = async (device) => {
  const shaderPath = "src/shaders/generateHardcodedMaze.wgsl";

  const { cellBuffer, borderBuffer } = await compute(device, shaderPath, 9, 1, thickness);

  return { cellBuffer, borderBuffer, width, height };
};

export const compute = async (device, shaderPath, size, seed, width, height, thickness) => {
  const module = await device.createShaderModule({
    label: "doubling compute module",
    code: await resolveShader(shaderPath),
  });

  const pipeline = device.createComputePipeline({
    label: "maze generating compute pipeline",
    layout: "auto",
    compute: {
      module,
      entryPoint: "generate", // optional if there is only one entry point in the shader code
    },
  });

  // size * 2 * 6 * 2 because we have 2 coordinates per vertex, 6 vertices per quad, and up to 2 quads per cell
  const input = new Float32Array(size * 2 * 6 * 2).fill(seed);

  const workBuffer = device.createBuffer({
    label: "work buffer",
    size: input.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(workBuffer, 0, input);

  const dimensions = Uint32Array.from([width, height]);
  const dimensionsBuffer = device.createBuffer({
    label: "dimensions buffer",
    size: dimensions.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(dimensionsBuffer, 0, dimensions);

  const thicknessBuffer = device.createBuffer({
    label: "thickness buffer",
    size: Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(thicknessBuffer, 0, Float32Array.from([thickness]));

  const resultBuffer = device.createBuffer({
    label: "shared result buffer",
    size: input.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    label: "bind group for work buffer",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: workBuffer } },
      { binding: 1, resource: { buffer: dimensionsBuffer } },
      { binding: 2, resource: { buffer: thicknessBuffer } },
    ],
  });

  const encoder = device.createCommandEncoder({ label: "maze encoder" });
  const pass = encoder.beginComputePass({ label: "maze compute pass" });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(width, height);
  pass.end();

  encoder.copyBufferToBuffer(workBuffer, 0, resultBuffer, 0, resultBuffer.size);
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);
  await device.queue.onSubmittedWorkDone();

  const borderBuffer = generateBorderBuffer(device, width, height, thickness);

  return { cellBuffer: resultBuffer, borderBuffer };
};

const generateBorderBuffer = (device, width, height, thickness) => {
  const triangles = Float32Array.from(borderTriangleStrip(width, height, thickness).flat(2));

  const buffer = device.createBuffer({
    label: "border buffer",
    size: triangles.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(buffer, 0, triangles);

  return buffer;
};

const borderTriangleStrip = (width, height, thickness) => {
  const h = thickness / 2;

  return [
    [-0.5 - h, -0.5 - h], // bottom left
    [-0.5 + h, -0.5 + h], // bottom left inner
    [width - 0.5 + h, -0.5 - h], // bottom right
    [width - 0.5 - h, -0.5 + h], // bottom right inner
    [width - 0.5 + h, height - 0.5 + h], // top right
    [width - 0.5 - h, height - 0.5 - h], // top right inner
    [-0.5 - h, height - 0.5 + h], // top left
    [-0.5 + h, height - 0.5 - h], // top left inner
    [-0.5 - h, -0.5 - h], // bottom left
    [-0.5 + h, -0.5 + h], // bottom left inner
  ];
};
