import { assert } from "./assert.js";
import { autoResize } from "./resize.js";
import { resolveShader } from "./resolveShader.js";

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

  // we're drawing a 3x3 grid of squares. Each square has a top edge and a right edge.
  // The squares on the bottom row have a bottom edge, and the squares on the left row
  // have a left edge. Each edge is drawn as a line, and is therefore represented by 2
  // vertices. Therefore, we have 3 lines per row and 4 lines (3 top lines, 1 bottom line)
  // Similarly, we have 3 lines per column and 4 lines (3 left lines, 1 right line).
  // Therefore, we have (3 * 4) + (3 * 4) = 24 lines.
  // Not all lines will be filled in though

  // lets start with a hardcoded grid that looks like this:
  // ┌───┬───┬───┐
  // │           │  0,2 1,2 2,2
  // ├───┼   ┼   ┤
  // │       │   │  0,1 1,1 2,1
  // ├   ┼───┼   ┤
  // │   │       │  0,0 1,0 2,0
  // └───┴───┴───┘

  const quads = [
    // first row
    top(0, 2),
    top(1, 2),
    top(2, 2),
    left(0, 2),
    right(2, 2),
    // second row
    top(0, 1),
    left(0, 1),
    right(1, 1),
    right(2, 1),
    // third row
    top(1, 0),
    left(0, 0),
    right(0, 0),
    right(2, 0),
    bottom(0, 0),
    bottom(1, 0),
    bottom(2, 0),
  ];

  const xMin = -0.5;
  const xMax = 2.5;
  const yMin = -0.5;
  const yMax = 2.5;

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

const thickness = 0.1;
const halfThickness = thickness / 2;

const top = (x, y) => {
  // x, y is the center of the square.
  // the top edge is 0.5 units above the center
  // the quad should be vertically centered about the top edge
  // and have a thickness of 0.01 units

  const topEdge = y + 0.5;
  const leftEdge = x - 0.5;
  const rightEdge = x + 0.5;

  return [
    [leftEdge - halfThickness, topEdge - halfThickness],
    [rightEdge + halfThickness, topEdge - halfThickness],
    [leftEdge - halfThickness, topEdge + halfThickness],
    [rightEdge + halfThickness, topEdge - halfThickness],
    [leftEdge - halfThickness, topEdge + halfThickness],
    [rightEdge + halfThickness, topEdge + halfThickness],
  ];
};

const left = (x, y) => {
  const leftEdge = x - 0.5;
  const topEdge = y + 0.5;
  const bottomEdge = y - 0.5;

  return [
    [leftEdge - halfThickness, topEdge + halfThickness],
    [leftEdge - halfThickness, bottomEdge - halfThickness],
    [leftEdge + halfThickness, topEdge + halfThickness],
    [leftEdge - halfThickness, bottomEdge - halfThickness],
    [leftEdge + halfThickness, topEdge + halfThickness],
    [leftEdge + halfThickness, bottomEdge - halfThickness],
  ];
};

const right = (x, y) => {
  const rightEdge = x + 0.5;
  const topEdge = y + 0.5;
  const bottomEdge = y - 0.5;

  return [
    [rightEdge - halfThickness, topEdge + halfThickness],
    [rightEdge - halfThickness, bottomEdge - halfThickness],
    [rightEdge + halfThickness, topEdge + halfThickness],
    [rightEdge - halfThickness, bottomEdge - halfThickness],
    [rightEdge + halfThickness, topEdge + halfThickness],
    [rightEdge + halfThickness, bottomEdge - halfThickness],
  ];
};

const bottom = (x, y) => {
  const bottomEdge = y - 0.5;
  const leftEdge = x - 0.5;
  const rightEdge = x + 0.5;

  return [
    [leftEdge - halfThickness, bottomEdge - halfThickness],
    [rightEdge + halfThickness, bottomEdge - halfThickness],
    [leftEdge - halfThickness, bottomEdge + halfThickness],
    [rightEdge + halfThickness, bottomEdge - halfThickness],
    [leftEdge - halfThickness, bottomEdge + halfThickness],
    [rightEdge + halfThickness, bottomEdge + halfThickness],
  ];
};
