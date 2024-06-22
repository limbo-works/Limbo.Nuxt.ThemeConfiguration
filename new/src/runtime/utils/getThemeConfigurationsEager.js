export default function getThemeConfigurationsEager() {
	const configGlobs = import.meta.glob(
		`~/assets/js/theme-configuration.*.(js|cjs|mjs)`,
		{ as: 'json', eager: true }
	);

	const themeConfigurations = {};
	for (const key in configGlobs) {
		const themeName = key.match(
			/theme-configuration\.([a-zA-Z0-9_-]+)\./
		)[1];
		themeConfigurations[themeName] = configGlobs[key]?.default;
	}

	return themeConfigurations;
}
