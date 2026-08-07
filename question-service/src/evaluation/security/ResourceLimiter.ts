export interface ResourceLimits {
  cpuLimitMs: number;
  memoryLimitMb: number;
  maxProcesses: number;
  maxCodeSizeKb: number;
}

export const defaultResourceLimits: ResourceLimits = {
  cpuLimitMs: 2000,
  memoryLimitMb: 256,
  maxProcesses: 1,
  maxCodeSizeKb: 256,
};
