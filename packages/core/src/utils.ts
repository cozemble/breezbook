export function mandatory<T>(value: T | undefined, errorMessage: string): Exclude<T | undefined | null, undefined | null> {
	if (!value) {
		throw new Error(errorMessage);
	}
	return value as Exclude<T | undefined | null, undefined | null>;
}

export function randomInteger(max: number, min = 0): number {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export interface Success<T = unknown> {
	_type: 'success';
	value: T;
}

export function success<T>(value: T): Success<T> {
	return { _type: 'success', value };
}
