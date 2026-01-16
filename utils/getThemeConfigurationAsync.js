export default async function getThemeConfigurationAsync(theme, subset) {
	const { $themeConfigurations = {} } = useNuxtApp();

	let config;
	if (typeof theme === 'string') {
		config = $themeConfigurations[theme] || await $themeConfigurations.$loadTheme?.(theme);
		if (!config) {
			const availableThemes = $themeConfigurations.$getAvailableThemes?.();
			console.warn(`Theme "${theme}" not found. Available themes:`, availableThemes || []);
			return undefined;
		}
	} else if (typeof theme === 'object') {
		config = theme;
	} else {
		return undefined;
	}

	return subset ? getThemeConfigurationSubset(config, subset) : config;
}
