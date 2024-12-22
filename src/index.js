import { render } from "./render.js";
import {
  generateBinTreeMaze as generateBinTreeMazeGPU,
  generateHardcodedMaze as generateHardcodedMazeGPU,
} from "./gpuMaze.js";
import { generateBinTreeMaze, generateHardcodedMaze } from "./maze.js";
import { round } from "remeda";

const main = async () => {
  const mazeCPU = await generateHardcodedMaze();
  const mazeGPU = await generateHardcodedMazeGPU();
  // debugMazes({ mazeGPU, mazeCPU });

  // const maze = await generateBinTreeMaze(20, 20);
  await render(mazeGPU);
  // await render(mazeCPU);
  // await compute();
};
main();

const debugMazes = ({ mazeGPU, mazeCPU }) => {
  for (let i = 0; i < mazeCPU.quads.length; i++) {
    console.log("quad: ", i);
    const quadCPU = mazeCPU.quads[i];
    const quadGPU = mazeGPU.quads[i];

    for (let j = 0; j < quadCPU.length; j++) {
      const coordCPU = quadCPU[j];
      const coordGPU = quadGPU[j];

      const xCPU = round(coordCPU[0], 2);
      const yCPU = round(coordCPU[1], 2);
      const xGPU = round(coordGPU[0], 2);
      const yGPU = round(coordGPU[1], 2);

      console.log("coord: ", j);
      console.log({ xCPU, yCPU });
      console.log({ xGPU, yGPU });
    }
  }
};
