import { colorResolver } from '@unocss/preset-mini/utils';
import {
	sanitizeKey,
	restructureFontSizeObject,
	cloneDeep,
} from './helpers.js';
import * as deepmergeSrc from 'deepmerge';
const deepmerge = deepmergeSrc.default || deepmergeSrc;

// From https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/_utils/handlers/regex.ts
const numberWithUnitRE =
	/^(-?\d*(?:\.\d+)?)(px|pt|pc|%|r?(?:em|ex|lh|cap|ch|ic)|(?:[sld]?v|cq)(?:[whib]|min|max)|in|cm|mm|rpx)?$/i;

// Helpful links
// https://unocss.dev/config/rules
// https://unocss.dev/config/theme
// https://unocss.dev/tools/autocomplete

export { makeThemeUtilities, makeRules };

// Utility map used for mapping the utility names to the CSS property names
const utilityMap = {
	// Colors
	text: 'color',
	border: 'border-color',
	bg: 'background-color',
	// Spacings
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
	'inset-x': 'inset-inline',
	'inset-y': 'inset-block',
	'translate-x': '--un-translate-x',
	'translate-y': '--un-translate-y',
};
const themeKeyMap = {
	textColors: 'textColor',
	backgroundColors: 'backgroundColor',
	borderColors: 'borderColor',
};
const colorVariablePrefixMap = {
	textColors: 'colors-text',
	backgroundColors: 'colors-background',
	borderColors: 'colors-border',
};
const themeKeyPropertyMap = {
	// WE DON*T INCLUDE FONTSIZE HERE ON PURPOSE
	fontFamily: 'font-family',
	fontWeight: 'font-weight',
	fontStyle: 'font-style',
	lineHeight: 'line-height',
	letterSpacing: 'letter-spacing',
	textCase: 'text-transform',
	textDecoration: 'text-decoration',
	paragraphIndent: 'text-indent',
	// Just in case we ever need it, here it is
	paragraphSpacing: '--theme-paragraphSpacing',
};

// GENERATE THEME UTILITIES
function makeThemeUtilities(config, options) {
	options = Object.assign({}, options);
	if (!options) {
		return;
	}

	const originalConfig = config;
	config = cloneDeep(config);
	if (config.fontSize) {
		const fontSizeUtils = restructureFontSizeObject(config.fontSize);
		delete config.fontSize;
		Object.assign(config, fontSizeUtils);

		// Manual overrides in config
		Object.keys(themeKeyPropertyMap).forEach((key) => {
			if (originalConfig[key]) {
				deepmerge(config[key], originalConfig[key]);
			}
		});
	}
	const themeUtilities = {};

	// Pick out keys to transform
	const colorKeys = getColorRuleKeys(config);
	const colorKeysWithOnRules = colorKeys.filter((key) => {
		const regExp = new RegExp(
			`on-(${Object.keys(config.backgroundColors || {}).join('|')})`
		);
		const obj = config[key] || {};
		return Object.keys(obj).some((subKey) => {
			return regExp.test(subKey);
		});
	});

	// Adding the color utilities
	if (config.colors) {
		themeUtilities.colors = {};

		// Add the color rules
		Object.keys(config.colors || {}).forEach((key) => {
			themeUtilities.colors[key] = getRightColorValue(
				'colors',
				key,
				config.colors[key]
			);
		});

		// Add the on-background color rules
		colorKeysWithOnRules.forEach((key) => {
			const obj = config[key] || {};
			Object.keys(obj).forEach((subKey) => {
				const value = obj[subKey];
				const [background, ...remainderArray] = subKey
					.split('on-')
					.pop()
					.split('-');
				const name = remainderArray.join('-');

				if (background && name) {
					const themeKey = themeKeyMap[key] ?? 'colors';
					themeUtilities[themeKey] = themeUtilities[themeKey] || {};

					themeUtilities[themeKey][name] = getRightColorValue(
						colorVariablePrefixMap[key] || key,
						`${name}-on-X`,
						value
					);
				}
			});
		});

		// Don't add if empty
		if (Object.keys(themeUtilities.colors || {}).length === 0) {
			delete themeUtilities.colors;
		}
	}
	if (config.backgroundColors) {
		themeUtilities.backgroundColor = {};

		// Add the color rules
		Object.keys(config.backgroundColors || {}).forEach((key) => {
			themeUtilities.backgroundColor[key] = getRightColorValue(
				colorVariablePrefixMap.backgroundColors,
				key,
				config.backgroundColors[key]
			);
		});

		// Don't add if empty
		if (Object.keys(themeUtilities.backgroundColor || {}).length === 0) {
			delete themeUtilities.backgroundColor;
		}
	}

	return themeUtilities;
}

