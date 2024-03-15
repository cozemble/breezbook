import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.svelte', './src/**/*.html'],
	theme: {
		fontFamily: {
			sans: [
				'"Commissioner"',
				'"Ysabeau"',
				'"Castoro"',
				'"Comfortaa"',
				'"Kalnia"',
				'"Bangers"',
				'sans-serif'
			]
		},
		extend: {}
	},
	plugins: [daisyui],
	daisyui: {
		themes: ['winter', 'corporate', 'dim', 'sunset', 'cyberpunk', 'lemonade']
	}
};
