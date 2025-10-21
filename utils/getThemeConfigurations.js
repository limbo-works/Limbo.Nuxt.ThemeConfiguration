export default function getThemeConfigurations() {
	const { $themeConfigurations = {} } = useNuxtApp();
	return $themeConfigurations;
}
