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

	baseFontSize: 16,

	layers: true, // boolean for all/none or array with specific layer/package names
	layerRule: 'merge', // 'merge' | 'replace'

	namedBreaks: {},

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
	addImportsDir(resolver.resolve('./runtime/composables'));
	addImportsDir(resolver.resolve('./runtime/utils'));
  },
})
