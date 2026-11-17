import colors from '../rules/colors';
import backgroundColors from '../rules/background-colors';
import textColors from '../rules/text-colors';
import borderColors from '../rules/border-colors';
import layout from '../rules/layout';
import spacing from '../rules/spacing';
import borderRadius from '../rules/border-radius';
import fontSize from '../rules/font-size';
import fontStyles from '../rules/font-styles';
import containers from '../rules/containers';
import { createTypographyPropertyRule } from './typography';
import { typographyProperties } from '../helpers';
import { createColorRule } from './color';
import type { ThemeRuleRegistry } from '../../utils/theme-configuration.types';
import type { ThemeRulePlugin } from './types';

export const defaultRules: ThemeRuleRegistry = {
	colors,
	backgroundColors,
	textColors,
	borderColors,
	layout,
	spacing,
	borderRadius,
	fontStyles,
	fontSize,
	containers,
	...Object.fromEntries(
		typographyProperties
			.filter((key) => key !== 'fontSize')
			.map((key) => [key, createTypographyPropertyRule(key)])
	),
};

export function resolveRules(
	overrides: ThemeRuleRegistry = {}
): ThemeRuleRegistry {
	for (const [key, rule] of Object.entries(overrides)) {
		if (
			rule !== false &&
			(!rule || (typeof rule.css !== 'function' && !rule.adapters))
		) {
			throw new Error(
				`themeConfiguration: rule "${key}" must export a plugin with css or adapters.`
			);
		}
	}
	return { ...defaultRules, ...overrides };
}

export function ruleFor(
	key: string,
	rules: ThemeRuleRegistry
): ThemeRulePlugin | false | undefined {
	if (key in rules) return rules[key];
	if (key.endsWith('Colors')) {
		return createColorRule(`colors-${key.slice(0, -6).toLowerCase()}`, key);
	}
	return undefined;
}
