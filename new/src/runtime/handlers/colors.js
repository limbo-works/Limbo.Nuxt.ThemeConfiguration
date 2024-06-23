export default defineThemeConfigurationHandler({
	key: 'colors',

	/** Method for generating the styles/custom properties */
	styles(colors, fullConfig, configOptions) {
		return '';
	},

	/** Methods for specific frameworks */
	unocss() {},
	// tailwindcss() {},
	// ..., etc.
});
