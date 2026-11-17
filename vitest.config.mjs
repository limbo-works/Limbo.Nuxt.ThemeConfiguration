import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import vue from '@vitejs/plugin-vue';

const resolve = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: 'unit',
					include: ['test/*.test.mjs'],
					environment: 'node',
				},
			},
			{
				plugins: [vue()],
				resolve: {
					alias: {
						'#app': resolve('./test/playground/nuxt-context.mjs'),
						'#imports': resolve(
							'./test/playground/nuxt-context.mjs'
						),
						'#theme-configuration/rules': resolve(
							'./test/playground/rules.mjs'
						),
						'#theme-configuration/themes': resolve(
							'./.playground/.nuxt/theme-configuration/themes.mjs'
						),
						'~': resolve('./.playground'),
					},
				},
				test: {
					include: ['test/playground/*.test.mjs'],
					browser: {
						enabled: true,
						headless: true,
						provider: playwright(),
						commands: {
							async setMedia({ page }, media) {
								await page.emulateMedia({ media });
							},
						},
						instances: [
							{
								browser: 'chromium',
								name: 'playground-chromium',
							},
							{ browser: 'firefox', name: 'playground-firefox' },
							{ browser: 'webkit', name: 'playground-webkit' },
						],
					},
				},
			},
		],
	},
});
