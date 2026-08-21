import type {
	ThemeConfiguration,
	ThemeLoaders,
} from './theme-configuration.types';

type ThemeConfigEntry =
	| string
	| {
			name?: string;
			path: string;
			theme?: ThemeConfiguration;
	  };

type ThemeConfigurationAppConfig = {
	themeConfiguration?: {
		themes?: ThemeConfigEntry[];
	};
	[key: string]: unknown;
};

function normalizeModulePath(path: string): string {
	const withoutBackslashes = path.replaceAll('\\', '/');
	const withoutQuery = withoutBackslashes.split('?')[0] ?? '';
	return withoutQuery.split('#')[0] ?? '';
}

function resolveFromLocalLoaders(
	path: string,
	localLoaders: ThemeLoaders
): ThemeLoaders[string] | undefined {
	const normalizedInput = normalizeModulePath(path);

	if (normalizedInput in localLoaders) {
		return localLoaders[normalizedInput];
	}

	const inputAssetSuffixMatch = normalizedInput.match(
		/assets\/js\/theme-configuration\.[^/]+\.(?:m?js|cjs|m?ts|cts)$/
	);
	const inputAssetSuffix = inputAssetSuffixMatch?.[0];
	if (inputAssetSuffix) {
		for (const [key, loader] of Object.entries(localLoaders)) {
			if (normalizeModulePath(key).endsWith(inputAssetSuffix)) {
				return loader;
			}
		}
	}

	if (normalizedInput.startsWith('~/')) {
		const tildePath = normalizedInput.replace(/^~\//, '/');
		for (const [key, loader] of Object.entries(localLoaders)) {
			if (normalizeModulePath(key).endsWith(tildePath)) {
				return loader;
			}
		}
	}

	return undefined;
}

export default function extractThemeConfigurationsFromAppConfig(
	appConfig: ThemeConfigurationAppConfig = {},
	localLoaders: ThemeLoaders = {}
) {
	const { themeConfiguration } = appConfig;
	if (
		!themeConfiguration?.themes ||
		!Array.isArray(themeConfiguration.themes)
	) {
		return {};
	}

	const configGlobs: ThemeLoaders = {};
	for (const configPath of themeConfiguration.themes) {
		if (typeof configPath === 'object') {
			const name = configPath.name || configPath.path;
			const { path, theme } = configPath;

			// Direct theme access
			if (theme) {
				// Get the theme directly
				configGlobs[name] = () => theme;
			} else {
				const localLoader = resolveFromLocalLoaders(path, localLoaders);
				if (localLoader) {
					configGlobs[name] = localLoader;
					continue;
				}

				// Extract theme from path (doesn't work too well)
				configGlobs[name] = async () => {
					try {
						const module = await import(/* @vite-ignore */ path);
						return module?.default || module;
					} catch (error) {
						console.warn(
							`Failed to import theme configuration from "${path}": ${(error as Error)?.message || String(error)}`
						);
						return undefined;
					}
				};
			}
		} else {
			const localLoader = resolveFromLocalLoaders(
				configPath,
				localLoaders
			);
			if (localLoader) {
				configGlobs[configPath] = localLoader;
				continue;
			}

			configGlobs[configPath] = async () => {
				try {
					const module = await import(/* @vite-ignore */ configPath);
					return module?.default || module;
				} catch (error) {
					console.warn(
						`Failed to import theme configuration from "${configPath}": ${(error as Error)?.message || String(error)}`
					);
					return undefined;
				}
			};
		}
	}

	return configGlobs;
}
