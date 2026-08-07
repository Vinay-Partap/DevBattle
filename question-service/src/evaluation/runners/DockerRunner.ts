export class DockerRunner {
  async run(): Promise<never> {
    throw new Error('DockerRunner is a boundary adapter for future evaluation workers.');
  }
}
