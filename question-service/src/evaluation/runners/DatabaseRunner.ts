export class DatabaseRunner {
  async run(): Promise<never> {
    throw new Error('DatabaseRunner must run against a controlled temporary database in an evaluation worker.');
  }
}
