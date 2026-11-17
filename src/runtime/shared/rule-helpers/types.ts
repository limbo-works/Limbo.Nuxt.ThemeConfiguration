import type {
	ResolvedThemeOptions,
	ThemeConfiguration,
	ThemeRuleRegistry,
} from '../../utils/theme-configuration.types';

export interface ThemeBreakpoint {
	name: string;
	width: number;
}

export interface ThemeCss {
	base: string[];
	media: Record<number, string[]>;
}

export interface ThemeResponsiveOptions {
	unit?: string;
	mode?: 'fluid' | 'step';
	transform?: (value: number) => number;
	format?: (value: string | number) => string;
}

export interface ThemeRuleContext {
	key: string;
	config: ThemeConfiguration;
	options: ResolvedThemeOptions;
	breaks: ThemeBreakpoint[];
	rules: ThemeRuleRegistry;
	responsive: (
		prefix: string,
		tokens: unknown,
		options?: ThemeResponsiveOptions
	) => ThemeCss;
}

// Adapters augment this interface; core does not load their framework dependencies.
export interface ThemeRuleAdapters {
	[adapter: string]: unknown;
}

export interface ThemeRulePlugin {
	css?: (value: unknown, context: ThemeRuleContext) => ThemeCss;
	adapters?: ThemeRuleAdapters;
}

export function defineThemeRule<T extends ThemeRulePlugin>(rule: T): T {
	return rule;
}

export function emptyCss(): ThemeCss {
	return { base: [], media: {} };
}

export function mergeCss(...sections: ThemeCss[]): ThemeCss {
	const result = emptyCss();
	for (const section of sections) {
		result.base.push(...section.base);
		for (const [width, rules] of Object.entries(section.media)) {
			(result.media[Number(width)] ??= []).push(...rules);
		}
	}
	return result;
}
