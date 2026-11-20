import { isRecord } from '../normalize-theme-configuration';
import { utilityAutocomplete } from '../adapters/uno-helpers';
import { createColorRule, onBackgroundStyles } from '../rule-helpers/color';
import { defineThemeRule } from '../rule-helpers/types';
import type { ThemeUnoOutput } from '../adapters/uno.types';

const base = createColorRule('colors-background', 'backgroundColor');

export default defineThemeRule({
	...base,
	adapters: {
		uno(value, context, api): ThemeUnoOutput {
			const output = base.adapters.uno(value, context, api);
			return {
				theme: output.theme,
				rules: ['bg', 'bg-scope'].map((utility) => [
					new RegExp(`^${utility}-(.+)$`),
					async (match, meta) => {
						const resolved: unknown = await api.colorResolver(
							'background-color',
							utility
						)(match, {
							...meta,
							theme: {
								...meta.theme,
								colors: {
									...meta.theme.colors,
									...output.theme?.backgroundColor,
								},
							},
						});
						if (
							!isRecord(resolved) ||
							typeof resolved['background-color'] !== 'string'
						)
							return;
						const styles: Record<string, string> = {};
						for (const [key, value] of Object.entries(resolved)) {
							if (
								typeof value === 'string' ||
								typeof value === 'number'
							)
								styles[key] = String(value);
						}
						if (utility === 'bg-scope')
							delete styles['background-color'];
						if (match[1] !== 'bgCurrent')
							styles['--bgCurrent'] = String(
								resolved['background-color']
							);
						const scoped =
							match[1] && onBackgroundStyles(match[1], context);
						if (scoped) Object.assign(styles, scoped);
						return styles;
					},
					{
						autocomplete: [
							`${utility}-$backgroundColor`,
							...utilityAutocomplete(
								[utility],
								Object.keys(isRecord(value) ? value : {})
							),
						],
					},
				]),
			};
		},
	},
});
