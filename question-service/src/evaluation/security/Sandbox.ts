export interface SandboxPolicy {
  cpuLimitMs: number;
  memoryLimitMb: number;
  timeoutMs: number;
  networkEnabled: boolean;
  filesystemReadonly: boolean;
}

export const defaultSandboxPolicy: SandboxPolicy = {
  cpuLimitMs: 2000,
  memoryLimitMb: 256,
  timeoutMs: 5000,
  networkEnabled: false,
  filesystemReadonly: true,
};
