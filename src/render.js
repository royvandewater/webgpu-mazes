import { assert } from "./assert.js";
import { autoResize } from "./resize.js";
import { resolveShader } from "./resolveShader.js";

export const render = async (device, maze, options) => {
  const { cellBuffer, borderBuffer, width, height } = maze;
  assert(cellBuffer, new Error("cellBuffer is required"));
  assert(borderBuffer, new Error("borderBuffer is required"));

  const canvas = document.querySelector("canvas#maze");
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

  const cellPipeline = await device.createRenderPipeline({
    label: "maze cell pipeline",
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
    primitive: {
      // we're stuck using triangle-list because we can't render disjoint quads
      // using triangle-strip.
      topology: "triangle-list",
    },
  });

  const dimensions = Float32Array.from([-1, -1, width, height]);
  const dimensionsBuffer = device.createBuffer({
    label: "dimensions buffer",
    size: dimensions.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(dimensionsBuffer, 0, dimensions);

  const camera = Float32Array.from([options.position.x, options.position.y, options.zoom]);
  const cameraBuffer = device.createBuffer({
    label: "camera buffer",
    size: camera.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(cameraBuffer, 0, camera);

  const flip = options.flip ? 1 : 0;
  const flipBuffer = device.createBuffer({
    label: "flip buffer",
    size: Uint32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(flipBuffer, 0, Uint32Array.from([flip]));

  const cellBindGroup = device.createBindGroup({
    label: "cell bind group",
    layout: cellPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: cellBuffer } },
      { binding: 1, resource: { buffer: dimensionsBuffer } },
      { binding: 2, resource: { buffer: cameraBuffer } },
      { binding: 3, resource: { buffer: flipBuffer } },
    ],
  });

  const borderPipeline = await device.createRenderPipeline({
    label: "maze border pipeline",
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
    primitive: {
      topology: "triangle-strip",
    },
  });

  const borderBindGroup = device.createBindGroup({
    label: "border bind group",
    layout: borderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: borderBuffer } },
      { binding: 1, resource: { buffer: dimensionsBuffer } },
      { binding: 2, resource: { buffer: cameraBuffer } },
      { binding: 3, resource: { buffer: flipBuffer } },
    ],
  });

  const cellRenderPassDescriptor = {
    label: "our basic canvas render pass",
    colorAttachments: [
      {
        clearValue: [1.0, 1.0, 1.0, 1.0],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };

  const borderRenderPassDescriptor = {
    label: "border render pass",
    colorAttachments: [
      {
        // clearValue: [1.0, 1.0, 1.0, 1.0],
        // loadOp: "clear",
        loadOp: "load",
        storeOp: "store",
      },
    ],
  };

  const renderLoop = () => {
    // make a command encoder to start encoding commands
    const encoder = device.createCommandEncoder({ label: "out encoder" });

    // update the camera buffer
    camera.set([options.position.x, options.position.y, options.zoom]);
    device.queue.writeBuffer(cameraBuffer, 0, camera);

    // Get the current texture from the canvas context and
    // set it as the texture to render to.
    cellRenderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
    const cellPass = encoder.beginRenderPass(cellRenderPassDescriptor);
    cellPass.setPipeline(cellPipeline);
    cellPass.setBindGroup(0, cellBindGroup);
    cellPass.draw(width * height * 2 * 6 * 2);
    cellPass.end();

    borderRenderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

    const borderPass = encoder.beginRenderPass(borderRenderPassDescriptor);
    borderPass.setPipeline(borderPipeline);
    borderPass.setBindGroup(0, borderBindGroup);
    borderPass.draw(borderBuffer.size / Float32Array.BYTES_PER_ELEMENT);
    borderPass.end();

    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(renderLoop);
  };

  renderLoop();
};
