export interface InngestInvocation {
    name: string;
    data: any;
}

export interface InngestStep {
    run<T>(name: string, f: () => Promise<T>): Promise<T>

    send(payload: InngestInvocation): Promise<void>
}

export class DelegatingInngestStep implements InngestStep {
    constructor(private readonly inngest: any, private readonly step: any) {
    }

    async run<T>(name: string, f: () => Promise<T>): Promise<T> {
        return await this.step.run(name, f);
    }

    async send(payload: InngestInvocation): Promise<void> {
        await this.inngest.send(payload);
    }
}

export interface Logger {
    info(...args: any[]): void;

    warn(...args: any[]): void;

    error(...args: any[]): void;

    debug(...args: any[]): void;
}

export class ConsoleLogger implements Logger {
    info(...args: any[]): void {
        console.log(...args);
    }

    warn(...args: any[]): void {
        console.warn(...args);
    }

    error(...args: any[]): void {
        console.error(...args);
    }

    debug(...args: any[]): void {
        console.debug(...args);
    }
}

export function consoleLogger(): Logger {
    return new ConsoleLogger();
}

export class CollectingLogger implements Logger {
    private readonly logs: any[] = [];

    info(...args: any[]): void {
        this.logs.push(['info', args]);
    }

    warn(...args: any[]): void {
        this.logs.push(['warn', args]);
    }

    error(...args: any[]): void {
        this.logs.push(['error', args]);
    }

    debug(...args: any[]): void {
        this.logs.push(['debug', args]);
    }

    getLogs(): any[] {
        return this.logs;
    }

    lines(): string[] {
        return this.logs.map(([level, args]) => `${level}: ${args.join(' ')}`);
    }
}

export function collectingLogger(): Logger {
    return new CollectingLogger();
}