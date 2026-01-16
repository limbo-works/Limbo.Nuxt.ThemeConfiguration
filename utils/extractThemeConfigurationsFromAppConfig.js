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

			// Use standard dynamic import
			configGlobs[name] = async () => {
				try {
					const module = await import(/* @vite-ignore */ configPath);
					return module?.default || module;
				} catch (error) {
					console.warn(`Failed to import theme configuration from "${configPath}": ${error?.message || String(error)}`);
					return undefined;
				}
			};
		}
	}

	return configGlobs;
};
