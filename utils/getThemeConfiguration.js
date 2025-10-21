export default function getThemeConfiguration(theme, subset) {
	const { $themeConfigurations = {} } = useNuxtApp();

	let config = undefined;
	if (typeof theme === 'string') {
		if ($themeConfigurations[theme]) {
			config = { ...$themeConfigurations[theme] };
		}
	} else if (typeof theme === 'object') {
		config = { ...theme };
	}

	if (subset) {
		config = getThemeConfigurationSubset(config, subset);
	}

	return config;
}
