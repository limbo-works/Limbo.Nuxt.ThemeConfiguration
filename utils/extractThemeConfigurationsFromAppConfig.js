export default function extractThemeConfigurationsFromAppConfig(appConfig = {}) {
	const { themeConfiguration } = appConfig;

	const configGlobs = {};

	if (themeConfiguration?.themes && Array.isArray(themeConfiguration.themes)) {
		for (let configPath of themeConfiguration.themes) {
			let name;
			if (typeof configPath === 'object') {
				name = configPath.name || configPath.path;
				configPath = configPath.path;
			}

			configGlobs[name] = async () => (await import(configPath /* @vite-ignore */, {
				as: 'json',
			}));
		}
	}

	return configGlobs;
};
