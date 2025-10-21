export default async function getThemeConfigurationAsync(theme, subset) {
	let config = undefined;
	if (typeof theme === 'string') {
		const configGlobs = import.meta.glob(
			'~/assets/js/theme-configuration.*.(js|cjs|mjs)',
			{ as: 'json' }
		);

		const themeConfigurations = {};
		for (const key in configGlobs) {
			const themeName = key.match(
				/theme-configuration\.([a-zA-Z0-9_-]+)\./
			)[1];
			if (themeName === theme) {
				themeConfigurations[themeName] = (await configGlobs[key]())?.default;
			}
		}

		if (themeConfigurations[theme]) {
			config = { ...themeConfigurations[theme] };
		}
	} else if (typeof theme === 'object') {
		config = { ...theme };
	}

	if (subset) {
		config = getThemeConfigurationSubset(config, subset);
	}

	return config;
}
