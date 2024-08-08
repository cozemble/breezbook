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
					primary: '#04A7E2',
					'primary-content': '#ffffff',
					secondary: '#96D9F2',
					'secondary-content': '#051016',
					accent: '#4de8ad',
					'accent-content': '#031007',
					neutral: '#00284B',
					'neutral-content': '#ECF6FE',

					'base-100': '#ffffff',
					'base-200': '#EFF4F5',
					'base-300': '#D4E2E8',
					'base-content': '#0F1C26',

					info: '#259630',
					'info-content': '#051016',
					success: '#0C78FC',
					'success-content': '#021203',
					warning: '#FFDC00',
					'warning-content': '#150f00',
					error: '#FF3E38',
					'error-content': '#1C0101'
				}
			}
		]
	}
};
