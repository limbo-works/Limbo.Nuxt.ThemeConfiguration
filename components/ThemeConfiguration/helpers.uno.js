import { colorResolver } from '@unocss/preset-mini/utils';
import {
	sanitizeKey,
	restructureFontSizeObject,
	cloneDeep,
	deepmerge,
} from './helpers.js';

// From https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/_utils/handlers/regex.ts
const numberWithUnitRE =
	/^(-?\d*(?:\.\d+)?)(px|pt|pc|%|r?(?:em|ex|lh|cap|ch|ic)|(?:[sld]?v|cq)(?:[whib]|min|max)|in|cm|mm|rpx)?$/i;

// Helpful links
// https://unocss.dev/config/rules
// https://unocss.dev/config/theme
// https://unocss.dev/tools/autocomplete
// https://github.com/unocss/unocss/blob/f4954d2a2b2a3dc4ad32d1ea098aab07596c55b1/packages/core/src/types.ts#L153

// Bienvenido al uno infierno
export { makeThemeUtilities, makeRules };

// Utility map used for mapping the utility names to the CSS property names
const utilityMap = {
	// Colors
	text: 'color', // text as text is handled separately
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
	gap: 'gap',
	'gap-x': 'column-gap',
	'gap-y': 'row-gap',
	// Border radius
	rounded: 'border-radius',
	'rounded-s': ['border-start-start-radius', 'border-end-start-radius'],
	'rounded-e': ['border-end-start-radius', 'border-end-end-radius'],
	'rounded-t': ['border-top-left-radius', 'border-top-right-radius'],
	'rounded-r': ['border-top-right-radius', 'border-bottom-right-radius'],
	'rounded-b': ['border-bottom-left-radius', 'border-bottom-right-radius'],
	'rounded-l': ['border-top-left-radius', 'border-bottom-left-radius'],
	'rounded-tl': 'border-top-left-radius',
	'rounded-tr': 'border-top-right-radius',
	'rounded-br': 'border-bottom-right-radius',
	'rounded-bl': 'border-bottom-left-radius',
};
// Map used for mapping the theme config names to unoCSS theme keys
const themeKeyMap = {
	textColors: 'textColor',
	backgroundColors: 'backgroundColor',
	borderColors: 'borderColor',
};
// Map for mapping the theme config names to partial CSS variable names
const colorVariablePrefixMap = {
	textColors: 'colors-text',
	backgroundColors: 'colors-background',
	borderColors: 'colors-border',
};
// Map for mapping the theme config names to CSS property names
const textPropertyMap = {
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
		Object.keys(textPropertyMap).forEach((key) => {
			if (originalConfig[key]) {
				deepmerge(config[key], originalConfig[key]);
			}
		});
	}
	const themeUtilities = {};

	// Pick out keys to transform
	const colorKeys = getColorRuleKeys(config);
	const colorKeysWithOnRules = colorKeys.filter((key) => {
		const kebabPartial = `(on-(${Object.keys(
			config.backgroundColors || {}
		).join('|')}))`;
		const camelPartial = `(on(${Object.keys(config.backgroundColors || {})
			.map((key) => {
				return key.charAt(0).toUpperCase() + key.slice(1);
			})
			.join('|')}))`;

		const regExpKebab = new RegExp(kebabPartial);
		const regExpCamel = new RegExp(camelPartial);

		const obj = config[key] || {};
		return Object.keys(obj).some((subKey) => {
			return regExpKebab.test(subKey) || regExpCamel.test(subKey);
		});
	});
	// Adding the color utilities
	if (config.colors) {
		themeUtilities.colors = {
			bgCurrent: 'var(--bgCurrent, transparent)',
		};

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
				let name, background;
				const value = obj[subKey];

				if (subKey.indexOf('on-') === 0) {
					// Kebab syntax check
					const str = subKey.replace('on-', '');
					const backgroundKeys = Object.keys(config.backgroundColors);
					backgroundKeys.sort((a, b) => b.length - a.length);
					backgroundKeys.find((backgroundKey) => {
						if (
							str.indexOf(backgroundKey) === 0 &&
							backgroundKey.length !== str.length
						) {
							name = str.replace(backgroundKey, '').substring(1);
							name = name.charAt(0).toLowerCase() + name.slice(1);
							background = backgroundKey;
							return true;
						}
					});
				} else if (
					subKey.indexOf('on') === 0 &&
					subKey.charAt(2) === subKey.charAt(2).toUpperCase()
				) {
					// Camel syntax check
					const str = subKey.replace('on', '');
					const backgroundKeys = Object.keys(config.backgroundColors);
					backgroundKeys.sort((a, b) => b.length - a.length);
					backgroundKeys.find((backgroundKey) => {
						const bg =
							backgroundKey.charAt(0).toUpperCase() +
							backgroundKey.slice(1);
						if (str.indexOf(bg) === 0 && bg.length !== str.length) {
							name = str.replace(bg, '');
							name = name.charAt(0).toLowerCase() + name.slice(1);
							background = backgroundKey;
							return true;
						}
					});
				}

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
		themeUtilities.backgroundColor ??= {};

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
	if (config.borderColors) {
		themeUtilities.borderColor ??= {};

		// Add the color rules
		Object.keys(config.borderColors || {}).forEach((key) => {
			themeUtilities.borderColor[key] = getRightColorValue(
				colorVariablePrefixMap.borderColors,
				key,
				config.borderColors[key]
			);
		});

		// Don't add if empty
		if (Object.keys(themeUtilities.borderColor || {}).length === 0) {
			delete themeUtilities.borderColor;
		}
	}
	if (config.textColors) {
		themeUtilities.textColor ??= {};

		// Add the color rules
		Object.keys(config.textColors || {}).forEach((key) => {
			themeUtilities.textColor[key] = getRightColorValue(
				colorVariablePrefixMap.textColors,
				key,
				config.textColors[key]
			);
		});

		// Don't add if empty
		if (Object.keys(themeUtilities.textColor || {}).length === 0) {
			delete themeUtilities.textColor;
		}
	}
	if (config.containers) {
		themeUtilities.containers ??= {
			'<layout-max': '(max-width: calc(var(--theme-layout-max) - 0.1px))',
			'>=layout-max': '(min-width: var(--theme-layout-max))',
		};

		for (const key in config.containers) {
			const value = config.containers[key];
			themeUtilities.containers[key] = `(min-width: ${value})`;
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
	const textPropertyMap = filterTextPropertyMap(config);
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
		GAPS: 'gap|gap-x|gap-y',
		GAPSX: 'gap-x',
		GAPSY: 'gap-y',
		TEXT: 'text',
		BORDERRADIUS:
			'rounded|rounded-s|rounded-e|rounded-t|rounded-r|rounded-b|rounded-l|rounded-tl|rounded-tr|rounded-br|rounded-bl',
		DROPSHADOW: 'drop-shadow',
	};

	// Selectors to be used for the rules
	const SELECTOR_LAYOUT_MARGIN_GUTTER = joinSelectorStrings(
		joinPropertyStrings(
			R.SIZES,
			R.MARGINS,
			R.PADDINGS,
			R.INSETS,
			R.TRANSLATIONS,
			R.GAPS
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
			R.TRANSLATIONS,
			R.GAPS
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
			R.TRANSLATIONS,
			R.GAPS
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
			R.TRANSLATIONSX,
			R.GAPSX
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
			R.TRANSLATIONSY,
			R.GAPSY
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
	const SELECTOR_BORDER_RADIUS = joinSelectorStrings(
		R.BORDERRADIUS,
		(() => {
			const keys = Object.keys(config.borderRadius || {});
			return joinPropertyStrings(...keys);
		})()
	);
	const SELECTOR_DROP_SHADOW = joinSelectorStrings(
		R.DROPSHADOW,
		(() => {
			const keys = Object.keys(config.dropShadow || {});
			return joinPropertyStrings(...keys);
		})()
	);

	// Pick out keys to transform
	const colorKeys = getColorRuleKeys(config);
	const colorKeysWithOnRules = colorKeys.filter((key) => {
		const kebabPartial = `(on-(${Object.keys(
			config.backgroundColors || {}
		).join('|')}))`;
		const camelPartial = `(on(${Object.keys(config.backgroundColors || {})
			.map((key) => {
				return key.charAt(0).toUpperCase() + key.slice(1);
			})
			.join('|')}))`;

		const regExpKebab = new RegExp(kebabPartial);
		const regExpCamel = new RegExp(camelPartial);

		const obj = config[key] || {};
		return Object.keys(obj).some((subKey) => {
			return regExpKebab.test(subKey) || regExpCamel.test(subKey);
		});
	});

	// Rules for adding specific color utilities
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
						colors: {
							...(meta.theme.colors || {}),
							...(meta.theme[`${key}Color`] || {}),
						},
					};
					return colorResolver(
						utilityMap[key],
						key,
						(css) => !css.color?.toString().match(numberWithUnitRE)
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
						colors: {
							...(meta.theme.colors || {}),
							...(meta.theme.backgroundColor || {}),
						},
					};

					const resolvedColor = colorResolver(
						'background-color',
						utility
					)(match, meta);
					const _return = { ...resolvedColor };
					if (utility === 'bg-scope') {
						delete _return['background-color'];
					}

					// Add currently set background as a variable
					if (Object.keys(resolvedColor).length) {
						if (
							!['bg-bgCurrent', 'bg-scope-bgCurrent'].includes(
								match[0]
							)
						) {
							const addedStyles = {
								'--bgCurrent':
									resolvedColor['background-color'],
							};

							Object.assign(_return, addedStyles, _return);
						}
					}

					// Set variables that are dependent on the background color
					colorKeysWithOnRules.forEach((key) => {
						Object.keys(config[key] || {}).forEach((fullName) => {
							let name, background;
							if (fullName.indexOf('on-') === 0) {
								// Kebab syntax check
								const str = fullName.replace('on-', '');
								const backgroundKeys = Object.keys(
									config.backgroundColors
								);
								backgroundKeys.sort(
									(a, b) => b.length - a.length
								);
								backgroundKeys.find((backgroundKey) => {
									if (
										str.indexOf(backgroundKey) === 0 &&
										backgroundKey.length !== str.length
									) {
										name = str
											.replace(backgroundKey, '')
											.substring(1);
										name =
											name.charAt(0).toLowerCase() +
											name.slice(1);
										background = backgroundKey;
										return true;
									}
								});
							} else if (
								fullName.indexOf('on') === 0 &&
								fullName.charAt(2) ===
									fullName.charAt(2).toUpperCase()
							) {
								// Camel syntax check
								const str = fullName.replace('on', '');
								const backgroundKeys = Object.keys(
									config.backgroundColors
								);
								backgroundKeys.sort(
									(a, b) => b.length - a.length
								);
								backgroundKeys.find((backgroundKey) => {
									const bg =
										backgroundKey.charAt(0).toUpperCase() +
										backgroundKey.slice(1);
									if (
										str.indexOf(bg) === 0 &&
										bg.length !== str.length
									) {
										name = str.replace(bg, '');
										name =
											name.charAt(0).toLowerCase() +
											name.slice(1);
										background = backgroundKey;
										return true;
									}
								});
							}
							if (name !== fullName && background === match[1]) {
								const prefix =
									colorVariablePrefixMap[key] || key;
								const newVar = {
									[`--theme-${prefix}-${name}-on-X`]: `var(--theme-${prefix}-${fullName})`,
								};
								Object.assign(_return, newVar, _return);
							}
						});
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
					const fallback = !config.disableBreakpointSpecificCustomProperties ? `, var(--theme-${sanitizeKey(value)}--sm)` : '';
					return {
						[property]: getIfNegativeRule(
							rawSelector,
							currentSelector
						)
							? `calc(var(--theme-${sanitizeKey(
									value
								)}${fallback}))`
							: `var(--theme-${sanitizeKey(
									value
								)}${fallback})`,
						transform: transformValue(currentSelector),
					};
					/* eslint-enable */
				},
				{
					autocomplete: SELECTOR_LAYOUT_MARGIN_GUTTER,
					sortBefore: /^ma?()-?(-?.+)$/,
				},
			],

			// Rule for layout max
			// These can be applied to widths
			[
				makeRegExp(SELECTOR_LAYOUT_MAX),
				(match, { rawSelector, currentSelector }) => {
					const property = utilityMap[match[1]] || match[1];
					if (!property || !('max' in config.layout)) return;

					const fallback = !config.disableBreakpointSpecificCustomProperties ? ', var(--theme-layout-max--sm)' : '';
					return {
						[property]: getIfNegativeRule(
							rawSelector,
							currentSelector
						)
							? `calc(var(--theme-layout-max${fallback}))`
							: `var(--theme-layout-max${fallback})`,
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

					const fallback = !config.disableBreakpointSpecificCustomProperties ? `, var(--theme-layout-column-of-${columnCount}--sm)` : '';
					const fallbackGutter = !config.disableBreakpointSpecificCustomProperties ? ', var(--theme-layout-gutter--sm)' : '';
					return {
						[property]: `calc(${columns} * var(--theme-layout-column-of-${columnCount}${fallback}) + ${Math.max(
							0,
							Math.ceil(columns) - 1
						)} * var(--theme-layout-gutter${fallbackGutter}))`,
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
					const fallback = !config.disableBreakpointSpecificCustomProperties ? `, var(--theme-spacing-${sanitizeKey(value)}--sm)` : '';
					return {
						[property]: getIfNegativeRule(
							rawSelector,
							currentSelector
						)
							? `calc(var(--theme-spacing-${sanitizeKey(
									value
								)}${fallback}))`
							: `var(--theme-spacing-${sanitizeKey(
									value
								)}${fallback})`,
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
					const fallback = !config.disableBreakpointSpecificCustomProperties ? `, var(--theme-horizontalSpacing-${sanitizeKey(value)}--sm)` : '';
					return {
						[property]: getIfNegativeRule(
							rawSelector,
							currentSelector
						)
							? `calc(var(--theme-horizontalSpacing-${sanitizeKey(
									value
								)}${fallback}))`
							: `var(--theme-horizontalSpacing-${sanitizeKey(
									value
								)}${fallback})`,
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
					const fallback = !config.disableBreakpointSpecificCustomProperties ? `, var(--theme-verticalSpacing-${sanitizeKey(value)}--sm)` : '';
					return {
						[property]: getIfNegativeRule(
							rawSelector,
							currentSelector
						)
							? `calc(var(--theme-verticalSpacing-${sanitizeKey(
									value
								)}${fallback}))`
							: `var(--theme-verticalSpacing-${sanitizeKey(
									value
								)}${fallback})`,
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
					Object.keys(textPropertyMap).forEach((key) => {
						const property = textPropertyMap[key];
						if (config[key]?.[value]) {
							if (key === 'paragraphSpacing') {
								_return[property] =
									`var(--theme-${key}-${sanitizeKey(
										value
									)}, 0)`;
							} else {
								_return[property] =
									`var(--theme-${key}-${sanitizeKey(value)})`;
							}
						} else {
							if (key === 'paragraphSpacing') {
								_return[property] = '0';
							} else {
								_return[property] = 'initial';
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

	// Rules for border radius utilities
	Object.keys(config.borderRadius || {}).length &&
		rules.push(
			// Rule for border radius
			[
				makeRegExp(SELECTOR_BORDER_RADIUS),
				(match, { currentSelector }) => {
					const property = utilityMap[match[1]] || match[1];
					const value = currentSelector.split(`${match[1]}-`).pop();
					if (!property || !value) return;

					const fallback = !config.disableBreakpointSpecificCustomProperties ? `, var(--theme-borderRadius-${sanitizeKey(value)}--sm)` : '';
					return {
						[property]: `var(--theme-borderRadius-${sanitizeKey(
							value
						)}${fallback})`,
					};
				},
				{
					autocomplete: SELECTOR_BORDER_RADIUS,
				},
			]
		);

	// Rules for drop shadow utilities
	// Need to figure some stuff out with design
	// Object.keys(config.dropShadow || {}).length &&
	// 	rules.push(
	// 		// Rule for drop shadows
	// 		[
	// 			makeRegExp(SELECTOR_DROP_SHADOW),
	// 			(match, { currentSelector }) => {
	// 				console.log(match, currentSelector);
	// 				const property = utilityMap[match[1]] || match[1];
	// 				const value = currentSelector.split(`${match[1]}-`).pop();
	// 				if (!property || !value) return;

	// 				return {
	// 					[property]: `var(--theme-dropShadow-${sanitizeKey(
	// 						value
	// 					)}, var(--theme-dropShadow-${sanitizeKey(value)}--sm))`,
	// 				};
	// 			},
	// 			{
	// 				autocomplete: SELECTOR_BORDER_RADIUS,
	// 			},
	// 		]
	// 	);

	// Opacity rules are pullet from core presets and added to the end of the rules to allow for overwrite
	rules.push(...getOpacityRules());

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
	colorValue = String(colorValue)
		.split(',')
		.join(' ')
		.split('  ')
		.join(' ')
		.trim();
	// // Use the build in opacity utilities if three comma-separated values are provided
	const splitValue = colorValue.split(' ');
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

// Filter the theme key property map to only include the keys that are in the config
function filterTextPropertyMap(config) {
	const newMap = { ...textPropertyMap };
	Object.keys(textPropertyMap).forEach((key) => {
		if (key in config) {
			return;
		}
		delete newMap[key];
	});
	return newMap;
}

// Get opacity rules
function getOpacityRules() {
	const presetNuxtCore = tryRequire(
		'@limbo-works/nuxt-core/assets/js/unocss/preset-core.js'
	);
	const presetCitiCore = tryRequire(
		'@limbo-works/citi-core/assets/js/unocss/preset-citi-core.js'
	);

	let opacityRules = [];
	[presetNuxtCore, presetCitiCore].filter(Boolean).forEach((preset) => {
		opacityRules.push(
			...(preset?.()?.rules?.filter?.((rule) => {
				return (
					String(rule[0]).indexOf('op(?:acity)?') >= 0 ||
					String(rule[0]).indexOf('opacity') >= 0
				);
			}) || [])
		);
	});

	opacityRules = [...new Set(opacityRules)].map((rule) => {
		const [...newRule] = rule;
		return newRule;
	});

	return opacityRules;
}

// Try import
function tryRequire(path, fallback) {
	let output = fallback;
	try {
		output = require(path);
	} catch (e) {
		// Nothing
	}
	return output;
}
