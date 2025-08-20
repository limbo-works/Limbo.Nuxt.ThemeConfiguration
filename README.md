# Theme Configuration Module

The `ThemeConfiguration` Nuxt module for Nuxt3+ allows you to configure theme settings for your application with UnoCSS integration.

## Installation

```bash
yarn add @limbo-works/theme-configuration
```

Make the component globally usable by adding the module to `nuxt.config.js`.

```js
export default defineNuxtConfig({
    modules: [
        '@limbo-works/theme-configuration',
        ...
    ],
    ...
});
```

## Using the Component

```html
<ThemeConfiguration
	:config="themeConfig"
	:media="{
	print: 'print',
  }"
	:use-theme-classes="true"
	css-layer="layer1"
>
	<!-- Your content here -->
</ThemeConfiguration>
```

Note that the component doesn't have to wrap your content and you should ever only have one on the page.

### Props:

-   config: The configuration object or key for the theme settings. Can be a string (matching \~/assets/js/theme-configuration.**this-name**.js) or an object.
-   media: An object of key-value pairs where the key is the media query to use and the value is the config to use for this media query.
-   useThemeClasses: Whether to use theme classes for styling. Can be a boolean or an array of theme class keys (again, matching \~/assets/js/theme-configuration.**this-name**.js). Will result in classes like `.u-theme-default`, `.u-theme-this-name`, etc..
-   cssLayer: The CSS layer to apply the theme styles to. Can be a string.

### Slots:

-   Default: The content to be rendered inside the `ThemeConfiguration` component.

### Exposed Properties:

-   config: The observed data object for the theme configuration.

## Utility Functions

The package contains utility functions that are automatically imported when using the module.

**async getThemeConfigurations()**: Returns an object with all available configurations at `~/assets/js/` (as described previously, configurations should be named `theme-configuration.`**name**`.js`).

**async getThemeConfiguration(name, [subset])**: Returns either the config of the given name or, if the `subset` argument is supplied, a subset of that config.
The subset can be either a string, array, object or regexp. A string will return a config with only that one key (if it exists), an array will return a subset of all the keys it contains, an object allows for complex digging through the config, and regexp allow you to get a subset based of that regexp rule.
Note that an array can include both strings, arrays, objects and regexp as well, and that an object can similarly include everything as the values for the keys. Also the keys of the objects can be regexp strings starting with a `/`.

## UnoCSS Integration

The module automatically imports UnoCSS helper functions for building theme utilities:

**makeThemeUtilities(config)**: Generates theme utilities for UnoCSS configuration.
**makeRules(config)**: Generates UnoCSS rules for the theme configuration.

Example UnoCSS configuration:
```js
import { defineConfig } from 'unocss';
import { makeThemeUtilities, makeRules } from '@limbo-works/theme-configuration/helpers';
import defaultConfig from './assets/js/theme-configuration.default.js';

export default defineConfig({
    theme: { ...makeThemeUtilities(defaultConfig) },
    rules: [...makeRules(defaultConfig)],
});
```

## Breaking Changes from v2.x

- **Installation method**: Changed from `extends` to `modules` array in `nuxt.config.js`
- **Tailwind support removed**: All Tailwind helper functions have been removed. Use UnoCSS instead.
- **Package structure**: Main entry point is now the Nuxt module, with additional exports available

## Notes and Further Work

-   The documentation needs expanding.
