import getThemeConfigurationSubset from './getThemeConfigurationSubset';
import { normalizeThemeConfiguration } from '../shared/normalize-theme-configuration';
import type {
	ThemeConfiguration,
	ThemeSubset,
	ThemeSystem,
} from './theme-configuration.types';

export default function getThemeConfiguration(
	theme: string | ThemeConfiguration,
	subset?: ThemeSubset
) {
	const { $themeConfigurations = {} } = useNuxtApp();
	const typedThemeConfigurations = $themeConfigurations as ThemeSystem;

	let config: ThemeConfiguration | undefined;
	if (typeof theme === 'string') {
		config = typedThemeConfigurations[theme] as
			ThemeConfiguration | undefined;
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
		config = normalizeThemeConfiguration(theme);
	} else {
		return undefined;
	}

	return subset ? getThemeConfigurationSubset(config, subset) : config;
}
import { useNuxtApp } from '#app';
