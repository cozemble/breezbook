import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.svelte', './src/**/*.html'],
	theme: {
		fontFamily: {
			sans: ['"Castoro"', 'sans-serif']
		},
		extend: {}
	},
	plugins: [daisyui],
	daisyui: {
		themes: ['winter', 'corporate', 'dim']
	}
};
