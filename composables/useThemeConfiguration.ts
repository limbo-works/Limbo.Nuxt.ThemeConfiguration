// @ts-nocheck
import {
	sanitizeKey,
	restructureFontSizeObject,
	cloneDeep,
	deepmerge,
} from '~/assets/js/helpers';

export function useThemeConfiguration(options?: {
	config?: string | Record<string, any>;
	media?: Record<string, string | Record<string, any>>;
	useThemeClasses?: boolean | string[];
	mergeThemeClassesWithBaseConfig?: boolean;
	cssLayer?: string;
}) {
	const iterationCounter = useState(() => 0);

	const opts = {
		config: undefined,
		media: undefined,
		useThemeClasses: undefined,
		mergeThemeClassesWithBaseConfig: false,
		cssLayer: undefined,
		...options,
	};

	const availableConfigs = getThemeConfigurations();
	const defaultConfig = availableConfigs.default || {};

	function resolveConfig(config) {
		if (typeof config === 'string') {
			return availableConfigs[config] || {};
		}
		return config || {};
	}

	function shouldIncludeThemeClass(key) {
		if (opts.config === key) return false;
		if (!opts.config && key === 'default') return false;
		if (
			Array.isArray(opts.useThemeClasses) &&
			!opts.useThemeClasses.includes(key)
		) {
			return false;
		}
		return true;
	}

	const compConfig = computed(() => {
		let clone = cloneDeep(defaultConfig);

		const usedConfig = resolveConfig(opts.config);

		// Overwrite by property
		if (Object.keys(usedConfig).length) {
			clone = deepmerge(clone, cloneDeep(usedConfig));
		}

		// Default to the defaultConfig
		return clone;
	});

	const colorRules = computed(() =>
		extractColorRules(compConfig.value?.colors)
	);
	const altColorRules = computed(() =>
		findAltRuleKeys('colors', compConfig.value).map(
			({ configKey, prefix }) =>
				extractColorRules(compConfig.value[configKey], prefix)
		)
	);
	const layoutRules = computed(() =>
		extractLayoutRules(compConfig.value?.layout)
	);
	const fontSizeRules = computed(() =>
		extractFontRules(compConfig.value?.fontSize)
	);
	const fontStyleRules = computed(() =>
		extractFontRules(compConfig.value?.fontStyles)
	);
	const spacingRules = computed(() =>
		extractRules('spacing', compConfig.value?.spacing)
	);
	const altSpacingRules = computed(() =>
		findAltRuleKeys('spacing', compConfig.value).map(({ configKey }) =>
			extractRules(configKey, compConfig.value[configKey])
		)
	);
	const cachedRuleSections = computed(() =>
		createRuleSections(compConfig.value)
	);
	const themeClassRuleSections = computed(() => {
		const sections = {};
		if (!opts.useThemeClasses) return sections;

		for (const [key, value] of Object.entries(availableConfigs)) {
			if (!shouldIncludeThemeClass(key)) continue;

			const config =
				(opts.mergeThemeClassesWithBaseConfig ?? false)
					? deepMergeExisting(cloneDeep(compConfig.value), value)
					: value;
			sections[key] = {
				config,
				rules: createRuleSections(config),
			};
		}

		return sections;
	});

	/* Compile css text */
	const cssText = computed(() => {
		const rules = [
			makeCssText(undefined, compConfig.value, cachedRuleSections.value),
		];

		if (opts.useThemeClasses) {
			for (const [key] of Object.entries(availableConfigs)) {
				if (!shouldIncludeThemeClass(key)) continue;
				const themeClassRuleSection = themeClassRuleSections.value[key];
				rules.push(
					makeCssText(
						`.u-theme-${key}`,
						themeClassRuleSection.config,
						themeClassRuleSection.rules
					)
				);
			}
		}

		return rules.join('\n');
	});

	/* Compose media configs */
	const media = computed(() => {
		const mediaEntries = [];
		for (const [key, config] of Object.entries(opts.media || {})) {
			const resolvedConfig = resolveConfig(config);
			const rules = [makeCssText(undefined, resolvedConfig)];

			if (opts.useThemeClasses) {
				for (const [themeKey] of Object.entries(availableConfigs)) {
					if (!shouldIncludeThemeClass(themeKey)) continue;

					rules.push(
						makeCssText(`.u-theme-${themeKey}`, resolvedConfig)
					);
				}
			}

			mediaEntries.push({
				query: key,
				cssText: rules.join('\n'),
			});
		}
		return mediaEntries;
	});

	watch(
		[cssText, media],
		() => {
			iterationCounter.value++;
		},
		{ flush: 'sync' }
	);

	const headStyles = computed(() => {
		const iteration = iterationCounter.value;
		const baseId = `theme-configuration-${iteration}`;
		return {
			style: [
				cssText.value && {
					key: baseId,
					id: baseId,
					type: 'text/css',
					innerHTML: cssText.value,
				},
				...(media.value?.map((mediaItem) => ({
					key: `theme-configuration-${mediaItem.query}-${iteration}`,
					id: `theme-configuration-${mediaItem.query}-${iteration}`,
					type: 'text/css',
					media: mediaItem.query,
					innerHTML: mediaItem.cssText,
				})) ?? []),
			],
		};
	});

	useHead(headStyles);

	function extractColorRules(object, prefix) {
		object = cloneDeep(typeof object === 'object' ? object : {});

		const rules = [];
		Object.entries(object).forEach(([key, value]) => {
			if (!compConfig.value.minify && !rules.length) {
				rules.push(`/* colors ${prefix ? `- ${prefix} ` : ''}*/`);
			}

			// We make sure there's spaces between the commas
			const composedValue = String(value?.value ?? value)
				.split(' ')
				.join('')
				.split(',')
				.join(' ');
			rules.push(
				`--theme-colors-${prefix ? `${prefix}-` : ''}${sanitizeKey(
					key
				)}: ${composedValue};`
			);
		});

		return {
			rules,
			mdScreenRules: [],
			lgScreenRules: [],
		};
	}

	function extractLayoutRules(object) {
		object = cloneDeep(typeof object === 'object' ? object : {});
		const useBreakpointSpecificRules =
			!compConfig.value.disableBreakpointSpecificCustomProperties;
		const columns = object.columns || {};
		delete object.columns;

		const maxRuleValue = object.max;
		delete object.max;

		const {
			rules = [],
			mdScreenRules = [],
			lgScreenRules = [],
		} = extractRules('layout', object);
		if (!compConfig.value.minify) {
			!rules.length && rules.push('/* layout */');
			!mdScreenRules.length && mdScreenRules.push('/* layout */');
			!lgScreenRules.length && lgScreenRules.push('/* layout */');
		}

		// Setup column rules
		const { sm = 0, md = 0, lg = 0 } = columns;
		if (sm || md || lg) {
			const { gutter, margin } = object;
			const { smViewport, mdViewport, lgViewport } = compConfig.value;
			const viewport = {
				sm: smViewport,
				md: mdViewport,
				lg: lgViewport,
			};

			// Small helpers to not rewrite a lot of long code
			const generateBaseRule = (sizeDesignation, columnCount) => {
				return `--theme-layout-column--${sizeDesignation}: ${
					Math.round(
						((viewport[sizeDesignation] -
							margin[sizeDesignation] * 2 -
							gutter[sizeDesignation] * (columnCount - 1)) /
							columnCount) *
							1000
					) / 1000
				}px;`;
			};
			const generateResponsiveRule = (columnCount) => {
				const { viewportWidth = '100dvw' } = compConfig.value;

				const fallbackMargin = useBreakpointSpecificRules
					? ', var(--theme-layout-margin--sm)'
					: '';
				const fallbackGutter = useBreakpointSpecificRules
					? ', var(--theme-layout-gutter--sm)'
					: '';

				const widthCalculation = `(var(--visual-viewport-width, ${viewportWidth}) - var(--theme-layout-margin${fallbackMargin}) * 2 - var(--theme-layout-gutter${fallbackGutter}) * ${
					columnCount - 1
				}) / ${columnCount}`;

				// If the columns are not meant to stop growing
				if (typeof maxRuleValue === 'undefined') {
					return `--theme-layout-column-of-${columnCount}: calc(${widthCalculation});`;
				}

				const fallbackMarginLg = useBreakpointSpecificRules
					? ', var(--theme-layout-margin--lg)'
					: '';
				const fallbackGutterLg = useBreakpointSpecificRules
					? ', var(--theme-layout-gutter--lg)'
					: '';
				return `--theme-layout-column-of-${columnCount}: min(${widthCalculation}, (${maxRuleValue}px - var(--theme-layout-margin${fallbackMarginLg}) * 2 - var(--theme-layout-gutter${fallbackGutterLg}) * ${
					columnCount - 1
				}) / ${columnCount});`;
			};

			if (useBreakpointSpecificRules) {
				rules.push(generateBaseRule('sm', sm));
				rules.push(generateBaseRule('md', md));
				rules.push(generateBaseRule('lg', lg));
			}

			const colCounts = [...new Set([sm, md, lg])];
			for (const colCount of colCounts) {
				rules.push(generateResponsiveRule(colCount));
			}
		}

		// Setup layout max
		const { viewportWidth = '100dvw' } = compConfig.value;
		if (typeof maxRuleValue === 'undefined') {
			rules.push(
				`--theme-layout-max: var(--visual-viewport-width, ${viewportWidth});`
			);
		} else {
			rules.push(`--theme-layout-max: ${maxRuleValue}px;`);
		}

		if (!compConfig.value.minify) {
			rules.length === 1 && rules.pop();
			mdScreenRules.length === 1 && mdScreenRules.pop();
			lgScreenRules.length === 1 && lgScreenRules.pop();
		}

		return { rules, mdScreenRules, lgScreenRules };
	}

	function extractFontRules(object) {
		const useBreakpointSpecificRules =
			!compConfig.value.disableBreakpointSpecificCustomProperties;
		object = typeof object === 'object' ? object : {};

		// Restructure the object
		object = restructureFontSizeObject(object);
		Object.keys(object).forEach((key) => {
			if (compConfig.value[key] && key !== 'fontSize') {
				object[key] = deepmerge(object[key], compConfig.value[key]);
			}
		});

		// Extract rules
		const { baseFontSize } = compConfig.value;
		const returnObject = {
			rules: [],
			smToMdScreenRules: [],
			mdScreenRules: [],
			mdToLgScreenRules: [],
		};

		// Extract font sizes as rem
		['fontSize'].forEach((key) => {
			if (object[key]) {
				const extracted = extractRules(
					key,
					object[key],
					'rem',
					(value) => {
						return (
							Math.round((Number(value) / baseFontSize) * 1000) /
							1000
						);
					}
				);
				returnObject.rules.push(...extracted.rules);
				returnObject.mdScreenRules.push(...extracted.mdScreenRules);
			}
		});

		// Extract as em
		['letterSpacing', 'paragraphSpacing'].forEach((key) => {
			if (object[key]) {
				const rules = [];
				const smToMdScreenRules = [];
				const mdToLgScreenRules = [];

				const convertFromPercentage = (value) => {
					if (typeof value === 'string' && value.endsWith('%')) {
						return +value.substring(0, value.length - 1) / 100;
					}
					return value;
				};

				for (const name in object[key]) {
					const subObject = object[key][name];

					const smValue = `${convertFromPercentage(subObject.sm)}em`;
					const mdValue = `${convertFromPercentage(subObject.md)}em`;
					const lgValue = `${convertFromPercentage(subObject.lg)}em`;

					if (useBreakpointSpecificRules) {
						rules.push(
							`--theme-${key}-${sanitizeKey(name)}--sm: ${smValue};`
						);
						rules.push(
							`--theme-${key}-${sanitizeKey(name)}--md: ${mdValue};`
						);
						rules.push(
							`--theme-${key}-${sanitizeKey(name)}--lg: ${lgValue};`
						);
					}

					rules.push(
						`--theme-${key}-${sanitizeKey(name)}: ${smValue};`
					);
					if (subObject.md !== subObject.sm) {
						smToMdScreenRules.push(
							`--theme-${key}-${sanitizeKey(name)}: ${mdValue};`
						);
					}
					if (subObject.lg !== subObject.md) {
						mdToLgScreenRules.push(
							`--theme-${key}-${sanitizeKey(name)}: ${lgValue};`
						);
					}
				}

				// Return rules
				if (!compConfig.value.minify) {
					rules.length && rules.unshift(`/* ${key} */`);
					smToMdScreenRules.length &&
						smToMdScreenRules.unshift(`/* ${key} */`);
					mdToLgScreenRules.length &&
						mdToLgScreenRules.unshift(`/* ${key} */`);
				}

				returnObject.rules.push(...rules);
				returnObject.smToMdScreenRules.push(...smToMdScreenRules);
				returnObject.mdToLgScreenRules.push(...mdToLgScreenRules);
			}
		});

		// Extract as whatever it is
		[
			'fontFamily',
			'fontWeight',
			'fontStyle',
			'lineHeight',
			'textCase',
			'textDecoration',
			'paragraphIndent',
		].forEach((key) => {
			if (object[key]) {
				const rules = [];
				const smToMdScreenRules = [];
				const mdToLgScreenRules = [];

				for (const name in object[key]) {
					const subObject = object[key][name];

					let { sm, md, lg } = subObject;
					if (key === 'fontFamily') {
						sm = normalizeFontFamily(sm);
						md = normalizeFontFamily(md);
						lg = normalizeFontFamily(lg);
					}

					if (useBreakpointSpecificRules) {
						rules.push(
							`--theme-${key}-${sanitizeKey(name)}--sm: ${sm};`
						);
						rules.push(
							`--theme-${key}-${sanitizeKey(name)}--md: ${md};`
						);
						rules.push(
							`--theme-${key}-${sanitizeKey(name)}--lg: ${lg};`
						);
					}

					rules.push(`--theme-${key}-${sanitizeKey(name)}: ${sm};`);
					if (md !== sm) {
						smToMdScreenRules.push(
							`--theme-${key}-${sanitizeKey(name)}: ${md};`
						);
					}
					if (lg !== md) {
						mdToLgScreenRules.push(
							`--theme-${key}-${sanitizeKey(name)}: ${lg};`
						);
					}
				}

				// Return rules
				if (!compConfig.value.minify) {
					rules.length && rules.unshift(`/* ${key} */`);
					smToMdScreenRules.length &&
						smToMdScreenRules.unshift(`/* ${key} */`);
					mdToLgScreenRules.length &&
						mdToLgScreenRules.unshift(`/* ${key} */`);
				}

				returnObject.rules.push(...rules);
				returnObject.smToMdScreenRules.push(...smToMdScreenRules);
				returnObject.mdToLgScreenRules.push(...mdToLgScreenRules);
			}
		});

		return returnObject;
	}

	function normalizeFontFamily(value) {
		if (value.startsWith('"') || value.startsWith("'")) {
			return value;
		}
		if (value.match(/^[a-zA-Z]*$/)) {
			return value;
		}
		return value.includes("'") ? `"${value}"` : `'${value}'`;
	}

	function extractRules(
		prefix,
		object,
		unit = 'px',
		transformation = (value) => Number(value)
	) {
		object = typeof object === 'object' ? object : {};
		const useBreakpointSpecificRules =
			!compConfig.value.disableBreakpointSpecificCustomProperties;
		const rules = [];
		const mdScreenRules = [];
		const lgScreenRules = [];

		for (const name in object) {
			const subObject = object[name];

			// First the general rules
			if (useBreakpointSpecificRules) {
				for (const suffix in subObject) {
					const value = subObject[suffix];
					rules.push(
						`--theme-${sanitizeKey(prefix)}-${sanitizeKey(
							name
						)}--${suffix}: ${transformation(value)}${unit};`
					);
				}
			}

			// Then the scaling rules
			const doScalingRule = ['sm', 'md', 'lg'].every((key) => {
				return key in subObject;
			});
			const { smViewport, mdViewport, lgViewport } = compConfig.value;
			if (doScalingRule) {
				const { viewportWidth = '100dvw' } = compConfig.value;
				const { sm, md, lg } = subObject;

				// This one is for smaller screens
				const f1 = (x) => {
					const m = (md - sm) / (mdViewport - smViewport);
					const b = sm - m * smViewport;
					return Math.round((m * x + b) * 1000) / 1000;
				};
				if (sm === md || smViewport === mdViewport) {
					rules.push(
						`--theme-${sanitizeKey(prefix)}-${sanitizeKey(
							name
						)}: ${transformation(sm)}${unit};`
					);
				} else {
					const min = Math.min(sm, md);
					const max = Math.max(sm, md);
					const mid = md;

					let cssMin = `${transformation(min)}${unit}`;
					let cssMax = `${transformation(
						max + (unit === 'rem' ? mid : 0)
					)}${unit} - ${unit === 'rem' ? mid : 0}px`;

					rules.push(
						`--theme-${sanitizeKey(prefix)}-${sanitizeKey(
							name
						)}: clamp(${cssMin}, ${transformation(
							f1(0) + (unit === 'rem' ? mid : 0)
						)}${unit} + ${
							Math.round(
								((max - min) / (mdViewport - smViewport)) *
									100000
							) / 100000
						} * ${viewportWidth} - ${unit === 'rem' ? mid : 0}px, ${cssMax});`
							.split(' - 0px')
							.join('')
					);
				}

				// This one is for larger screens (if lg is not the same as md)
				if (lg !== md) {
					if (lgViewport === mdViewport) {
						rules.push(
							`--theme-${sanitizeKey(prefix)}-${sanitizeKey(
								name
							)}: ${transformation(lg)}${unit};`
						);
					} else {
						const f2 = (x) => {
							const m = (lg - md) / (lgViewport - mdViewport);
							const b = md - m * mdViewport;
							return Math.round((m * x + b) * 1000) / 1000;
						};

						const min = Math.min(md, lg);
						const max = Math.max(md, lg);
						const mid = md;

						let cssMin = `${transformation(
							min + (unit === 'rem' ? mid : 0)
						)}${unit} - ${unit === 'rem' ? mid : 0}px`;
						let cssMax = `${transformation(max)}${unit}`;

						mdScreenRules.push(
							`--theme-${sanitizeKey(prefix)}-${sanitizeKey(
								name
							)}: clamp(${cssMin}, ${transformation(
								f2(0) + (unit === 'rem' ? mid : 0)
							)}${unit} + ${
								Math.round(
									((max - min) / (lgViewport - mdViewport)) *
										100000
								) / 100000
							} * ${viewportWidth} - ${unit === 'rem' ? mid : 0}px, ${cssMax});`
								.split(' - 0px')
								.join('')
						);
					}
				}
			}
		}

		// Apply roundings
		if (compConfig.value.round) {
			[rules, mdScreenRules, lgScreenRules].forEach((ruleSet) => {
				if (ruleSet.length === 0) return;
				const roundTo =
					typeof compConfig.value.round === 'boolean'
						? '1px'
						: typeof compConfig.value.round === 'number'
							? `${compConfig.value.round}px`
							: compConfig.value.round;

				const roundedRules = [
					`@supports (padding: round(1%, ${roundTo})) {`,
				];
				ruleSet.forEach((rule) => {
					const ruleParts = rule.split(': ');
					const property = ruleParts[0];
					const value = ruleParts[1].substring(
						0,
						ruleParts[1].length - 1
					);
					roundedRules.push(
						`${property}: round(${value}, ${roundTo});`
					);
				});

				ruleSet.push(...roundedRules, '}');
			});
		}

		// Return rules
		if (compConfig.value.minify) {
			return {
				rules,
				mdScreenRules,
				lgScreenRules,
			};
		}
		return {
			rules: rules.length ? [`/* ${prefix} */`, ...rules] : [],
			mdScreenRules: mdScreenRules.length
				? [`/* ${prefix} */`, ...mdScreenRules]
				: [],
			lgScreenRules: lgScreenRules.length
				? [`/* ${prefix} */`, ...lgScreenRules]
				: [],
		};
	}

	function makeCssText(
		selector,
		config = compConfig.value,
		cachedSections = undefined
	) {
		if (!selector) {
			const selectors = [':root'];
			if (options.useThemeClasses) {
				selectors.push('.u-theme');

				if (typeof opts.config === 'string') {
					selectors.push(`.u-theme-${opts.config}`);
				} else if (!opts.config) {
					selectors.push('.u-theme-default');
				}
			}
			selector = selectors.join(', ');
		}

		const { baseFontSize, smViewport, mdViewport, lgViewport } = config;

		let rules = cachedSections || [
			extractColorRules(config?.colors),
			// Find variants ending with colors, like backgroundColors
			...findAltRuleKeys('colors', config).map(({ configKey, prefix }) =>
				extractColorRules(config[configKey], prefix)
			),
			extractLayoutRules(config?.layout),
			extractFontRules(config?.fontSize),
			extractFontRules(config?.fontStyles),
			extractRules('spacing', config?.spacing),
			// Find variants ending with spacing, like horizontalSpacing
			...findAltRuleKeys('spacing', config).map(({ configKey }) =>
				extractRules(configKey, config[configKey])
			),
			extractRules('borderRadius', config?.borderRadius),
		];

		const collectRules = (key) =>
			rules
				.reduce((arr, obj) => {
					arr.push(...(obj[key] || []));
					return arr;
				}, [])
				.filter(Boolean);

		let smToMdScreenRules = collectRules('smToMdScreenRules');
		let mdScreenRules = collectRules('mdScreenRules');
		let mdToLgScreenRules = collectRules('mdToLgScreenRules');
		let lgScreenRules = collectRules('lgScreenRules');
		rules = collectRules('rules');

		// Apply selector around rules and indent
		if (rules.length) {
			if (!compConfig.value.minify) {
				rules = rules.map((rule) => `  ${rule}`);
			}
			rules.unshift(`${selector} {`);
			rules.push('}');
		}

		// Apply media query and selector around rules and indent
		if (smToMdScreenRules.length) {
			// Selector
			if (!compConfig.value.minify) {
				smToMdScreenRules = smToMdScreenRules.map(
					(rule) => `  ${rule}`
				);
			}
			smToMdScreenRules.unshift(`${selector} {`);
			smToMdScreenRules.push('}');

			// Media query
			if (!compConfig.value.minify) {
				smToMdScreenRules = smToMdScreenRules.map(
					(rule) => `  ${rule}`
				);
			}
			smToMdScreenRules.unshift(
				`@media screen and (min-width: ${
					Math.round(
						((smViewport + mdViewport) / 2 / baseFontSize) * 1000
					) / 1000
				}em) {`
			);
			smToMdScreenRules.push('}');
		}

		if (mdScreenRules.length) {
			// Selector
			if (!compConfig.value.minify) {
				mdScreenRules = mdScreenRules.map((rule) => `  ${rule}`);
			}
			mdScreenRules.unshift(`${selector} {`);
			mdScreenRules.push('}');

			// Media query
			if (!compConfig.value.minify) {
				mdScreenRules = mdScreenRules.map((rule) => `  ${rule}`);
			}
			mdScreenRules.unshift(
				`@media screen and (min-width: ${
					Math.round((mdViewport / baseFontSize) * 1000) / 1000
				}em) {`
			);
			mdScreenRules.push('}');
		}

		if (mdToLgScreenRules.length) {
			// Selector
			if (!compConfig.value.minify) {
				mdToLgScreenRules = mdToLgScreenRules.map(
					(rule) => `  ${rule}`
				);
			}
			mdToLgScreenRules.unshift(`${selector} {`);
			mdToLgScreenRules.push('}');

			// Media query
			if (!compConfig.value.minify) {
				mdToLgScreenRules = mdToLgScreenRules.map(
					(rule) => `  ${rule}`
				);
			}
			mdToLgScreenRules.unshift(
				`@media screen and (min-width: ${
					Math.round(
						((mdViewport + lgViewport) / 2 / baseFontSize) * 1000
					) / 1000
				}em) {`
			);
			mdToLgScreenRules.push('}');
		}

		if (lgScreenRules.length) {
			// Selector
			if (!compConfig.value.minify) {
				lgScreenRules = lgScreenRules.map((rule) => `  ${rule}`);
			}
			lgScreenRules.unshift(`${selector} {`);
			lgScreenRules.push('}');

			// Media query
			if (!compConfig.value.minify) {
				lgScreenRules = lgScreenRules.map((rule) => `  ${rule}`);
			}
			lgScreenRules.unshift(
				`@media screen and (min-width: ${
					Math.round((lgViewport / baseFontSize) * 1000) / 1000
				}em) {`
			);
			lgScreenRules.push('}');
		}

		// Wrap in a CSS layer
		const layer = opts.cssLayer ? [`@layer ${opts.cssLayer} {`] : [];
		const layerEnd = opts.cssLayer ? ['}'] : [];

		if (compConfig.value.minify) {
			return [
				...layer,
				...rules,
				...smToMdScreenRules,
				...mdScreenRules,
				...mdToLgScreenRules,
				...lgScreenRules,
				...layerEnd,
			]
				.join('')
				.replaceAll('  ', ' ');
		}
		return [
			...layer,
			...rules,
			...smToMdScreenRules,
			...mdScreenRules,
			...mdToLgScreenRules,
			...lgScreenRules,
			...layerEnd,
		].join('\n');
	}

	function createRuleSections(config) {
		if (config === compConfig.value) {
			return [
				colorRules.value,
				...altColorRules.value,
				layoutRules.value,
				fontSizeRules.value,
				fontStyleRules.value,
				spacingRules.value,
				...altSpacingRules.value,
				extractRules('borderRadius', compConfig.value?.borderRadius),
			];
		}

		return [
			extractColorRules(config?.colors),
			...findAltRuleKeys('colors', config).map(({ configKey, prefix }) =>
				extractColorRules(config[configKey], prefix)
			),
			extractLayoutRules(config?.layout),
			extractFontRules(config?.fontSize),
			extractFontRules(config?.fontStyles),
			extractRules('spacing', config?.spacing),
			...findAltRuleKeys('spacing', config).map(({ configKey }) =>
				extractRules(configKey, config[configKey])
			),
			extractRules('borderRadius', config?.borderRadius),
		];
	}

	function findAltRuleKeys(key, config = compConfig.value) {
		const partial = key.charAt(0).toUpperCase() + key.slice(1);
		const matches = [];

		for (const configKey of Object.keys(config || {})) {
			if (configKey.endsWith(partial)) {
				matches.push({
					configKey,
					prefix: configKey.split(partial)[0].toLowerCase(),
				});
			}
		}
		return matches;
	}

	function deepMergeExisting(target, source) {
		for (const key in source) {
			if (key in target) {
				if (typeof target[key] === 'object') {
					deepMergeExisting(target[key], source[key]);
				} else {
					target[key] = source[key];
				}
			}
		}

		// Also return the target in the end for easier chaining
		return target;
	}

	return { compConfig };
}
