import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';
import svelte from '@astrojs/svelte';

import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
	integrations: [
		tailwind(),
		svelte(),
		icon({
			include: {
				solar: ['*']
			}
		})
	],
	output: 'server',
	adapter: vercel(),
	vite: {
		build: {
			rollupOptions: {
				external: ['sharp'],
			},
		},
	},

});
