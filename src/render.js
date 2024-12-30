import { autoResize } from "./resize.js";
import { resolveShader } from "./resolveShader.js";

export const render = async (device, maze) => {
  const { buffer: sharedResultBuffer, width, height } = maze;

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

  const dimensionsBuffer = device.createBuffer({
    label: "dimensions buffer",
    size: 4 * 4, // 4 32-bit floats
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(dimensionsBuffer, 0, Float32Array.from([-1, -1, width, height]));

  const bindGroup = device.createBindGroup({
    label: "objects bind group",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: sharedResultBuffer } },
      { binding: 1, resource: { buffer: dimensionsBuffer } },
    ],
  });

  const renderLoop = () => {
    // Get the current texture from the canvas context and
    // set it as the texture to render to.
    renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

    // make a command encoder to start encoding commands
    const encoder = device.createCommandEncoder({ label: "out encoder" });

    // make a render pass encoder to encode render specific commands
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(width * height * 2 * 6 * 4);
    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    requestAnimationFrame(() => renderLoop());
  };
  renderLoop();
};
