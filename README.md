# Theme Configuration

Theme Configuration is a Nuxt module for generating responsive theme CSS custom properties and utility-friendly design tokens from one or more theme config files.

This README describes the upcoming v5 module. Until v5 is released, installing the latest published package may install v4; use the documentation for your installed version.

It includes:

- The global `ThemeConfiguration` component that injects runtime theme CSS.
- The `useThemeConfiguration` composable, which can also scope a theme to a selector.
- Auto-loaded theme configs from files and/or `app.config`.
- Sync and async utility functions for reading theme configs.
- UnoCSS helper functions for generating theme tokens and rules.
- Min/max text size utility rules: `text-min-*` and `text-max-*`.

## Contents

- [Installation](#installation)
- [Breaking changes in v5](#breaking-changes-in-v5)
- [Quick start](#quick-start)
- [Theme sources](#theme-sources)
- [Component API](#themeconfiguration-component)
- [Scoped and reactive themes](#scoping-a-theme-to-a-class)
- [Options, interpolation, and breakpoint inheritance](#generated-css-behavior)
- [Built-in sections](#built-in-section-reference)
- [Project rule plugins](#project-rule-plugins)
- [UnoCSS integration and autocomplete](#unocss-integration)
- [Text size limits](#text-clamp-rules-text-min-_-and-text-max-_)
- [Runtime access](#runtime-theme-access-api)
- [Utility functions](#utility-functions)
- [TypeScript and public imports](#typescript-and-public-imports)
- [Configuration example](#configuration-shape-example)
- [Troubleshooting](#troubleshooting)
- [Migration from v4 to v5](#migration-from-v4-to-v5)
- [Performance](#performance)
- [Testing](#testing)

## Requirements

- Nuxt 4+ for the component, composable, module, and runtime getters.
- Optional: UnoCSS 66.x and `@unocss/nuxt` for automatic utility generation. CSS variables work without UnoCSS.
- Standalone UnoCSS helpers do not require a Nuxt application; see [UnoCSS Integration](#unocss-integration).

## Installation

```bash
yarn add @limbo-works/theme-configuration
```

For automatic UnoCSS integration, also install `unocss`, `@unocss/nuxt`, and `@unocss/preset-mini` at compatible 66.x versions:

```bash
yarn add unocss@^66 @unocss/nuxt@^66 @unocss/preset-mini@^66
```

CSS-variable-only projects can omit UnoCSS entirely and register only `@limbo-works/theme-configuration`.

Register the module and, optionally, set module-wide defaults in `nuxt.config`. Every theme inherits these; a theme's own `options` win over them:

```ts
export default defineNuxtConfig({
	modules: ['@unocss/nuxt', '@limbo-works/theme-configuration'],
	themeConfiguration: {
		minify: false,
		round: '1px',
		baseFontSize: 16,
		namedBreaks: { sm: 375, md: 1440, lg: 1920 },
	},
});
```

Precedence: active theme `options` > inherited default-theme options > `themeConfiguration` module options > built-in defaults. A supplied `namedBreaks` map replaces the entire inherited map; its entries are sorted by width.

When `@unocss/nuxt` is installed and registered, this module automatically adds tokens and plugin utility rules from the selected UnoCSS theme (`default` unless `sources.unoTheme` is set). Keep your UnoCSS presets, but remove manual `makeRules`/`makeThemeUtilities` calls. Explicit UnoCSS config wins over generated theme values and rules. Set `themeConfiguration.uno: false` to opt out.

## Breaking changes in v5

- Packaged as a Nuxt module instead of a layer. Replace `extends: ['@limbo-works/theme-configuration']` with `modules: [...]`.
- UnoCSS is no longer installed by this package; add `@unocss/nuxt` yourself.
- Tailwind helpers (`helpers.tailwind.ts`) are removed.
- The `background` section and rule export are removed. Use `backgroundColors` for colors; author gradients/images directly in project CSS or a project rule.
- `horizontalSpacing` and `verticalSpacing` are removed; use `spacing`.
- Column counts are no longer configured. Remove `layout.columns`; each `X/Ycol` utility chooses its own denominator. Old `--theme-layout-column--<break>` and `--theme-layout-column-of-N` variables are removed.
- Only the new theme format is accepted: settings under `options`, responsive values keyed by configured breakpoint names or numeric viewport widths.
- Any positive number of named breaks is supported, not just `sm`, `md`, and `lg`.
- `options.handlers` is replaced by project rule plugins.
- Invalid legacy input and unregistered sections now fail explicitly. Missing theme names passed to the component/composable throw; getters retain their warning/`undefined` behavior.
- Responsive calculations support sparse and decreasing tokens and use revised precision/font-size formulas. Identically named tokens do not guarantee pixel-identical rendering after migration.
- Generated responsive width queries use `min-width` without a `screen` restriction, so they can also apply in print. Thresholds remain `em`-based.

See [Migration from v4 to v5](#migration-from-v4-to-v5) for a step-by-step guide.

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

For UnoCSS utilities, keep an appropriate preset in `uno.config.ts`:

```ts
import { defineConfig, presetMini } from 'unocss';

export default defineConfig({
	presets: [presetMini()],
});
```

The module supplies tokens/rules, not a preset. Existing project presets can replace `presetMini()`.

## Theme Sources

Themes can come from:

1. Files matching `~/assets/js/theme-configuration.<name>.<extension>`, with `js`, `cjs`, `mjs`, `ts`, `cts`, or `mts` extensions.
2. `app.config.ts` through `themeConfiguration.themes`

`~` refers to Nuxt's source directory. Use a default-exported theme object. File theme names may contain letters, numbers, underscores, and hyphens; for example, `theme-configuration.brand-a.ts` becomes `brand-a`. Discovery order is deterministic; later matching files/sources win when names collide.

The `default` theme supplies the base values inherited by component/composable overrides and, unless `sources.unoTheme` selects another theme, the token names used for automatic UnoCSS generation. Other themes need only specify their differences. A missing default theme means an empty base; components can still receive explicit theme objects.

### Configuring file sources

`themeConfiguration.sources` customizes discovery. Default discovery remains enabled unless `includeDefault: false`. Each entry accepts `paths` (directories, files, and/or glob patterns relative to Nuxt's source directory; absolute paths and Nuxt aliases also work). A directory uses `theme-configuration.*.{js,cjs,mjs,ts,cts,mts}` unless `files` supplies filename glob(s). Direct file paths and globs match exactly what you specify, including JSON.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
	modules: ['@unocss/nuxt', '@limbo-works/theme-configuration'],
	themeConfiguration: {
		sources: {
			// true by default; set false to replace the conventional assets/js source
			includeDefault: true,
			// Optional: use this theme's tokens for automatic UnoCSS generation.
			// Does not rename it or change the runtime default theme.
			unoTheme: 'light',
			entries: [
				{
					paths: ['~/assets/generated/tokens'],
					files: 'main-*.json',
					namePattern: '^main-(?<name>[a-zA-Z0-9_-]+)\\.json$',
					transform: './theme/transform-tokens.ts',
				},
			],
		},
	},
});
```

Without `namePattern`, conventional filenames retain `theme-configuration.<name>` naming; other filenames use their basename without the final extension (`main-light.json` → `main-light`). `namePattern` is a JavaScript regular-expression string matched against each filename: use a named `name` capture or first capture. Nonmatching files are skipped. Derived names must contain only letters, digits, underscores, and hyphens. To map an individual file to another name, use an entry with `name`.

Sources are processed in order after the optional default source. Globs return sorted matches; explicit paths retain their order. When multiple files derive the same name without grouping, the later file wins. Later sources override earlier sources and discovered file themes override same-named `app.config` entries, preserving existing precedence. A missing explicit path, invalid pattern/name, failed import/transform, invalid transformed theme, or missing explicitly selected UnoCSS theme fails clearly. A glob matching no files emits a warning.

### Transforming one or multiple token files

Each transformer runs **at Nuxt build/dev startup**, not per request. It receives an array of `{ path, data }` (absolute file path and imported default export/JSON contents), and `{ name }`. Return a valid new-format theme object, or a promise of one. Without `name`, it runs separately for each file; `name` groups all files matched by that entry into one theme. Grouping more than one file requires a transformer.

```ts
// theme/transform-tokens.ts
import type { ThemeSourceTransformer } from '@limbo-works/theme-configuration/types';

const transform: ThemeSourceTransformer = (files, { name }) => {
	// Interpret and validate your TokenTransformer output here.
	// Its shape is project-specific; it is not automatically converted.
	const data = files[0]?.data;
	if (!data || typeof data !== 'object' || !('spacing' in data))
		throw new Error(`Invalid tokens for ${name}`);
	const spacing = data.spacing;
	if (
		!spacing ||
		typeof spacing !== 'object' ||
		Array.isArray(spacing) ||
		!Object.values(spacing).every(
			(value) => typeof value === 'number' && Number.isFinite(value)
		)
	)
		throw new Error(`Invalid spacing for ${name}`);
	return { spacing: Object.fromEntries(Object.entries(spacing)) };
};
export default transform;
```

Inline functions in `nuxt.config` also work. This complete example combines two simple JSON files: `colors.json` contains `{"primary": [12, 34, 56]}` and `spacing.json` contains `{"testRamp": 28}`. It validates that particular shape; adapt it to the actual TokenTransformer output.

```ts
// nuxt.config.ts
import { isRecord } from '@limbo-works/theme-configuration/config';

export default defineNuxtConfig({
	modules: ['@limbo-works/theme-configuration'],
	themeConfiguration: {
		sources: {
			entries: [
				{
					paths: [
						'assets/generated/tokens/colors.json',
						'assets/generated/tokens/spacing.json',
					],
					name: 'default',
					transform: (files) => {
						const colors = files.find((file) =>
							file.path.endsWith('/colors.json')
						)?.data;
						const spacing = files.find((file) =>
							file.path.endsWith('/spacing.json')
						)?.data;
						if (
							!isRecord(colors) ||
							!Array.isArray(colors.primary) ||
							colors.primary.length !== 3 ||
							!colors.primary.every(
								(value) =>
									typeof value === 'number' &&
									Number.isFinite(value)
							) ||
							!isRecord(spacing) ||
							typeof spacing.testRamp !== 'number' ||
							!Number.isFinite(spacing.testRamp)
						) {
							throw new Error('Invalid color or spacing tokens');
						}
						return {
							backgroundColors: {
								primary: colors.primary.map(Number),
							},
							spacing: { testRamp: spacing.testRamp },
						};
					},
				},
			],
		},
	},
});
```

Transformed results must contain only JSON-compatible plain objects, arrays, and finite numbers; functions, cycles, and class instances are rejected. The generated registry bundles those results for both SSR and client. Never put secrets in theme data. Source files without transformers remain normal bundled module imports.

Restart Nuxt dev after adding/removing matched files, changing source configuration, transformers, or transformed inputs. UnoCSS inventories and transformed snapshots are generated at startup/build and do not automatically refresh in a running Nuxt process. Existing reactive theme switching and live component overrides still work; they do not rerun source transformers.

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
					options: {
						baseFontSize: 16,
					},
					layout: {
						margin: { 375: 16, 1440: 32, 1920: 48 },
						gutter: { 375: 16, 1440: 24, 1920: 32 },
					},
				},
			},
		],
	},
});
```

An explicit `name` gives an app-config entry a stable lookup key. Without one, a recognized `theme-configuration.<name>.*` filename supplies the name; otherwise the path is the key. Inline entries should always specify `name`.

File sources and app-config entries are combined, with discovered local files taking precedence on name collisions. Use discoverable local files for path-based entries so Vite can bundle them; arbitrary dynamic import paths are not guaranteed to resolve in a production browser build.

At startup the runtime plugin asynchronously preloads **all** registered themes. Loading/validation failures are logged and rethrown, not replaced with an empty successful theme. The async loading API is also available after clearing a cached theme; initial startup is not lazy.

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
    - `true`: generates `.u-theme-{name}` classes for all available themes, except the selected named base theme (or `default` when `config` is omitted).
    - `string[]`: generates classes only for listed theme names.
    - Without a custom `selector`, base CSS also targets `.u-theme` and the selected named theme's class, in addition to `:root`.
- `mergeThemeClassesWithBaseConfig`: `boolean`
    - `false`: emits only tokens selected by each class theme; unspecified tokens inherit through CSS.
    - `true`: merges class values over the active base, retaining the base's section/token inventory. New class-only token keys are ignored in this mode.
    - When omitted, defaults to `false` if `partial` is omitted or `true`, and `true` if `partial` is explicitly `false`. Set this prop explicitly when class isolation matters.
- `cssLayer`: `string`
    - Wraps generated output in `@layer <name> { ... }`.
- `selector`: `string`
    - Replaces the base selector (`:root` by default). Additional theme classes still use their own `.u-theme-{name}` selectors; this does not namespace them beneath the custom selector.
- `partial`: `boolean` (omitted behaves as `false` for base output)
    - `false`: emits the full theme merged over `default`.
    - `true`: emits only supplied tokens, while still inheriting options and unmodified endpoints of those tokens.
- `styleTagId`: `string`
    - Custom base identifier for generated head style tags. Updates may add an iteration suffix. Use distinct identifiers for independent instances.

### Slot

- Default slot only, rendered without an extra wrapper element. CSS is registered through Nuxt/Unhead rather than inserted beside the slot.

### Exposed

- `config`: this instance's computed config object; full merged data normally, supplied overrides only with `partial: true`. Access through a Vue component ref, not an internal module import.

### Media themes and theme classes

`media` creates separate `<style media="...">` entries for the supplied media queries. Each media theme emits its selected overrides, using the active base's options and endpoints where not explicitly replaced. Other base declarations remain in effect. With theme classes enabled, media overrides also target the included theme-class selectors.

Apply a generated class to an element to switch it and its descendants:

```html
<section class="u-theme-brand-a bg-surface">...</section>
```

Media themes, `partial`, and `useThemeClasses` change emitted CSS; they do not create new UnoCSS utility names. Keep all required names in the selected UnoCSS theme (`default` unless `sources.unoTheme` is set).

## Scoping a theme to a class

`useThemeConfiguration` is what the `ThemeConfiguration` component uses internally. It takes the same options as the component's props, including `selector`. Call it in a Vue/Nuxt setup context. A custom selector receives the theme's CSS variables instead of `:root`, so matching elements and their descendants use those values.

```vue
<script setup lang="ts">
useThemeConfiguration({
	selector: '.promo-theme',
	config: {
		backgroundColors: { surface: [75, 67, 190] },
	},
});
</script>

<template>
	<section class="promo-theme bg-surface">...</section>
</template>
```

Options:

- `selector`: any CSS selector (for example `.promo-theme`).
- `config`: theme name or theme object. Merged over the `default` theme, so partial overrides are fine.
- `cssLayer`: wraps the output in `@layer <name> { ... }`.
- `partial`: emit only the supplied tokens instead of the full merged theme.
- `styleTagId`: identify the instance's generated style tags.

Notes:

- Unless `partial: true`, the full merged theme is emitted for the selector, not just overridden keys.
- Output is computed reactively and registered through Unhead for server rendering and client updates. Unmounting the owning component disposes its head entries.
- Reusing a selector or style identifier can cause conflicts/deduplication. Use distinct scopes/identifiers; normal CSS cascade and layer ordering still apply.
- Class names containing special characters must be escaped in `selector`.

### Reactive options and return value

Pass a reactive options object, a Vue ref, or a computed ref. Plain, non-reactive object mutations do not trigger updates.

```vue
<script setup lang="ts">
const activeColor = ref('#123456');
const { compConfig } = useThemeConfiguration(
	computed(() => ({
		selector: '.promo-theme',
		styleTagId: 'promo-theme',
		partial: true,
		config: { backgroundColors: { surface: activeColor.value } },
	}))
);
</script>
```

The returned `compConfig` is a computed ref with the same full/partial semantics as the component's exposed `config`. Reactive changes regenerate the relevant styles; they do not rerun build-time UnoCSS generation.

## Generated CSS Behavior

The component generates CSS custom properties (variables) on `:root` and optionally on theme classes.

Main categories:

- Colors (`colors`, plus `*Colors` groups)
- Layout (`layout.margin`, `layout.gutter`, `layout.max`)
- Typography (`fontSize`, `fontFamily`, `fontWeight`, `fontStyle`, `lineHeight`, `letterSpacing`, `textCase`, `textDecoration`, `paragraphIndent`, `paragraphSpacing`)
- Spacing (`spacing`)
- Border radius (`borderRadius`)

### Options reference

These settings can be supplied globally under `nuxt.config.themeConfiguration` and overridden under each theme's `options`. Undefined option values do not erase inherited defaults.

| Option                                      | Type                          | Built-in default                  | Behavior                                                                                                                              |
| ------------------------------------------- | ----------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `minify`                                    | `boolean`                     | `false`                           | Removes generated formatting whitespace.                                                                                              |
| `round`                                     | `boolean \| number \| string` | `false`                           | `true` rounds to `1px`; numbers specify a pixel step; strings specify a CSS step such as `'0.5px'`. `false` or `0` disables rounding. |
| `disableBreakpointSpecificCustomProperties` | `boolean`                     | `false`                           | Omits endpoint suffix properties such as `--theme-spacing-page--phone`, retaining the live responsive variable.                       |
| `baseFontSize`                              | `number`                      | `16`                              | Positive finite value used for pixel-to-`rem` font conversion and pixel-to-`em` media thresholds.                                     |
| `viewportWidth`                             | `string`                      | `'100dvw'`                        | CSS width expression used in fluid calculations, for example `'100vw'` or `'var(--panel-width, 50vw)'`.                               |
| `namedBreaks`                               | `Record<string, number>`      | `{ sm: 375, md: 1440, lg: 1920 }` | Nonempty map of unique positive finite widths. Names start with a letter and contain only letters, digits, or hyphens.                |

Module-only settings do **not** go inside theme files:

| Module option | Default | Behavior                                                                                                    |
| ------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| `uno`         | `true`  | Adds generated theme/rules through the `unocss:config` hook when UnoCSS is registered. `false` opts out.    |
| `rules`       | `{}`    | Maps section names to plugin module paths or `false`. Overrides built-ins, adds sections, or disables them. |
| `sources`     | `{}`    | Configures file discovery, transformers, and the UnoCSS source theme; see [Theme Sources](#theme-sources).  |

Rounding preserves an unrounded declaration as fallback, then emits a CSS `round()` declaration inside `@supports`. It applies to dimension/font-size output, not step-based typography. Custom plugin CSS is rounded only if the plugin uses the shared responsive helper in fluid mode.

Options live under `options`. Token breakpoint keys can be configured names or their numeric widths. Names also determine CSS property suffixes.

```ts
import { defineThemeConfig } from '@limbo-works/theme-configuration/config';

export default defineThemeConfig({
	options: {
		namedBreaks: { phone: 360, tablet: 768, desktop: 1440, wide: 1920 },
	},
	spacing: {
		page: { phone: 16, tablet: 24, desktop: 48, wide: 64 },
		// Missing intermediate breaks: one ramp from 360 to 1920.
		compact: { 360: 8, 1920: 24 },
		fixed: 12,
	},
});
```

- Each adjacent pair of **supplied token endpoints** creates one fluid segment. Four endpoints produce three segments; two produce one.
- Named and numeric keys can be mixed, but specifying both for the same width in one token is an error.
- Values clamp below the first and above the last supplied endpoint. One endpoint, or a scalar, produces a constant.
- Increasing, decreasing, and constant segments are supported.
- Dimension endpoints are finite numbers, not CSS strings such as `'16px'`. Spacing, radii, and layout dimensions use pixels; font-size endpoints are converted to `rem`. Zero is valid.
- Font sizes use fluid `rem` values. Other typography properties retain midpoint switches between their supplied endpoints.
- A step switches to the right-hand value at the exact midpoint. Sparse step tokens use the midpoint of their supplied endpoints, not every intervening named break.
- Media thresholds retain font-relative behavior: each configured width (or midpoint) is divided by `baseFontSize` and emitted in `em`. For example, 640 with `baseFontSize: 20` becomes `32em`, which matches 512 CSS pixels when the browser's initial font size is 16px. `baseFontSize` also controls font-token conversion to `rem`.
- Responsive width queries are not restricted to `screen`; they can match print too. `namedBreaks` controls theme calculations, not UnoCSS's `sm:`/`md:` variants. Configure UnoCSS breakpoints separately when those should match.
- Layout column widths support arbitrary break names; each utility specifies its own column count.
- Partial themes merge supplied endpoint overrides into base tokens, then emit only the selected tokens. Base settings and unsupplied endpoints remain available.
- Empty, duplicate-width, or invalid break maps and unconfigured token names or widths throw descriptive errors.

### Breakpoint inheritance

Effective break map precedence is: active theme's explicit `options.namedBreaks` > inherited default theme's map > `nuxt.config.themeConfiguration.namedBreaks` > built-in breaks.

- If Nuxt defines `{ compact: 360, wide: 1280 }` and a theme defines `{ phone: 400, desktop: 1200 }`, that theme uses only 400 and 1200. Names and widths from the Nuxt map are not added.
- If a theme omits `namedBreaks`, it inherits the applicable base/default settings. If no theme or module defines breaks, built-in `{ sm: 375, md: 1440, lg: 1920 }` applies.
- Explicit `namedBreaks: {}` is invalid; it does not mean "inherit" or "disable responsiveness".
- Token endpoint keys must match the effective names or widths. Named keys resolve to their effective widths; numeric keys are not rescaled. Supplied endpoint maps replace inherited endpoints when widths change, but untouched inherited tokens with unconfigured names or widths still throw and must be updated.

Built-in sections are enabled by default: `colors`, `backgroundColors`, `textColors`, `borderColors`, `layout`, `spacing`, `borderRadius`, `fontSize`, `fontStyles`, individual typography property groups, and `containers`. Additional `*Colors` groups retain automatic color handling.

### Merge and naming rules

The default theme is recursively merged with the supplied override without mutating either input. With unchanged breakpoint widths, a one-endpoint override preserves the other endpoints of that token, including when the base and override use different keys for the same width. Scalars replace endpoint maps, and supplied endpoint maps replace scalars. Changing a breakpoint width set replaces supplied endpoint maps rather than retaining incompatible widths; it does not delete unrelated inherited tokens.

CSS custom property segments preserve letter case and replace every non-alphanumeric character with `-`. For example, `spacing.pageGap` produces `--theme-spacing-pageGap`, and a `phone` endpoint produces `--theme-spacing-pageGap--phone`. Avoid names such as `a.b` and `a-b` in the same section because they produce the same CSS variable. UnoCSS utility names retain the authored token name.

Endpoint suffixes are emitted only for supplied/effectively inherited endpoints, not interpolated values at every named break. Disabling suffixes does not disable fluid scaling.

## Built-in Section Reference

### Colors, backgrounds, and on-background colors

`colors`, `textColors`, `backgroundColors`, and `borderColors` accept named CSS color strings, RGB/RGBA arrays, comma-separated RGB strings, or `{ value, isListedRgb? }` wrappers:

```ts
export default {
	colors: {
		brand: '#4b43be',
		faint: [75, 67, 190, 0.4],
		channels: '10, 20, 30',
		wrapped: { value: '10 20 30', isListedRgb: true },
		onPanelContrast: [255, 255, 255],
		'on-panel-muted': '#cccccc',
	},
	backgroundColors: {
		panel: [20, 30, 40],
	},
};
```

| Section            | CSS variable example              | UnoCSS usage                                                                                               |
| ------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `colors`           | `--theme-colors-brand`            | Shared palette for compatible preset color utilities, such as `text-brand`, `bg-brand`, or `border-brand`. |
| `textColors`       | `--theme-colors-text-muted`       | `text-muted`.                                                                                              |
| `backgroundColors` | `--theme-colors-background-panel` | `bg-panel`, `bg-panel/50`, and `bg-scope-panel`.                                                           |
| `borderColors`     | `--theme-colors-border-divider`   | `border-divider`; does not itself set border width/style.                                                  |

An unregistered section ending in `Colors`, such as `accentColors`, also receives color handling and an UnoCSS theme palette named after that section. Its CSS prefix is `--theme-colors-accent-*`. Utility prefixes beyond the standard palettes depend on the active UnoCSS preset or a project adapter.

RGB channel values are wrapped for UnoCSS color/opacity handling. Color strings remain authored CSS; validation is structural, not a general CSS parser. `backgroundColors` sets `background-color`, not the full `background` property. Gradients/images belong in project CSS or a custom rule.

For on-background colors:

- `onPanelContrast` and `on-panel-muted` match background `panel`, exposing shorthand `text-contrast` and `text-muted` in addition to the full token names.
- `bg-panel` paints the background and rebinds its matching on-background variables. Nested backgrounds can supply different values for the same shorthand.
- `bg-scope-panel` performs that rebinding without painting a background.
- With a `colors` section, `bgCurrent` is also available as a color token referencing the current background, for example `text-bgCurrent`.

### Spacing and border radius

Both sections accept numeric scalars or numeric endpoint maps:

```ts
export default {
	spacing: {
		page: { 375: 16, 1440: 32, 1920: 48 },
		fixed: 12,
	},
	borderRadius: {
		card: { 375: 4, 1920: 16 },
	},
};
```

Spacing tokens are available across width/height and min/max sizes, padding, margin, gap, inset/edge positions, and translations. Examples: `w-page`, `px-page`, `gap-page`, `top-page`, `translate-x-page`, and `-m-fixed`. Values reference live `--theme-spacing-*` variables; negative forms negate those values.

Radius utilities include `rounded-card`, physical sides/corners (`rounded-t-card`, `rounded-bl-card`), and logical start/end sides (`rounded-s-card`, `rounded-e-card`).

### Layout and columns

`layout.margin` and `layout.gutter` accept numeric scalars or endpoint maps, generating dimension utilities such as `px-layout-margin` and `gap-layout-gutter`. `layout.max` is an optional fixed pixel cap. Its width utilities are `w-layout-max`, `min-w-layout-max`, and `max-w-layout-max`.

No column count belongs in configuration. `w-1/3col`, `w-4/12col`, and `w-2/5col` choose their grid through the denominator. Denominators must be positive integers; numerators may be non-negative fractional spans. A `layout` section, even `{}`, enables these UnoCSS utilities. Calculations use:

```text
column = (effective viewport - 2 * margin - (count - 1) * gutter) / count
span = amount * column + max(0, ceil(amount) - 1) * gutter
```

When `max` is set, the column calculation is capped using that width. Without it, `--theme-layout-max` follows the viewport expression. Layout calculations honor `--visual-viewport-width` when supplied, falling back to `options.viewportWidth`.

`w-3/12col` spans three columns plus internal gutters. `w-1/3col` and `w-4/12col` produce equivalent widths for whole-column spans. Fractional spans such as `w-2.5/12col` retain the ceiling-based internal-gutter calculation shown above; equivalent fractions with fractional numerators do not necessarily produce identical widths. Column rules also support the dimension prefixes used for spacing. Invalid denominators receive no theme column rule, though an UnoCSS preset may still interpret those class names independently.

Runtime CSS emits `--theme-layout-width`, the outer layout width capped by `layout.max`, independently of endpoint-suffix settings. Utilities calculate their own columns from that width and the live margin/gutter variables. Runtime themes and scoped overrides can therefore change dimensions without registering new denominators. Old per-count/per-break column variables are not emitted. New utility class names still need to be discoverable by UnoCSS at build time.

This does not implement `@X/Ycol:` container queries. Generating that syntax with fixed or compiled responsive thresholds is possible, but native size-query conditions cannot read ordinary theme CSS variables. Fully live thresholds following arbitrary scoped theme changes would require JavaScript measurement/observation rather than only generated CSS.

### Typography

`fontStyles` is an alias of the `fontSize` rule, not a separate typography feature. Both accept the same three token forms; use one section when duplicate naming is unnecessary:

```ts
export default {
	fontSize: {
		// Shorthand: font size only.
		body: { 375: 16, 1920: 20 },
		// Property-first.
		title: {
			fontSize: { 375: 32, 1920: 64 },
			fontWeight: { 375: 500, 1920: 700 },
			lineHeight: 1.1,
			letterSpacing: { 375: 0, 1920: '2%' },
		},
		// Breakpoint-first.
		caption: {
			375: { fontSize: 12, fontWeight: 400 },
			1920: { fontSize: 14, fontWeight: 600 },
		},
	},
};
```

A numeric scalar such as `body: 16` is also supported. Each font-size token creates a `text-body`, `text-title`, or `text-caption` utility applying its size and accompanying typography.

Properties may instead be authored as top-level token maps, for example `fontWeight: { title: { 1920: 900 } }`. Effective precedence for matching properties/tokens is `fontStyles` < `fontSize` < individual property sections. Sparse property overrides preserve the other endpoints. A property-only token does not create its own `text-*` utility unless that name also has a font-size token.

| Property                                  | Behavior                                                                                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fontSize`                                | Numeric pixel input, fluid `rem` output.                                                                                                              |
| `fontWeight`, `lineHeight`                | Typically numeric, switched at midpoints rather than interpolated.                                                                                    |
| `fontFamily`                              | Midpoint-switched string. Family names containing spaces are quoted. For a fallback list, provide already quoted CSS such as `'"Inter", sans-serif'`. |
| `fontStyle`, `textCase`, `textDecoration` | Midpoint-switched CSS values; `textCase` maps to `text-transform`.                                                                                    |
| `letterSpacing`, `paragraphSpacing`       | Numeric values use `em`; percentages such as `'2%'` become `0.02em`. Midpoint-switched.                                                               |
| `paragraphIndent`                         | Midpoint-switched `text-indent`; provide a CSS length such as `'1em'` for nonzero values.                                                             |

`paragraphSpacing` sets the `--theme-paragraphSpacing` custom property through the text utility; it does not add paragraph margins automatically. Consume that property in project prose styles.

Text utilities reset properties from other configured typography groups to `initial` when absent on the selected token (`0` for paragraph spacing). This prevents another token's values unintentionally carrying across. Text size constraints are described under [Text Clamp Rules](#text-clamp-rules-text-min-_-and-text-max-_).

### Containers

Container queries use native CSS only: HTML and styles can be server-rendered, and the browser evaluates container sizes without hydration, observers, or measurement code. The built-in UnoCSS adapter supplies the parent utility and query variants. It is enabled even when `containers` is omitted; disable/replace it through the `containers` rule plugin.

Named thresholds are optional:

```ts
containers: {
	card: '400px',
	'card-wide': '32rem',
},
```

These are raw, non-negative CSS lengths in UnoCSS's `theme.containers`, not wrapped query conditions. Supported units are `px`, `rem`, `em`, `ch`, `ex`, `cap`, `ic`, `lh`, `rlh`, `cm`, `mm`, `in`, `pt`, `pc`, and `q`. Percentages, CSS variables, and math expressions are not accepted. Names use letters/digits/underscores/hyphens; `container` and the `lt-` prefix are reserved.

| Class                 | Generated behavior                                                              |
| --------------------- | ------------------------------------------------------------------------------- |
| `@container`          | Establishes `container-type: inline-size`.                                      |
| `@container/sidebar`  | Also sets `container-name: sidebar`.                                            |
| `@card:w-1/2`         | Minimum configured width, inclusive.                                            |
| `@lt-card:w-full`     | Maximum configured width minus 0.1 in its unit.                                 |
| `@960:w-1/2`          | Minimum 960px; numeric thresholds need no registration.                         |
| `@lt-1080:w-full`     | Maximum 1079.9px.                                                               |
| `@[40rem]:flex`       | Explicit length threshold; `@lt-[40rem]:` is also supported.                    |
| `@card/sidebar:w-1/2` | Queries the named `sidebar` ancestor instead of the nearest eligible container. |

`@lt-` follows the Nuxt Core directive convention: subtract `0.1` in the threshold's authored unit, not a mathematically strict `<`. For example `32rem` becomes `max-width: 31.9rem`. This leaves a small interval between the maximum and minimum forms. Relative lengths are evaluated by CSS; `em`/`rem` thresholds are not converted with `options.baseFontSize`.

```html
<div class="@container">
	<div class="w-full @card:w-1/2 @lt-400:block">...</div>
</div>
```

Queries style descendants, not the container itself. Parent size, not viewport width, determines matches. Ordinary variants can stack (`hover:@card:underline`); nested queries can also stack. Multiple minimum queries are ordered from smaller to larger thresholds; maximum queries reverse that order. Prefer consistent units for overlapping thresholds, since relative lengths depend on CSS context.

Keep the variant-group transformer for `@card:(flex w-1/2)` and a compatible directive transformer for `@apply @card:w-1/2`. The standard `transformerVariantGroup` and `transformerDirectives` exports from `unocss` are covered by tests. The installed Nuxt Core directive transformer uses an older UnoCSS API (`parentOrders.get`) and fails with the current UnoCSS version for conditional `@apply`; upgrade that transformer upstream or use the standard transformer if you do not require Nuxt Core's custom directive behavior. This module does not modify project transformers or media-query syntax.

Named queries and their `@lt-` forms provide autocomplete, including utilities after the query prefix. With UnoCSS's default `-` separator, a partial hyphenated name can be interpreted as a complete shorter variant (for example `@card-w` when `card` also exists). Select the longer name from the initial `@ca` suggestions, type its full prefix, or opt into `separators: [':']` in UnoCSS.

Thresholds are build-time values, independent of `namedBreaks` and runtime theme CSS variables. Changing a runtime/scoped theme does not change compiled thresholds. Changing the parent dimensions can still make a query start/stop matching. Column queries such as `@4/12col:` are intentionally unsupported. The old layout-generated `<layout-max`/`>=layout-max` container entries are removed: ordinary CSS variables cannot be used as size-query thresholds.

## Project rule plugins

Each built-in section has its own plugin. Plugins own both CSS generation and optional framework adapter hooks; the core engine only combines their output.

Source organization keeps section plugins in `src/runtime/shared/rules`, with shared factories, contracts, and registry logic in `src/runtime/shared/rule-helpers`. The public `/rules` entry still re-exports built-ins, helpers, and types; project imports do not change.

Register project modules by path in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
	modules: ['@unocss/nuxt', '@limbo-works/theme-configuration'],
	themeConfiguration: {
		rules: {
			spacing: './theme-rules/spacing.ts', // replace or wrap a built-in
			motion: './theme-rules/motion.ts', // add a section
			borderColors: false, // disable CSS and adapter output
		},
	},
});
```

Paths resolve from the project root and support Nuxt aliases (`~/`, `~~/`). Plugins must default-export a rule object, run in both build-time and browser/SSR contexts, and must not import Node-only dependencies at runtime. Restart Nuxt after changing registrations, adapter code, or selected UnoCSS theme token names so build-time output is regenerated.

### Extend or overwrite an existing rule

```ts
// theme-rules/spacing.ts
import {
	defineThemeRule,
	spacing,
} from '@limbo-works/theme-configuration/rules';

export default defineThemeRule({
	...spacing, // explicitly retain built-in adapter hooks
	css(value, context) {
		const result = spacing.css(value, context);
		result.base.push('--project-spacing-enabled: 1;');
		return result;
	},
});
```

A path **replaces the whole plugin**, not just its `css` handler. Omit the spread to replace everything; spread `adapters` too when replacing just one adapter hook.

### Add a rule with UnoCSS support

```ts
// theme-rules/motion.ts
import { isRecord } from '@limbo-works/theme-configuration/config';
import {
	defineThemeRule,
	type ThemeUnoOutput,
} from '@limbo-works/theme-configuration/rules';

export default defineThemeRule({
	css: (value, context) =>
		context.responsive('motion', value, { unit: 'ms', mode: 'step' }),
	adapters: {
		uno(value): ThemeUnoOutput {
			if (!isRecord(value)) {
				throw new Error('motion must be a token map.');
			}
			return {
				rules: Object.keys(value).map((name) => [
					`duration-theme-${name}`,
					{
						'transition-duration': `var(--theme-motion-${name})`,
					},
				]),
			};
		},
	},
});
```

Theme files can now contain `motion: { fast: 120 }`, generating `--theme-motion-fast: 120ms` and the `duration-theme-fast` utility. UnoCSS receives the same project plugin automatically. These are static UnoCSS rules, which are automatically discoverable by autocomplete. Dynamic regex rules should supply an `autocomplete` template in their third tuple element; merely matching a token at runtime does not make it discoverable.

### Plugin contract and future adapters

- `css(value, context)` returns `{ base: string[], media: Record<number, string[]> }`. Entries are CSS declarations; media keys are minimum viewport widths in pixels. The engine applies selectors, media queries, CSS layers, and formatting.
- `context` provides the section `key`, merged `config`, resolved `options`, active `rules`, and sorted `breaks` (`{ name, width }[]`).
- `context.responsive(prefix, tokens, options?)` generates dimension or step rules. Options: `unit`, `mode: 'fluid' | 'step'`, numeric `transform`, and a step-value `format`. Use fluid mode for lengths; use step mode for unitless values, strings, durations, and other non-length units.
- Responsive-helper defaults are `mode: 'fluid'`, `unit: 'px'`, and an identity numeric transform. Explicitly pass `unit: ''` for unitless step properties. Media entries returned by multiple plugins at the same width are combined.
- `adapters.uno(value, context, api)` returns `{ theme?, rules?, variants? }`; `api.colorResolver` exposes UnoCSS's color resolver without requiring plugins to load UnoCSS runtime code into the browser.
- Plugins may provide CSS only, adapter hooks only, or both. Do not mutate input config.
- Hooks run for sections actually present in the compiled configuration, except the UnoCSS `containers` hook, which also runs with `undefined` when omitted so numeric queries work without a named map. Registering other plugins does not itself add a theme section. Disabled plugins emit neither their section CSS nor their own UnoCSS adapter output.
- Plugin inputs are `unknown`: validate them before use, or delegate to `context.responsive`, which validates its token maps. `defineThemeRule` preserves inferred plugin types; it does not validate project-specific token values.
- `/rules` also exports `defaultRules`, `resolveRules`, `emptyCss`, and `mergeCss`. Use `emptyCss()` for a deliberate empty CSS result and `mergeCss(...)` to combine sections, rather than inventing alternative output shapes.
- Other adapter keys are reserved for project/future adapters. An adapter reads its own hooks from the same registry; core does not interpret them. A future Tailwind adapter can collect `adapters.tailwind` while CSS generation stays unchanged. No Tailwind implementation or legacy helper is shipped.
- Unknown theme sections without registered plugins fail explicitly instead of silently disappearing.

## UnoCSS Integration

Nuxt integration is automatic. Keep your existing presets in `uno.config.ts`; no theme imports are needed there.

Automatic generation reads the discovered `default` theme file, or an app-config entry named `default` if no such file exists. Set `sources.unoTheme` to select another discovered/app-config theme; an explicit missing name throws. Selection does not change the runtime default or its inheritance. It runs at build/dev configuration time, independently of the runtime component. Non-default, backend, and reactive theme overrides can change values for known utilities, but cannot add utility names to an already built stylesheet. Add all required names to the selected theme, or register additional UnoCSS rules/shortcuts yourself.

Generated theme values are merged below explicit UnoCSS config, and project rules are appended after generated rules. Existing presets, shortcuts, variants, and unrelated rules remain under project control.

For standalone UnoCSS builds, including projects without Nuxt or `@unocss/nuxt`, the `/uno` entry exports:

- `makeUnoTheme(config, options?, rules?)`: returns `{ theme, rules, variants }`.
- `makeThemeUtilities(config, options?, rules?)`: returns just the UnoCSS theme.
- `makeRules(config, options?, rules?)`: returns just utility rules, including autocomplete metadata.

Use the complete `makeUnoTheme` result for container queries or project plugins that return variants. Combining only `makeThemeUtilities` and `makeRules` does not install generated variants.

Example:

```ts
import { defineConfig, presetMini } from 'unocss';
import { makeUnoTheme } from '@limbo-works/theme-configuration/uno';
import defaultTheme from './assets/js/theme-configuration.default.js';

export default defineConfig({
	presets: [presetMini()],
	...makeUnoTheme(defaultTheme),
});
```

For manual registration inside Nuxt, set `themeConfiguration.uno: false` to avoid duplicate automatic registration. Manually called helpers do not read `nuxt.config`: pass shared theme options as their second argument and project plugin objects as their third. Explicit options inside the theme still win over the second argument.

These helpers generate UnoCSS utilities, not the `--theme-*` variable definitions. The Nuxt component/composable emits those definitions; a project without Nuxt must supply them separately.

### Editor autocomplete

Keeping helper calls in `uno.config.ts` also makes generated rules available when the UnoCSS editor extension loads that config independently of Nuxt. If Nuxt's automatic hook is not reflected in the editor, use manual registration with `uno: false`; this avoids depending on the editor running Nuxt hooks.

Built-in autocomplete covers named colors/backgrounds, spacing (including negative forms), layout dimensions/max/columns, border radius, typography, and text min/max tokens, numeric suggestions, and resets. Column suggestions use common numeric spans and denominators; any positive-integer denominator can be typed manually. Custom dynamic plugin rules must provide their own UnoCSS `autocomplete` metadata; static rules are discovered automatically.

Automated tests exercise UnoCSS's autocomplete engine and verify suggested classes generate CSS. They do not automate the VS Code extension UI.

Generated/extended utility behavior includes:

- Color utilities (`text-*`, `bg-*`, `border-*`) mapped to theme variables.
- Background scope utility (`bg-scope-*`) for on-background color variable scoping.
- Layout/spacing utilities from token keys.
- Column width utilities like `w-3/12col` (enabled by the `layout` section; no configured count).
- Typography token utility classes (`text-h1`, etc.).
- Border radius utilities from theme tokens.

## Text Clamp Rules: text-min-_ and text-max-_

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
- Constraints use CSS `clamp(min, theme size, max)`; they do not mutate theme tokens. Token-based bounds remain responsive.
- Clamp rules are supplied by the font-size/font-styles adapter when it has font-size tokens. Disabling both sections removes these generated rules.

## Runtime Theme Access API

The Nuxt plugin provides `$themeConfigurations` on the app instance, with a cache owned by that Nuxt app. Access it in a Nuxt setup/plugin context:

```ts
const { $themeConfigurations } = useNuxtApp();
const defaultTheme = $themeConfigurations.default;
const available = $themeConfigurations.$getAvailableThemes();
```

| Access/method           | Result and behavior                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `themes[name]`          | Cached authored configuration, or `undefined`. Warns if a registered theme is not currently loaded.                                  |
| `$loadTheme(name)`      | Async cached read/load. Unknown names return `undefined`; import/validation failures are logged and thrown.                          |
| `$loadThemeSync(name)`  | Cached configuration or `undefined`; does not import it.                                                                             |
| `$getAvailableThemes()` | Registered loader names, including themes cleared from cache.                                                                        |
| `$isThemeLoaded(name)`  | Whether the theme is currently cached.                                                                                               |
| `$clearTheme(name)`     | Removes a cached theme; returns whether one was removed.                                                                             |
| `$clearAllThemes()`     | Clears cached themes; returns the number removed. Loaders remain registered.                                                         |
| `$destroy()`            | Clears themes/loaders and permanently disables this instance; returns `true`. Subsequent proxy access warns and returns `undefined`. |

All themes are preloaded at startup. Clearing a theme is not a switch operation: it does not clear already emitted CSS, update existing component snapshots, or rebuild UnoCSS. Reload through the async API before using it again. Use reactive component/composable options to switch displayed themes instead of mutating the cache.

Treat cached theme objects as read-only authored data. The cache and getter results are not a reactive theme store. `$destroy()` is a lifecycle cleanup API, not a way to reset/reinitialize the module; browser page lifecycle handlers also invoke it.

## Utility Functions

These are auto-imported by the module. Theme getters return authored theme data; module defaults are applied during generation. The component/composable exposes the effective merged config (or only supplied overrides in `partial` mode).

Call app-dependent getters within a Nuxt context. Sync and async single-theme getters warn and return `undefined` for missing names. A loader or normalization failure can throw; an empty subset match returns `undefined` rather than an empty success object.

### getThemeConfigurations()

Returns all currently loaded theme configurations as an object keyed by theme name.

```ts
const themes = getThemeConfigurations();
```

The result is a snapshot of loaded entries, not a reactive view of later cache additions/removals.

### getThemeConfigurationsAsync()

Returns available theme loaders keyed by theme name.

```ts
const loaders = await getThemeConfigurationsAsync();
const module = await loaders.print?.();
```

This discovers loader functions; it does not return fully loaded themes or update the runtime cache when a loader is called directly. Loader results may be a theme object or a module with a `default` export. Prefer `getThemeConfigurationAsync` for a cached, normalized theme.

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

Results retain their section/key structure: selecting `'colors'` returns `{ colors: ... }`, not just the colors map. `true` includes a key, `false` skips it, and nested selectors narrow its contents. Missing keys are omitted. Use non-global regexes for predictable repeated matching.

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

### getThemeModuleOptions()

Returns the module-wide generation defaults stored in public runtime config, or `{}` when absent. It does not resolve a theme's options or return plugin objects/paths. Like the app-dependent getters, call it within a Nuxt context.

## TypeScript and Public Imports

```ts
import { defineThemeConfig } from '@limbo-works/theme-configuration/config';
import type {
	ThemeConfiguration,
	ThemeOptions,
	ThemeModuleOptions,
	ThemeResponsive,
	ThemeSubset,
	ThemeFileSource,
	ThemeSourceOptions,
	ThemeSourceTransformer,
} from '@limbo-works/theme-configuration/types';
import {
	defineThemeRule,
	type ThemeRuleContext,
	type ThemeRulePlugin,
	type ThemeUnoOutput,
} from '@limbo-works/theme-configuration/rules';
```

- `defineThemeConfig` preserves the inferred shape while checking the declared theme contract. It is an identity helper, not a legacy-format converter or a substitute for runtime validation.
- `ThemeResponsive<T>` accepts a scalar or numeric endpoint map. Built-in dimension groups require numeric values; individual typography and custom sections are interpreted by their rule plugins.
- `ThemeConfiguration` permits custom section keys as `unknown`. Add project types/validation for those sections; their shape is not inferred from a module plugin path.
- Nuxt's `themeConfiguration` module options and `$themeConfigurations` injection are typed. Components, composables, and runtime utility functions are auto-registered.
- Public runtime entry points are the package root (Nuxt module), `/config`, `/rules`, and `/uno`; `/types` is a type-only entry. Do not import internal `src`, `dist`, or old layer paths.

The `/config` entry also exports:

- `defaultThemeOptions`: built-in generation defaults.
- `resolveThemeOptions(themeOptions?, defaults?)`: validates and returns a fully resolved option set, with theme options taking precedence.
- `normalizeThemeConfiguration(theme, defaults?)`: rejects legacy settings and validates options, returning a shallow theme copy with explicit merged options. It does not fill every built-in option or compile/validate all rule values.
- `unwrapThemeModule(value)`: accepts a theme object or an object whose `default` is a theme.
- `isRecord(value)`: an object/non-array type guard for plugin input checks.

## Configuration Shape Example

```js
import { defineThemeConfig } from '@limbo-works/theme-configuration/config';

export default defineThemeConfig({
	options: {
		minify: false,
		round: '1px',
		disableBreakpointSpecificCustomProperties: false,
		namedBreaks: { sm: 375, md: 1440, lg: 1920 },
		baseFontSize: 16,
		viewportWidth: '100dvw',
	},

	layout: {
		margin: { 375: 16, 1440: 32, 1920: 48 },
		gutter: { 375: 16, 1440: 24, 1920: 32 },
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
		md: { 375: 16, 1440: 24, 1920: 32 },
	},

	borderRadius: {
		md: { 375: 8, 1440: 12, 1920: 16 },
	},

	fontSize: {
		h1: {
			fontSize: { 375: 32, 1440: 48, 1920: 64 },
			lineHeight: { 375: 1.1, 1440: 1.1, 1920: 1.1 },
			letterSpacing: { 375: 0, 1440: 0, 1920: 0 },
			fontWeight: { 375: 700, 1440: 700, 1920: 700 },
		},
	},
});
```

## Notes

- Keep all keys you want utilities generated for in the selected UnoCSS theme (`default` unless `sources.unoTheme` is set).
- Override themes should primarily override values, not introduce entirely new token structures late.

## Troubleshooting

- **Variables are missing:** registering the module or UnoCSS helpers alone does not emit runtime variable definitions. Mount `<ThemeConfiguration>` or call `useThemeConfiguration` in the relevant Vue setup scope. Without Nuxt, supply CSS definitions separately.
- **A utility is missing:** add its token name to the selected UnoCSS theme (`default` unless `sources.unoTheme` is set) and restart development/build. A runtime or API-provided theme can change values, not the compiled utility inventory. For dynamically constructed class strings, configure UnoCSS extraction/safelisting as required.
- **CSS works but editor suggestions are missing:** ensure the editor can load the same UnoCSS config/preset. Use manual helper registration with `uno: false` if the editor does not run Nuxt hooks.
- **A breakpoint error appears after changing options:** every token endpoint must belong to the effective break map, including inherited tokens. Rename/replace endpoint keys rather than expecting automatic conversion.
- **Two scoped themes interfere:** use distinct selectors and `styleTagId` values, check CSS layer/cascade order, and avoid emitting unscoped theme classes from a component intended to be isolated.
- **A cleared theme is unavailable synchronously:** reload it with `getThemeConfigurationAsync` or `$loadTheme`. Clearing the cache does not reset styles already registered by a component.

## Migration from v4 to v5

The new format is required; there is no legacy runtime compatibility mode. Existing CSS variable names and utility class names remain unchanged when keeping `sm`/`md`/`lg` names and existing token names.

### 1. Register the module instead of extending the layer

```ts
// Before
export default defineNuxtConfig({
	extends: ['@limbo-works/theme-configuration'],
});

// After
export default defineNuxtConfig({
	// Keep unrelated layers in extends.
	modules: ['@unocss/nuxt', '@limbo-works/theme-configuration'],
});
```

Install `@unocss/nuxt` separately if using utility classes. CSS-variable-only projects need only this module.

### 2. Move settings into options

```ts
// Before
export default {
	minify: true,
	baseFontSize: 16,
	smViewport: 375,
	mdViewport: 1440,
	lgViewport: 1920,
	spacing: {
		md: { sm: 16, md: 24, lg: 32 },
	},
};
```

```ts
// After
import { defineThemeConfig } from '@limbo-works/theme-configuration/config';

export default defineThemeConfig({
	options: {
		minify: true,
		baseFontSize: 16,
		namedBreaks: { sm: 375, md: 1440, lg: 1920 },
	},
	spacing: {
		md: { sm: 16, md: 24, lg: 32 },
	},
});
```

Responsive endpoint keys in `layout`, `spacing`, `fontSize`/`fontStyles`, individual typography groups, and `borderRadius` can use configured names or numeric widths, including breakpoint-first typography objects. Do **not** rename token names such as `spacing.md`. To keep existing CSS suffixes (`--sm`, `--md`, `--lg`), retain those names in `namedBreaks`.

Shared options can instead move into `nuxt.config.ts` under `themeConfiguration`. A theme's explicit options override module settings. Custom break maps do not merge with defaults. When a theme changes the breakpoint width set, its supplied responsive maps replace old endpoints rather than merging incompatible widths. Update inherited tokens whose names or numeric widths are no longer configured.

### 3. Consolidate spacing and remove obsolete integrations

- Merge used `horizontalSpacing`/`verticalSpacing` tokens into `spacing`, resolving duplicate names explicitly. Update classes referencing renamed tokens. Removed sections now report migration errors.
- Remove Tailwind helper imports/configuration. Tailwind support is not part of v5.
- Replace `background` color tokens with `backgroundColors`. Move gradients/images into project CSS or a project rule; `backgroundColors` cannot paint them.
- Remove configured `layout.columns` or `layout.columnCount`. Choose the denominator in each column utility, such as `w-4/12col`, and replace references to removed per-count/per-break column variables.
- Remove `options.handlers`. Register a plugin path under `themeConfiguration.rules` and wrap a built-in plugin to preprocess its section or replace its output.
- Keep existing theme filenames, `<ThemeConfiguration>` usage, scoped composables, media themes, and runtime getters.

### 4. Remove manual UnoCSS generation

Delete `makeThemeUtilities(defaultTheme)` and `makeRules(defaultTheme)` from UnoCSS config, along with their imports. The module now loads the selected UnoCSS theme (`default` unless `sources.unoTheme` is set) and project plugins automatically. Keep presets, shortcuts, and unrelated rules.

For deliberately manual or standalone setups, change old `assets/js/helpers.uno.ts` imports to `@limbo-works/theme-configuration/uno`, set `themeConfiguration.uno: false`, and pass project plugin objects as the third argument to both helper functions. Use `/config` for `defineThemeConfig`, `/rules` for built-in plugins and plugin types, and `/types` for theme types. Internal source paths are not public API.

### 5. Verify representative pages

Check small, intermediate, and large widths; print/media themes; scoped/partial themes; on-background colors; and column utilities. Fluid ramps now work for decreasing values and any number of endpoints. Other typography properties retain midpoint switches. The selected UnoCSS theme determines which utility names exist; runtime themes change their values.

Also check custom root/base font sizes, rounding, property-level typography overrides, and print styles that relied on responsive declarations being screen-only. Nuxt 4/UnoCSS 66 compatibility and revised calculation precision mean v5 is not a guaranteed pixel-identical drop-in replacement, even after converting config.

## Performance

Theme merging clones the base once, detaches updated branches, and clones incoming override values. It avoids repeatedly deep-cloning whole subtrees while keeping authored data and shared token objects isolated.

Typography collection and on-background color indexing are reused within one compilation. Background names are sorted once, matched names are indexed, and background utilities reuse their precomputed color bindings instead of scanning every color group per class.

This is not a persistent CSS/output cache. Each CSS or UnoCSS compilation gets its own derived data; independent themes, scopes, rule registries, and Nuxt apps do not share compiled results. Reactive component/composable options still recompile after named-theme switches or nested configuration edits. Scoped overrides, merged theme classes, and print media retain their normal generation paths.

UnoCSS's token inventory is still build-time data: runtime changes update existing utilities through CSS variables, not by discovering new utility names. See [UnoCSS integration](#unocss-integration).

## Testing

Tests use Vitest, including Browser Mode with its Playwright provider. The test toolchain requires Node 22 (22.12+), 24, or 26+. Install development dependencies and browser binaries first:

```bash
yarn install
yarn test:playground:install
yarn typecheck
yarn test
```

- `yarn test:unit`: configuration validation, responsive output, plugin behavior, merge semantics, UnoCSS generation, real autocomplete suggestions, container variants, grouping, and standard directive-transformer output.
- `yarn test:playground`: the real playground verification component in Chromium, Firefox, and WebKit. Checks computed styles across breakpoint boundaries, sparse/decreasing ramps, midpoint typography, colors, layout, rounding, overrides, plugin extensions, native container min/max boundaries and named-ancestor selection, print media, runtime getters, repeated named-theme switches, nested live edits, scoped/subtheme-class isolation, and unmount cleanup.
- `yarn bench`: Vitest benchmarks using 100 typography/spacing tokens and 24 backgrounds. Measures partial merges, CSS compilation, UnoCSS configuration, and fresh UnoCSS stylesheet generation. These are synthetic local measurements, not guaranteed application-wide speedups or timing assertions in the test suite.
- `yarn typecheck`: module and playground TypeScript checks.
- `yarn prepack`: builds the distributable module and runtime declarations.
- `yarn build`: separate production Nuxt integration check.

Browser tests mount the real components, runtime plugin, Unhead, and generated UnoCSS, with a small Nuxt context adapter. They do not run a production Nuxt server or test SSR hydration. Run typechecking before tests/builds, not concurrently: Nuxt preparation replaces generated files consumed by those commands. Production builds also update Nuxt's generated files.

Run `yarn dev` to open the interactive playground. Its theme selector, container-width slider, scoped theme controls, and runtime reload button demonstrate live behavior. The pass/fail cards compare selected computed browser styles with expected values; they are illustrative checks, not a substitute for the automated suite.
