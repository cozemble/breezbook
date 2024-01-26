export interface Clock {
	now(): Date;
}

export class SystemClock implements Clock {
	now() {
		return new Date();
	}
}

export class FixedClock implements Clock {
	constructor(private readonly when: Date = new Date()) {}

	now() {
		return this.when;
	}
}

export function systemClock(): Clock {
	return new SystemClock();
}

export function fixedClock(when: Date = new Date()): Clock {
	return new FixedClock(when);
}
