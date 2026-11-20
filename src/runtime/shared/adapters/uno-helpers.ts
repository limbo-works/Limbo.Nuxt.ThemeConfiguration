import type { Rule, PresetMiniTheme as Theme } from 'unocss';
import { sanitizeKey } from '../helpers';
import { isRecord } from '../normalize-theme-configuration';

export const dimensionProperties: Record<string, string> = {
	w: 'width',
	h: 'height',
	'min-w': 'min-width',
	'min-h': 'min-height',
	'max-w': 'max-width',
	'max-h': 'max-height',
	p: 'padding',
	px: 'padding-inline',
	py: 'padding-block',
	pt: 'padding-top',
	pb: 'padding-bottom',
	pl: 'padding-left',
	pr: 'padding-right',
	m: 'margin',
	mx: 'margin-inline',
	my: 'margin-block',
	mt: 'margin-top',
	mb: 'margin-bottom',
	ml: 'margin-left',
	mr: 'margin-right',
	inset: 'inset',
	'inset-x': 'inset-inline',
	'inset-y': 'inset-block',
	top: 'top',
	right: 'right',
	bottom: 'bottom',
	left: 'left',
	'translate-x': '--un-translate-x',
	'translate-y': '--un-translate-y',
	gap: 'gap',
	'gap-x': 'column-gap',
	'gap-y': 'row-gap',
};

export const textProperties: Record<string, string> = {
	fontFamily: 'font-family',
	fontWeight: 'font-weight',
	fontStyle: 'font-style',
	lineHeight: 'line-height',
	letterSpacing: 'letter-spacing',
	textCase: 'text-transform',
	textDecoration: 'text-decoration',
	paragraphIndent: 'text-indent',
	paragraphSpacing: '--theme-paragraphSpacing',
};

export function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function utilityAutocomplete(
	utilities: string[],
	names: string[],
	negative = false
) {
	const prefixes = negative
		? utilities.flatMap((utility) => [utility, `-${utility}`])
		: utilities;
	// UnoCSS strips input hyphens before matching template fragments.
	return prefixes.flatMap((utility) =>
		names.map((name) =>
			`${utility}-${name}`
				.split('-')
				.map((part) => (part ? `(${part})` : ''))
				.join('-')
		)
	);
}

export function dimensionUtilities(
	value: unknown,
	prefix: string,
	properties: Record<string, string | string[]> = dimensionProperties,
	namePrefix = ''
): Rule<Theme>[] {
	if (!isRecord(value) || !Object.keys(value).length) return [];
	const names = Object.keys(value).map((name) => `${namePrefix}${name}`);
	return [
		[
			new RegExp(
				`^(-?)(${Object.keys(properties).map(escapeRegExp).join('|')})-(${names.map(escapeRegExp).join('|')})$`
			),
			([, negative, utility, name]) => {
				if (!utility || !name) return;
				const property = properties[utility]!;
				const tokenName = name.slice(namePrefix.length);
				const variable = `var(--theme-${prefix}-${sanitizeKey(tokenName)})`;
				return {
					...Object.fromEntries(
						(Array.isArray(property) ? property : [property]).map(
							(key) => [
								key,
								negative ? `calc(-1 * ${variable})` : variable,
							]
						)
					),
					...(utility.startsWith('translate-')
						? {
								transform:
									'translateX(var(--un-translate-x, 0)) translateY(var(--un-translate-y, 0)) translateZ(var(--un-translate-z, 0)) rotate(var(--un-rotate, 0)) rotateX(var(--un-rotate-x, 0)) rotateY(var(--un-rotate-y, 0)) rotateZ(var(--un-rotate-z, 0)) skewX(var(--un-skew-x, 0)) skewY(var(--un-skew-y, 0)) scaleX(var(--un-scale-x, 1)) scaleY(var(--un-scale-y, 1)) scaleZ(var(--un-scale-z, 1))',
							}
						: {}),
				};
			},
			{
				autocomplete: utilityAutocomplete(
					Object.keys(properties),
					names,
					true
				),
			},
		],
	];
}
