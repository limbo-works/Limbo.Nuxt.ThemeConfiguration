import { defineConfig } from 'unocss';
import { presetCore } from '@limbo-works/nuxt-core/assets/js/unocss/preset-core.mjs';

export default defineConfig({
	presets: [presetCore()],

	content: {
		pipeline: {
			exclude: [
				/* Something here is wreaking havoc with unoCSS */
				'**/ThemeConfiguration.vue',
			],
		},
	},
});
