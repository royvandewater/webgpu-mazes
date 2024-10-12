import { assert } from "./assert.js";
import { resolveShader } from "./resolveShader.js";

export const compute = async () => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  assert(device, new Error("Failed to get WebGPU device"));

  const module = await device.createShaderModule({
    label: "doubling compute module",
    code: await resolveShader("src/shaders/doublingCompute.wgsl"),
  });

  const pipeline = device.createComputePipeline({
    label: "doubling compute pipeline",
    layout: "auto",
    compute: {
      module,
      entryPoint: "compute_something", // optional if there is only one entry point in the shader code
    },
  });

  const input = new Float32Array([1, 3, 5]);

  const workBuffer = device.createBuffer({
    label: "work buffer",
    size: input.byteLength,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(workBuffer, 0, input);

  const resultBuffer = device.createBuffer({
    label: "result buffer",
    size: input.byteLength,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    label: "bind group for work buffer",
    layout: pipeline.getBindGroupLayout(0),
    // binding 0 corresponds to the @group(0) @binding(0) in the compute shader
    entries: [{ binding: 0, resource: { buffer: workBuffer } }],
  });

  const encoder = device.createCommandEncoder({ label: "doubling encoder" });
  const pass = encoder.beginComputePass({ label: "doubling compute pass" });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(input.length);
  pass.end();

  encoder.copyBufferToBuffer(workBuffer, 0, resultBuffer, 0, resultBuffer.size);
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);

  await resultBuffer.mapAsync(GPUMapMode.READ);
  const result = new Float32Array(resultBuffer.getMappedRange());

  console.log("input", input);
  console.log("result", result);

  resultBuffer.unmap();
};
