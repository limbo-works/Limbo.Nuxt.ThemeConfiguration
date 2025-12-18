export default async function getThemeConfigurationAsync(theme, subset) {
	const appConfig = useAppConfig();

	let config = undefined;
	if (typeof theme === 'string') {
		const configGlobs = import.meta.glob(
			'~/assets/js/theme-configuration.*.(js|cjs|mjs)',
			{ as: 'json' }
		);

		Object.assign(configGlobs, extractThemeConfigurationsFromAppConfig(appConfig));

		const themeConfigurations = {};
		for (const key in configGlobs) {
			const themeName = key.match(
				/theme-configuration\.([a-zA-Z0-9_-]+)\./
			)?.[1] || key;
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
