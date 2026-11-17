import { isRecord } from '../normalize-theme-configuration';
import {
	restructureFontSizeObject,
	cloneDeep,
	deepmerge,
	typographyProperties,
} from '../helpers';
import { defineThemeRule, mergeCss } from './types';
import type { ThemeRuleContext } from './types';
import { memoizeCompilation } from './compilation-cache';

export const typographyTokens = memoizeCompilation((context) => {
	const groups: Record<string, Record<string, unknown>> = {};
	const mergeGroup = (key: string, tokens: Record<string, unknown>) => {
		const group = (groups[key] ??= {});
		for (const [name, value] of Object.entries(tokens)) {
			const current = group[name];
			group[name] =
				isRecord(current) && isRecord(value)
					? deepmerge(current, value)
					: cloneDeep(value);
		}
	};
	for (const section of ['fontStyles', 'fontSize'] as const) {
		if (
			context.rules[section] === false ||
			!isRecord(context.config[section])
		)
			continue;
		for (const [key, tokens] of Object.entries(
			restructureFontSizeObject(context.config[section])
		)) {
			mergeGroup(key, tokens);
		}
	}
	for (const key of typographyProperties) {
		if (
			key !== 'fontSize' &&
			context.rules[key] !== false &&
			isRecord(context.config[key])
		) {
			mergeGroup(key, context.config[key]);
		}
	}
	return groups;
});

export function typographyProperty(
	key: string,
	value: unknown,
	context: ThemeRuleContext
) {
	if (key === 'fontSize') {
		return context.responsive(key, value, {
			unit: 'rem',
			transform: (value) => value / context.options.baseFontSize,
		});
	}
	return context.responsive(key, value, {
		mode: 'step',
		unit: '',
		format: (entry) => {
			if (key === 'fontFamily') {
				const family = String(entry);
				return /^[a-zA-Z-]+$/.test(family) || /^['"]/.test(family)
					? family
					: JSON.stringify(family);
			}
			if (key === 'letterSpacing' || key === 'paragraphSpacing') {
				const amount =
					typeof entry === 'string' && entry.endsWith('%')
						? Number(entry.slice(0, -1)) / 100
						: entry;
				return `${amount}em`;
			}
			return String(entry);
		},
	});
}

export function typographyCss(value: unknown, context: ThemeRuleContext) {
	if (value === undefined) return mergeCss();
	if (!isRecord(value))
		throw new Error(
			`themeConfiguration: ${context.key} must be a typography map.`
		);
	const groups = restructureFontSizeObject(value);
	const effective = typographyTokens(context);
	return mergeCss(
		...Object.entries(groups).map(([key, tokens]) => {
			const scoped = Object.fromEntries(
				Object.entries(tokens).map(([name, token]) => [
					name,
					effective[key]?.[name] ?? token,
				])
			);
			return typographyProperty(key, scoped, context);
		})
	);
}

export function createTypographyPropertyRule(key: string) {
	return defineThemeRule({
		css(value, context) {
			if (!isRecord(value))
				return typographyProperty(key, value, context);
			const effective = typographyTokens(context)[key] ?? {};
			const scoped = Object.fromEntries(
				Object.keys(value).map((name) => [name, effective[name]])
			);
			return typographyProperty(key, scoped, context);
		},
	});
}
