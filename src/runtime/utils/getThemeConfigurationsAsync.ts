import type { ThemeLoaders } from './theme-configuration.types';
import extractThemeConfigurationsFromAppConfig from './extractThemeConfigurationsFromAppConfig';
import {
	themeLoaders as discoveredThemes,
	fileLoaders,
} from '#theme-configuration/themes';

export default async function getThemeConfigurationsAsync() {
	const extracted = extractThemeConfigurationsFromAppConfig(
		useAppConfig(),
		fileLoaders
	);
	const themeLoaders: ThemeLoaders = {};
	for (const key in extracted) {
		const match = key.match(/theme-configuration\.([a-zA-Z0-9_-]+)\./);
		const loaderKey = match?.[1] || key;
		themeLoaders[loaderKey] = extracted[key]!;
	}
	return { ...themeLoaders, ...discoveredThemes };
}
import { useAppConfig } from '#app';
