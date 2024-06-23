import { defineNuxtModule, addPlugin, addComponentsDir, addImportsDir, createResolver } from '@nuxt/kit'
import { layout, colors, backgroundColors, textColors, borderColors, spacing, fontSize  } from './runtime/handlers/index';

export default defineNuxtModule({
  meta: {
    name: 'theme-configuration',
    configKey: 'themeConfiguration',
  },

  defaults: {
	minify: true,
	round: '1px',

	namedBreaks: {
		sm: 375,
		md: 1440,
		lg: 1920,
	},

	baseFontSize: 16,

	handlers: {
		layout,
		colors,
		backgroundColors,
		textColors,
		borderColors,
		spacing,
		fontSize,
	},
  },

  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url);

    addPlugin(resolver.resolve('./runtime/plugin'));
	addComponentsDir(resolver.resolve('./runtime/components'));
	addImportsDir(resolver.resolve('./runtime/utils'));
  },
})
