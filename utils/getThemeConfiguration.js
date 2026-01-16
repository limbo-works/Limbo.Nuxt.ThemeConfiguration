export default function getThemeConfiguration(theme, subset) {
	const { $themeConfigurations = {} } = useNuxtApp();

	let config;
	if (typeof theme === 'string') {
		config = $themeConfigurations[theme];
		if (!config) {
			console.warn(`Theme "${theme}" not found. Available themes:`, $themeConfigurations.$getAvailableThemes?.() || []);
			return undefined;
		}
	} else if (typeof theme === 'object') {
		config = theme;
	} else {
		return undefined;
	}

	return subset ? getThemeConfigurationSubset(config, subset) : config;
}
