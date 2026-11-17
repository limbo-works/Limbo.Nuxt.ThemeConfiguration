import { colorResolver } from '@unocss/preset-mini/utils';
import type { Rule, Variant, PresetMiniTheme as Theme } from 'unocss';
import { deepmerge } from './helpers';
import { normalizeThemeConfiguration } from './normalize-theme-configuration';
import { createRuleContext } from './theme-engine';
import { resolveRules, ruleFor } from './rule-helpers/registry';
import type {
	ThemeConfiguration,
	ThemeOptions,
	ThemeRuleRegistry,
} from '../utils/theme-configuration.types';
import type { ThemeUnoOutput } from './adapters/uno.types';

export type * from './adapters/uno.types';

export function makeUnoTheme(
	input: ThemeConfiguration,
	options: ThemeOptions = {},
	overrides: ThemeRuleRegistry = {}
): Required<ThemeUnoOutput> {
	const config = normalizeThemeConfiguration(input, options);
	const registry = resolveRules(overrides);
	const context = createRuleContext(config, '', {}, registry);
	const theme: Theme & Record<string, unknown> = {};
	const rules: Rule<Theme>[] = [];
	const variants: Variant<Theme>[] = [];
	for (const key of new Set([...Object.keys(config), 'containers'])) {
		const value = config[key];
		if (key === 'options' || (value === undefined && key !== 'containers'))
			continue;
		const plugin = ruleFor(key, registry);
		if (plugin === undefined)
			throw new Error(
				`themeConfiguration: no rule registered for "${key}".`
			);
		const hook = plugin && plugin.adapters?.uno;
		if (!hook) continue;
		const result = hook(value, { ...context, key }, { colorResolver });
		if (result.theme) deepmerge(theme, { ...result.theme });
		if (result.rules) rules.push(...result.rules);
		if (result.variants) variants.push(...result.variants);
	}
	return { theme, rules, variants };
}

export function makeThemeUtilities(
	config: ThemeConfiguration,
	options?: ThemeOptions,
	rules?: ThemeRuleRegistry
): Theme {
	return makeUnoTheme(config, options, rules).theme;
}

export function makeRules(
	config: ThemeConfiguration,
	options?: ThemeOptions,
	rules?: ThemeRuleRegistry
): Rule<Theme>[] {
	return makeUnoTheme(config, options, rules).rules;
}
