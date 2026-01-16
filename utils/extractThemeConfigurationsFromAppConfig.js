export default function extractThemeConfigurationsFromAppConfig(appConfig = {}) {
	const { themeConfiguration } = appConfig;
	if (!themeConfiguration?.themes || !Array.isArray(themeConfiguration.themes)) {
		return {};
	}

	const configGlobs = {};
	for (const configPath of themeConfiguration.themes) {
		if (typeof configPath === 'object') {
			const name = configPath.name || configPath.path;
			const {path} = configPath;
			configGlobs[name] = async () => {
				try {
					const module = await import(/* @vite-ignore */ path);
					return module?.default || module;
				} catch (error) {
					console.warn(`Failed to import theme configuration from "${path}": ${error?.message || String(error)}`);
					return undefined;
				}
			};
		} else {
			configGlobs[configPath] = async () => {
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
