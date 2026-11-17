import { sanitizeKey } from '../helpers';
import { isRecord } from '../normalize-theme-configuration';
import { emptyCss, defineThemeRule } from './types';
import type { ThemeRuleContext } from './types';
import type { ThemeUnoOutput } from '../adapters/uno.types';
import { memoizeCompilation } from './compilation-cache';

export function colorValue(value: unknown): string {
	const raw = isRecord(value) ? value.value : value;
	if (typeof raw === 'string') {
		if (/^\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*$/.test(raw)) {
			return raw
				.split(',')
				.map((channel) => channel.trim())
				.join(' ');
		}
		return raw;
	}
	if (
		Array.isArray(raw) &&
		(raw.length === 3 || raw.length === 4) &&
		raw.every(
			(channel) => typeof channel === 'number' && Number.isFinite(channel)
		)
	) {
		return `${raw.slice(0, 3).join(' ')}${raw.length === 4 ? ` / ${raw[3]}` : ''}`;
	}
	throw new Error(`themeConfiguration: invalid color ${String(raw)}.`);
}

function matchBackground(name: string, backgrounds: string[]) {
	for (const background of backgrounds) {
		const camel = `on${background[0]!.toUpperCase()}${background.slice(1)}`;
		const kebab = `on-${background}-`;
		const suffix = name.startsWith(kebab)
			? name.slice(kebab.length)
			: name.startsWith(camel)
				? name.slice(camel.length)
				: '';
		if (suffix)
			return {
				background,
				name: suffix[0]!.toLowerCase() + suffix.slice(1),
			};
	}
	return undefined;
}

const backgroundIndex = memoizeCompilation((context) => {
	const backgrounds = Object.keys(context.config.backgroundColors ?? {}).sort(
		(a, b) => b.length - a.length
	);
	const matches = new Map<string, ReturnType<typeof matchBackground>>();
	const styles = new Map<string, Record<string, string>>();
	for (const [section, entries] of Object.entries(context.config)) {
		if (
			context.rules[section] === false ||
			(section !== 'colors' && !section.endsWith('Colors')) ||
			!isRecord(entries)
		)
			continue;
		const prefix =
			section === 'colors'
				? 'colors'
				: `colors-${section.slice(0, -6).toLowerCase()}`;
		for (const name of Object.keys(entries)) {
			if (!matches.has(name))
				matches.set(name, matchBackground(name, backgrounds));
			const on = matches.get(name);
			if (!on) continue;
			const declarations = styles.get(on.background) ?? {};
			declarations[`--theme-${prefix}-${sanitizeKey(on.name)}-on-X`] =
				`var(--theme-${prefix}-${sanitizeKey(name)})`;
			styles.set(on.background, declarations);
		}
	}
	return { backgrounds, matches, styles };
});

export function onBackground(name: string, context: ThemeRuleContext) {
	if (context.rules.backgroundColors === false) return undefined;
	const index = backgroundIndex(context);
	if (!index.matches.has(name))
		index.matches.set(name, matchBackground(name, index.backgrounds));
	return index.matches.get(name);
}

export function onBackgroundStyles(
	background: string,
	context: ThemeRuleContext
) {
	if (context.rules.backgroundColors === false) return undefined;
	return backgroundIndex(context).styles.get(background);
}

export function colorVariable(
	prefix: string,
	name: string,
	value: unknown
): string {
	const raw = colorValue(value);
	const rgb =
		(isRecord(value) && value.isListedRgb) ||
		/^-?[\d.]+\s+-?[\d.]+\s+-?[\d.]+(?:\s*\/\s*[\d.]+%?)?$/.test(raw);
	const variable = `var(--theme-${prefix}-${sanitizeKey(name)}, ${raw})`;
	return rgb ? `rgb(${variable})` : variable;
}

export function createColorRule(
	prefix: string,
	themeKey: string,
	utility?: string,
	property?: string
) {
	return defineThemeRule({
		css(value) {
			const output = emptyCss();
			if (value === undefined) return output;
			if (!isRecord(value))
				throw new Error(
					`themeConfiguration: ${prefix} must be a color map.`
				);
			for (const [name, color] of Object.entries(value)) {
				output.base.push(
					`--theme-${prefix}-${sanitizeKey(name)}: ${colorValue(color)};`
				);
			}
			return output;
		},
		adapters: {
			uno(value, context, api): ThemeUnoOutput {
				if (!isRecord(value)) return {};
				const colors: Record<string, string> = {};
				for (const [name, color] of Object.entries(value)) {
					colors[name] = colorVariable(prefix, name, color);
					const on = onBackground(name, context);
					if (on)
						colors[on.name] = colorVariable(
							prefix,
							`${on.name}-on-X`,
							color
						);
				}
				if (themeKey === 'colors')
					colors.bgCurrent = 'var(--bgCurrent, transparent)';
				return {
					theme: { [themeKey]: colors },
					rules:
						utility && property
							? [
									[
										new RegExp(`^${utility}-(.+)$`),
										(match, meta) =>
											api.colorResolver(
												property,
												utility
											)(match, {
												...meta,
												theme: {
													...meta.theme,
													colors: {
														...meta.theme.colors,
														...colors,
													},
												},
											}),
										{
											autocomplete: `${utility}-$${themeKey}`,
										},
									],
								]
							: [],
				};
			},
		},
	});
}
