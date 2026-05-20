import config from './node_modules/@limbo-works/lint-configs/eslint.config.mjs';

export default [
	{
		ignores: ['components/ThemeConfiguration/ThemeConfiguration.vue'],
	},
	...config,
	{
		files: ['**/*.vue'],
		rules: {
			'vue/multi-word-component-names': 'off',
		},
		languageOptions: {
			parserOptions: {
				sourceType: 'module',
				ecmaVersion: 'latest',
			},
		},
	},
];
