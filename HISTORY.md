# History of Theme Configuration

Theme Configuration centralizes design tokens and turns them into responsive CSS variables and utility-friendly values. This page summarizes its evolution; [CHANGELOG.md](./CHANGELOG.md) records released versions and individual changes.

## The Beginning: A Need for Consistency (Pre-2023)

The concept of "Theme Configuration" at Limbo Works predates the Nuxt package. Projects used different approaches to colors, typography, spacing, and responsive design, leading to:

- Duplicated CSS code across projects
- Inconsistent design implementations
- Time-consuming manual updates when brand guidelines changed
- Difficulty maintaining design coherence across a growing portfolio of websites

The initial concept of "Theme Configuration" emerged from the need to centralize these design decisions and create a system that could be shared across projects while still allowing for customization.

## Early Implementations (Pre-Nuxt Era)

Before the Nuxt implementation, theme configuration concepts were already being used in Limbo Works projects:

- **Umbraco Projects**: Early versions of theme configuration concepts were implemented in Umbraco-based websites, including projects like the Odsherred Kommune Website (Umbraco 9), where the foundational ideas of centralized theming and design consistency were first explored
- **Standalone Components**: Theme configuration was developed as standalone components and utilities that could be integrated into various project types
- **Framework-Agnostic Approach**: The initial implementations focused on creating reusable theming solutions that weren't tied to specific frameworks

These early implementations established principles later used by the Nuxt package. The repository changelog does not document these earlier projects.

## Transition to Modern Framework Integration (2023)

The transition to a Nuxt 3-specific implementation marked a significant evolution, building on the lessons learned from earlier implementations:

- **Nuxt 3+ Integration**: Built specifically for the Nuxt 3 ecosystem, taking advantage of its composables and component architecture
- **CSS Custom Properties**: Enhanced use of CSS variables for dynamic theming and runtime customization
- **Tailwind CSS Integration**: Earlier implementations supported Tailwind CSS for utility-first styling. This support is removed in the upcoming v5 release.

The system maintained focus on core design tokens established in earlier versions:

- Color palettes and semantic color naming
- Typography scales and font family management
- Spacing and layout systems
- Responsive breakpoint management

## Nuxt 3 Package Era: Formalizing the System (2024)

The formal Nuxt 3 package and versioning began with the 2.0 release series, building upon the earlier implementations and establishing key architectural decisions for the modern framework integration:

### Version 2.1.0 (January 30, 2024)

- **Utility Functions**: Introduction of `getThemeConfigurations()` and related helper functions
- **Print Configuration Support**: Recognition that different media contexts require different design approaches
- **Release Automation**: Implementation of automated release processes for better version management

### Version 2.2.0 (January 31, 2024)

- **Media Query Configurations**: Ability to define different configurations for different media contexts
- This was a crucial step toward responsive design token management

## The Maturation Phase (2024)

### Version 2.3.0 (March 7, 2024)

- **Font Family Handling**: Improved support for custom fonts and special characters
- **Query System Refinements**: Better handling of complex media queries

### Version 2.4.0 (March 28, 2024)

- **Enhanced Utility Functions**: Introduction of `getThemeConfiguration()` with advanced subset selection
- **Flexible Configuration Access**: Support for string, array, object, and regex-based configuration subsetting

### Version 2.5.0 (June 4, 2024)

- **Rounding Capabilities**: Added sophisticated rounding controls for precise design implementation
- This reflected the growing attention to pixel-perfect design implementation

## The Professional Polish (2024-2025)

### Version 2.5.1 (September 5, 2024)

- **Font Family Quotation**: Automatic handling of special characters in font family names
- **Bug Fixes**: Refinements to component naming and stability

### Version 2.6.0 (September 23, 2024)

- **Modern Dependencies**: Upgrade to latest tooling and dependencies
- **Code Quality**: Comprehensive linting and code standardization

### Version 2.7.0 (May 7, 2025)

- **Performance Optimization**: Migration to `useHead` for better style injection

### Version 2.7.1 (May 14, 2025)

- **Dynamic Style Management**: Improved handling of dynamic style updates

### Version 2.7.2 (May 21, 2025)

- **Configuration Key Management**: Enhanced tracking of configuration changes

### Later v2 releases (October–November 2025)

The 2.7.3 and 2.7.4 releases addressed cleanup and Nuxt configuration, while 2.8 added utility functions and subsequent fixes.

## v3: Theme Classes and Additional Sources (2025–2026)

- **v3.0.0 (November 2025)** changed listed RGB colors from comma-separated to space-separated values for newer UnoCSS compatibility. The release changelog also records theme-class generation and earlier theme-access capabilities.
- **v3.1.0 (December 2025)** added configuration for additional theme sources, with local files taking precedence.
- **v3.2–3.3 (January–February 2026)** focused on efficiency and dynamic style handling.
- **v3.4–3.6 (February–March 2026)** added an option to omit breakpoint-specific custom properties, direct theme extraction, and font-size limits.

## v4: Nuxt 4 and Scoped Themes (2026)

- **v4.0.0 (March 2026)** upgraded to Nuxt 4, moved helper files to `assets/js`, and exposed theme generation through a composable.
- **v4.1 (May 2026)** expanded `text-min-*` and `text-max-*` utilities.
- **v4.2–4.4 (May–August 2026)** included performance work, fixes, and stronger TypeScript usage.
- **v4.5–4.6 (October 2026)** added selector-based scoping and custom style-tag IDs, with fixes for partial configuration exposure.

See [CHANGELOG.md](./CHANGELOG.md) for all releases, dates, and fixes.

## Upcoming v5: Nuxt Module and New Theme Format

The v5 work described in [README.md](./README.md) is not yet a released version:

- The Nuxt layer becomes a module, with shared settings in `nuxt.config.themeConfiguration`.
- Theme settings move under `options`, and responsive values use numeric viewport widths with configurable named breaks.
- Tailwind support, separate horizontal/vertical spacing, and the `background` section are removed. Grid counts move from configuration to individual utilities such as `w-4/12col`.
- Section rule plugins can extend or replace built-in generation. UnoCSS integration uses the selected source theme, `default` unless `sources.unoTheme` is configured.
- Theme discovery supports configured folders, files, globs, and build-time transformers. Runtime switching, scoped themes, theme classes, media overrides, and SSR remain supported.
- Native container queries support named and numeric thresholds. Their thresholds are build-time values; dynamic `@X/Ycol:` queries are not provided.

See the [v4-to-v5 migration guide](./README.md#migration-from-v4-to-v5) for breaking changes and upgrade steps.

## Design Token Workflow

Projects can export tokens from design tools such as Figma and transform them into the theme format. In v5, a project can configure a build-time transformer for one or multiple source files; the package does not automatically interpret TokenTransformer or Figma export formats. The resulting themes are bundled for SSR and client use, and runtime theme changes update existing CSS variables.
