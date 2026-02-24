declare module "node:https" {
  import type { IncomingMessage } from "node:http";
  function request(
    url: string | URL,
    options: {
      method?: string;
      headers?: Record<string, string>;
      timeout?: number;
    },
    callback?: (res: IncomingMessage) => void
  ): {
    on(event: string, listener: (...args: unknown[]) => void): void;
    write(data: string): void;
    end(): void;
    destroy(): void;
  };
}

declare module "node:http" {
  interface IncomingMessage {
    statusCode?: number;
    on(event: string, listener: (...args: unknown[]) => void): void;
  }
}
