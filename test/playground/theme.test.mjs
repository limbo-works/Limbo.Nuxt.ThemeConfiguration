import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { commands, page } from 'vitest/browser';
import { createApp, h, nextTick, ref } from 'vue';
import { createHead, renderDOMHead } from '@unhead/vue/client';
import { createGenerator } from '@unocss/core';
import presetMini from '@unocss/preset-mini';
import ThemeConfiguration from '../../src/runtime/components/ThemeConfiguration.vue';
import ThemeVerification from '../../.playground/components/ThemeVerification.vue';
import themePlugin from '../../src/runtime/plugins/theme-configuration';
import defaultTheme from '../../.playground/assets/js/theme-configuration.default';
import { makeUnoTheme } from '../../src/runtime/shared/helpers.uno';
import { resetNuxtContext, useRuntimeConfig } from './nuxt-context.mjs';
import rules from './rules.mjs';

let app;
let container;
let utilities;
let head;
let warn;
let error;
let rootOptions;

const element = (id) => {
	const result = container.querySelector(`[data-testid="${id}"]`);
	if (!result) throw new Error(`Missing playground element: ${id}`);
	return result;
};
const styles = (id) =>
	[...document.querySelectorAll('style')].filter(
		(style) => style.id === id || style.id.startsWith(`${id}-`)
	);
const text = (id) =>
	styles(id)
		.map((style) => style.textContent)
		.join('\n');
const css = (id, property) =>
	getComputedStyle(element(id)).getPropertyValue(property).trim();

beforeEach(async () => {
	warn = vi.spyOn(console, 'warn');
	error = vi.spyOn(console, 'error');
	const nuxtApp = resetNuxtContext();
	await themePlugin(nuxtApp);
	head = createHead();
	container = document.createElement('main');
	document.body.append(container);
	rootOptions = ref({
		useThemeClasses: true,
		media: { print: 'print' },
	});
	app = createApp({
		render: () =>
			h('div', [
				h(ThemeConfiguration, rootOptions.value),
				h(
					'header',
					{
						class: 'bg-primary px-layout-margin',
						'data-testid': 'header',
					},
					'Global theme'
				),
				h(ThemeVerification),
			]),
	});
	app.use(head);
	app.component('ThemeConfiguration', ThemeConfiguration);
	app.mount(container);
	await nextTick();
	container.querySelector('.advanced').open = true;
	await renderDOMHead(head);
	const generated = makeUnoTheme(
		defaultTheme,
		useRuntimeConfig().public.themeConfiguration,
		rules
	);
	const uno = await createGenerator({
		presets: [presetMini()],
		...generated,
	});
	const classes = [...container.querySelectorAll('[class]')]
		.flatMap((node) => [...node.classList])
		.join(' ');
	utilities = document.createElement('style');
	utilities.textContent = (await uno.generate(classes)).css;
	document.head.append(utilities);
	expect(element('verification').dataset.ready).toBe('true');
});

afterEach(async () => {
	await commands.setMedia('screen');
	app?.unmount();
	await renderDOMHead(head);
	container?.remove();
	utilities?.remove();
	const errors = error.mock.calls;
	const warnings = warn.mock.calls.filter((args) =>
		/hydration|failed|theme|vue warn/i.test(args.join(' '))
	);
	vi.restoreAllMocks();
	expect(errors, 'No runtime errors').toEqual([]);
	expect(warnings, 'No Vue or theme-loading warnings').toEqual([]);
});

function length(id, property, expected) {
	const actual = css(id, property);
	const value =
		property === 'letter-spacing' && actual === 'normal'
			? 0
			: parseFloat(actual);
	expect(
		Math.abs(value - expected),
		`${id} ${property}: ${actual}, expected ${expected}px`
	).toBeLessThan(0.06);
}

function interpolate(points, width) {
	if (width <= points[0][0]) return points[0][1];
	for (let index = 1; index < points.length; index++) {
		const [rightWidth, rightValue] = points[index];
		const [leftWidth, leftValue] = points[index - 1];
		if (width <= rightWidth)
			return (
				leftValue +
				((rightValue - leftValue) * (width - leftWidth)) /
					(rightWidth - leftWidth)
			);
	}
	return points.at(-1)[1];
}

