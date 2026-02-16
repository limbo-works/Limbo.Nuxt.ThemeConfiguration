<template>
	<slot></slot>
</template>

<script>
const observedData = ref({});
export { observedData as config };
</script>

<script setup>
import {
	sanitizeKey,
	restructureFontSizeObject,
	cloneDeep,
	deepmerge,
} from './helpers.js';

const props = defineProps({
	config: [String, Object],
	media: Object,
	useThemeClasses: [Boolean, Array],
	cssLayer: String,
});

const serializedProps = computed(() => {
	return JSON.stringify(props);
});

defineExpose({
	config: observedData,
});

const iterationCounter = useState(() => 0);

watch(() => props, () => {
	iterationCounter.value++;
});

const availableConfigs = getThemeConfigurations();
const defaultConfig = availableConfigs.default || {};

const compConfig = computed(() => {
	let clone = cloneDeep(defaultConfig);

	let usedConfig = props.config;
	if (typeof usedConfig === 'string') {
		usedConfig = availableConfigs[usedConfig];
	}
	usedConfig = usedConfig || {};

	// Overwrite by property
	if (Object.keys(usedConfig).length) {
		clone = deepmerge(clone, cloneDeep(usedConfig));
	}

	// Default to the defaultConfig
	return clone;
});

const classBaseConfig = computed(() => {
	if (props.useThemeClasses && Array.isArray(props.useThemeClasses)) {
		return deepMergeExisting(
			props.useThemeClasses.reduce((obj, key) => {
				Object.assign(obj, availableConfigs[key]);
			}, {}),
			compConfig.value
		);
	}

	return compConfig.value;
});

/* Compile css text */
const cssText = computed(() => {
	const rules = [makeCssText()];

	if (props.useThemeClasses) {
		for (const [key, value] of Object.entries(availableConfigs)) {
			if (props.config === key) continue;
			if (!props.config && key === 'default') continue;
			if (
				Array.isArray(props.useThemeClasses) &&
				!props.useThemeClasses.includes(key)
			)
				continue;

			rules.push(
				makeCssText(
					`.u-theme-${key}`,
					deepMergeExisting({ ...classBaseConfig.value }, value)
				)
			);
		}
	}

	return rules.join('\n');
});

/* Compose media configs */
const media = computed(() => {
	const media = [];
	for (const [key, config] of Object.entries(props.media || {})) {
		const rules = [
			makeCssText(
				undefined,
				typeof config === 'string' ? availableConfigs[config] : config
			),
		];

		if (props.useThemeClasses) {
			for (const [key] of Object.entries(availableConfigs)) {
				if (props.config === key) continue;
				if (!props.config && key === 'default') continue;
				if (
					Array.isArray(props.useThemeClasses) &&
					!props.useThemeClasses.includes(key)
				)
					continue;

				rules.push(
					makeCssText(
						`.u-theme-${key}`,
						typeof config === 'string'
							? availableConfigs[config]
							: config
					)
				);
			}
		}

		media.push({
			query: key,
			cssText: rules.join('\n'),
		});
	}
	return media;
});

