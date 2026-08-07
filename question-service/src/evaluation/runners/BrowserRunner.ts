export class BrowserRunner {
  async run(): Promise<never> {
    throw new Error('BrowserRunner must run in an isolated Playwright worker, not in the Question Service process.');
  }
}
