<template>
	<Head v-if="cssText">
		<Style type="text/css" :children="cssText" />
	</Head>
	<slot></slot>
</template>

<script>
import * as deepmergeSrc from 'deepmerge';
const deepmerge = deepmergeSrc.default || deepmergeSrc;

import {
	sanitizeKey,
	restructureFontSizeObject,
	cloneDeep,
	getThemeConfigurations,
} from './helpers.js';

/*
	This is the component responsible for configuring the theme
	of the solution. The component takes basis in a default theme,
	usually the one used on a main solution. But it can* also take
	data from the site object, which allow the backend to overwrite
	the theme.

	The component does also also allow for a configuration to be
	passed in through a prop, but this shouldn't be the way, and
	is mainly done for future demo site.
*/

const observedData = ref({
	config: {},
});

export const { config } = observedData.value;
export default defineNuxtComponent({
	name: 'ThemeConfiguration',
	key: 'ThemeConfiguration',

	props: {
		config: {
			type: [String,Object],
			default: () => ({}),
		},
		cssLayer: {
			type: String,
			default: '',
		},
	},

	data() {
		return {
			availableConfigurations: {},
		};
	},

	computed: {
		defaultConfig() {
			return this.availableConfigurations.default || {};
		},
		compConfig() {
			let clone = cloneDeep(this.defaultConfig);

			let usedConfig = this.config;
			if (typeof usedConfig === 'string') {
				usedConfig = this.availableConfigurations[usedConfig];
			}
			usedConfig = usedConfig || {};

			// Overwrite by property
			if (Object.keys(usedConfig).length) {
				clone = deepmerge(clone, cloneDeep(usedConfig));
			}

			// Default to the defaultConfig
			return clone;
		},
		minify() {
			return this.compConfig.minify;
		},

		cssText() {
			const {
				compConfig: config,
				extractColorRules,
				extractLayoutRules,
				extractFontRules,
				extractRules: extract,
				findAltRuleKeys,
			} = this;
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
				extract('spacing', config?.spacing),
				// Find variants ending with spacing, like horizontalSpacing
				...findAltRuleKeys('spacing').map(({ configKey }) =>
					extract(configKey, config[configKey])
				),
				extract('borderRadius', config?.borderRadius),
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

			// Apply root around rules and indent
			if (rules.length) {
				if (!this.minify) {
					rules = rules.map((rule) => `  ${rule}`);
				}
				rules.unshift(':root {');
				rules.push('}');
			}

			// Apply media query and root around rules and indent
			if (smToMdScreenRules.length) {
				// Root
				if (!this.minify) {
					smToMdScreenRules = smToMdScreenRules.map(
						(rule) => `  ${rule}`
					);
				}
				smToMdScreenRules.unshift(':root {');
				smToMdScreenRules.push('}');

				// Media query
				if (!this.minify) {
					smToMdScreenRules = smToMdScreenRules.map(
						(rule) => `  ${rule}`
					);
				}
				smToMdScreenRules.unshift(
					`@media screen and (min-width: ${
						Math.round(
							((smViewport + mdViewport) / 2 / baseFontSize) *
								1000
						) / 1000
					}em) {`
				);
				smToMdScreenRules.push('}');
			}

			if (mdScreenRules.length) {
				// Root
				if (!this.minify) {
					mdScreenRules = mdScreenRules.map((rule) => `  ${rule}`);
				}
				mdScreenRules.unshift(':root {');
				mdScreenRules.push('}');

				// Media query
				if (!this.minify) {
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
				// Root
				if (!this.minify) {
					mdToLgScreenRules = mdToLgScreenRules.map(
						(rule) => `  ${rule}`
					);
				}
				mdToLgScreenRules.unshift(':root {');
				mdToLgScreenRules.push('}');

				// Media query
				if (!this.minify) {
					mdToLgScreenRules = mdToLgScreenRules.map(
						(rule) => `  ${rule}`
					);
				}
				mdToLgScreenRules.unshift(
					`@media screen and (min-width: ${
						Math.round(
							((mdViewport + lgViewport) / 2 / baseFontSize) *
								1000
						) / 1000
					}em) {`
				);
				mdToLgScreenRules.push('}');
			}

			if (lgScreenRules.length) {
				// Root
				if (!this.minify) {
					lgScreenRules = lgScreenRules.map((rule) => `  ${rule}`);
				}
				lgScreenRules.unshift(':root {');
				lgScreenRules.push('}');

				// Media query
				if (!this.minify) {
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
			const layer = this.cssLayer ? [`@layer ${this.cssLayer} {`] : [];
			const layerEnd = this.cssLayer ? ['}'] : [];

			if (this.minify) {
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
		},
	},

	watch: {
		compConfig: {
			deep: true,
			immediate: true,
			handler(newConfig) {
				Object.assign(observedData.value.config, cloneDeep(newConfig));
			},
		},
	},

	async created() {
		this.availableConfigurations = await getThemeConfigurations();
	},

	methods: {
		// Extracting colors from the config
		extractColorRules(object, prefix) {
			object = cloneDeep(typeof object === 'object' ? object : {});

			const rules = [];
			Object.entries(object).forEach(([key, value]) => {
				if (!this.minify && !rules.length) {
					rules.push(`/* colors ${prefix ? `- ${prefix} ` : ''}*/`);
				}

				// We make sure there's spaces between the commas
				const composedValue = String(value?.value ?? value)
					.split(',')
					.join(', ')
					.split('  ')
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
		},

		// Extracting layout rules from the config
		extractLayoutRules(object) {
			object = cloneDeep(typeof object === 'object' ? object : {});
			const columns = object.columns || {};
			delete object.columns;

			const maxRuleValue = object.max;
			delete object.max;

			const {
				rules = [],
				mdScreenRules = [],
				lgScreenRules = [],
			} = this.extractRules('layout', object);
			if (!this.minify) {
				!rules.length && rules.push('/* layout */');
				!mdScreenRules.length && mdScreenRules.push('/* layout */');
				!lgScreenRules.length && lgScreenRules.push('/* layout */');
			}

			// Setup column rules
			const { sm = 0, md = 0, lg = 0 } = columns;
			if (sm || md || lg) {
				const { gutter, margin } = object;
				const { smViewport, mdViewport, lgViewport } = this.compConfig;
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
					const widthCalculation = `(var(--visual-viewport-width, 100vw) - var(--theme-layout-margin, var(--theme-layout-margin--sm)) * 2 - var(--theme-layout-gutter, var(--theme-layout-gutter--sm)) * ${
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
				rules.push(
					'--theme-layout-max: var(--visual-viewport-width, 100vw);'
				);
			} else {
				rules.push(`--theme-layout-max: ${maxRuleValue}px;`);
			}

			if (!this.minify) {
				rules.length === 1 && rules.pop();
				mdScreenRules.length === 1 && mdScreenRules.pop();
				lgScreenRules.length === 1 && lgScreenRules.pop();
			}

			return { rules, mdScreenRules, lgScreenRules };
		},

		// Extracting font rules from the config
		extractFontRules(object) {
			object = typeof object === 'object' ? object : {};

			// Restructure the object
			object = restructureFontSizeObject(object);
			Object.keys(object).forEach((key) => {
				if (this.compConfig[key] && key !== 'fontSize') {
					object[key] = deepmerge(object[key], this.compConfig[key]);
				}
			});

			// Extract rules
			const { baseFontSize } = this.compConfig;
			const returnObject = {
				rules: [],
				smToMdScreenRules: [],
				mdScreenRules: [],
				mdToLgScreenRules: [],
			};

			// Extract font sizes as rem
			['fontSize'].forEach((key) => {
				if (object[key]) {
					const extracted = this.extractRules(
						key,
						object[key],
						'rem',
						(value) => {
							return (
								Math.round(
									(Number(value) / baseFontSize) * 1000
								) / 1000
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
					if (!this.minify) {
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

						rules.push(
							`--theme-${key}-${sanitizeKey(name)}--sm: ${
								subObject.sm
							};`
						);
						rules.push(
							`--theme-${key}-${sanitizeKey(name)}--md: ${
								subObject.md
							};`
						);
						rules.push(
							`--theme-${key}-${sanitizeKey(name)}--lg: ${
								subObject.lg
							};`
						);

						rules.push(
							`--theme-${key}-${sanitizeKey(name)}: ${
								subObject.sm
							};`
						);
						if (subObject.md !== subObject.sm) {
							smToMdScreenRules.push(
								`--theme-${key}-${sanitizeKey(name)}: ${
									subObject.md
								};`
							);
						}
						if (subObject.lg !== subObject.md) {
							mdToLgScreenRules.push(
								`--theme-${key}-${sanitizeKey(name)}: ${
									subObject.lg
								};`
							);
						}
					}

					// Return rules
					if (!this.minify) {
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
		},

		// Extracting css rules from the config
		extractRules(
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
				const { smViewport, mdViewport, lgViewport } = this.compConfig;
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
							)}: clamp(${transformation(
								min
							)}${unit}, ${transformation(
								f1(0) + (unit === 'rem' ? mid : 0)
							)}${unit} + ${
								Math.round(
									((max - min) / (mdViewport - smViewport)) *
										100000
								) / 1000
							}vw - ${
								unit === 'rem' ? mid : 0
							}px, ${transformation(
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
										((max - min) /
											(lgViewport - mdViewport)) *
											100000
									) / 1000
								}vw - ${
									unit === 'rem' ? mid : 0
								}px, ${transformation(max)}${unit});`
									.split(' - 0px')
									.join('')
							);
						}
					}
				}
			}

			// Return rules
			if (this.minify) {
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
		},

		// Find and generate alternate rulesets
		findAltRuleKeys(key) {
			const { compConfig: config } = this;
			const partial = key.charAt(0).toUpperCase() + key.slice(1);
			const returnArray = [];

			Object.keys(config).forEach((configKey) => {
				if (configKey.endsWith(partial)) {
					returnArray.push({
						configKey,
						prefix: configKey.split(partial)[0].toLowerCase(),
					});
				}
			});
			return returnArray;
		},
	},
});
</script>
