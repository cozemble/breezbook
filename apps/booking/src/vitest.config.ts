/// <reference types="vitest" />
import { defineProject } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineProject({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		environment: 'jsdom',
		globals: true
	}
});