// GENERATE RULES
function makeRules(config, options) {
	options = Object.assign({}, options);
	if (!options) {
		return;
	}

	config = cloneDeep(config);
	if (config.fontSize) {
		const fontSizeUtils = restructureFontSizeObject(config.fontSize);
		delete config.fontSize;
		Object.assign(config, fontSizeUtils);
	}
	const rules = [];

	// RegExp-string sections for the different utility types
	const R = {
		SIZES: 'w|h|min-w|min-h|max-w|max-h',
		WIDTHS: 'w|max-w|min-w',
		HEIGHTS: 'h|max-h|min-h',
		MARGINS: 'm|mx|my|mt|mb|ml|mr',
		MARGINSX: 'mx|ml|mr',
		MARGINSY: 'my|mt|mb',
		PADDINGS: 'p|px|py|pt|pb|pl|pr',
		PADDINGSX: 'px|pl|pr',
		PADDINGSY: 'py|pt|pb',
		INSETS: 'inset|inset-x|inset-y|top|right|bottom|left',
		INSETSX: 'inset-x|left|right',
		INSETSY: 'inset-y|top|bottom',
		TRANSLATIONS: 'translate-x|translate-y',
		TRANSLATIONSX: 'translate-x',
		TRANSLATIONSY: 'translate-y',
		TEXT: 'text',
	};

	// Selectors to be used for the rules
	const SELECTOR_LAYOUT_MARGIN_GUTTER = joinSelectorStrings(
		joinPropertyStrings(
			R.SIZES,
			R.MARGINS,
			R.PADDINGS,
			R.INSETS,
			R.TRANSLATIONS
		),
		'layout-gutter|layout-margin'
	);
	const SELECTOR_LAYOUT_MAX = joinSelectorStrings(R.WIDTHS, 'layout-max');
	const SELECTOR_LAYOUT_COLUMNS = joinSelectorStrings(
		joinPropertyStrings(
			R.SIZES,
			R.MARGINS,
			R.PADDINGS,
			R.INSETS,
			R.TRANSLATIONS
		),
		`<number>/(${[
			config.layout?.columns?.sm,
			config.layout?.columns?.md,
			config.layout?.columns?.lg,
		]
			.filter(Boolean)
			.join('|')})col`
	);
	const SELECTOR_SPACING = joinSelectorStrings(
		joinPropertyStrings(
			R.SIZES,
			R.MARGINS,
			R.PADDINGS,
			R.INSETS,
			R.TRANSLATIONS
		),
		(() => {
			const keys = Object.keys(config.spacing || {});
			return joinPropertyStrings(...keys);
		})()
	);
	const SELECTOR_HORIZONTAL_SPACING = joinSelectorStrings(
		joinPropertyStrings(
			R.WIDTHS,
			R.MARGINSX,
			R.PADDINGSX,
			R.INSETSX,
			R.TRANSLATIONSX
		),
		(() => {
			const keys = Object.keys(config.horizontalSpacing || {}).map(
				(str) => `${str}/h`
			);
			return joinPropertyStrings(...keys);
		})()
	);
	const SELECTOR_VERTICAL_SPACING = joinSelectorStrings(
		joinPropertyStrings(
			R.HEIGHTS,
			R.MARGINSY,
			R.PADDINGSY,
			R.INSETSY,
			R.TRANSLATIONSY
		),
		(() => {
			const keys = Object.keys(config.verticalSpacing || {}).map(
				(str) => `${str}/v`
			);
			return joinPropertyStrings(...keys);
		})()
	);
	const SELECTOR_TEXT = joinSelectorStrings(
		R.TEXT,
		(() => {
			const keys = Object.keys(config.fontSize || {});
			return joinPropertyStrings(...keys);
		})()
	);

	// Pick out keys to transform
	const colorKeys = getColorRuleKeys(config);
	const colorKeysWithOnRules = colorKeys.filter((key) => {
		const regExp = new RegExp(
			`on-(${Object.keys(config.backgroundColors || {}).join('|')})`
		);
		const obj = config[key] || {};
		return Object.keys(obj).some((subKey) => {
			return regExp.test(subKey);
		});
	});

	// Rules for adding specific color utilities
	Object.keys(config.textColors || {}).length &&
		rules.push(
			// Rule for text and border color
			// Derived from https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/_rules/color.ts
			// We do a switcheroo on the colors and textColors to force colorResolver to use the textColors – we need to do that on each "special" property
			...['text', 'border'].map((key) => {
				return [
					new RegExp(`^${key}-(.+)$`),
					(match, meta) => {
						meta = { ...meta };
						meta.theme = {
							...meta.theme,
							colors: meta.theme[`${key}Color`],
						};
						return colorResolver(
							utilityMap[key],
							key,
							(css) =>
								!css.color?.toString().match(numberWithUnitRE)
						)(match, meta);
					},
					{ autocomplete: `${key}-$${key}Color` },
				];
			}),

			// Rule for background color and for setting variable scope as well
			// Important the bg-scope rule is placed after the bg rule
			...['bg', 'bg-scope'].map((utility) => {
				return [
					new RegExp(`^${utility}-(.+)$`),
					(match, meta) => {
						meta = { ...meta };
						meta.theme = {
							...meta.theme,
							colors: meta.theme.backgroundColor,
						};

						/* eslint-disable */
						const _return =
							utility === 'bg-scope'
								? {}
								: colorResolver('background-color', 'bg')(
										match,
										meta
								  );
						/* eslint-enable */

						// Set variables that are dependent on the background color
						colorKeysWithOnRules.forEach((key) => {
							Object.keys(config[key] || {}).forEach(
								(fullName) => {
									const name = fullName
										.split(
											`on-${match[1]
												.split('-scope')
												.pop()}-`
										)
										.pop();
									if (name !== fullName) {
										const prefix =
											colorVariablePrefixMap[key] || key;
										const newVar = {
											[`--theme-${prefix}-${name}-on-X`]: `var(--theme-${prefix}-${fullName})`,
										};
										Object.assign(_return, newVar, _return);
									}
								}
							);
						});

						return _return;
					},
					{ autocomplete: `${utility}-$backgroundColor` },
				];
			})
		);

	// Rules for adding the layout utilities
	Object.keys(config.layout || {}).length &&
		rules.push(
			// Rule for layout margin and gutter
			// These can be applied to both widths, heights, margins, paddings and positions
			[
				makeRegExp(SELECTOR_LAYOUT_MARGIN_GUTTER),
				(match, { rawSelector, currentSelector }) => {
					const property = utilityMap[match[1]] || match[1];
					const value = currentSelector.split(`${match[1]}-`).pop();
					if (!property || !value) return;

					/* eslint-disable */
					return {
						[property]: getIfNegativeRule(
							rawSelector,
							currentSelector
						)
							? `calc(var(--theme-${sanitizeKey(
									value
							  )}, var(--theme-${sanitizeKey(value)}--sm)))`
							: `var(--theme-${sanitizeKey(
									value
							  )}, var(--theme-${sanitizeKey(value)}--sm))`,
						transform: transformValue(currentSelector),
					};
					/* eslint-enable */
				},
				{
					autocomplete: SELECTOR_LAYOUT_MARGIN_GUTTER,
				},
			],

			// Rule for layout max
			// These can be applied to widths
			[
				makeRegExp(SELECTOR_LAYOUT_MAX),
				(match, { rawSelector, currentSelector }) => {
					const property = utilityMap[match[1]] || match[1];
					if (!property || !('max' in config.layout)) return;

					return {
						[property]: getIfNegativeRule(
							rawSelector,
							currentSelector
						)
							? 'calc(var(--theme-layout-max, var(--theme-layout-max--sm)))'
							: 'var(--theme-layout-max, var(--theme-layout-max--sm))',
					};
				},
				{
					autocomplete: SELECTOR_LAYOUT_MAX,
				},
			],

			// Rule for layout columns
			// These can be applied to widths, heights, margins, paddings and positions
			[
				makeRegExp(SELECTOR_LAYOUT_COLUMNS),
				(match, { currentSelector }) => {
					const property = utilityMap[match[1]] || match[1];
					const value = currentSelector
						.split(`${match[1]}-`)
						.pop()
						.replace('col', '');
					const [columns, columnCount] = value
						.split('/')
						.map((str) => +str);

					if (!property || !('columns' in config.layout)) return;
					if (
						!(
							+config.layout.columns.sm === columnCount ||
							+config.layout.columns.md === columnCount ||
							+config.layout.columns.lg === columnCount
						)
					) {
						return;
					}

					return {
						[property]: `calc(${columns} * var(--theme-layout-column-of-${columnCount}, var(--theme-layout-column-of-${columnCount}--sm)) + ${Math.max(
							0,
							Math.ceil(columns) - 1
						)} * var(--theme-layout-gutter, var(--theme-layout-gutter--sm)))`,
						transform: transformValue(currentSelector),
					};
				},
				{
					autocomplete: SELECTOR_LAYOUT_COLUMNS,
				},
			]
		);

	// Rules for adding spacing utilities
	Object.keys(config.spacing || {}).length &&
		rules.push(
			// Rule for layout margin and gutter
			// These can be applied to both widths, heights, margins, paddings and positions
			[
				makeRegExp(SELECTOR_SPACING),
				(match, { rawSelector, currentSelector }) => {
					const property = utilityMap[match[1]] || match[1];
					const value = currentSelector.split(`${match[1]}-`).pop();
					if (!property || !value) return;

					/* eslint-disable */
					return {
						[property]: getIfNegativeRule(
							rawSelector,
							currentSelector
						)
							? `calc(var(--theme-spacing-${sanitizeKey(
									value
							  )}, var(--theme-spacing-${sanitizeKey(
									value
							  )}--sm)))`
							: `var(--theme-spacing-${sanitizeKey(
									value
							  )}, var(--theme-spacing-${sanitizeKey(
									value
							  )}--sm))`,
						transform: transformValue(currentSelector),
					};
					/* eslint-enable */
				},
				{
					autocomplete: SELECTOR_SPACING,
				},
			]
		);

	Object.keys(config.horizontalSpacing || {}).length &&
		rules.push(
			// Rule for layout margin and gutter
			// These can be applied to both widths, heights, margins, paddings and positions
			[
				makeRegExp(SELECTOR_HORIZONTAL_SPACING),
				(match, { rawSelector, currentSelector }) => {
					const property = utilityMap[match[1]] || match[1];
					const value = currentSelector
						.split(`${match[1]}-`)
						.pop()
						.replace('/h', '');
					if (!property || !value) return;

					/* eslint-disable */
					return {
						[property]: getIfNegativeRule(
							rawSelector,
							currentSelector
						)
							? `calc(var(--theme-horizontalSpacing-${sanitizeKey(
									value
							  )}, var(--theme-horizontalSpacing-${sanitizeKey(
									value
							  )}--sm)))`
							: `var(--theme-horizontalSpacing-${sanitizeKey(
									value
							  )}, var(--theme-horizontalSpacing-${sanitizeKey(
									value
							  )}--sm))`,
						transform: transformValue(currentSelector),
					};
					/* eslint-enable */
				},
				{
					autocomplete: SELECTOR_HORIZONTAL_SPACING,
				},
			]
		);

	Object.keys(config.verticalSpacing || {}).length &&
		rules.push(
			// Rule for layout margin and gutter
			// These can be applied to both widths, heights, margins, paddings and positions
			[
				makeRegExp(SELECTOR_VERTICAL_SPACING),
				(match, { rawSelector, currentSelector }) => {
					const property = utilityMap[match[1]] || match[1];
					const value = currentSelector
						.split(`${match[1]}-`)
						.pop()
						.replace('/v', '');
					if (!property || !value) return;

					/* eslint-disable */
					return {
						[property]: getIfNegativeRule(
							rawSelector,
							currentSelector
						)
							? `calc(var(--theme-verticalSpacing-${sanitizeKey(
									value
							  )}, var(--theme-verticalSpacing-${sanitizeKey(
									value
							  )}--sm)))`
							: `var(--theme-verticalSpacing-${sanitizeKey(
									value
							  )}, var(--theme-verticalSpacing-${sanitizeKey(
									value
							  )}--sm))`,
						transform: transformValue(currentSelector),
					};
					/* eslint-enable */
				},
				{
					autocomplete: SELECTOR_VERTICAL_SPACING,
				},
			]
		);

	// Rules for text utilities
	Object.keys(config.fontSize || {}).length &&
		rules.push(
			// Rule for font size and styles
			[
				makeRegExp(SELECTOR_TEXT),
				(match, { currentSelector }) => {
					const property = 'text';
					const value = currentSelector.split('text-').pop();
					if (!property || !value) return;

					const _return = {
						'font-size': `var(--theme-fontSize-${sanitizeKey(
							value
						)})`,
					};
					Object.keys(themeKeyPropertyMap).forEach((key) => {
						const property = themeKeyPropertyMap[key];
						if (config[key]?.[value]) {
							if (key === 'paragraphSpacing') {
								_return[
									property
								] = `var(--theme-${key}-${sanitizeKey(
									value
								)}, 1em)`;
							} else {
								_return[
									property
								] = `var(--theme-${key}-${sanitizeKey(value)})`;
							}
						}
					});

					return _return;
				},
				{
					autocomplete: SELECTOR_TEXT,
				},
			]
		);

	// Return the compiled rules
	return rules;
}

