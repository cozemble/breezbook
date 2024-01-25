import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import vercel from 'vite-plugin-vercel';

export default defineConfig({
	plugins: [sveltekit(), vercel()],
	vercel: {
		// optional configuration options, see "Advanced usage" below for details
	}
});
