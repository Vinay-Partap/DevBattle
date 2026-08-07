export class NodeRunner {
  async run(): Promise<never> {
    throw new Error('NodeRunner must run in an isolated worker, not in the Question Service process.');
  }
}
