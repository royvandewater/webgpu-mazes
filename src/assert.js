/**
 * @param {*} t
 * @param {string | Error | undefined} error
 * @returns {asserts t}
 */
export const assert = (t, error = new Error("assertion failed")) => {
  if (t) return;
  if (error instanceof Error) throw error;
  throw new Error(error);
};
