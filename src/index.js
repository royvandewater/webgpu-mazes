import { assert } from "./assert.js";
import { autoResize } from "./resize.js";

const resolveShader = async (path) => {
  const response = await fetch(path);
  assert(response.ok, `Failed to load shader: ${path}`);
  return response.text();
};

const render = (device, context, renderPassDescriptor, pipeline) => {
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
  pass.draw(3);
  pass.end();

  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);

  requestAnimationFrame(() =>
    render(device, context, renderPassDescriptor, pipeline)
  );
};

const main = async () => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  if (!device) {
    throw new Error("Failed to get WebGPU device");
  }

  const canvas = document.querySelector("canvas");
  const context = canvas.getContext("webgpu");
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
  });

  autoResize(canvas, device);

  const module = await device.createShaderModule({
    label: "our hardcoded red triangle shaders",
    code: await resolveShader("src/shaders/redTriangle.wgsl"),
  });

  const pipeline = await device.createRenderPipeline({
    label: "our hardcoded red triangle pipeline",
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

  render(device, context, renderPassDescriptor, pipeline);
};
main();
