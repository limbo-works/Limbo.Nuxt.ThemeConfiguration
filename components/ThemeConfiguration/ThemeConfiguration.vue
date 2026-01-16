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

defineExpose({
	config: observedData,
});

const iterationCounter = useState(() => 0);

watch(() => props, () => {
	iterationCounter.value++;
	// Clear config cache when props change
	configCache.clear();
});

const availableConfigs = getThemeConfigurations();
const defaultConfig = availableConfigs.default || {};

// Cache merged configs to avoid repeated cloning
const configCache = new Map();

const compConfig = computed(() => {
	let usedConfig = props.config;
	const configKey = typeof usedConfig === 'string' ? usedConfig : JSON.stringify(usedConfig);

	// Check cache first
	if (configCache.has(configKey)) {
		return configCache.get(configKey);
	}

	if (typeof usedConfig === 'string') {
		usedConfig = availableConfigs[usedConfig];
	}
	usedConfig = usedConfig || {};

	let result;
	// Only clone and merge if we have custom config
	if (Object.keys(usedConfig).length) {
		result = deepmerge(cloneDeep(defaultConfig), usedConfig);
	} else {
		result = defaultConfig;
	}

	// Cache the result
	configCache.set(configKey, result);
	return result;
});

const classBaseConfig = computed(() => {
	if (props.useThemeClasses && Array.isArray(props.useThemeClasses)) {
		// Build merged config without excessive cloning
		const mergedObj = {};
		for (let i = 0; i < props.useThemeClasses.length; i++) {
			const key = props.useThemeClasses[i];
			const config = availableConfigs[key];
			if (config) {
				Object.assign(mergedObj, config);
			}
		}
		return deepMergeExisting(mergedObj, compConfig.value);
	}

	return compConfig.value;
});

/* Compile css text */
const cssText = computed(() => {
	const rules = [makeCssText()];

	if (props.useThemeClasses) {
		const availableKeys = Object.keys(availableConfigs);
		for (let i = 0; i < availableKeys.length; i++) {
			const key = availableKeys[i];
			if (props.config === key) continue;
			if (!props.config && key === 'default') continue;
			if (Array.isArray(props.useThemeClasses) && !props.useThemeClasses.includes(key)) continue;

			rules.push(
				makeCssText(
					`.u-theme-${key}`,
					deepMergeExisting({ ...classBaseConfig.value }, availableConfigs[key])
				)
			);
		}
	}

	return rules.join('\n');
});

/* Compose media configs */
const media = computed(() => {
	const mediaObj = props.media || {};
	const mediaKeys = Object.keys(mediaObj);
	if (!mediaKeys.length) return [];

	const result = new Array(mediaKeys.length);
	for (let i = 0; i < mediaKeys.length; i++) {
		const key = mediaKeys[i];
		const config = mediaObj[key];

		// Build rules more efficiently
		const rules = [];
		const baseConfig = typeof config === 'string' ? availableConfigs[config] : config;
		rules.push(makeCssText(undefined, baseConfig));

		if (props.useThemeClasses) {
			const availableKeys = Object.keys(availableConfigs);
			for (let j = 0; j < availableKeys.length; j++) {
				const themeKey = availableKeys[j];
				if (props.config === themeKey) continue;
				if (!props.config && themeKey === 'default') continue;
				if (Array.isArray(props.useThemeClasses) && !props.useThemeClasses.includes(themeKey)) continue;

				rules.push(makeCssText(`.u-theme-${themeKey}`, baseConfig));
			}
		}

		result[i] = {
			query: key,
			cssText: rules.join('\n'),
		};
	}
	return result;
});

