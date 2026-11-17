import config from './node_modules/@limbo-works/lint-configs/eslint.config.mjs';
import typescriptParser from '@typescript-eslint/parser';

export default [
	{
		ignores: ['dist/**', 'src/runtime/components/ThemeConfiguration.vue'],
	},
	...config,
	{
		files: ['**/*.vue'],
		rules: {
			'vue/multi-word-component-names': 'off',
		},
		languageOptions: {
			parserOptions: {
				parser: typescriptParser,
				sourceType: 'module',
				ecmaVersion: 'latest',
			},
		},
	},
];
