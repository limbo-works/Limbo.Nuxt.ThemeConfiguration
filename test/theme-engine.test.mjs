import assert from 'node:assert/strict';
import { test } from 'vitest';
import { createJiti } from 'jiti';
import {
	createGenerator,
	presetMini,
	transformerVariantGroup,
	transformerDirectives,
} from 'unocss';
import MagicString from 'magic-string';
import { createAutocomplete } from '@unocss/autocomplete';

const jiti = createJiti(import.meta.url);
const { generateThemeCss, mergeThemeConfigs } = await jiti.import(
	'../src/runtime/shared/theme-engine.ts'
);
const { normalizeThemeConfiguration, resolveThemeOptions } = await jiti.import(
	'../src/runtime/shared/normalize-theme-configuration.ts'
);
const { spacing, defineThemeRule } = await jiti.import(
	'../src/runtime/shared/rules/index.ts'
);
const { makeUnoTheme } = await jiti.import(
	'../src/runtime/shared/helpers.uno.ts'
);
const { resolveRules } = await jiti.import(
	'../src/runtime/shared/rules/index.ts'
);

test('container queries generate native numeric and named conditions without column queries', async () => {
	const generated = makeUnoTheme({
		containers: { card: '400px', 'card-wide': '32rem' },
	});
	assert.equal(generated.theme.containers.card, '400px');
	const uno = await createGenerator({
		presets: [presetMini()],
		...generated,
	});
	const result = await uno.generate(
		'@container @container/sidebar @card:w-1/2 @lt-card:w-full @960:flex @lt-1080:block @card-wide/sidebar:grid @lt-card-wide:hidden @[600px]:flex hover:@card:underline @4/12col:flex @lt-4/12col:flex'
	);
	assert.match(result.css, /container-type:inline-size/);
	assert.match(result.css, /container-name:sidebar/);
	for (const condition of [
		'(min-width: 400px)',
		'(max-width: 399.9px)',
		'(min-width: 960px)',
		'(max-width: 1079.9px)',
		'(max-width: 31.9rem)',
		'(min-width: 600px)',
	])
		assert.ok(result.css.includes(`@container ${condition}`), condition);
	assert.match(result.css, /@container sidebar \(min-width: 32rem\)/);
	assert.doesNotMatch(result.css, /min-width: \(min-width:/);
	assert.ok(!result.matched.has('@4/12col:flex'));
	assert.ok(!result.matched.has('@lt-4/12col:flex'));
	assert.ok(result.matched.has('hover:@card:underline'));
	const numericOnly = await createGenerator({
		presets: [presetMini()],
		...makeUnoTheme({}),
	});
	assert.match(
		(await numericOnly.generate('@960:flex')).css,
		/@container \(min-width: 960px\)/
	);
	const disabled = makeUnoTheme({}, {}, { containers: false });
	assert.deepEqual(disabled.variants, []);
	const replaced = makeUnoTheme(
		{},
		{},
		{ containers: defineThemeRule({ adapters: { uno: () => ({}) } }) }
	);
	assert.deepEqual(replaced.variants, []);
});

test('container maps reject invalid widths and reserved names explicitly', () => {
	for (const containers of [
		null,
		[],
		42,
		{ card: 400 },
		{ card: 'var(--width)' },
		{ card: '(min-width: 400px)' },
		{ card: '-20px' },
		{ card: '30%' },
		{ 'lt-card': '400px' },
		{ 'bad/name': '400px' },
	])
		assert.throws(
			() => makeUnoTheme({ containers }),
			/containers must be a map|invalid container/
		);
});

test('container autocomplete suggests named, less-than, and prefixed utility forms', async () => {
	const uno = await createGenerator({
		presets: [presetMini()],
		...makeUnoTheme({
			containers: { card: '400px', 'card-wide': '32rem' },
		}),
	});
	const autocomplete = createAutocomplete(uno);
	for (const [prefix, suggestion] of [
		['@ca', '@card:'],
		['@card-wide:fl', '@card-wide:flex'],
		['@lt-ca', '@lt-card:'],
		['@lt-card-w', '@lt-card-wide:'],
		['@960:fl', '@960:flex'],
		['@lt-400:bl', '@lt-400:block'],
	]) {
		assert.ok(
			(await autocomplete.suggest(prefix)).includes(suggestion),
			suggestion
		);
		assert.ok(
			(
				await uno.generate(
					suggestion.endsWith(':') ? `${suggestion}flex` : suggestion
				)
			).matched.size > 0
		);
	}
	const strict = await createGenerator({
		presets: [presetMini()],
		...makeUnoTheme({
			containers: { card: '400px', 'card-wide': '32rem' },
		}),
		separators: [':'],
	});
	assert.ok(
		(await createAutocomplete(strict).suggest('@card-w')).includes(
			'@card-wide:'
		)
	);
});

test('container variants work through grouping and standard apply transformer', async () => {
	const uno = await createGenerator({
		presets: [presetMini()],
		...makeUnoTheme({ containers: { card: '400px' } }),
	});
	const grouped = new MagicString(
		'<div class="@card:(flex w-1/2) @lt-400:(block w-full)"></div>'
	);
	await transformerVariantGroup().transform(grouped, 'fixture.vue', { uno });
	assert.ok(grouped.toString().includes('@card:flex @card:w-1/2'));
	const generated = await uno.generate(grouped.toString());
	assert.ok(generated.matched.has('@card:w-1/2'));
	const code = new MagicString(
		'.card { @apply @card:w-1/2 @lt-400:w-full; }'
	);
	await transformerDirectives().transform(code, 'fixture.css', { uno });
	assert.match(code.toString(), /@container \(min-width: 400px\)/);
	assert.match(code.toString(), /@container \(max-width: 399.9px\)/);
	assert.doesNotMatch(code.toString(), /@apply/);
});

const breaks = {
	phone: 320,
	tablet: 640,
	laptop: 960,
	desktop: 1280,
	wide: 1600,
};

function theme(spacing, namedBreaks = breaks) {
	return { options: { namedBreaks }, spacing };
}

function clampAt(css, viewport, root = 16) {
	const [
		,
		min,
		minUnit,
		intercept,
		interceptUnit,
		sign,
		slope,
		max,
		maxUnit,
	] =
		css.match(
			/clamp\(([-\d.]+)(px|rem), ([-\d.]+)(px|rem) ([+-]) ([\d.]+) \* 100dvw, ([-\d.]+)(px|rem)\)/
		) ?? [];
	assert.ok(min !== undefined, `Missing clamp: ${css}`);
	const px = (value, unit) => Number(value) * (unit === 'rem' ? root : 1);
	return Math.max(
		px(min, minUnit),
		Math.min(
			px(max, maxUnit),
			px(intercept, interceptUnit) +
				(sign === '-' ? -1 : 1) * Number(slope) * viewport
		)
	);
}

test('one to five breaks produce endpointCount - 1 fluid segments, sorted by width', () => {
	for (const count of [1, 2, 3, 4, 5]) {
		const entries = Object.entries(breaks).slice(0, count).reverse();
		const values = Object.fromEntries(
			[...entries]
				.reverse()
				.map(([, width], index) => [width, 8 + index * 8])
		);
		const css = generateThemeCss(
			theme({ gap: values }, Object.fromEntries(entries))
		);
		assert.equal(
			(css.match(/clamp\(/g) ?? []).length,
			Math.max(0, count - 1)
		);
		assert.equal(
			(css.match(/@media /g) ?? []).length,
			Math.max(0, count - 2)
		);
		assert.ok(css.includes('--theme-spacing-gap--phone: 8px;'));
		if (count === 1) assert.ok(css.includes('--theme-spacing-gap: 8px;'));
		if (count >= 4) {
			assert.ok(
				css.indexOf('min-width: 40em') < css.indexOf('min-width: 60em')
			);
		}
	}
});

test('sparse endpoints interpolate directly, clamp outside, and handle descending values', () => {
	for (const [start, end] of [
		[8, 48],
		[48, 8],
	]) {
		const css = generateThemeCss(theme({ gap: { 320: start, 1600: end } }));
		assert.equal((css.match(/clamp\(/g) ?? []).length, 1);
		assert.doesNotMatch(css, /@media|--tablet|--laptop|--desktop/);
		for (const width of [0, 320, 640, 960, 1280, 1600, 2400]) {
			const expected =
				start +
				(end - start) * Math.max(0, Math.min(1, (width - 320) / 1280));
			assert.ok(Math.abs(clampAt(css, width) - expected) < 0.001);
		}
	}
	const css = generateThemeCss(theme({ gap: { 320: 8, 640: 24, 960: 24 } }));
	assert.match(css, /min-width: 40em/);
	assert.match(css, /--theme-spacing-gap: 24px;/);
});

test('scalar and single-endpoint tokens are constant, including zero; rounding and suffix opt-out apply', () => {
	const css = generateThemeCss({
		...theme({ zero: 0, fixed: { 640: 12 } }),
		options: {
			namedBreaks: breaks,
			round: '1px',
			disableBreakpointSpecificCustomProperties: true,
		},
	});
	assert.match(css, /--theme-spacing-zero: 0px;/);
	assert.match(css, /--theme-spacing-fixed: 12px;/);
	assert.match(css, /round\(12px, 1px\)/);
	assert.doesNotMatch(css, /--tablet|clamp\(/);
});

test('typography supports property-first, breakpoint-first, shorthand, and midpoint switches', () => {
	const config = {
		options: { namedBreaks: { phone: 320, desktop: 1280 } },
		fontSize: {
			title: {
				fontSize: { 320: 24, 1280: 48 },
				letterSpacing: { 320: 0, 1280: '2%' },
			},
			body: {
				320: { fontSize: 16, fontWeight: 400, lineHeight: 1.2 },
				1280: { fontSize: 20, fontWeight: 700, lineHeight: 1.5 },
			},
			small: { 320: 12, 1280: 14 },
		},
	};
	const original = structuredClone(config);
	const css = generateThemeCss(config);
	assert.match(css, /--theme-fontSize-title--phone: 1.5rem/);
	assert.match(css, /--theme-fontSize-body--desktop: 1.25rem/);
	assert.match(css, /--theme-fontSize-small--phone: 0.75rem/);
	assert.match(css, /--theme-letterSpacing-title--phone: 0em/);
	assert.match(css, /--theme-letterSpacing-title--desktop: 0.02em/);
	assert.match(css, /min-width: 50em/);
	assert.match(css, /--theme-fontWeight-body: 700/);
	const title = css
		.split('\n')
		.find((line) => line.includes('--theme-fontSize-title:'));
	assert.ok(Math.abs(clampAt(title, 800) - 36) < 0.001);
	assert.deepEqual(config, original);
});

test('break maps replace defaults, theme options win, and invalid or legacy input fails explicitly', () => {
	const options = resolveThemeOptions(
		{ namedBreaks: { only: 600 }, minify: false },
		{ minify: true }
	);
	assert.deepEqual(options.namedBreaks, { only: 600 });
	assert.equal(options.minify, false);
	for (const namedBreaks of [
		{},
		{ a: 0 },
		{ a: -1 },
		{ a: 400, b: 400 },
		{ 'bad name': 400 },
		{ a: NaN },
	]) {
		assert.throws(
			() => resolveThemeOptions({ namedBreaks }),
			/namedBreaks|breakpoint/
		);
	}
	assert.throws(
		() => normalizeThemeConfiguration({ smViewport: 375 }),
		/legacy key/
	);
	assert.throws(
		() => normalizeThemeConfiguration({ options: { handlers: {} } }),
		/replaced/
	);
	assert.throws(
		() => generateThemeCss(theme({ bad: { sm: 8 } })),
		/numeric namedBreaks width/
	);
	assert.throws(
		() => generateThemeCss(theme({ bad: { 320: Infinity } })),
		/finite numeric/
	);
	assert.throws(
		() => generateThemeCss(theme({ bad: {} })),
		/no breakpoint values/
	);
});

test('module defaults stay below authored base and override options, including empty and partial themes', () => {
	const defaults = { namedBreaks: breaks, minify: true, baseFontSize: 20 };
	const base = normalizeThemeConfiguration({
		options: { minify: false, namedBreaks: { start: 400, end: 1000 } },
		spacing: { gap: { 400: 8, 1000: 24 } },
	});
	const empty = mergeThemeConfigs(
		base,
		normalizeThemeConfiguration({}),
		defaults
	);
	assert.equal(empty.options.minify, false);
	assert.equal(empty.options.baseFontSize, 20);
	assert.deepEqual(empty.options.namedBreaks, { start: 400, end: 1000 });
	const partial = normalizeThemeConfiguration({
		spacing: { gap: { 1000: 40 } },
	});
	const css = generateThemeCss(partial, { baseConfig: empty, defaults });
	assert.match(css, /--theme-spacing-gap--start: 8px/);
	assert.match(css, /--theme-spacing-gap--end: 40px/);
	assert.doesNotMatch(css, /--phone|--wide/);
	const overridden = mergeThemeConfigs(
		base,
		{ options: { minify: true } },
		defaults
	);
	assert.equal(overridden.options.minify, true);
});

test('media queries retain em thresholds derived from baseFontSize', () => {
	const css = generateThemeCss({
		options: {
			namedBreaks: { small: 320, medium: 640, large: 960 },
			baseFontSize: 20,
		},
		spacing: { gap: { 320: 8, 640: 16, 960: 32 } },
		fontWeight: { body: { 320: 400, 640: 700 } },
	});
	assert.match(css, /min-width: 32em/);
	assert.match(css, /min-width: 24em/);
});

test('breakpoint precedence reaches emitted CSS and rejects incompatible inherited tokens', () => {
	const defaults = { namedBreaks: { compact: 360, wide: 1280 } };
	const inherited = { spacing: { gap: { 360: 8, 1280: 24 } } };
	const inheritedCss = generateThemeCss(inherited, { defaults });
	assert.match(inheritedCss, /--theme-spacing-gap--compact: 8px/);
	assert.match(inheritedCss, /--theme-spacing-gap--wide: 24px/);
	assert.doesNotMatch(inheritedCss, /--sm|--md|--lg/);

	const override = {
		options: { namedBreaks: { phone: 400, desktop: 1200 } },
		spacing: { gap: { 400: 12, 1200: 32 } },
	};
	const overriddenCss = generateThemeCss(override, { defaults });
	assert.match(overriddenCss, /--theme-spacing-gap--phone: 12px/);
	assert.doesNotMatch(overriddenCss, /--compact|--wide/);
	assert.throws(
		() =>
			generateThemeCss(
				{ ...inherited, options: override.options },
				{ defaults }
			),
		/not a configured numeric namedBreaks width/
	);
	assert.throws(
		() => generateThemeCss({ options: { namedBreaks: {} } }, { defaults }),
		/at least one breakpoint/
	);
	const builtInCss = generateThemeCss({
		spacing: { gap: { 375: 8, 1920: 24 } },
	});
	assert.match(builtInCss, /--theme-spacing-gap--sm: 8px/);
	assert.match(builtInCss, /--theme-spacing-gap--lg: 24px/);

	const merged = mergeThemeConfigs(
		{
			...inherited,
			spacing: { ...inherited.spacing, untouched: { 360: 4 } },
		},
		override,
		defaults
	);
	assert.throws(
		() => generateThemeCss(merged),
		/not a configured numeric namedBreaks width/
	);
});

test('themes can replace break sets without retaining obsolete endpoints, including merged classes', () => {
	const base = theme({ gap: { 320: 8, 640: 16, 1600: 32 } });
	const override = {
		options: { namedBreaks: { compact: 400, large: 1200 } },
		spacing: { gap: { 400: 12, 1200: 24 }, newToken: { 400: 8 } },
	};
	for (const existingOnly of [false, true]) {
		const merged = mergeThemeConfigs(base, override, {}, existingOnly);
		const css = generateThemeCss(merged);
		assert.match(css, /--theme-spacing-gap--compact: 12px/);
		assert.doesNotMatch(css, /--phone|--tablet|--wide/);
		assert.equal('newToken' in merged.spacing, !existingOnly);
	}
	const merged = mergeThemeConfigs(
		base,
		{ spacing: { gap: { 640: 24 } } },
		{},
		true
	);
	assert.deepEqual(merged.spacing.gap, { 320: 8, 640: 24, 1600: 32 });
});

test('partial, media, and class-style compilation inherit options without emitting base tokens', () => {
	const base = {
		...theme({ gap: { 320: 8, 1600: 32 } }),
		colors: { text: '#123456' },
	};
	const override = { spacing: { gap: { 320: 12, 1600: 48 } } };
	const css = generateThemeCss(override, {
		baseConfig: base,
		selector: '.promo',
		cssLayer: 'theme',
	});
	assert.match(css, /^@layer theme/);
	assert.match(css, /\.promo \{/);
	assert.match(css, /--theme-spacing-gap--wide: 48px/);
	assert.doesNotMatch(css, /--theme-colors/);
	const merged = mergeThemeConfigs(base, {
		options: { namedBreaks: { single: 320 } },
	});
	assert.deepEqual(merged.options.namedBreaks, { single: 320 });
	const singleEndpoint = generateThemeCss(
		{ spacing: { gap: { 640: 24 } } },
		{ baseConfig: base }
	);
	assert.match(singleEndpoint, /--theme-spacing-gap--phone: 8px/);
	assert.match(singleEndpoint, /--theme-spacing-gap--tablet: 24px/);
	assert.match(singleEndpoint, /--theme-spacing-gap--wide: 32px/);
	assert.equal((singleEndpoint.match(/clamp\(/g) ?? []).length, 2);
	assert.doesNotMatch(singleEndpoint, /theme-colors/);
});

test('plugins replace, extend, disable and add rules; adapter-specific hooks stay independent', async () => {
	const extended = defineThemeRule({
		...spacing,
		css(value, context) {
			const output = spacing.css(value, context);
			output.base.push('--project-extra: 1;');
			return output;
		},
	});
	const motion = defineThemeRule({
		css(value, context) {
			return context.responsive('motion', value, {
				unit: 'ms',
				mode: 'step',
			});
		},
		adapters: {
			uno() {
				return {
					rules: [
						[
							/^animate-project$/,
							() => ({
								'animation-duration':
									'var(--theme-motion-fast)',
							}),
						],
					],
				};
			},
			futureAdapter() {
				return { independent: true };
			},
		},
	});
	const config = {
		...theme({ gap: 8 }),
		colors: { onPrimaryStrong: [255, 255, 255] },
		backgroundColors: { primary: [0, 0, 0] },
		motion: { fast: 120 },
	};
	const rules = { spacing: extended, colors: false, motion };
	const css = generateThemeCss(config, { rules });
	assert.match(css, /--project-extra: 1/);
	assert.match(css, /--theme-motion-fast: 120ms/);
	assert.doesNotMatch(css, /--theme-colors-onPrimaryStrong/);
	assert.throws(
		() => generateThemeCss(config),
		/no rule registered for "motion"/
	);
	const generated = makeUnoTheme(config, {}, rules);
	assert.equal(generated.theme.colors, undefined);
	const uno = await createGenerator({
		presets: [presetMini()],
		...generated,
	});
	const result = await uno.generate('p-gap animate-project bg-primary');
	assert.match(result.css, /padding:var\(--theme-spacing-gap\)/);
	assert.match(result.css, /animation-duration:var\(--theme-motion-fast\)/);
	assert.doesNotMatch(result.css, /--theme-colors-strong-on-X/);
});

test('disabled typography sections do not leak through another section adapter', async () => {
	const config = {
		options: { namedBreaks: breaks },
		fontSize: { title: { 320: 24, 1600: 48 } },
		fontStyles: { ghost: { 320: 16, 1600: 20 } },
	};
	for (const [disabled, absent, present] of [
		['fontStyles', 'text-ghost', 'text-title'],
		['fontSize', 'text-title', 'text-ghost'],
	]) {
		const generated = makeUnoTheme(config, {}, { [disabled]: false });
		const uno = await createGenerator({
			presets: [presetMini()],
			...generated,
		});
		const result = await uno.generate(`${absent} ${present}`);
		assert.ok(result.matched.has(present));
		assert.ok(!result.matched.has(absent));
	}
});

test('layout and UnoCSS handle arbitrary column denominators, scoped colors, radii, and text limits', async () => {
	const config = {
		options: {
			namedBreaks: {
				phone: 320,
				tablet: 640,
				laptop: 960,
				desktop: 1280,
			},
		},
		layout: {
			margin: { 320: 16, 1280: 64 },
			gutter: 16,
			max: 1600,
		},
		colors: { onPrimaryStrong: [255, 255, 255] },
		backgroundColors: { primary: [0, 0, 0] },
		textColors: { onPrimarySubtle: '#abc', comma: '10, 20, 30' },
		borderRadius: { card: 12 },
		spacing: { gap: 16 },
		fontSize: { title: { 320: 24, 1280: 48 } },
	};
	const css = generateThemeCss(config);
	assert.match(css, /--theme-layout-width: min\(/);
	assert.doesNotMatch(css, /--theme-layout-column/);
	assert.match(css, /--theme-colors-text-comma: 10 20 30/);
	const generated = makeUnoTheme(config);
	const uno = await createGenerator({
		presets: [presetMini()],
		...generated,
	});

	const result = await uno.generate(
		'w-3/10col w-5/14col w-2.5/14col bg-primary bg-scope-primary text-strong text-subtle text-comma rounded-t-card -m-gap text-title text-min-24 text-max-title'
	);
	assert.ok(result.matched.has('w-3/10col'));
	assert.ok(result.matched.has('w-2.5/14col'));
	assert.match(result.css, /var\(--theme-layout-width\)/);
	assert.match(result.css, /--theme-colors-strong-on-X/);
	assert.match(result.css, /--theme-colors-text-subtle-on-X/);
	assert.match(result.css, /rgb\(var\(--theme-colors-text-comma, 10 20 30\)/);
	assert.match(
		result.css,
		/border-top-left-radius:var\(--theme-borderRadius-card\)/
	);
	assert.match(
		result.css,
		/border-top-right-radius:var\(--theme-borderRadius-card\)/
	);
	assert.match(result.css, /margin:calc\(var\(--theme-spacing-gap\) \* -1\)/);
	assert.match(result.css, /--minFontSize:24px/);
	assert.match(result.css, /--maxFontSize:var\(--theme-fontSize-title\)/);
});

test('removed background section requires an explicit project rule', () => {
	const config = { background: { fancy: 'linear-gradient(red, blue)' } };
	for (const compile of [generateThemeCss, makeUnoTheme]) {
		assert.throws(
			() => compile(config),
			/no rule registered for "background"/
		);
	}
});

test('column utilities need no configured count and retain fractional spans with suffixes disabled', async () => {
	const config = {
		options: {
			namedBreaks: { narrow: 320, wide: 1280 },
			disableBreakpointSpecificCustomProperties: true,
		},
		layout: { margin: 16, gutter: 8 },
	};
	const css = generateThemeCss(config);
	assert.match(css, /--theme-layout-width:/);
	assert.doesNotMatch(css, /--theme-layout-column/);
	const uno = await createGenerator({
		presets: [presetMini()],
		...makeUnoTheme(config),
	});
	for (const token of [
		'w-1/1col',
		'w-1/3col',
		'w-4/12col',
		'w-2.5/12col',
		'min-w-3/37col',
	]) {
		const result = await uno.generate(token);
		assert.ok(result.matched.has(token));
		assert.match(result.css, /var\(--theme-layout-width\)/);
	}
	for (const token of ['w-1/0col', 'w-1/-3col', 'w-1/2.5col']) {
		assert.doesNotMatch(
			(await uno.generate(token)).css,
			/--theme-layout-width/
		);
	}
	assert.match(
		(await uno.generate('w-2.5/12col')).css,
		/\+ 2 \* var\(--theme-layout-gutter, 0px\)/
	);
});

test('invalid plugin registrations fail explicitly', () => {
	for (const rule of [null, {}, { css: 'not-a-function' }]) {
		assert.throws(
			() => resolveRules({ project: rule }),
			/rule "project".*plugin/
		);
	}
});

test('unknown and legacy layout settings are ignored', () => {
	const config = {
		options: { namedBreaks: breaks },
		layout: {
			margin: 16,
			gutter: 8,
			max: 1400,
			columns: 12,
			columnCount: 12,
			viewport: { sm: 320, md: 960 },
			breakpoints: [320, 960],
			customLegacySetting: true,
		},
	};
	for (const compile of [generateThemeCss, makeUnoTheme])
		assert.doesNotThrow(() => compile(config));

	const css = generateThemeCss(config);
	assert.match(css, /--theme-layout-margin: 16px/);
	assert.match(css, /--theme-layout-gutter: 8px/);
	assert.match(css, /--theme-layout-max: 1400px/);
	assert.doesNotMatch(
		css,
		/--theme-layout-(columns|columnCount|breakpoints)/
	);
	assert.doesNotMatch(css, /customLegacySetting/);
});

test('standalone UnoCSS autocomplete suggests layout, backgrounds, negative spacing, and text limits', async () => {
	const generated = makeUnoTheme({
		options: { namedBreaks: breaks },
		layout: {
			margin: 16,
			gutter: 8,
			max: 1400,
		},
		backgroundColors: {
			panel: [10, 20, 30],
			'panel-soft': [40, 50, 60],
		},
		spacing: { breathing: 16, 'breathing-room': 24 },
		borderRadius: { card: 12 },
		fontSize: { heading: 24 },
	});
	const uno = await createGenerator({
		presets: [presetMini()],
		...generated,
	});
	const autocomplete = createAutocomplete(uno);
	for (const [prefix, expected] of [
		['w-layout-ma', 'w-layout-max'],
		['min-w-layout-ma', 'min-w-layout-max'],
		['max-w-layout-ma', 'max-w-layout-max'],
		['w-3/', 'w-3/14col'],
		['w-', 'w-12/14col'],
		['min-w-3/', 'min-w-3/14col'],
		['w-', 'w-1/14col'],
		['p-layout-mar', 'p-layout-margin'],
		['bg-pan', 'bg-panel'],
		['bg-panel-so', 'bg-panel-soft'],
		['bg-scope-pan', 'bg-scope-panel'],
		['-m-brea', '-m-breathing'],
		['-m-breathing-ro', '-m-breathing-room'],
		['rounded-t-ca', 'rounded-t-card'],
		['text-hea', 'text-heading'],
		['text-min-hea', 'text-min-heading'],
		['text-min-uns', 'text-min-unset'],
		['text-max-uns', 'text-max-unset'],
		['text-min-', 'text-min-24'],
		['text-max-', 'text-max-36'],
	]) {
		const suggestions = await autocomplete.suggest(prefix);
		assert.ok(
			suggestions.includes(expected),
			`${prefix} must suggest ${expected}`
		);
		const result = await uno.generate(expected);
		assert.ok(
			result.matched.has(expected),
			`${expected} must generate CSS`
		);
	}
	assert.ok((await autocomplete.suggest('w-3/')).includes('w-3/12col'));
});

test('CSS and adapter compilation leave theme inputs untouched when fonts and layout share overrides', () => {
	const config = {
		options: { namedBreaks: breaks, minify: true },
		layout: {
			margin: 16,
			gutter: 8,
			max: 1400,
		},
		fontSize: {
			heading: {
				fontSize: { 320: 24, 1600: 48 },
				fontWeight: { 320: 400, 1600: 700 },
			},
		},
		fontWeight: { heading: { 1600: 900 } },
		colors: { primary: { value: [10, 20, 30], isListedRgb: true } },
	};
	const original = structuredClone(config);
	const css = generateThemeCss(config);
	assert.match(css, /--theme-fontWeight-heading--phone: 400/);
	assert.match(css, /--theme-fontWeight-heading--wide: 900/);
	assert.doesNotMatch(
		css.split('@media')[0],
		/--theme-fontWeight-heading: 900;/
	);
	assert.doesNotMatch(css, /\n/);
	const output = makeUnoTheme(config);
	assert.ok(output.rules.length > 0);
	assert.equal(
		output.theme.colors.primary,
		'rgb(var(--theme-colors-primary, 10 20 30))'
	);
	assert.deepEqual(config, original);
});

test('optimized merges detach shared branches and preserve endpoint, scalar, and existing-only semantics', () => {
	const shared = { 320: 8, 1600: 32 };
	const separated = mergeThemeConfigs(
		theme({ first: shared, second: shared }),
		{ spacing: { first: { 320: 16 } } }
	);
	assert.deepEqual(separated.spacing.first, { 320: 16, 1600: 32 });
	assert.deepEqual(separated.spacing.second, { 320: 8, 1600: 32 });
	const base = {
		...theme({ gap: { 320: 8, 1600: 32 }, fixed: 0 }),
		project: { nested: { list: [{ value: 1 }] } },
	};
	const override = {
		spacing: { gap: base.spacing.gap, fixed: -0, added: undefined },
		project: base.project,
	};
	const merged = mergeThemeConfigs(base, override);
	merged.spacing.gap[320] = 100;
	merged.project.nested.list[0].value = 2;
	assert.equal(base.spacing.gap[320], 8);
	assert.equal(base.project.nested.list[0].value, 1);
	assert.equal(override.spacing.gap[320], 8);
	assert.ok(Object.is(merged.spacing.fixed, -0));
	assert.ok(Object.hasOwn(merged.spacing, 'added'));
	const existing = mergeThemeConfigs(
		base,
		{
			spacing: { gap: { 640: 20 }, newToken: 16 },
			project: { nested: { list: [{ value: 3 }], newKey: true } },
		},
		{},
		true
	);
	assert.deepEqual(existing.spacing, {
		gap: { 320: 8, 640: 20, 1600: 32 },
		fixed: 0,
	});
	assert.deepEqual(existing.project.nested, { list: [{ value: 3 }] });
	assert.deepEqual(
		mergeThemeConfigs(base, { spacing: { gap: 12 } }).spacing.gap,
		12
	);
});

test('compilation memoization never retains typography across edits or rule registries', async () => {
	const config = {
		...theme({ gap: { 320: 8, 1600: 32 } }),
		fontSize: {
			heading: {
				fontSize: { 320: 24, 1600: 48 },
				fontWeight: { 320: 400, 1600: 700 },
			},
		},
		fontWeight: { heading: { 1600: 800 } },
	};
	const initial = generateThemeCss(config);
	assert.match(initial, /--theme-fontWeight-heading--wide: 800/);
	for (const weight of [900, 600, 900]) {
		config.fontWeight.heading[1600] = weight;
		config.fontSize.heading.fontSize[320] = weight / 25;
		const css = generateThemeCss(config);
		assert.match(
			css,
			new RegExp(`--theme-fontWeight-heading--wide: ${weight}`)
		);
		assert.match(
			css,
			new RegExp(`--theme-fontSize-heading--phone: ${weight / 400}rem`)
		);
		const disabled = generateThemeCss(config, {
			rules: { fontWeight: false },
		});
		assert.match(disabled, /--theme-fontWeight-heading--wide: 700/);
		const generated = makeUnoTheme(config);
		const uno = await createGenerator({
			presets: [presetMini()],
			...generated,
		});
		assert.match(
			(await uno.generate('text-heading')).css,
			/font-weight:var\(--theme-fontWeight-heading\)/
		);
	}
	assert.match(initial, /--theme-fontSize-heading--phone: 1.5rem/);
});

test('on-background indexes keep longest matches, disabled groups, and separate builds isolated', async () => {
	const config = {
		backgroundColors: { panel: [10, 20, 30], panelAlt: [30, 40, 50] },
		colors: { onPanelAltContrast: [250, 250, 250] },
		textColors: { 'on-panelAlt-muted': [180, 180, 180] },
	};
	const compile = async (rules = {}) => {
		const generated = makeUnoTheme(config, {}, rules);
		const uno = await createGenerator({
			presets: [presetMini()],
			...generated,
		});
		return {
			...generated,
			css: (
				await uno.generate(
					'bg-panel bg-panelAlt bg-panelWide bg-scope-panelAlt'
				)
			).css,
		};
	};
	const first = await compile();
	assert.ok(first.theme.colors.contrast);
	assert.equal(first.theme.colors.altContrast, undefined);
	assert.match(
		first.css,
		/--theme-colors-contrast-on-X:var\(--theme-colors-onPanelAltContrast\)/
	);
	const disabled = await compile({ colors: false });
	assert.doesNotMatch(disabled.css, /--theme-colors-contrast-on-X/);
	assert.match(disabled.css, /--theme-colors-text-muted-on-X/);
	delete config.backgroundColors.panelAlt;
	config.backgroundColors.panelWide = [60, 70, 80];
	delete config.colors.onPanelAltContrast;
	config.colors.onPanelWideEmphasis = [1, 2, 3];
	const edited = await compile();
	assert.match(
		edited.css,
		/--theme-colors-emphasis-on-X:var\(--theme-colors-onPanelWideEmphasis\)/
	);
	assert.doesNotMatch(edited.css, /--theme-colors-contrast-on-X/);
	assert.match(first.css, /--theme-colors-contrast-on-X/);
});
