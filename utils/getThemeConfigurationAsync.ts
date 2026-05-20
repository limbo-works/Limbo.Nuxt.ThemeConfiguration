import type {
	ThemeConfiguration,
	ThemeSystem,
} from './theme-configuration.types';

export default async function getThemeConfigurationAsync(
	theme: string | ThemeConfiguration,
	subset?: string | string[] | RegExp | Record<string, any>
) {
	const { $themeConfigurations = {} } = useNuxtApp();
	const typedThemeConfigurations = $themeConfigurations as ThemeSystem;

	let config: ThemeConfiguration | undefined;
	if (typeof theme === 'string') {
		config =
			(typedThemeConfigurations[theme] as
				| ThemeConfiguration
				| undefined) ||
			(await typedThemeConfigurations.$loadTheme?.(theme));
		if (!config) {
			const availableThemes =
				typedThemeConfigurations.$getAvailableThemes?.();
			console.warn(
				`Theme "${theme}" not found. Available themes:`,
				availableThemes || []
			);
			return undefined;
		}
	} else if (typeof theme === 'object') {
		config = theme as ThemeConfiguration;
	} else {
		return undefined;
	}

	return subset ? getThemeConfigurationSubset(config, subset) : config;
}
