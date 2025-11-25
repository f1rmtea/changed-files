
import * as core from '@actions/core';

export class Logger {
  static info(message: string): void {
    core.info(message);
  }

  static warn(message: string): void {
    core.warning(message);
  }

  static error(message: string): void {
    core.error(message);
  }

  static debug(message: string): void {
    core.debug(message);
  }

  static group<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return core.group(name, fn);
  }

  static startGroup(name: string): void {
    core.startGroup(name);
  }

  static endGroup(): void {
    core.endGroup();
  }
}