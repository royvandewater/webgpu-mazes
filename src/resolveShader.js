import { assert } from "./assert.js";

export const resolveShader = async (path) => {
  const response = await fetch(path);
  assert(response.ok, `Failed to load shader: ${path}`);
  return response.text();
};