const headStyles = computed(() => {
	return {
		style: [
			cssText.value && { key: 'theme-configuration-' + iterationCounter.value, type: 'text/css', textContent: cssText.value },
			...(media.value?.map((mediaItem) => ({
				key: 'theme-configuration-' + mediaItem.query + '-'  + iterationCounter.value,
				type: 'text/css',
				media: mediaItem.query,
				textContent: mediaItem.cssText,
			})) ?? []),
		],
	};
});
useHead(() => headStyles);

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
			// When disableBreakpointSpecificCustomProperties is true, hardcode the values
			if (compConfig.value.disableBreakpointSpecificCustomProperties) {
				const widthCalculation = `(var(--visual-viewport-width, 100dvw) - var(--theme-layout-margin, ${margin.sm}px) * 2 - var(--theme-layout-gutter, ${gutter.sm}px) * ${
					columnCount - 1
				}) / ${columnCount}`;

				// If the columns are not meant to stop growing
				if (typeof maxRuleValue === 'undefined') {
					return `--theme-layout-column-of-${columnCount}: calc(${widthCalculation});`;
				}

				return `--theme-layout-column-of-${columnCount}: min(${widthCalculation}, (${maxRuleValue}px - var(--theme-layout-margin, ${margin.lg}px) * 2 - var(--theme-layout-gutter, ${gutter.lg}px) * ${
					columnCount - 1
				}) / ${columnCount});`;
			}

			// Default behavior with custom properties
			const widthCalculation = `(var(--visual-viewport-width, 100dvw) - var(--theme-layout-margin, var(--theme-layout-margin--sm)) * 2 - var(--theme-layout-gutter, var(--theme-layout-gutter--sm)) * ${
				columnCount - 1
			}) / ${columnCount}`;

			// If the columns are not meant to stop growing
			if (typeof maxRuleValue === 'undefined') {
				return `--theme-layout-column-of-${columnCount}: calc(${widthCalculation});`;
			}

			return `--theme-layout-column-of-${columnCount}: min(${widthCalculation}, (${maxRuleValue}px - var(--theme-layout-margin, var(--theme-layout-margin--lg)) * 2 - var(--theme-layout-gutter, var(--theme-layout-gutter--lg)) * ${
				columnCount - 1
			}) / ${columnCount});`;
		};

		// Only generate breakpoint-specific column properties when not disabled
		if (!compConfig.value.disableBreakpointSpecificCustomProperties) {
			rules.push(generateBaseRule('sm', sm, true));
			rules.push(generateBaseRule('md', md, true));
			rules.push(generateBaseRule('lg', lg, true));
		}

		const colCounts = [...new Set([sm, md, lg])];
		for (let i = 0; i < colCounts.length; i++) {
			const colCount = colCounts[i];
			rules.push(generateResponsiveRule(colCount));
		}
	}

	// Setup layout max
	if (typeof maxRuleValue === 'undefined') {
		rules.push('--theme-layout-max: var(--visual-viewport-width, 100dvw);');
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
			const extracted = extractRules(key, object[key], 'rem', (value) => {
				return Math.round((Number(value) / baseFontSize) * 1000) / 1000;
			});
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

				if (!compConfig.value.disableBreakpointSpecificCustomProperties) {
					rules.push(
						`--theme-${key}-${sanitizeKey(
							name
						)}--sm: ${convertFromPercentage(subObject.sm)}em;`
					);
					rules.push(
						`--theme-${key}-${sanitizeKey(
							name
						)}--md: ${convertFromPercentage(subObject.md)}em;`
					);
					rules.push(
						`--theme-${key}-${sanitizeKey(
							name
						)}--lg: ${convertFromPercentage(subObject.lg)}em;`
					);
				}

				rules.push(
					`--theme-${key}-${sanitizeKey(
						name
					)}: ${convertFromPercentage(subObject.sm)}em;`
				);
				if (subObject.md !== subObject.sm) {
					smToMdScreenRules.push(
						`--theme-${key}-${sanitizeKey(
							name
						)}: ${convertFromPercentage(subObject.md)}em;`
					);
				}
				if (subObject.lg !== subObject.md) {
					mdToLgScreenRules.push(
						`--theme-${key}-${sanitizeKey(
							name
						)}: ${convertFromPercentage(subObject.lg)}em;`
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
					if (!sm.startsWith('"') && !sm.startsWith('\'')) {
						if (!sm.match(/^[a-zA-Z]*$/)) {
							sm.includes('\'') && (sm = `"${sm}"`);
							!sm.includes('\'') && (sm = `'${sm}'`);
						}
					}
					if (!md.startsWith('"') && !md.startsWith('\'')) {
						if (!md.match(/^[a-zA-Z]*$/)) {
							md.includes('\'') && (md = `"${md}"`);
							!md.includes('\'') && (md = `'${md}'`);
						}
					}
					if (!lg.startsWith('"') && !lg.startsWith('\'')) {
						if (!lg.match(/^[a-zA-Z]*$/)) {
							lg.includes('\'') && (lg = `"${lg}"`);
							!lg.includes('\'') && (lg = `'${lg}'`);
						}
					}
				}

				if (!compConfig.value.disableBreakpointSpecificCustomProperties) {
					rules.push(`--theme-${key}-${sanitizeKey(name)}--sm: ${sm};`);
					rules.push(`--theme-${key}-${sanitizeKey(name)}--md: ${md};`);
					rules.push(`--theme-${key}-${sanitizeKey(name)}--lg: ${lg};`);
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

function extractRules(
	prefix,
	object,
	unit = 'px',
	transformation = (value) => Number(value)
) {
	object = typeof object === 'object' ? object : {};
	const rules = [];
	const mdScreenRules = [];
	const lgScreenRules = [];

	for (const name in object) {
		const subObject = object[name];

		// First the general rules (skip if disableBreakpointSpecificCustomProperties is true)
		if (!compConfig.value.disableBreakpointSpecificCustomProperties) {
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
			return Object.keys(subObject).includes(key);
		});
		const { smViewport, mdViewport, lgViewport } = compConfig.value;
		if (doScalingRule) {
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
				rules.push(
					`--theme-${sanitizeKey(prefix)}-${sanitizeKey(
						name
					)}: clamp(${transformation(min)}${unit}, ${transformation(
						f1(0) + (unit === 'rem' ? mid : 0)
					)}${unit} + ${
						Math.round(
							((max - min) / (mdViewport - smViewport)) * 100000
						) / 1000
					}vw - ${unit === 'rem' ? mid : 0}px, ${transformation(
						max + (unit === 'rem' ? mid : 0)
					)}${unit} - ${unit === 'rem' ? mid : 0}px);`
						.split(' - 0px')
						.join('')
				);
			}

			// This one is for larger screens (if lg is not the same as md)
			if (lg !== md) {
				if (lgViewport === mdViewport) {
					mdScreenRules.push(
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
					mdScreenRules.push(
						`--theme-${sanitizeKey(prefix)}-${sanitizeKey(
							name
						)}: clamp(${transformation(
							min + (unit === 'rem' ? mid : 0)
						)}${unit} - ${
							unit === 'rem' ? mid : 0
						}px, ${transformation(
							f2(0) + (unit === 'rem' ? mid : 0)
						)}${unit} + ${
							Math.round(
								((max - min) / (lgViewport - mdViewport)) *
									100000
							) / 1000
						}vw - ${unit === 'rem' ? mid : 0}px, ${transformation(
							max
						)}${unit});`
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
				roundedRules.push(`${property}: round(${value}, ${roundTo});`);
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

function makeCssText(selector, config = compConfig.value) {
	if (!selector) {
		const selectors = [':root'];
		if (props.useThemeClasses) {
			selectors.push('.u-theme');

			if (typeof props.config === 'string') {
				selectors.push(`.u-theme-${props.config}`);
			} else if (!props.config) {
				selectors.push('.u-theme-default');
			}
		}
		selector = selectors.join(', ');
	}

	const { baseFontSize, smViewport, mdViewport, lgViewport } = config;

	let rules = [
		extractColorRules(config?.colors),
		// Find variants ending with colors, like backgroundColors
		...findAltRuleKeys('colors').map(({ configKey, prefix }) =>
			extractColorRules(config[configKey], prefix)
		),
		extractLayoutRules(config?.layout),
		extractFontRules(config?.fontSize),
		extractFontRules(config?.fontStyles),
		extractRules('spacing', config?.spacing),
		// Find variants ending with spacing, like horizontalSpacing
		...findAltRuleKeys('spacing').map(({ configKey }) =>
			extractRules(configKey, config[configKey])
		),
		extractRules('borderRadius', config?.borderRadius),
	];

	let smToMdScreenRules = rules
		.reduce((arr, obj) => {
			arr.push(...(obj.smToMdScreenRules || []));
			return arr;
		}, [])
		.filter(Boolean);
	let mdScreenRules = rules
		.reduce((arr, obj) => {
			arr.push(...(obj.mdScreenRules || []));
			return arr;
		}, [])
		.filter(Boolean);
	let mdToLgScreenRules = rules
		.reduce((arr, obj) => {
			arr.push(...(obj.mdToLgScreenRules || []));
			return arr;
		}, [])
		.filter(Boolean);
	let lgScreenRules = rules
		.reduce((arr, obj) => {
			arr.push(...(obj.lgScreenRules || []));
			return arr;
		}, [])
		.filter(Boolean);
	rules = rules
		.reduce((arr, obj) => {
			arr.push(...(obj.rules || []));
			return arr;
		}, [])
		.filter(Boolean);

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
			smToMdScreenRules = smToMdScreenRules.map((rule) => `  ${rule}`);
		}
		smToMdScreenRules.unshift(`${selector} {`);
		smToMdScreenRules.push('}');

		// Media query
		if (!compConfig.value.minify) {
			smToMdScreenRules = smToMdScreenRules.map((rule) => `  ${rule}`);
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
			mdToLgScreenRules = mdToLgScreenRules.map((rule) => `  ${rule}`);
		}
		mdToLgScreenRules.unshift(`${selector} {`);
		mdToLgScreenRules.push('}');

		// Media query
		if (!compConfig.value.minify) {
			mdToLgScreenRules = mdToLgScreenRules.map((rule) => `  ${rule}`);
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
	const layer = props.cssLayer ? [`@layer ${props.cssLayer} {`] : [];
	const layerEnd = props.cssLayer ? ['}'] : [];

	if (compConfig.value.minify) {
		return [
			...layer,
			...rules,
			...smToMdScreenRules,
			...mdScreenRules,
			...mdToLgScreenRules,
			...lgScreenRules,
			...layerEnd,
		].join('');
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

function findAltRuleKeys(key) {
	const partial = key.charAt(0).toUpperCase() + key.slice(1);
	const returnArray = [];

	Object.keys(compConfig.value).forEach((configKey) => {
		if (configKey.endsWith(partial)) {
			returnArray.push({
				configKey,
				prefix: configKey.split(partial)[0].toLowerCase(),
			});
		}
	});
	return returnArray;
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
}

watch(compConfig, (value) => (observedData.value = value), {
	immediate: true,
	deep: true,
});
</script>
