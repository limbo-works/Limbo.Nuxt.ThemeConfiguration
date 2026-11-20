export default defineNuxtConfig({
	extends: ['@limbo-works/nuxt-core'],
	modules: ['@unocss/nuxt', '../src/module'],
	themeConfiguration: {
		minify: true,
		viewportWidth: '100dvw',
		sources: {
			entries: [
				{
					paths: ['assets/generated/test-tokens'],
					files: '*.json',
					name: 'tokenBundle',
					transform: (files) => ({
						colors: files.find((file) =>
							file.path.endsWith('/colors.json')
						).data,
						spacing: files.find((file) =>
							file.path.endsWith('/spacing.json')
						).data,
					}),
				},
			],
		},
		rules: {
			motion: './rules/motion.ts',
			spacing: './rules/spacing.ts',
			testDisabled: false,
		},
	},
	compatibilityDate: '2024-09-23',
});
