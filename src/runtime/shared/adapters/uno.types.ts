import type { Rule, Variant, PresetMiniTheme as Theme } from 'unocss';
import type { colorResolver } from '@unocss/preset-mini/utils';
import type { ThemeRuleContext } from '../rule-helpers/types';

export interface ThemeUnoOutput {
	theme?: Theme;
	rules?: Rule<Theme>[];
	variants?: Variant<Theme>[];
}

export interface ThemeUnoApi {
	colorResolver: typeof colorResolver;
}

export type ThemeUnoHandler = (
	value: unknown,
	context: ThemeRuleContext,
	api: ThemeUnoApi
) => ThemeUnoOutput;

declare module '../rule-helpers/types' {
	interface ThemeRuleAdapters {
		uno?: ThemeUnoHandler;
	}
}
