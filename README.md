# Theme Configuration

Theme Configuration is a Nuxt layer/package for generating responsive theme CSS custom properties and utility-friendly design tokens from one or more theme config files.

It includes:

- The global `ThemeConfiguration` component that injects runtime theme CSS.
- Auto-loaded theme configs from files and/or `app.config`.
- Sync and async utility functions for reading theme configs.
- UnoCSS helper functions for generating theme tokens and rules.
- Tailwind helper functions for generating theme tokens/plugins.
- Min/max text size utility rules: `text-min-*` and `text-max-*`.

## Requirements

- Nuxt 3+
- UnoCSS module enabled (`@unocss/nuxt`)

## Installation

```bash
yarn add @limbo-works/theme-configuration
```

Extend the layer in your Nuxt config:

```ts
export default defineNuxtConfig({
	extends: ['@limbo-works/theme-configuration'],
});
```

## Quick Start

Create one or more theme files:

- `~/assets/js/theme-configuration.default.js`
- `~/assets/js/theme-configuration.print.js`
- `~/assets/js/theme-configuration.brand-a.js`

Then add the component once in your app (for example in `app.vue` or a top-level layout):

```vue
<template>
	<ThemeConfiguration
		config="default"
		:media="{ print: 'print' }"
		:use-theme-classes="true"
		css-layer="theme"
	/>

	<NuxtPage />
</template>
```

Only one instance is typically needed per page/app root.

## Theme Sources

Themes can come from:

1. Files matching `~/assets/js/theme-configuration.*.(js|cjs|mjs)`
2. `app.config.ts` through `themeConfiguration.themes`

### app.config themes

```ts
export default defineAppConfig({
	themeConfiguration: {
		themes: [
			// by import path
			'~/assets/js/theme-configuration.default.js',

			// by object with explicit name
			{ name: 'print', path: '~/assets/js/theme-configuration.print.js' },

			// direct inline theme object
			{
				name: 'campaign',
				theme: {
					baseFontSize: 16,
					smViewport: 375,
					mdViewport: 1440,
					lgViewport: 1920,
					layout: {
						margin: { sm: 16, md: 32, lg: 48 },
						gutter: { sm: 16, md: 24, lg: 32 },
						columns: { sm: 4, md: 8, lg: 12 },
					},
				},
			},
		],
	},
});
```

## ThemeConfiguration Component

### Props

- `config`: `string | object`
    - String: resolves a named theme.
    - Object: uses the object directly.
    - Omitted: defaults to `default` theme if available.
- `media`: `Record<string, string | object>`
    - Key is media query (example: `print`, `(prefers-color-scheme: dark)`).
    - Value is a theme name or theme object used for that media query.
- `useThemeClasses`: `boolean | string[]`
    - `true`: generates `.u-theme-{name}` classes for all available themes (except the currently active base theme).
    - `string[]`: generates classes only for listed theme names.
- `mergeThemeClassesWithBaseConfig`: `boolean` (default: `false`)
    - `false`: theme classes include only each class theme values.
    - `true`: each class is generated from base config merged with class theme values (larger CSS, more isolated result).
- `cssLayer`: `string`
    - Wraps generated output in `@layer <name> { ... }`.

### Slot

- Default slot only.

### Exposed

- `config`: observed/active computed config object.

## Generated CSS Behavior

The component generates CSS custom properties (variables) on `:root` and optionally on theme classes.

Main categories:

- Colors (`colors`, plus `*Colors` groups)
- Layout (`layout.margin`, `layout.gutter`, `layout.columns`, `layout.max`)
- Typography (`fontSize`, `fontFamily`, `fontWeight`, `fontStyle`, `lineHeight`, `letterSpacing`, `textCase`, `textDecoration`, `paragraphIndent`, `paragraphSpacing`)
- Spacing (`spacing`, `horizontalSpacing`, `verticalSpacing`)
- Border radius (`borderRadius`)

Useful config options:

- `minify`: compact CSS output.
- `round`: wraps generated values in CSS `round()` support blocks.
- `disableBreakpointSpecificCustomProperties`: skips generation of `--sm/--md/--lg` property variants.
- `baseFontSize`, `smViewport`, `mdViewport`, `lgViewport`, `viewportWidth`: control fluid scaling behavior.

## UnoCSS Integration

This package includes helpers in `assets/js/helpers.uno.js`:

- `makeThemeUtilities(config)`
- `makeRules(config)`

Example:

```ts
import { defineConfig } from 'unocss';
import { makeThemeUtilities, makeRules } from '@limbo-works/theme-configuration/assets/js/helpers.uno.js';
import defaultTheme from './assets/js/theme-configuration.default.js';

export default defineConfig({
	theme: {
		...makeThemeUtilities(defaultTheme),
	},
	rules: [
		...makeRules(defaultTheme),
	],
});
```

Generated/extended utility behavior includes:

