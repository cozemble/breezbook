function tail<T>(array: T[]): T[] {
  return array.slice(1);
}

export const arrays = {
  tail
}