# Theme Configuration

The `ThemeConfiguration` component and setup for Nuxt3+ allows you to configure the theme settings for your application.

## Installation

\`\`\` bash
yarn add @limbo-works/theme-configuration
\`\`\`

Make the component globally usable by extending the layer in \`nuxt.config.js\`.

\`\`\` js
export default defineNuxtConfig({
    extends: [
        '@limbo-works/theme-configuration',
        ...
    ],
    ...
});
\`\`\`

## Using the Component

``` html
<ThemeConfiguration
  :config="themeConfig"
  :printConfig="printThemeConfig"
  :useThemeClasses="true"
  cssLayer="layer1"
>
  <!-- Your content here -->
</ThemeConfiguration>
```

### Props:

* config: The configuration object or key for the theme settings. Can be a string (matching \~/assets/js/theme-configuration.**this-name**.js) or an object.
* printConfig: The configuration object or key for the print theme settings. Can be a string or an object. Is not required for things to work.
* useThemeClasses: Whether to use theme classes for styling. Can be a boolean or an array of theme class keys (again, matching \~/assets/js/theme-configuration.**this-name**.js). Will result in classes like `.u-theme-default`, `.u-theme-this-name`, etc..
* cssLayer: The CSS layer to apply the theme styles to. Can be a string.

### Slots:

* Default: The content to be rendered inside the `ThemeConfiguration` component.

### Exposed Properties:

* config: The observed data object for the theme configuration.

## Other

Other than the ThemeConfiguration component, the layer also introduce an async `getThemeConfigurations()` utility function to get all the available config files.

## Notes and Further Work

* The documentation needs expanding.
* The "printConfig" addition could be expanded further to include prefered colors and contrast, however it needs a bit of consideration in terms of what-overwrites-what and why.
