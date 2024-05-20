// .prettierrc.mjs
/** @type {import("prettier").Config} */
export default {
	plugins: ['prettier-plugin-astro'],
	overrides: [
		{
			files: '*.astro',
			options: {
				parser: 'astro'
			}
		}
	],
	singleQuote: true,
	useTabs: true,
	trailingComma: 'none',
	printWidth: 160
};
