import { assert } from "./assert.js";
import { autoResize } from "./resize.js";
import { resolveShader } from "./resolveShader.js";

export const render = async (maze) => {
  const { quads } = maze;

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  assert(device, new Error("Failed to get WebGPU device"));

  const canvas = document.querySelector("canvas");
  const context = canvas.getContext("webgpu");
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format: presentationFormat,
  });

  autoResize(canvas, device);

  const module = await device.createShaderModule({
    label: "maze module",
    code: await resolveShader("src/shaders/maze.wgsl"),
  });

  const pipeline = await device.createRenderPipeline({
    label: "maze pipeline",
    layout: "auto",
    vertex: {
      entryPoint: "vertexShader",
      module,
    },
    fragment: {
      entryPoint: "fragmentShader",
      module,
      targets: [{ format: presentationFormat }],
    },
  });

  const renderPassDescriptor = {
    label: "our basic canvas render pass",
    colorAttachments: [
      {
        clearValue: [1.0, 1.0, 1.0, 1.0],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };

  const vertices = quads.flat();

  const xs = vertices.map(([x, _y]) => x);
  const ys = vertices.map(([_x, y]) => y);

  const xMin = xs.reduce((min, x) => Math.min(min, x), xs[0]);
  const xMax = xs.reduce((max, x) => Math.max(max, x), xs[0]);
  const yMin = ys.reduce((min, y) => Math.min(min, y), ys[0]);
  const yMax = ys.reduce((max, y) => Math.max(max, y), ys[0]);

  const kNumObjects = quads.length;

  const unitSize = 6 * 4 * 4; // each quad is 6 vertices of 4 32bit floats (4 bytes each)
  const storageBufferSize = unitSize * kNumObjects;
  const numVertices = 6 * kNumObjects;

  const storageBuffer = device.createBuffer({
    label: "storage buffer",
    size: storageBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const storageValues = new Float32Array(storageBufferSize / 4);

  const dimensionsBuffer = device.createBuffer({
    label: "dimensions buffer",
    size: 4 * 4, // 4 32-bit floats
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    label: "objects bind group",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: storageBuffer } },
      { binding: 1, resource: { buffer: dimensionsBuffer } },
    ],
  });

  const renderLoop = () => {
    // Get the current texture from the canvas context and
    // set it as the texture to render to.
    renderPassDescriptor.colorAttachments[0].view = context
      .getCurrentTexture()
      .createView();

    // make a command encoder to start encoding commands
    const encoder = device.createCommandEncoder({ label: "out encoder" });

    // make a render pass encoder to encode render specific commands
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(pipeline);

    quads.forEach((quad, ndx) => {
      const offset = ndx * (unitSize / 4);

      storageValues.set(quad.flat(), offset);
    });

    device.queue.writeBuffer(storageBuffer, 0, storageValues);

    const dimensionsValues = Float32Array.from([xMin, yMin, xMax, yMax]);
    device.queue.writeBuffer(dimensionsBuffer, 0, dimensionsValues);

    pass.setBindGroup(0, bindGroup);
    pass.draw(2 * numVertices);
    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    requestAnimationFrame(() => renderLoop());
  };
  renderLoop();
};
