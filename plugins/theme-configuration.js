export default defineNuxtPlugin(async (nuxtApp) => {
	try {
		const themeLoaders = await getThemeConfigurationsAsync();
		const themeCache = {};
		let isDestroyed = false;

		const themeSystem = new Proxy(themeCache, {
			get(target, prop) {
				if (isDestroyed) {
					console.warn('Theme system has been destroyed');
					return undefined;
				}

				// Handle helper methods
				if (prop === '$loadTheme') {
					return async (themeName) => {
						if (isDestroyed) return undefined;
						if (target[themeName]) return target[themeName];

						const loader = themeLoaders[themeName];
						if (typeof loader === 'function') {
							try {
								const config = await loader();
								const themeConfig = config?.default || config;
								if (themeConfig && typeof themeConfig === 'object') {
									target[themeName] = themeConfig;
									return themeConfig;
								}
							} catch (error) {
								console.warn(`Failed to load theme configuration "${themeName}": ${error?.message || String(error)}`);
							}
						}
						return undefined;
					};
				}

				if (prop === '$loadThemeSync') return (themeName) => isDestroyed ? undefined : target[themeName];
				if (prop === '$getAvailableThemes') return () => isDestroyed ? [] : Object.keys(themeLoaders);
				if (prop === '$isThemeLoaded') return (themeName) => isDestroyed ? false : Boolean(target[themeName]);

				// Cleanup methods
				if (prop === '$clearTheme') {
					return (themeName) => {
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
						keys.forEach(key => delete target[key]);
						return keys.length;
					};
				}

				if (prop === '$destroy') {
					return () => {
						isDestroyed = true;
						// Clear all themes
						Object.keys(target).forEach(key => delete target[key]);
						// Clear loaders to break references
						Object.keys(themeLoaders).forEach(key => delete themeLoaders[key]);
						return true;
					};
				}

				// Handle theme access - load synchronously if not cached
				if (typeof prop === 'string' && !prop.startsWith('$') && themeLoaders[prop] && !target[prop]) {
					if (isDestroyed) return undefined;
					console.warn(`Theme "${prop}" not preloaded. Use getThemeConfigurationAsync() for loading.`);
					return undefined;
				}

				return isDestroyed ? undefined : target[prop];
			}
		});

		// Pre-load all themes for backward compatibility
		for (const themeName of Object.keys(themeLoaders)) {
			await themeSystem.$loadTheme(themeName);
		}

		// Add cleanup on app unmount/destroy
		nuxtApp.hook('app:beforeUnmount', () => {
			themeSystem.$destroy();
		});

		// Also handle browser page unload for cleanup
		if (process.client) {
			const cleanup = () => themeSystem.$destroy();
			window.addEventListener('beforeunload', cleanup);
			window.addEventListener('pagehide', cleanup);
		}

		nuxtApp.provide('themeConfigurations', themeSystem);
	} catch (error) {
		console.warn(`Failed to initialize theme configurations: ${error?.message || String(error)}`);
		nuxtApp.provide('themeConfigurations', {
			$loadTheme: async () => undefined,
			$loadThemeSync: () => undefined,
			$getAvailableThemes: () => [],
			$isThemeLoaded: () => false
		});
	}
});
