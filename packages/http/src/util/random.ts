export class Random {
    static bytes = randomBytes;
}

export function randomBytes(size: number): Uint8Array {
    const sizeInFloats = Math.round(size / 4) + 1;
    const randomFloats = new Array<number>(sizeInFloats);

    for (let i = 0; i < randomFloats.length; i++) randomFloats[i] = Math.random();

    const buffer: ArrayBufferLike = Float32Array.from(randomFloats).buffer;
    return new Uint8Array(buffer).slice(0, size);
}