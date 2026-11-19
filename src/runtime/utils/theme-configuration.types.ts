import type { ThemeRulePlugin } from '../shared/rule-helpers/types';

export type ThemeScalar = string | number | boolean | null;
export type ThemeBreakpointName = string;
export type ThemeBreakpoints = Record<ThemeBreakpointName, number>;
export type ThemeResponsive<T> = T | Partial<Record<string | number, T>>;
export type ThemeColor =
	string | number[] | { value: string | number[]; isListedRgb?: boolean };
export type ThemeDimensions = Record<string, ThemeResponsive<number>>;
export type ThemeTypographyProperty =
	| 'fontSize'
	| 'fontFamily'
	| 'fontWeight'
	| 'fontStyle'
	| 'lineHeight'
	| 'letterSpacing'
	| 'textCase'
	| 'textDecoration'
	| 'paragraphIndent'
	| 'paragraphSpacing';
export type ThemeTypography = Record<
	string,
	| ThemeResponsive<number>
	| Partial<Record<ThemeTypographyProperty, ThemeResponsive<string | number>>>
	| Partial<
			Record<
				string | number,
				Partial<Record<ThemeTypographyProperty, string | number>>
			>
	  >
>;

export interface ThemeConfiguration {
	options?: ThemeOptions;
	colors?: Record<string, ThemeColor>;
	backgroundColors?: Record<string, ThemeColor>;
	textColors?: Record<string, ThemeColor>;
	borderColors?: Record<string, ThemeColor>;
	layout?: {
		margin?: ThemeResponsive<number>;
		gutter?: ThemeResponsive<number>;
		max?: number;
	};
	spacing?: ThemeDimensions;
	borderRadius?: ThemeDimensions;
	fontSize?: ThemeTypography;
	fontStyles?: ThemeTypography;
	containers?: Record<string, string>;
	[key: string]: unknown;
}

export interface ThemeSubsetMap {
	[key: string]: boolean | ThemeSubset;
}

export type ThemeSubset = string | string[] | RegExp | ThemeSubsetMap;

export type ThemeOptions = {
	minify?: boolean;
	round?: string | number | boolean;
	disableBreakpointSpecificCustomProperties?: boolean;
	baseFontSize?: number;
	viewportWidth?: string;
	namedBreaks?: ThemeBreakpoints;
};

export interface ThemeSourceFile {
	/** Absolute path to the source file. */
	path: string;
	/** Default export or JSON contents. */
	data: unknown;
}

export type ThemeSourceTransformer = (
	files: readonly ThemeSourceFile[],
	context: { name: string }
) => ThemeConfiguration | Promise<ThemeConfiguration>;

export interface ThemeFileSource {
	/** Directories, files, or glob patterns relative to Nuxt's source directory. */
	paths: string[];
	/** Filename globs used for directory paths. */
	files?: string | string[];
	/** Capture theme name from filename; named group "name" or first capture. */
	namePattern?: string;
	/** Aggregate all matched files into one theme. */
	name?: string;
	/** Build-time transformer function or path to a default-exported function. */
	transform?: ThemeSourceTransformer | string;
}

export interface ThemeSourceOptions {
	includeDefault?: boolean;
	entries?: ThemeFileSource[];
	unoTheme?: string;
}

export type ThemeModuleOptions = ThemeOptions & {
	rules?: Record<string, string | false>;
	uno?: boolean;
	sources?: ThemeSourceOptions;
};

export type ThemeConfigurationInput = ThemeConfiguration;
export type ThemeRuleRegistry = Record<string, ThemeRulePlugin | false>;
export type ResolvedThemeOptions = Required<ThemeOptions>;

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
