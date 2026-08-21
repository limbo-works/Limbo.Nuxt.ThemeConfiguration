import type {
	ThemeConfiguration,
	ThemeLoaderResult,
	ThemeLoaders,
	ThemeSystem,
} from '~/utils/theme-configuration.types';

export default defineNuxtPlugin(async (nuxtApp) => {
	try {
		const themeLoaders =
			(await getThemeConfigurationsAsync()) as ThemeLoaders;
		const themeCache: Record<string, ThemeConfiguration> = {};
		let isDestroyed = false;

		const themeSystem = new Proxy(themeCache, {
			get(target, prop: string | symbol) {
				if (isDestroyed) {
					console.warn('Theme system has been destroyed');
					return undefined;
				}

				// Handle helper methods
				if (prop === '$loadTheme') {
					return async (themeName: string) => {
						if (isDestroyed) return undefined;
						if (target[themeName]) return target[themeName];

						const loader = themeLoaders[themeName];
						if (typeof loader === 'function') {
							try {
								const config =
									(await loader()) as ThemeLoaderResult;
								const themeConfig = config?.default || config;
								if (
									themeConfig &&
									typeof themeConfig === 'object'
								) {
									target[themeName] =
										themeConfig as ThemeConfiguration;
									return themeConfig;
								}
							} catch (error: unknown) {
								console.warn(
									`Failed to load theme configuration "${themeName}": ${(error as Error)?.message || String(error)}`
								);
							}
						}
						return undefined;
					};
				}

				if (prop === '$loadThemeSync')
					return (themeName: string) =>
						isDestroyed ? undefined : target[themeName];
				if (prop === '$getAvailableThemes')
					return () => (isDestroyed ? [] : Object.keys(themeLoaders));
				if (prop === '$isThemeLoaded')
					return (themeName: string) =>
						isDestroyed ? false : Boolean(target[themeName]);

				// Cleanup methods
				if (prop === '$clearTheme') {
					return (themeName: string) => {
						if (target[themeName]) {
							delete target[themeName];
							return true;
						}
						return false;
					};
				}

				if (prop === '$clearAllThemes') {
					return () => {
						const keys = Object.keys(target);
						keys.forEach((key) => delete target[key]);
						return keys.length;
					};
				}

				if (prop === '$destroy') {
					return () => {
						isDestroyed = true;
						// Clear all themes
						Object.keys(target).forEach(
							(key) => delete target[key]
						);
						// Clear loaders to break references
						Object.keys(themeLoaders).forEach(
							(key) => delete themeLoaders[key]
						);
						return true;
					};
				}

				// Handle theme access - load synchronously if not cached
				if (
					typeof prop === 'string' &&
					!prop.startsWith('$') &&
					themeLoaders[prop] &&
					!target[prop]
				) {
					if (isDestroyed) return undefined;
					console.warn(
						`Theme "${prop}" not preloaded. Use getThemeConfigurationAsync() for loading.`
					);
					return undefined;
				}

				return isDestroyed || typeof prop !== 'string'
					? undefined
					: target[prop];
			},
		}) as ThemeSystem;

		// Pre-load all themes for backward compatibility
		await Promise.all(
			Object.keys(themeLoaders).map((themeName) =>
				themeSystem.$loadTheme(themeName)
			)
		);

		// Also handle browser page unload for cleanup
		if (import.meta.client) {
			const cleanup = () => themeSystem?.$destroy?.();
			window.addEventListener('beforeunload', cleanup);
			window.addEventListener('pagehide', cleanup);
		}

		nuxtApp.provide('themeConfigurations', themeSystem);
	} catch (error: unknown) {
		console.warn(
			`Failed to initialize theme configurations: ${(error as Error)?.message || String(error)}`
		);
		nuxtApp.provide('themeConfigurations', {
			$loadTheme: async () => undefined,
			$loadThemeSync: () => undefined,
			$getAvailableThemes: () => [],
			$isThemeLoaded: () => false,
			$clearTheme: () => false,
			$clearAllThemes: () => 0,
			$destroy: () => true,
		});
	}
});
