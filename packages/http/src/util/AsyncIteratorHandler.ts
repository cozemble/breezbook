type PromiseCallbacks<T> = [(value: IteratorResult<T>) => void, (err: any) => void];

// TODO: can this be (much) more terse, and obviously correct?
export class AsyncIteratorHandler<T> implements AsyncIterator<T> {
    private pullQueue: PromiseCallbacks<T>[] = [];
    private pushQueue: ((callbacks: PromiseCallbacks<T>) => void)[] = [];

    next(): Promise<IteratorResult<T>> {
        return new Promise<IteratorResult<T>>((resolve, reject) => {
            this.pull([resolve, reject]);
        });
    }

    push(value: T): void {
        const serve = ([resolve, _]: PromiseCallbacks<T>) => resolve({
            done: false,
            value: value
        });

        const waiting: PromiseCallbacks<T> | undefined = this.pullQueue.shift();
        if (waiting)
            serve(waiting);
        else
            this.pushQueue.push(serve);
    }

    private pull(thing: PromiseCallbacks<T>): void {
        const waiting = this.pushQueue.shift();
        if (waiting)
            waiting(thing);
        else
            this.pullQueue.push(thing)
    }

    end(): void {
        this.close(([resolve, _]: PromiseCallbacks<T>) => resolve({
            done: true,
            value: undefined as any as T/* they got the interface wrong*/
        }));
        this.end = () => {
        };
    }

    error(e: any): void {
        this.close(([_, err]) => {
            err(e)
        });
    }

    // TODO: this is being too cute. Make it simpler?
    private close(final: ((callbacks: PromiseCallbacks<T>) => void)) {
        const oldPull = this.pull;
        const self = this;
        this.pullQueue.forEach(final);

        this.pull = (thing: PromiseCallbacks<T>) =>
            self.pushQueue.length === 0 ? final(thing) : oldPull.bind(self)(thing);

        // TODO: check the contract for AsyncIterator to confirm behaviour
        this.push = this.closed;
        this.close = this.closed;
    }

    private closed() {
        throw new Error("Iterator is closed")
    }
}