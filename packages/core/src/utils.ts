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

export function omit<Data extends object, Keys extends keyof Data>(
	data: Data,
	keys: Keys[]
): Omit<Data, Keys> {
	const result = { ...data };
	for (const key of keys) {
		delete result[key];
	}
	return result as Omit<Data, Keys>;
}

export function pick<Data extends object, Keys extends keyof Data>(
	data: Data,
	keys: Keys[]
): Pick<Data, Keys> {
	const result = {} as Pick<Data, Keys>;
	for (const key of keys) {
		result[key] = data[key];
	}
	return result;
}