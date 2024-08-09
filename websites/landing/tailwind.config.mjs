/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		fontFamily: {
			sans: ['"Commissioner"', 'sans-serif']
		},
		extend: {}
	},
	plugins: [require('daisyui')],

	daisyui: {
		themes: [
			{
				breezbook: {
					primary: '#349EFF',
					'primary-content': '#ffffff',
					secondary: '#ACD8FF',
					'secondary-content': '#051016',
					accent: '#52E09C',
					'accent-content': '#092015',
					neutral: '#132433',
					'neutral-content': '#ECF5FE',

					'base-100': '#ffffff',
					'base-200': '#EFF4F5',
					'base-300': '#D4E2E8',
					'base-content': '#0F1C26',

					info: '#38D7FF',
					'info-content': '#051316',
					success: '#93D117',
					'success-content': '#0D1202',
					warning: '#FFC02D',
					'warning-content': '#1E1501',
					error: '#FF473A',
					'error-content': '#FFF5F5'
				}
			}
		]
	}
};
