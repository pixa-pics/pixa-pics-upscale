import workerpool from "workerpool";
export default workerpool.pool({minWorkers: 1, maxWorkers: 2});