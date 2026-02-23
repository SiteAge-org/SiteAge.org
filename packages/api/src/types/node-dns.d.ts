declare module "node:dns" {
  const promises: {
    resolveTxt(hostname: string): Promise<string[][]>;
  };
}