async function click(id) {
	await page.getByTestId(id).click();
	await nextTick();
	await renderDOMHead(head);
}

test('fluid ramps, sparse tokens, descending segments, constants, and one/two/five breaks', async () => {
	const cases = {
		ramp: [
			[375, 8],
			[768, 20],
			[1440, 36],
			[1920, 48],
		],
		sparse: [
			[375, 8],
			[1920, 48],
		],
		descending: [
			[375, 48],
			[768, 24],
			[1440, 24],
			[1920, 8],
		],
		'single-break': [[600, 18]],
		'two-breaks': [
			[400, 10],
			[1200, 30],
		],
		'five-breaks': [
			[320, 8],
			[640, 24],
			[960, 16],
			[1280, 16],
			[1600, 32],
		],
	};
	for (const width of [
		320, 375, 480, 640, 767, 768, 769, 960, 1104, 1280, 1439, 1440, 1600,
		1920, 2240,
	]) {
		await page.viewport(width, 900);
		for (const [id, points] of Object.entries(cases))
			length(id, 'padding-left', interpolate(points, width));
		length('fixed', 'padding-left', 12);
		length('zero', 'padding-left', 0);
		length('negative', 'margin-left', -12);
	}
});

test('typography preserves fluid rem sizing, midpoint switches, property overrides, and min/max limits', async () => {
	for (const width of [
		375, 571, 572, 768, 1103, 1104, 1147, 1148, 1440, 1679, 1680, 1920,
		2240,
	]) {
		await page.viewport(width, 900);
		const size = interpolate(
			[
				[375, 24],
				[1920, 48],
			],
			width
		);
		length('typography', 'font-size', size);
		length(
			'typography',
			'line-height',
			size * (width < 1147.5 ? 1.2 : 1.5)
		);
		length(
			'typography',
			'letter-spacing',
			width < 1147.5 ? 0 : size * 0.02
		);
		length('text-min', 'font-size', Math.max(32, size));
		length('text-max', 'font-size', Math.min(36, size));
		expect(css('typography', 'font-weight')).toBe(
			width < 571.5
				? '400'
				: width < 1104
					? '500'
					: width < 1680
						? '700'
						: '900'
		);
		expect(css('typography-override', 'font-weight')).toBe(
			width < 571.5
				? '400'
				: width < 1104
					? '550'
					: width < 1680
						? '700'
						: '900'
		);
		expect(css('typography', 'font-family').replace(/['"]/g, '')).toBe(
			width < 1147.5 ? 'Arial' : 'Times New Roman'
		);
	}
});

test('colors, RGB opacity, nested background scope, and corner utilities', async () => {
	expect(css('on-background', 'color')).toBe('rgb(230, 240, 250)');
	expect(css('nested-background', 'color')).toBe('rgb(200, 210, 220)');
	expect(css('scope-only', 'color')).toBe('rgb(230, 240, 250)');
	expect(css('scope-only', 'background-color')).toBe('rgba(0, 0, 0, 0)');
	expect(css('hex', 'color')).toBe('rgb(18, 52, 86)');
	expect(css('comma', 'color')).toBe('rgb(70, 80, 90)');
	expect(css('opacity', 'background-color')).toBe('rgba(10, 20, 30, 0.5)');
	expect(css('radius', 'border-top-color')).toBe('rgb(100, 110, 120)');
	for (const width of [375, 1000, 1920]) {
		await page.viewport(width, 900);
		const radius = interpolate(
			[
				[375, 4],
				[1920, 20],
			],
			width
		);
		length('radius', 'border-top-left-radius', radius);
		length('radius', 'border-top-right-radius', radius);
		length('radius', 'border-bottom-left-radius', 0);
	}
});

test('layout columns and max cap use live margin and gutter dimensions', async () => {
	for (const width of [375, 768, 1000, 1600, 1920, 2240]) {
		await page.viewport(width, 900);
		const margin = interpolate(
			[
				[375, 16],
				[768, 32],
				[1440, 48],
				[1920, 64],
			],
			width
		);
		const gutter = interpolate(
			[
				[375, 8],
				[768, 16],
				[1440, 24],
				[1920, 32],
			],
			width
		);
		const column = (Math.min(width, 1600) - margin * 2 - gutter * 11) / 12;
		length('columns', 'width', 3 * column + 2 * gutter);
		length(
			'third-columns',
			'width',
			(Math.min(width, 1600) - margin * 2 - gutter * 2) / 3
		);
		length('four-columns', 'width', 4 * column + 3 * gutter);
		length(
			'four-columns',
			'width',
			parseFloat(css('third-columns', 'width'))
		);
		length(
			'fifth-columns',
			'width',
			2 * ((Math.min(width, 1600) - margin * 2 - gutter * 4) / 5) + gutter
		);
		length('fractional-columns', 'width', 2.5 * column + 2 * gutter);
		length('layout-max', 'width', 1600);
	}
});

test('native container queries follow parent width, not viewport, at exact boundaries', async () => {
	await page.viewport(1200, 900);
	for (const width of [398, 398.5, 399, 399.89, 400, 401, 600]) {
		element('query-container').style.width = `${width}px`;
		length('query-named', 'width', width >= 400 ? width / 2 : width);
		length('query-numeric', 'width', width >= 400 ? width / 2 : width);
		length('query-less', 'width', width <= 399.9 ? width : width / 2);
		length('query-named-less', 'width', width <= 399.9 ? width : width / 2);
		length('query-rem', 'width', width >= 400 ? width / 2 : width);
		length('query-rem-less', 'width', width <= 398.4 ? width : width / 2);
		length(
			'query-min-order',
			'width',
			width >= 600 ? width / 3 : width >= 400 ? width / 2 : width
		);
		length(
			'query-max-order',
			'width',
			width <= 399.9 ? width : width <= 599.9 ? width / 2 : width / 3
		);
	}
	element('container-width').value = '500';
	element('container-width').dispatchEvent(new Event('input'));
	await nextTick();
	await page.viewport(700, 900);
	length('query-numeric', 'width', 250);
});

test('playground diagnostics respond to controls and report failed computed styles', async () => {
	await page.viewport(768, 900);
	const check = (name) =>
		element('verification').querySelector(`[data-check="${name}"]`);
	await expect
		.poll(() => check('Motion plugin')?.textContent)
		.toContain('PASS');
	element('container-width').value = '500';
	element('container-width').dispatchEvent(new Event('input'));
	await expect.poll(() => css('query-numeric', 'width')).toBe('250px');
	await expect
		.poll(() => check('Container query')?.textContent)
		.toContain('PASS');
	await click('toggle-reactive');
	await expect
		.poll(() => check('Reactive font size')?.textContent)
		.toContain('32.0px');
	await click('toggle-mounted');
	await expect
		.poll(() => check('Scoped style cleanup')?.textContent)
		.toContain('12.0px');
	expect(css('class-preview', 'background-color')).toBe('rgb(75, 67, 190)');
	await click('toggle-class');
	expect(css('class-preview', 'background-color')).toBe('rgb(255, 255, 255)');
	element('motion').style.transitionDuration = '0s';
	window.dispatchEvent(new Event('resize'));
	await expect
		.poll(() => check('Motion plugin')?.textContent)
		.toContain('FAIL');
	element('motion').style.transitionDuration = '';
	window.dispatchEvent(new Event('resize'));
	await expect
		.poll(() => check('Motion plugin')?.textContent)
		.toContain('PASS');
});

test('named containers target outer ancestor while ordinary queries use nearest container', () => {
	length('query-targeted', 'width', 100);
	length('query-nearest', 'width', 200);
	element('query-outer').style.width = '399px';
	length('query-targeted', 'width', 200);
	length('query-nearest', 'width', 200);
});

test('arbitrary column grids follow in-place layout edits without changing scoped grids', async () => {
	await page.viewport(1000, 900);
	rootOptions.value = {
		config: {
			options: { round: false },
			layout: { margin: 20, gutter: 10, max: 900 },
		},
	};
	const probe = document.createElement('div');
	probe.dataset.testid = 'live-columns';
	probe.className = 'w-1/3col';
	container.append(probe);
	await nextTick();
	await renderDOMHead(head);
	length('live-columns', 'width', (900 - 40 - 20) / 3);
	const scopedWidth = parseFloat(css('third-columns', 'width'));
	for (const expanded of [true, false, true]) {
		const layout = rootOptions.value.config.layout;
		layout.margin = expanded ? 40 : 20;
		layout.gutter = expanded ? 20 : 10;
		layout.max = expanded ? 800 : 900;
		await nextTick();
		await renderDOMHead(head);
		length(
			'live-columns',
			'width',
			(layout.max - layout.margin * 2 - layout.gutter * 2) / 3
		);
		length('third-columns', 'width', scopedWidth);
	}
	rootOptions.value.config.layout.max = undefined;
	await nextTick();
	await renderDOMHead(head);
	length('live-columns', 'width', (1000 - 80 - 40) / 3);
	rootOptions.value.config.options.viewportWidth = '800px';
	await nextTick();
	await renderDOMHead(head);
	length('live-columns', 'width', (800 - 80 - 40) / 3);
});

test('project plugins wrap defaults, add utilities, and disable sections', () => {
	const styles = text('verification-base');
	expect(styles).toContain('@layer verification');
	expect(styles).toContain('--playground-spacing-plugin: 1;');
	expect(styles).toContain('--theme-spacing-testRamp--tablet: 20px;');
	expect(document.head.textContent).not.toContain('testDisabled');
	expect(css('motion', 'transition-duration')).toBe('0.12s');
	expect(styles).toContain('\n');
	expect(styles).toContain('100dvw');
});

test('partial themes retain untouched endpoints and emit no unrelated sections', async () => {
	for (const width of [375, 600, 768, 1000, 1440, 1920]) {
		await page.viewport(width, 900);
		length(
			'partial',
			'padding-left',
			interpolate(
				[
					[375, 8],
					[768, 40],
					[1440, 36],
					[1920, 48],
				],
				width
			)
		);
	}
	expect(text('verification-partial')).toContain(
		'--theme-spacing-testRamp--sm: 8px;'
	);
	expect(text('verification-partial')).not.toContain('--theme-colors');
	expect(text('verification-partial')).not.toContain('--theme-fontSize');
	expect(css('partial', 'background-color')).toBe('rgb(10, 20, 30)');
});

test('rounding applies where supported and retains unrounded fallback', () => {
	length(
		'rounded',
		'padding-left',
		CSS.supports('padding', 'round(1%, 2px)') ? 14 : 13.25
	);
	expect(text('verification-rounded')).toContain(
		'--theme-spacing-testFixed: 13.25px;'
	);
	expect(text('verification-rounded')).toContain('@supports');
	expect(text('verification-rounded')).not.toContain(
		'--theme-spacing-testFixed--'
	);
});

test('reactive config replaces CSS without leaking tags or changing other instances', async () => {
	await page.viewport(768, 900);
	length('reactive', 'padding-left', 22);
	length('reactive', 'font-size', 20);
	expect(css('reactive', 'background-color')).toBe('rgb(30, 40, 50)');
	expect(styles('verification-reactive')).toHaveLength(1);
	for (let index = 0; index < 4; index++) {
		await click('toggle-reactive');
		length('reactive', 'padding-left', index % 2 === 0 ? 44 : 22);
		length('reactive', 'font-size', index % 2 === 0 ? 32 : 20);
		length('reactive', 'line-height', index % 2 === 0 ? 48 : 24);
		expect(css('reactive', 'font-weight')).toBe(
			index % 2 === 0 ? '800' : '400'
		);
		expect(css('reactive', 'background-color')).toBe(
			index % 2 === 0 ? 'rgb(90, 100, 110)' : 'rgb(30, 40, 50)'
		);
		expect(styles('verification-reactive')).toHaveLength(1);
		length('ramp', 'padding-left', 20);
	}
});

test('named themes switch repeatedly without stale base, scoped, class, or print values', async () => {
	await page.viewport(1920, 900);
	// Fixture components own the global theme-class selectors.
	rootOptions.value.useThemeClasses = false;
	for (const name of ['print', 'default', 'print', 'default']) {
		rootOptions.value.config = name;
		await nextTick();
		await renderDOMHead(head);
		const print = name === 'print';
		expect(css('header', 'background-color')).toBe(
			print ? 'rgb(255, 255, 255)' : 'rgb(75, 67, 190)'
		);
		length('header', 'padding-left', print ? 0 : 124);
		length('ramp', 'padding-left', 48);
		expect(css('theme-class', 'background-color')).toBe('rgb(60, 70, 80)');
		await commands.setMedia('print');
		expect(css('header', 'background-color')).toBe('rgb(255, 255, 255)');
		length('header', 'padding-left', 0);
		await commands.setMedia('screen');
	}
});

test('grouped transformed files load and switch as a runtime theme', async () => {
	await page.viewport(768, 900);
	const probe = document.createElement('p');
	probe.dataset.testid = 'token-source';
	probe.className = 'p-testRamp';
	container.append(probe);
	for (const name of ['tokenBundle', 'default', 'tokenBundle']) {
		rootOptions.value.config = name;
		await nextTick();
		await renderDOMHead(head);
		length(
			'token-source',
			'padding-left',
			name === 'tokenBundle' ? 28 : 20
		);
	}
});

test('in-place theme edits refresh typography while merged subtheme classes stay isolated', async () => {
	await page.viewport(768, 900);
	rootOptions.value = {
		config: {
			options: { round: false },
			fontSize: {
				testHeading: { fontSize: 18, fontWeight: 400, lineHeight: 1.2 },
			},
			spacing: { testRamp: 22 },
			backgroundColors: { testPanel: [30, 40, 50] },
		},
		useThemeClasses: ['citiDefault'],
		mergeThemeClassesWithBaseConfig: true,
		media: { print: 'print' },
	};
	const probe = document.createElement('p');
	probe.dataset.testid = 'live-theme';
	probe.className = 'text-testHeading p-testRamp bg-testPanel';
	container.append(probe);
	await nextTick();
	await renderDOMHead(head);
	length('live-theme', 'font-size', 18);
	length('live-theme', 'padding-left', 22);
	expect(css('live-theme', 'font-weight')).toBe('400');
	for (let index = 0; index < 4; index++) {
		const expanded = index % 2 === 0;
		probe.classList.add('u-theme-citiDefault');
		const before = getComputedStyle(probe).fontSize;
		rootOptions.value.config.fontSize.testHeading.fontSize = expanded
			? 30
			: 18;
		rootOptions.value.config.fontSize.testHeading.fontWeight = expanded
			? 800
			: 400;
		rootOptions.value.config.fontSize.testHeading.lineHeight = expanded
			? 1.5
			: 1.2;
		rootOptions.value.config.spacing.testRamp = expanded ? 44 : 22;
		rootOptions.value.config.backgroundColors.testPanel[0] = expanded
			? 90
			: 30;
		await nextTick();
		await renderDOMHead(head);
		expect(getComputedStyle(probe).fontSize).toBe(before);
		expect(css('live-theme', 'background-color')).toBe('rgb(10, 20, 30)');
		length('live-theme', 'padding-left', 20);
		probe.classList.remove('u-theme-citiDefault');
		length('live-theme', 'font-size', expanded ? 30 : 18);
		length('live-theme', 'line-height', expanded ? 45 : 21.6);
		length('live-theme', 'padding-left', expanded ? 44 : 22);
		expect(css('live-theme', 'font-weight')).toBe(expanded ? '800' : '400');
		expect(css('live-theme', 'background-color')).toBe(
			expanded ? 'rgb(90, 40, 50)' : 'rgb(30, 40, 50)'
		);
		length('reactive', 'font-size', 20);
		length('ramp', 'padding-left', 20);
	}
});

test('unmount removes scoped styles and remount restores them', async () => {
	length('mounted', 'padding-left', 28);
	expect(styles('verification-mounted')).toHaveLength(1);
	await click('toggle-mounted');
	expect(styles('verification-mounted')).toHaveLength(0);
	length('mounted', 'padding-left', 12);
	await click('toggle-mounted');
	expect(styles('verification-mounted')).toHaveLength(1);
	length('mounted', 'padding-left', 28);
});

test('component-exposed configs belong to their own instances', async () => {
	expect(JSON.parse(element('exposed-base').textContent)).toEqual({
		375: 8,
		768: 20,
		1440: 36,
		1920: 48,
	});
	expect(JSON.parse(element('exposed-partial').textContent)).toEqual({
		768: 40,
	});
	await click('toggle-reactive');
	await click('toggle-mounted');
	expect(JSON.parse(element('exposed-base').textContent)['768']).toBe(20);
	expect(JSON.parse(element('exposed-partial').textContent)).toEqual({
		768: 40,
	});
});

test('baseFontSize preserves em thresholds while custom viewport expressions drive scaling', async () => {
	for (const width of [375, 383, 384, 480, 800, 1200, 1920, 2400]) {
		await page.viewport(width, 900);
		expect(css('em-threshold', 'font-weight')).toBe(
			width < 384 ? '400' : '700'
		);
		length(
			'em-threshold',
			'font-size',
			interpolate(
				[
					[256, 16],
					[512, 32],
				],
				width
			)
		);
		length(
			'custom-viewport',
			'padding-left',
			interpolate(
				[
					[400, 10],
					[1200, 30],
				],
				width / 2
			)
		);
	}
	element('custom-viewport').style.setProperty(
		'--verification-width',
		'800px'
	);
	length('custom-viewport', 'padding-left', 20);
	expect(text('verification-em')).toContain('@media (min-width: 24em)');
	expect(text('verification-em')).not.toContain(
		'--theme-fontSize-testHeading--'
	);
});

test('merged theme classes retain base values and media declarations target print', async () => {
	await page.viewport(768, 900);
	expect(css('theme-class', 'background-color')).toBe('rgb(60, 70, 80)');
	length('theme-class', 'padding-left', 20);
	expect(css('header', 'background-color')).toBe('rgb(75, 67, 190)');
	const printStyles = document.querySelectorAll('style[media="print"]');
	expect(printStyles.length).toBeGreaterThan(0);
	expect(
		[...printStyles].some((style) =>
			style.textContent.includes(
				'--theme-colors-background-primary: 255 255 255;'
			)
		)
	).toBe(true);
});

test('print media switches computed theme values and restores screen styles', async () => {
	await page.viewport(1920, 900);
	length('header', 'padding-left', 124);
	await commands.setMedia('print');
	expect(css('header', 'background-color')).toBe('rgb(255, 255, 255)');
	length('header', 'padding-left', 0);
	await commands.setMedia('screen');
	expect(css('header', 'background-color')).toBe('rgb(75, 67, 190)');
	length('header', 'padding-left', 124);
});

test('runtime getters, app.config sources, subsets, and clear/reload work', async () => {
	const initial = JSON.parse(element('runtime-api').textContent);
	expect(initial.available).toEqual([
		'citiDefault',
		'default',
		'print',
		'tokenBundle',
	]);
	expect(Object.keys(initial.subset)).toEqual(['spacing']);
	expect(initial.subset.spacing.testRamp['768']).toBe(20);
	await click('reload-theme');
	await expect
		.poll(() => JSON.parse(element('runtime-api').textContent))
		.toMatchObject({
			cleared: true,
			unloaded: true,
			asyncLoaded: true,
			reloaded: true,
		});
	expect(warn.mock.calls).toEqual([
		[
			'Theme "print" not preloaded. Use getThemeConfigurationAsync() for loading.',
		],
	]);
	warn.mockClear();
});
