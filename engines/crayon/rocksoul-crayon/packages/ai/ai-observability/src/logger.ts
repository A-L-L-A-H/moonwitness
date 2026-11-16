export interface ILogger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

export class DefaultLogger implements ILogger {
  constructor(private prefix: string = '[AI-Engine]') {}

  info(message: string, ...args: any[]): void {
    console.log(`${this.prefix} [INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`${this.prefix} [WARN] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`${this.prefix} [ERROR] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    console.debug(`${this.prefix} [DEBUG] ${message}`, ...args);
  }
}

export class PinoLoggerAdapter implements ILogger {
  constructor(private pinoInstance: any) {}

  info(message: string, ...args: any[]): void {
    if (this.pinoInstance?.info) {
      this.pinoInstance.info({ args }, message);
    } else {
      console.log(message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.pinoInstance?.warn) {
      this.pinoInstance.warn({ args }, message);
    } else {
      console.warn(message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.pinoInstance?.error) {
      this.pinoInstance.error({ args }, message);
    } else {
      console.error(message, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.pinoInstance?.debug) {
      this.pinoInstance.debug({ args }, message);
    } else {
      console.debug(message, ...args);
    }
  }
}
