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
		themes: [
			{
				breezbook: {
					primary: '#347fff',
					'primary-content': '#ffffff',
					secondary: '#58cdfa',
					'secondary-content': '#051016',
					accent: '#5fd08e',
					'accent-content': '#031007',
					neutral: '#070e20',
					'neutral-content': '#c6c8ce',

					'base-100': '#fafeff',
					'base-200': '#e7edf2',
					'base-300': '#d0dde7',
					'base-content': '#151616',

					info: '#7dd3fc',
					'info-content': '#051016',
					success: '#4ade66',
					'success-content': '#021203',
					warning: '#facc15',
					'warning-content': '#150f00',
					error: '#f87171',
					'error-content': '#150404'
				}
			},
			'corporate',
			'winter',
			'dim',
			'sunset',
			'cyberpunk',
			'lemonade'
		]
	}
};
