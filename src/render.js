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
    label: "our triangle with storages",
    code: await resolveShader("src/shaders/triangleWithStorages.wgsl"),
  });

  const pipeline = await device.createRenderPipeline({
    label: "our triangle with storages pipeline",
    layout: "auto",
    vertex: {
      entryPoint: "vs",
      module,
    },
    fragment: {
      entryPoint: "fs",
      module,
      targets: [{ format: presentationFormat }],
    },
  });

  const renderPassDescriptor = {
    label: "our basic canvas render pass",
    colorAttachments: [
      {
        // view: <- to be filled out when we render
        clearValue: [0.3, 0.3, 0.3, 1.0],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };

  const kNumObjects = 100;
  const objectInfos = [];

  const staticUnitSize =
    4 * 4 + // color is 4 32bit floats (4 bytes each)
    2 * 4 + // scale is 2 32bit floats (4 bytes each)
    2 * 4; // padding
  const changingUnitSize = 2 * 4; // offset is 2 32bit floats (4 bytes each)
  const staticStorageBufferSize = staticUnitSize * kNumObjects;
  const changingStorageBufferSize = changingUnitSize * kNumObjects;

  const staticStorageBuffer = device.createBuffer({
    label: "static storage buffer",
    size: staticStorageBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const changingStorageBuffer = device.createBuffer({
    label: "changing storage buffer",
    size: changingStorageBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const kColorOffset = 0;
  const kOffsetOffset = 4;

  const kScaleOffset = 0;

  {
    const staticStorageValues = new Float32Array(staticStorageBufferSize / 4);
    for (let i = 0; i < kNumObjects; i++) {
      const staticOffset = i * (staticUnitSize / 4);

      const colorOffset = staticOffset + kColorOffset;
      const offsetOffset = staticOffset + kOffsetOffset;

      staticStorageValues.set([rand(), rand(), rand(), 1], colorOffset);
      staticStorageValues.set([rand(-0.9, 0.9), rand(-0.9, 0.9)], offsetOffset);

      objectInfos.push({
        scale: rand(0.2, 0.5),
      });
    }
    device.queue.writeBuffer(staticStorageBuffer, 0, staticStorageValues);
  }

  const storageValues = new Float32Array(changingStorageBufferSize / 4);
  const bindGroup = device.createBindGroup({
    label: "our objects bind group",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: staticStorageBuffer } },
      { binding: 1, resource: { buffer: changingStorageBuffer } },
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

    const aspect = canvas.width / canvas.height;

    objectInfos.forEach(({ scale }, ndx) => {
      const offset = ndx * (changingUnitSize / 4);
      storageValues.set([scale / aspect, scale], offset + kScaleOffset);
    });

    device.queue.writeBuffer(changingStorageBuffer, 0, storageValues);

    pass.setBindGroup(0, bindGroup);
    pass.draw(3, kNumObjects);
    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    requestAnimationFrame(() => renderLoop());
  };
  renderLoop();
};

// A random number between [min and max)
// With 1 argument it will be [0 to min)
// With no arguments it will be [0 to 1)
const rand = (min = 0, max = 1) => {
  return Math.random() * (max - min) + min;
};
