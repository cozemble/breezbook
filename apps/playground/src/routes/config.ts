import { env } from '$env/dynamic/public';

export const baseUrl = env.PUBLIC_API_URL ?? 'http://localhost:3000';