export default function getThemeConfigurations() {
	const { $themeConfigurations = {} } = useNuxtApp();
	const result = {};
	for (const key in $themeConfigurations) {
		if (!key.startsWith('$') && $themeConfigurations[key] != null) {
			result[key] = $themeConfigurations[key];
		}
	}
	return result;
}
