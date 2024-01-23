export function mandatory<T>(value: T | undefined, errorMessage: string): Exclude<T | undefined | null, undefined | null> {
	if (!value) {
		throw new Error(errorMessage);
	}
	return value as Exclude<T | undefined | null, undefined | null>;
}

export function randomInteger(max: number, min = 0): number {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
