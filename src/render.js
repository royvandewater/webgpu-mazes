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
    label: "our triangle with uniforms",
    code: await resolveShader("src/shaders/triangleWithUniforms.wgsl"),
  });

  const pipeline = await device.createRenderPipeline({
    label: "our triangle with uniforms pipeline",
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

  const uniformBufferSize =
    4 * 4 + // color is 4 32bit floats (4 bytes each)
    2 * 4 + // scale is 2 32bit floats (4 bytes each)
    2 * 4; // offset is 2 32bit floats (4 bytes each)

  const kColorOffset = 0;
  const kScaleOffset = 4;
  const kOffsetOffset = 6;

  const kNumObjects = 100;
  const objectInfos = [];

  for (let i = 0; i < kNumObjects; i++) {
    const uniformBuffer = device.createBuffer({
      label: `uniform buffer for object ${i}`,
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const uniformValues = new Float32Array(uniformBufferSize / 4);
    uniformValues.set([rand(), rand(), rand(), 1], kColorOffset);
    uniformValues.set([rand(-0.9, 0.9), rand(-0.9, 0.9)], kOffsetOffset);

    const bindGroup = device.createBindGroup({
      label: `bind group for object ${i}`,
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    });

    objectInfos.push({
      scale: rand(0.2, 0.5),
      uniformBuffer,
      uniformValues,
      bindGroup,
    });
  }

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

    for (const {
      scale,
      uniformBuffer,
      uniformValues,
      bindGroup,
    } of objectInfos) {
      uniformValues.set([scale / aspect, scale], kScaleOffset);
      device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
      pass.setBindGroup(0, bindGroup);
      pass.draw(3);
    }

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