/// Helper functions
// Get if the rule should be inverted to negative
function getIfNegativeRule(rawSelector, currentSelector) {
	if (rawSelector && currentSelector) {
		const index = rawSelector.indexOf(currentSelector);
		if (index > 0 && rawSelector[index - 1] === '-') {
			return true;
		}
	}
	return false;
}

// Set transform property if the rule is a transform rule
function transformValue(currentSelector) {
	if (
		// Right now we just look for translates
		!currentSelector.includes('translate-x') &&
		!currentSelector.includes('translate-y')
	) {
		return;
	}
	return 'translateX(var(--un-translate-x)) translateY(var(--un-translate-y)) translateZ(var(--un-translate-z)) rotate(var(--un-rotate)) rotateX(var(--un-rotate-x)) rotateY(var(--un-rotate-y)) rotateZ(var(--un-rotate-z)) skewX(var(--un-skew-x)) skewY(var(--un-skew-y)) scaleX(var(--un-scale-x)) scaleY(var(--un-scale-y)) scaleZ(var(--un-scale-z))';
}

// Join the property strings together with | as separator
function joinPropertyStrings(...propertyStrings) {
	return propertyStrings.filter(Boolean).join('|');
}

// Join the selector strings together with - as separator and encapulate each part in ()
function joinSelectorStrings(...selectorStrings) {
	return selectorStrings
		.filter(Boolean)
		.map((str) => {
			if (str.includes('|')) {
				return `(${str})`;
			}
			return str;
		})
		.join('-');
}

// Make selector regexp from string, lead with ^ and end with $
function makeRegExp(str) {
	str = str.replaceAll('<number>', '\\d*\\.?\\d*').replaceAll('/', '\\/');
	return new RegExp(`^${str}$`);
}

// Make list of color rule keys
function getColorRuleKeys(config) {
	const keys = [];
	Object.keys(config || {}).forEach((key) => {
		if (key === 'colors' || key.endsWith('Colors')) {
			keys.push(key);
		}
	});
	return keys;
}

function getRightColorValue(configKey, configSubKey, colorValue) {
	const obj = typeof colorValue === 'object' ? colorValue : {};
	if (typeof colorValue === 'object' && !Array.isArray(colorValue)) {
		colorValue = colorValue.value;
	}
	colorValue = String(colorValue);
	// // Use the build in opacity utilities if three comma-separated values are provided
	const splitValue = colorValue.split(',');
	if (
		obj.isListedRgb ||
		(splitValue.length === 3 &&
			splitValue.every((value) => {
				const trimmed = value.trim();
				return String(+trimmed) === trimmed;
			}))
	) {
		return `rgb(var(--theme-${sanitizeKey(configKey)}-${sanitizeKey(
			configSubKey
		)}))`;
	}
	return colorValue;
}
