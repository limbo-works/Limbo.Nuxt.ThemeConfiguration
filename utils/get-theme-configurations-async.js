export default async function getThemeConfigurationsAsync() {
	const configGlobs = import.meta.glob(
		'~/assets/js/theme-configuration.*.(js|cjs|mjs)',
		{ as: 'json' }
	);

	const themeConfigurations = {};
	for (const key in configGlobs) {
		const themeName = key.match(
			/theme-configuration\.([a-zA-Z0-9_-]+)\./
		)[1];
		themeConfigurations[themeName] = (await configGlobs[key]())?.default;
	}

	return themeConfigurations;
};
