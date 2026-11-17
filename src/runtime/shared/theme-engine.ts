import {
	isRecord,
	normalizeThemeConfiguration,
	resolveThemeOptions,
} from './normalize-theme-configuration';
import { cloneDeep } from './helpers';
import { generateResponsiveRules } from './responsive';
import { mergeCss } from './rule-helpers/types';
import { resolveRules, ruleFor } from './rule-helpers/registry';
import type { ThemeRuleContext } from './rule-helpers/types';
import type {
	ThemeConfiguration,
	ThemeOptions,
	ThemeRuleRegistry,
} from '../utils/theme-configuration.types';

export function createRuleContext(
	config: ThemeConfiguration,
	key: string,
	defaults: ThemeOptions = {},
	rules: ThemeRuleRegistry = resolveRules()
): ThemeRuleContext {
	const options = resolveThemeOptions(config.options, defaults);
	const context: ThemeRuleContext = {
		key,
		config,
		options,
		rules,
		breaks: Object.entries(options.namedBreaks)
			.map(([name, width]) => ({ name, width }))
			.sort((a, b) => a.width - b.width),
		responsive: (prefix, value, settings) =>
			generateResponsiveRules(context, prefix, value, settings),
	};
	return context;
}

export interface ThemeCssOptions {
	selector?: string;
	cssLayer?: string;
	defaults?: ThemeOptions;
	rules?: ThemeRuleRegistry;
	baseConfig?: ThemeConfiguration;
}

export function mergeThemeConfigs(
	base: ThemeConfiguration,
	override: ThemeConfiguration,
	defaults?: ThemeOptions,
	existingOnly = false
): ThemeConfiguration {
	const options = { ...base.options, ...override.options };
	const widths = (breaks: Record<string, number>) =>
		Object.values(breaks)
			.sort((a, b) => a - b)
			.join(',');
	const replaceEndpoints =
		!!override.options?.namedBreaks &&
		widths(override.options.namedBreaks) !==
			widths(resolveThemeOptions(base.options, defaults).namedBreaks);
	return {
		...mergeRecords(base, override, replaceEndpoints, existingOnly),
		options: defaults ? resolveThemeOptions(options, defaults) : options,
	};
}

function isEndpointMap(value: Record<string, unknown>): boolean {
	const keys = Object.keys(value);
	return keys.length > 0 && keys.every((key) => /^\d+(?:\.\d+)?$/.test(key));
}

function mergeRecords(
	base: Record<string, unknown>,
	override: Record<string, unknown>,
	replaceEndpoints: boolean,
	existingOnly: boolean
): Record<string, unknown> {
	return mergeOverrides(
		cloneDeep(base),
		base,
		override,
		replaceEndpoints,
		existingOnly
	);
}

function mergeOverrides(
	result: Record<string, unknown>,
	base: Record<string, unknown>,
	override: Record<string, unknown>,
	replaceEndpoints: boolean,
	existingOnly: boolean
): Record<string, unknown> {
	for (const [key, value] of Object.entries(override)) {
		if (existingOnly && !(key in base)) continue;
		const current = base[key];
		if (Object.is(current, value) && Object.hasOwn(result, key)) continue;
		if (
			isRecord(current) &&
			isRecord(value) &&
			!(replaceEndpoints && isEndpointMap(value))
		) {
			const target = result[key];
			const plain =
				isRecord(target) &&
				(Object.getPrototypeOf(target) === Object.prototype ||
					Object.getPrototypeOf(target) === null);
			// Detach updated branches: authored tokens can share object references.
			result[key] = mergeOverrides(
				plain ? { ...target } : cloneDeep(current),
				current,
				value,
				replaceEndpoints,
				existingOnly && !isEndpointMap(value)
			);
		} else {
			result[key] = cloneDeep(value);
		}
	}
	return result;
}

function scopedOverrides(source: unknown, effective: unknown): unknown {
	if (!isRecord(source) || !isRecord(effective)) return source;
	const keys = Object.keys(source);
	// A breakpoint map is one token: retain its unmodified endpoints, not unrelated tokens.
	if (isEndpointMap(source)) return effective;
	return Object.fromEntries(
		keys.map((key) => [key, scopedOverrides(source[key], effective[key])])
	);
}

export function generateThemeCss(
	config: ThemeConfiguration,
	settings: ThemeCssOptions = {}
): string {
	config = normalizeThemeConfiguration(config);
	const registry = resolveRules(settings.rules);
	const context = createRuleContext(
		mergeThemeConfigs(settings.baseConfig ?? {}, config),
		'',
		settings.defaults,
		registry
	);
	const sections = [];
	for (const key of new Set([
		...Object.keys(registry),
		...Object.keys(config),
	])) {
		const value = scopedOverrides(config[key], context.config[key]);
		if (key === 'options' || value === undefined) continue;
		const plugin = ruleFor(key, registry);
		if (plugin === undefined)
			throw new Error(
				`themeConfiguration: no rule registered for "${key}". Register it in themeConfiguration.rules.`
			);
		if (plugin !== false && plugin.css) {
			sections.push(plugin.css(value, { ...context, key }));
		}
	}
	const output = mergeCss(...sections);
	const selector = settings.selector ?? ':root';
	const minify = context.options.minify;
	const joiner = minify ? '' : '\n';
	const wrap = (rules: string[]) =>
		rules.length
			? [
					`${selector} {`,
					...rules.map((rule) => (minify ? rule : `  ${rule}`)),
					'}',
				].join(joiner)
			: '';
	const blocks = [wrap(output.base)];
	for (const [width, rules] of Object.entries(output.media).sort(
		([a], [b]) => Number(a) - Number(b)
	)) {
		if (!rules.length) continue;
		const em = Number(
			(Number(width) / context.options.baseFontSize).toFixed(6)
		);
		blocks.push(
			`@media (min-width: ${em}em) {${joiner}${wrap(rules)}${joiner}}`
		);
	}
	const css = blocks.filter(Boolean).join(joiner);
	return css && settings.cssLayer
		? `@layer ${settings.cssLayer} {${joiner}${css}${joiner}}`
		: css;
}
