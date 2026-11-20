import { test } from 'vitest';
import { createJiti } from 'jiti';
import { createGenerator, presetMini } from 'unocss';

const jiti = createJiti(import.meta.url);
const { generateThemeCss, mergeThemeConfigs } = await jiti.import(
	'../src/runtime/shared/theme-engine.ts'
);
const { makeUnoTheme } = await jiti.import(
	'../src/runtime/shared/helpers.uno.ts'
);
const points = (start) => ({ 320: start, 640: start + 8, 1280: start + 24 });
const theme = {
	options: { namedBreaks: { phone: 320, tablet: 640, desktop: 1280 } },
	spacing: {},
	fontSize: {},
	fontStyles: {},
	fontWeight: {},
	lineHeight: {},
	letterSpacing: {},
	backgroundColors: {},
	colors: {},
};
const override = { spacing: {}, fontWeight: {} };
for (let index = 0; index < 100; index++) {
	const name = `token${index}`;
	theme.spacing[name] = points(8);
	theme.fontStyles[name] = { fontSize: { 320: 14 }, fontStyle: 'normal' };
	theme.fontSize[name] = {
		fontSize: points(16),
		fontWeight: { 320: 400, 1280: 700 },
	};
	theme.fontWeight[name] = { 640: 500 };
	theme.lineHeight[name] = { 320: 1.2, 1280: 1.5 };
	theme.letterSpacing[name] = { 320: 0, 1280: '2%' };
	override.spacing[name] = { 640: 40 };
	override.fontWeight[name] = { 1280: 900 };
}
const classes = [];
for (let index = 0; index < 24; index++) {
	theme.backgroundColors[`panel${index}`] = [index, 20, 30];
	theme.colors[`onPanel${index}Contrast`] = [240, 240, 240];
	classes.push(`bg-panel${index}`, `bg-scope-panel${index}`);
}
const tokens = classes.join(' ');
const options = { time: 300, warmupTime: 100, iterations: 10 };

test('merge 100 partial tokens', async ({ bench }) => {
	await bench('merge partial theme', () =>
		mergeThemeConfigs(theme, override)
	).run(options);
});

test('compile 100 typography/spacing tokens', async ({ bench }) => {
	await bench('compile theme CSS', () =>
		generateThemeCss(theme, { baseConfig: theme })
	).run(options);
});

test('generate UnoCSS config with 24 backgrounds', async ({ bench }) => {
	await bench('generate UnoCSS config', () => makeUnoTheme(theme)).run(
		options
	);
});

test('build fresh UnoCSS stylesheet with on-background colors', async ({
	bench,
}) => {
	await bench('build fresh UnoCSS stylesheet', async () => {
		const uno = await createGenerator({
			presets: [presetMini()],
			...makeUnoTheme(theme),
		});
		await uno.generate(tokens);
	}).run(options);
});
