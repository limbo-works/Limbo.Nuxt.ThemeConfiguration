import {
	dimensionProperties,
	dimensionUtilities,
	utilityAutocomplete,
} from '../adapters/uno-helpers';
import { isRecord } from '../normalize-theme-configuration';
import { numericValue } from '../responsive';
import { defineThemeRule, emptyCss } from '../rule-helpers/types';
import type { ThemeUnoOutput } from '../adapters/uno.types';

function layoutDimensions(value: Record<string, unknown>) {
	if ('columns' in value || 'columnCount' in value)
		throw new Error(
			'themeConfiguration: column counts are no longer configured in layout; use classes such as w-1/3col.'
		);
	return Object.fromEntries(
		Object.entries(value).filter(([key]) => key !== 'max')
	);
}

export default defineThemeRule({
	css(value, context) {
		if (value === undefined) return emptyCss();
		if (!isRecord(value))
			throw new Error('themeConfiguration: layout must be an object.');
		const dimensions = layoutDimensions(value);
		const max = context.config.layout?.max;
		const output = context.responsive('layout', dimensions);
		if (max !== undefined) numericValue(max);
		output.base.push(
			`--theme-layout-max: ${
				max === undefined
					? `var(--visual-viewport-width, ${context.options.viewportWidth})`
					: `${max}px`
			};`
		);
		const viewport = `var(--visual-viewport-width, ${context.options.viewportWidth})`;
		output.base.push(
			`--theme-layout-width: min(${viewport}, var(--theme-layout-max));`
		);
		return output;
	},
	adapters: {
		uno(value): ThemeUnoOutput {
			if (!isRecord(value)) return {};
			const rules = dimensionUtilities(
				layoutDimensions(value),
				'layout',
				dimensionProperties,
				'layout-'
			);
			if ('max' in value) {
				rules.push([
					/^(w|min-w|max-w)-layout-max$/,
					([, utility]) =>
						utility
							? {
									[dimensionProperties[utility]!]:
										'var(--theme-layout-max)',
								}
							: undefined,
					{
						autocomplete: utilityAutocomplete(
							['w', 'min-w', 'max-w'],
							['layout-max']
						),
					},
				]);
			}
			rules.push([
				new RegExp(
					`^(${Object.keys(dimensionProperties).join('|')})-(\\d*\\.?\\d+)\\/([1-9]\\d*)col$`
				),
				([, utility, amount, count]) => {
					if (!utility || !amount || !count) return;
					const span = numericValue(Number(amount));
					const columns = numericValue(Number(count));
					const gutter = 'var(--theme-layout-gutter, 0px)';
					const column = `((var(--theme-layout-width) - (var(--theme-layout-margin, 0px) * 2 + ${gutter} * ${columns - 1})) / ${columns})`;
					return {
						[dimensionProperties[utility]!]:
							`calc(${span} * ${column} + ${Math.max(0, Math.ceil(span) - 1)} * ${gutter})`,
					};
				},
				{
					autocomplete: Object.keys(dimensionProperties).map(
						(utility) =>
							`${utility}-<num>/(1|2|3|4|5|6|8|10|12|14|16|24)col`
					),
				},
			]);
			return {
				rules,
			};
		},
	},
});
