import {
	sanitizeKey,
	restructureFontSizeObject,
	cloneDeep,
} from './helpers.js';

export { makeThemeUtilities, makeThemePlugins };

// Down here we have some practical functions (shouldn't be altered)
// Function to generate the tailwind utility values.
function makeThemeUtilities(config) {
	config = cloneDeep(config);
	if (config.fontSize) {
		const fontSizeUtils = restructureFontSizeObject(config.fontSize);
		delete config.fontSize;
		Object.assign(config, fontSizeUtils);
	}

	const obj = {};
	Object.keys(config).forEach((key) => {
		if (typeof config[key] === 'object') {
			Object.keys(config[key]).forEach((subKey) => {
				// Special case setup for columns
				if (key === 'layout' && subKey === 'columns') {
					const columns = obj[key]?.[subKey] || {};
					const { sm, md, lg } = config[key][subKey];
					const colCounts = [...new Set([sm, md, lg])];

					for (let i = 0; i < colCounts.length; i++) {
						for (let j = 1; j <= colCounts[i]; j++) {
							columns[
								`${j}/${colCounts[i]}col`
							] = `calc(var(--theme-${sanitizeKey(
								key
							)}-column-of-${
								colCounts[i]
							}) * ${j} + var(--theme-layout-gutter, var(--theme-layout-gutter--sm)) * ${
								j - 1
							})`;
						}
					}

					obj[key][subKey] = columns;
					return;
				}

				// Special case for layout max
				if (key === 'layout' && subKey === 'max') {
					const fallbackValue =
						typeof config[key][subKey] === 'undefined'
							? 'var(--visual-viewport-width, 100vw)'
							: `${config[key][subKey]}px`;
					obj[key] = obj[key] || {};
					obj[key][subKey] = `var(--theme-${sanitizeKey(
						key
					)}-${sanitizeKey(subKey)}, ${fallbackValue})`;
					return;
				}

				// Colors only
				if (
					[
						'colors',
						'backgroundColors',
						'textColors',
						'borderColors',
					].includes(key)
				) {
					let colorValue = config[key][subKey];

					const prefix = {
						backgroundColors: 'colors-background',
						textColors: 'colors-text',
						borderColors: 'colors-border',
					}[key];

					if (
						typeof colorValue === 'object' &&
						!Array.isArray(colorValue)
					) {
						colorValue = colorValue.value;
					}
					colorValue = String(colorValue)
						.split(',')
						.join(' ')
						.split('  ')
						.join(' ')
						.trim();

					obj[key] = obj[key] || {};
					obj[key][subKey] = `var(--theme-${
						prefix ?? sanitizeKey(key)
					}-${sanitizeKey(subKey)}, ${colorValue})`;

					// Use the build in opacity utilities if three comma-separated values are provided
					const splitValue = colorValue.split(' ');
					if (
						config[key][subKey].isListedRgb ||
						(splitValue.length === 3 &&
							splitValue.every((value) => {
								const trimmed = value.trim();
								return String(+trimmed) === trimmed;
							}))
					) {
						obj[key][subKey] = ({
							opacityVariable,
							opacityValue,
						}) => {
							if (opacityValue !== undefined) {
								return `rgba(var(--theme-${
									prefix ?? sanitizeKey(key)
								}-${sanitizeKey(subKey)}), ${opacityValue})`;
							}
							if (opacityVariable !== undefined) {
								return `rgba(var(--theme-${
									prefix ?? sanitizeKey(key)
								}-${sanitizeKey(
									subKey
								)}), var(${opacityVariable}, 1))`;
							}
							return `rgb(var(--theme-${
								prefix ?? sanitizeKey(key)
							}-${sanitizeKey(subKey)}))`;
						};
					}

					return;
				}

				// Ordinary setup
				obj[key] = obj[key] || {};
				obj[key][subKey] = `var(--theme-${sanitizeKey(
					key
				)}-${sanitizeKey(subKey)}, var(--theme-${sanitizeKey(
					key
				)}-${sanitizeKey(subKey)}--sm))`;

				// FontSize only:
				if (key === 'fontSize') {
					const lineHeight = config?.lineHeight?.[subKey];
					const letterSpacing = config?.letterSpacing?.[subKey];
					if (lineHeight || letterSpacing) {
						const extras = {};
						if (lineHeight) {
							extras.lineHeight = `var(--theme-lineHeight-${sanitizeKey(
								subKey
							)}, var(--theme-lineHeight-${sanitizeKey(
								subKey
							)}--sm))`;
						}
						if (letterSpacing) {
							extras.letterSpacing = `var(--theme-letterSpacing-${sanitizeKey(
								subKey
							)}, var(--theme-letterSpacing-${sanitizeKey(
								subKey
							)})--sm)`;
						}
						obj[key][subKey] = [
							`var(--theme-${sanitizeKey(key)}-${sanitizeKey(
								subKey
							)}, var(--theme-${sanitizeKey(key)}-${sanitizeKey(
								subKey
							)}--sm))`,
							extras,
						];
					}
				}
			});
		}
	});
	return obj;
}

// Function to generate the tailwind plugin functions.
function makeThemePlugins(config) {
	const response = {};

	/**
	 * Font styles
	 */
	if (config.fontStyles) {
		const utilities = {};
		Object.entries(config.fontStyles).forEach(([key, value]) => {
			const s = `${sanitizeKey(key)}`;

			utilities[`.text-${s}`] = {};
			utilities[`.text-${s}`]['font-family'] = value.fontFamily || 'none';
			utilities[`.text-${s}`]['font-weight'] = value.fontWeight || '500';
			utilities[`.text-${s}`]['font-style'] = value.fontStyle || 'normal';
			utilities[`.text-${s}`]['text-transform'] =
				value.textCase || 'none';
			utilities[`.text-${s}`]['text-decoration'] =
				value.textDecoration || 'none';

			utilities[`.text-${s}`][
				'font-size'
			] = `var(--theme-fontSize-${s}, var(--theme-fontSize-${s}--sm))`;

			utilities[`.text-${s}`][
				'line-height'
			] = `var(--theme-lineHeight-${s}, var(--theme-lineHeight-${s}--sm))`;

			utilities[`.text-${s}`][
				'letter-spacing'
			] = `var(--theme-letterSpacing-${s}, var(--theme-letterSpacing-${s}--sm))`;
		});

		response.fontStyles = function ({ addUtilities }) {
			addUtilities(utilities);
		};
	}

	return response;
}