- Color utilities (`text-*`, `bg-*`, `border-*`) mapped to theme variables.
- Background scope utility (`bg-scope-*`) for on-background color variable scoping.
- Layout/spacing utilities from token keys.
- Column width utilities like `w-3/12col` (from `layout.columns`).
- Typography token utility classes (`text-h1`, etc.).
- Border radius utilities from theme tokens.

## Text Clamp Rules: text-min-* and text-max-*

The UnoCSS helper supports explicit font-size constraints using CSS variables consumed by `text-*` utilities.

### Supported forms

- Theme token name:
    - `text-min-h3`
    - `text-max-body2`
- Pixel number:
    - `text-min-24` (24px)
    - `text-max-64` (64px)
- Arbitrary value:
    - `text-min-[1rem]`
    - `text-max-[clamp(20px,2vw,48px)]`
- Reset:
    - `text-min-unset` resets to `0px`
    - `text-max-unset` resets to `9999px`

### Example

```html
<h1 class="text-h1 text-min-24 text-max-h3">
	Fluid heading with explicit min/max limits
</h1>
```

### Notes

- Use them together with a `text-*` font-size utility.
- `text-*` utilities initialize `--minFontSize` and `--maxFontSize`, and `text-min-*` / `text-max-*` override those values on the same element.

## Tailwind Integration Helpers

For Tailwind-based setups, helper functions are available in `assets/js/helpers.tailwind.js`:

- `makeThemeUtilities(config)`
- `makeThemePlugins(config)`

These can be used to map theme tokens and generate text style plugin utilities.

## Runtime Theme Access API

The Nuxt plugin provides `$themeConfigurations` on the app instance.

Capabilities:

- Access loaded themes by key.
- `$loadTheme(name)` async lazy load.
- `$loadThemeSync(name)` read loaded theme only.
- `$getAvailableThemes()` list available theme names.
- `$isThemeLoaded(name)` boolean check.
- `$clearTheme(name)` clear one cached theme.
- `$clearAllThemes()` clear all cached themes.
- `$destroy()` cleanup/destroy theme system.

## Utility Functions

These are available in the layer/app context and can be imported directly if needed.

### getThemeConfigurations()

Returns all currently loaded theme configurations as an object keyed by theme name.

```ts
const themes = getThemeConfigurations();
```

### getThemeConfigurationsAsync()

Returns available theme loaders keyed by theme name.

```ts
const loaders = await getThemeConfigurationsAsync();
```

### getThemeConfiguration(theme, subset?)

Reads a single theme synchronously.

- `theme`: string theme name or direct object.
- `subset` (optional): filter structure (see below).

```ts
const full = getThemeConfiguration('default');
const onlyColors = getThemeConfiguration('default', 'colors');
```

### getThemeConfigurationAsync(theme, subset?)

Async version that can load a theme when not yet loaded.

```ts
const config = await getThemeConfigurationAsync('print');
```

### getThemeConfigurationSubset(object, subset)

Subset filter helper used by sync/async getters.

Supported subset types:

- `string`: one key.
- `string[]`: several direct keys.
- `RegExp`: matching keys.
- `object`: recursive selector object.

Object selectors also support regex-like keys in string form (`/pattern/flags`).

Examples:

```ts
getThemeConfiguration('default', 'colors');
getThemeConfiguration('default', ['layout', 'fontSize']);
getThemeConfiguration('default', /color/i);
getThemeConfiguration('default', {
	layout: { margin: true, gutter: true },
	'/.*Colors$/': true,
});
```

## Configuration Shape Example

```js
export default {
	minify: false,
	round: '1px',
	disableBreakpointSpecificCustomProperties: false,

	baseFontSize: 16,
	smViewport: 375,
	mdViewport: 1440,
	lgViewport: 1920,
	viewportWidth: '100dvw',

	layout: {
		margin: { sm: 16, md: 32, lg: 48 },
		gutter: { sm: 16, md: 24, lg: 32 },
		columns: { sm: 4, md: 8, lg: 12 },
		max: 1440,
	},

	colors: {
		onSurface: [33, 33, 33],
	},
	backgroundColors: {
		surface: [255, 255, 255],
		primary: [75, 67, 190],
	},
	textColors: {
		onPrimary: [255, 255, 255],
	},
	borderColors: {
		onSurfaceSubtle: [205, 206, 218],
	},

	spacing: {
		md: { sm: 16, md: 24, lg: 32 },
	},
	horizontalSpacing: {
		'md/h': { sm: 16, md: 24, lg: 32 },
	},
	verticalSpacing: {
		'md/v': { sm: 16, md: 24, lg: 32 },
	},

	borderRadius: {
		md: { sm: 8, md: 12, lg: 16 },
	},

	fontSize: {
		h1: {
			fontSize: { sm: 32, md: 48, lg: 64 },
			lineHeight: { sm: 1.1, md: 1.1, lg: 1.1 },
			letterSpacing: { sm: 0, md: 0, lg: 0 },
			fontWeight: { sm: 700, md: 700, lg: 700 },
		},
	},
};
```

## Notes

- Keep a single authoritative default theme with all keys you want utilities generated for.
- Override themes should primarily override values, not introduce entirely new token structures late.
