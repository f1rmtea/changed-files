export declare class Logger {
    static info(message: string): void;
    static warn(message: string): void;
    static error(message: string): void;
    static debug(message: string): void;
    static group<T>(name: string, fn: () => Promise<T>): Promise<T>;
    static startGroup(name: string): void;
    static endGroup(): void;
}
//# sourceMappingURL=logger.d.ts.map