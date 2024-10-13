import { assert } from "./assert.js";
import { autoResize } from "./resize.js";
import { resolveShader } from "./resolveShader.js";
import { generateMaze as bintreeMaze } from "./maze.js";

export const render = async () => {
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

  // const quads = hardcodedMaze();
  const quads = bintreeMaze(20, 20);
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

  const bindGroup = device.createBindGroup({
    label: "objects bind group",
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: storageBuffer } }],
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
      const [[x1, y1], [x2, y2], [x3, y3], [x4, y4], [x5, y5], [x6, y6]] = quad;
      const values = [
        scaleCoordinate(x1, xMin, xMax),
        scaleCoordinate(y1, yMin, yMax),
        scaleCoordinate(x2, xMin, xMax),
        scaleCoordinate(y2, yMin, yMax),
        scaleCoordinate(x3, xMin, xMax),
        scaleCoordinate(y3, yMin, yMax),
        scaleCoordinate(x4, xMin, xMax),
        scaleCoordinate(y4, yMin, yMax),
        scaleCoordinate(x5, xMin, xMax),
        scaleCoordinate(y5, yMin, yMax),
        scaleCoordinate(x6, xMin, xMax),
        scaleCoordinate(y6, yMin, yMax),
      ];

      storageValues.set(values, offset);
    });

    device.queue.writeBuffer(storageBuffer, 0, storageValues);

    pass.setBindGroup(0, bindGroup);
    pass.draw(2 * numVertices);
    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    requestAnimationFrame(() => renderLoop());
  };
  renderLoop();
};

// moves the coordinate to a -1 to 1 range
const scaleCoordinate = (v, min, max) => {
  return ((v - min) / (max - min)) * 2 - 1;
};
