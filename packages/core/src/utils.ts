export function mandatory<T>(value: T | undefined, errorMessage: string): T {
	if (!value) {
		throw new Error(errorMessage);
	}
	return value;
}

export function randomInteger(max: number, min = 0): number {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
