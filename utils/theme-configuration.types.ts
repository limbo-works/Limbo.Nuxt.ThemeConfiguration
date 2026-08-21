export type ThemeScalar = string | number | boolean | null;

export interface ThemeConfiguration {
	[key: string]: ThemeScalar | ThemeConfiguration | ThemeConfiguration[];
}

export interface ThemeSubsetMap {
	[key: string]: boolean | ThemeSubset;
}

export type ThemeSubset = string | string[] | RegExp | ThemeSubsetMap;

export type ThemeLoaderResult =
	ThemeConfiguration | { default?: ThemeConfiguration };

export type ThemeLoader = () => Promise<ThemeLoaderResult> | ThemeLoaderResult;

export type ThemeLoaders = Record<string, ThemeLoader>;

export type ThemeSystemApi = {
	$loadTheme: (themeName: string) => Promise<ThemeConfiguration | undefined>;
	$loadThemeSync: (themeName: string) => ThemeConfiguration | undefined;
	$getAvailableThemes: () => string[];
	$isThemeLoaded: (themeName: string) => boolean;
	$clearTheme: (themeName: string) => boolean;
	$clearAllThemes: () => number;
	$destroy: () => boolean;
};

export type ThemeSystem = ThemeSystemApi &
	Record<
		string,
		ThemeConfiguration | ThemeSystemApi[keyof ThemeSystemApi] | undefined
	>;
