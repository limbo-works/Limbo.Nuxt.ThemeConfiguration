import { defineConfig } from 'unocss';
import { presetCore } from '@limbo-works/nuxt-core/assets/js/unocss/preset-core.mjs';
import { makeThemeUtilities, makeRules } from '../assets/js/helpers.uno.ts';
import defaultConfig from './assets/js/theme-configuration.default.js';

export default defineConfig({
	presets: [presetCore()],

	theme: { ...makeThemeUtilities(defaultConfig) },
	rules: [...makeRules(defaultConfig)],

	content: {
		pipeline: {
			exclude: [
				/* Something here is wreaking havoc with unoCSS */
				'**/ThemeConfiguration.vue',
			],
		},
	},
});
