export default function getThemeConfiguration(theme, subset) {
	const { $themeConfigurations = {} } = useNuxtApp();

	let config = undefined;
	if (typeof theme === 'string') {
		const themeConfig = $themeConfigurations[theme];

		if (themeConfig && typeof themeConfig === 'object' && typeof themeConfig.then !== 'function') {
			// Theme is loaded
			config = { ...themeConfig };
		} else if (!themeConfig) {
			// Theme not found
			console.warn(`Theme "${theme}" not found. Available themes:`, Object.keys($themeConfigurations).filter(key => !key.startsWith('$')));
			return undefined;
		}
	} else if (typeof theme === 'object') {
		config = { ...theme };
	}

	if (subset) {
		config = getThemeConfigurationSubset(config, subset);
	}

	return config;
}
