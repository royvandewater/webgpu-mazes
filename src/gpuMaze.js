import { resolveShader } from "./resolveShader.js";

export const generateBinTreeMaze = async (device, width, height, seed) => {
  const shaderPath = "src/shaders/generateBinTreeMaze.wgsl";
  const size = width * height;

  const { cellBuffer, borderBuffer } = await compute(device, shaderPath, size, seed, width, height);

  return { cellBuffer, borderBuffer, width, height };
};

export const generateHardcodedMaze = async (device) => {
  const shaderPath = "src/shaders/generateHardcodedMaze.wgsl";

  const { cellBuffer, borderBuffer } = await compute(device, shaderPath, 9, 1);

  return { cellBuffer, borderBuffer, width, height };
};

export const compute = async (device, shaderPath, size, seed, width, height) => {
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

  // size * 2 * 6 * 4 because we have 2 coordinates per vertex, 6 vertices per quad, and up to 4 quads per cell
  const input = new Float32Array(size * 2 * 6 * 4).fill(seed);

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

  const borderBuffer = generateBorderBuffer(device, width, height);

  return { cellBuffer: resultBuffer, borderBuffer };
};

const generateBorderBuffer = (device, width, height) => {
  const triangles = Float32Array.from(borderTriangleStrip(width, height).flat(2));

  const buffer = device.createBuffer({
    label: "border buffer",
    size: triangles.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(buffer, 0, triangles);

  return buffer;
};

const borderTriangleStrip = (width, height) => {
  return [
    [-0.55, -0.55], // bottom left
    [-0.45, -0.45], // bottom left inner
    [width - 0.45, -0.55], // bottom right
    [width - 0.55, -0.45], // bottom right inner
    [width - 0.45, height - 0.45], // top right
    [width - 0.55, height - 0.55], // top right inner
    [-0.55, height - 0.45], // top left
    [-0.45, height - 0.55], // top left inner
    [-0.55, -0.55], // bottom left
    [-0.45, -0.45], // bottom left inner
  ];
};
