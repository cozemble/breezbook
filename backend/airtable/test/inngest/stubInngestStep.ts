import {InngestInvocation, InngestStep} from "../../src/inngest/inngestTypes.js";

export class StubInngestStep implements InngestStep {
    constructor(public readonly stepsRun: string[] = [], public readonly eventsSent: InngestInvocation[] = []) {
    }

    async run<T>(name: string, f: () => Promise<T>): Promise<T> {
        this.stepsRun.push(name);
        return await f()
    }

    async send(payload: InngestInvocation): Promise<void> {
        this.eventsSent.push(payload);
    }
}