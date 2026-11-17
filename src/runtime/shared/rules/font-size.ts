import { sanitizeKey } from '../helpers';
import {
	textProperties,
	escapeRegExp,
	utilityAutocomplete,
} from '../adapters/uno-helpers';
import { defineThemeRule } from '../rule-helpers/types';
import { typographyCss, typographyTokens } from '../rule-helpers/typography';
import type { ThemeUnoOutput } from '../adapters/uno.types';

export default defineThemeRule({
	css: typographyCss,
	adapters: {
		uno(_value, context): ThemeUnoOutput {
			if (
				context.key === 'fontStyles' &&
				context.config.fontSize &&
				context.rules.fontSize !== false
			)
				return {};
			const groups = typographyTokens(context);
			const sizes = groups.fontSize ?? {};
			const names = Object.keys(sizes);
			if (!names.length) return {};
			return {
				rules: [
					[
						new RegExp(
							`^text-(${names.map(escapeRegExp).join('|')})$`
						),
						([, name]) => {
							if (!name) return;
							const styles: Record<string, string> = {
								'font-size': `clamp(var(--minFontSize, 0px), var(--theme-fontSize-${sanitizeKey(name)}), var(--maxFontSize, 9999px))`,
								'--minFontSize': '0px',
								'--maxFontSize': '9999px',
							};
							for (const [key, property] of Object.entries(
								textProperties
							)) {
								if (!groups[key]) continue;
								styles[property] =
									groups[key][name] !== undefined
										? `var(--theme-${key}-${sanitizeKey(name)}${key === 'paragraphSpacing' ? ', 0' : ''})`
										: key === 'paragraphSpacing'
											? '0'
											: 'initial';
							}
							return styles;
						},
						{ autocomplete: utilityAutocomplete(['text'], names) },
					],
					...(['min', 'max'] as const).map(
						(
							bound
						): NonNullable<ThemeUnoOutput['rules']>[number] => [
							new RegExp(`^text-${bound}-(.+)$`),
							([, name]) => {
								if (!name) return;
								const property =
									bound === 'min'
										? '--minFontSize'
										: '--maxFontSize';
								if (name === 'unset')
									return {
										[property]:
											bound === 'min' ? '0px' : '9999px',
									};
								if (name in sizes)
									return {
										[property]: `var(--theme-fontSize-${sanitizeKey(name)})`,
									};
								if (/^\d+$/.test(name))
									return { [property]: `${name}px` };
								if (name.startsWith('[') && name.endsWith(']'))
									return { [property]: name.slice(1, -1) };
							},
							{
								autocomplete: [
									...utilityAutocomplete(
										[`text-${bound}`],
										[...names, 'unset']
									),
									`text-${bound}-<num>`,
								],
							},
						]
					),
				],
			};
		},
	},
});
