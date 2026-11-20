import type {
	ResolvedThemeOptions,
	ThemeConfiguration,
	ThemeOptions,
} from '../utils/theme-configuration.types';

export const defaultThemeOptions: ResolvedThemeOptions = {
	minify: false,
	round: false,
	disableBreakpointSpecificCustomProperties: false,
	baseFontSize: 16,
	viewportWidth: '100dvw',
	namedBreaks: { sm: 375, md: 1440, lg: 1920 },
};

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function unwrapThemeModule(value: unknown): ThemeConfiguration {
	if (!isRecord(value))
		throw new Error('themeConfiguration: theme must export an object.');
	return isRecord(value.default) ? value.default : value;
}

export function defineThemeConfig<T extends ThemeConfiguration>(config: T): T {
	return config;
}

export function resolveThemeOptions(
	options: ThemeOptions = {},
	defaults: ThemeOptions = {}
): ResolvedThemeOptions {
	const defined = (value: ThemeOptions): ThemeOptions =>
		Object.fromEntries(
			Object.entries(value).filter(([, entry]) => entry !== undefined)
		);
	const resolved: ResolvedThemeOptions = {
		...defaultThemeOptions,
		...defined(defaults),
		...defined(options),
	};
	const entries = Object.entries(resolved.namedBreaks);
	if (!entries.length)
		throw new Error(
			'themeConfiguration: namedBreaks must contain at least one breakpoint.'
		);
	const widths = new Set<number>();
	for (const [name, width] of entries) {
		if (
			!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(name) ||
			!Number.isFinite(width) ||
			width <= 0 ||
			widths.has(width)
		) {
			throw new Error(
				`themeConfiguration: invalid or duplicate named breakpoint "${name}": ${width}. Use unique positive widths and CSS-safe names.`
			);
		}
		widths.add(width);
	}
	if (!Number.isFinite(resolved.baseFontSize) || resolved.baseFontSize <= 0) {
		throw new Error('themeConfiguration: baseFontSize must be positive.');
	}
	return resolved;
}

export function normalizeThemeConfiguration(
	input: ThemeConfiguration,
	moduleOptions: ThemeOptions = {}
): ThemeConfiguration {
	for (const key of [
		...Object.keys(defaultThemeOptions),
		'smViewport',
		'mdViewport',
		'lgViewport',
		'handlers',
		'horizontalSpacing',
		'verticalSpacing',
	]) {
		if (key in input) {
			throw new Error(
				`themeConfiguration: legacy key "${key}". Move settings into options and replace removed keys; see README migration guide.`
			);
		}
	}
	if (input.options && 'handlers' in input.options) {
		throw new Error(
			'themeConfiguration: options.handlers was replaced by module rules. See README migration guide.'
		);
	}
	const options = Object.fromEntries(
		Object.entries({ ...moduleOptions, ...input.options }).filter(
			([, value]) => value !== undefined
		)
	);
	resolveThemeOptions(options);
	return { ...input, options };
}
