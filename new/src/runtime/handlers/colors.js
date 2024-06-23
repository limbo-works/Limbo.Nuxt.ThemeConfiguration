export default defineThemeConfigurationHandler({
	key: 'colors',

	generators: {
		/** Method for generating the styles/custom properties */
		styles(key, fullConfig, configOptions) {

			// Generate an object of keys (each being a breakpoint) with values being objects of generated styles
			// We want an object as we can easily both generate the string of styles, but also use the object for our framework generators
			return {};
		},

		/** Methods for specific frameworks */
		unocssTheme() {
			// Generate the theme object for UnoCSS
			return {};
		},
		unocssRules() {
			// Generate the rules array for UnoCSS
			return [];
		},
		// tailwindcss() {},
		// ..., etc.
	},
});
