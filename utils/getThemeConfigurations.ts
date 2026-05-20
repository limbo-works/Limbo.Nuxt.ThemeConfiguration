import type {
	ThemeConfiguration,
	ThemeSystem,
} from './theme-configuration.types';

export default function getThemeConfigurations() {
	const { $themeConfigurations = {} } = useNuxtApp();
	const typedThemeConfigurations = $themeConfigurations as ThemeSystem;
	const result: Record<string, ThemeConfiguration> = {};
	for (const key in typedThemeConfigurations) {
		if (!key.startsWith('$') && typedThemeConfigurations[key] != null) {
			result[key] = typedThemeConfigurations[key] as ThemeConfiguration;
		}
	}
	return result;
}