const headStyles = computed(() => {
	const styles = [];

	if (cssText.value) {
		styles.push({
			key: 'theme-configuration-' + iterationCounter.value,
			type: 'text/css',
			textContent: cssText.value
		});
	}

	// Efficiently build media styles without array spreading
	const mediaVal = media.value;
	if (mediaVal?.length) {
		for (let i = 0; i < mediaVal.length; i++) {
			const mediaItem = mediaVal[i];
			styles.push({
				key: 'theme-configuration-' + mediaItem.query + '-' + iterationCounter.value,
				type: 'text/css',
				media: mediaItem.query,
				textContent: mediaItem.cssText,
			});
		}
	}

	return { style: styles };
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

		rules.push(generateBaseRule('sm', sm, true));
		rules.push(generateBaseRule('md', md, true));
		rules.push(generateBaseRule('lg', lg, true));

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

				rules.push(`--theme-${key}-${sanitizeKey(name)}--sm: ${sm};`);
				rules.push(`--theme-${key}-${sanitizeKey(name)}--md: ${md};`);
				rules.push(`--theme-${key}-${sanitizeKey(name)}--lg: ${lg};`);

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

		// First the general rules
		for (const suffix in subObject) {
			const value = subObject[suffix];
			rules.push(
				`--theme-${sanitizeKey(prefix)}-${sanitizeKey(
					name
				)}--${suffix}: ${transformation(value)}${unit};`
			);
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
		let selectorStr = ':root';
		if (props.useThemeClasses) {
			selectorStr += ', .u-theme';
			if (typeof props.config === 'string') {
				selectorStr += `, .u-theme-${props.config}`;
			} else if (!props.config) {
				selectorStr += ', .u-theme-default';
			}
		}
		selector = selectorStr;
	}

	const { baseFontSize, smViewport, mdViewport, lgViewport } = config;

	// Pre-allocate arrays to avoid repeated allocation
	const allRules = [];

	// Add basic rules without spreading
	allRules.push(extractColorRules(config?.colors));

	// Add color variants efficiently
	const colorKeys = findAltRuleKeys('colors');
	for (let i = 0; i < colorKeys.length; i++) {
		const { configKey, prefix } = colorKeys[i];
		allRules.push(extractColorRules(config[configKey], prefix));
	}

	allRules.push(extractLayoutRules(config?.layout));
	allRules.push(extractFontRules(config?.fontSize));
	allRules.push(extractFontRules(config?.fontStyles));
	allRules.push(extractRules('spacing', config?.spacing));

	// Add spacing variants efficiently
	const spacingKeys = findAltRuleKeys('spacing');
	for (let i = 0; i < spacingKeys.length; i++) {
		const { configKey } = spacingKeys[i];
		allRules.push(extractRules(configKey, config[configKey]));
	}

	allRules.push(extractRules('borderRadius', config?.borderRadius));

	// Efficiently collect rules into separate arrays
	const rules = [];
	const smToMdScreenRules = [];
	const mdScreenRules = [];
	const mdToLgScreenRules = [];
	const lgScreenRules = [];

	for (let i = 0; i < allRules.length; i++) {
		const ruleSet = allRules[i];
		if (!ruleSet) continue;

		if (ruleSet.rules) {
			for (let j = 0; j < ruleSet.rules.length; j++) {
				if (ruleSet.rules[j]) rules.push(ruleSet.rules[j]);
			}
		}
		if (ruleSet.smToMdScreenRules) {
			for (let j = 0; j < ruleSet.smToMdScreenRules.length; j++) {
				if (ruleSet.smToMdScreenRules[j]) smToMdScreenRules.push(ruleSet.smToMdScreenRules[j]);
			}
		}
		if (ruleSet.mdScreenRules) {
			for (let j = 0; j < ruleSet.mdScreenRules.length; j++) {
				if (ruleSet.mdScreenRules[j]) mdScreenRules.push(ruleSet.mdScreenRules[j]);
			}
		}
		if (ruleSet.mdToLgScreenRules) {
			for (let j = 0; j < ruleSet.mdToLgScreenRules.length; j++) {
				if (ruleSet.mdToLgScreenRules[j]) mdToLgScreenRules.push(ruleSet.mdToLgScreenRules[j]);
			}
		}
		if (ruleSet.lgScreenRules) {
			for (let j = 0; j < ruleSet.lgScreenRules.length; j++) {
				if (ruleSet.lgScreenRules[j]) lgScreenRules.push(ruleSet.lgScreenRules[j]);
			}
		}
	}



	// Build CSS string efficiently without excessive array operations
	const cssBuilder = [];

	// Add CSS layer start
	if (props.cssLayer) {
		cssBuilder.push(`@layer ${props.cssLayer} {`);
	}

	// Build main rules section
	if (rules.length) {
		cssBuilder.push(`${selector} {`);
		for (let i = 0; i < rules.length; i++) {
			cssBuilder.push(compConfig.value.minify ? rules[i] : `  ${rules[i]}`);
		}
		cssBuilder.push('}');
	}

	// Build smToMd screen rules
	if (smToMdScreenRules.length) {
		const breakpoint = Math.round(((smViewport + mdViewport) / 2 / baseFontSize) * 1000) / 1000;
		cssBuilder.push(`@media screen and (min-width: ${breakpoint}em) {`);
		cssBuilder.push(compConfig.value.minify ? `${selector} {` : `  ${selector} {`);
		for (let i = 0; i < smToMdScreenRules.length; i++) {
			const indent = compConfig.value.minify ? '' : '    ';
			cssBuilder.push(indent + smToMdScreenRules[i]);
		}
		cssBuilder.push(compConfig.value.minify ? '}' : '  }');
		cssBuilder.push('}');
	}

	// Build md screen rules
	if (mdScreenRules.length) {
		const breakpoint = Math.round((mdViewport / baseFontSize) * 1000) / 1000;
		cssBuilder.push(`@media screen and (min-width: ${breakpoint}em) {`);
		cssBuilder.push(compConfig.value.minify ? `${selector} {` : `  ${selector} {`);
		for (let i = 0; i < mdScreenRules.length; i++) {
			const indent = compConfig.value.minify ? '' : '    ';
			cssBuilder.push(indent + mdScreenRules[i]);
		}
		cssBuilder.push(compConfig.value.minify ? '}' : '  }');
		cssBuilder.push('}');
	}

	// Build mdToLg screen rules
	if (mdToLgScreenRules.length) {
		const breakpoint = Math.round(((mdViewport + lgViewport) / 2 / baseFontSize) * 1000) / 1000;
		cssBuilder.push(`@media screen and (min-width: ${breakpoint}em) {`);
		cssBuilder.push(compConfig.value.minify ? `${selector} {` : `  ${selector} {`);
		for (let i = 0; i < mdToLgScreenRules.length; i++) {
			const indent = compConfig.value.minify ? '' : '    ';
			cssBuilder.push(indent + mdToLgScreenRules[i]);
		}
		cssBuilder.push(compConfig.value.minify ? '}' : '  }');
		cssBuilder.push('}');
	}

	// Build lg screen rules
	if (lgScreenRules.length) {
		const breakpoint = Math.round((lgViewport / baseFontSize) * 1000) / 1000;
		cssBuilder.push(`@media screen and (min-width: ${breakpoint}em) {`);
		cssBuilder.push(compConfig.value.minify ? `${selector} {` : `  ${selector} {`);
		for (let i = 0; i < lgScreenRules.length; i++) {
			const indent = compConfig.value.minify ? '' : '    ';
			cssBuilder.push(indent + lgScreenRules[i]);
		}
		cssBuilder.push(compConfig.value.minify ? '}' : '  }');
		cssBuilder.push('}');
	}

	// Add CSS layer end
	if (props.cssLayer) {
		cssBuilder.push('}');
	}

	return cssBuilder.join(compConfig.value.minify ? '' : '\n');
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
