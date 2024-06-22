import { defineNuxtModule, addPlugin, addComponentsDir, addImportsDir, createResolver } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'theme-configuration',
    configKey: 'themeConfiguration',
  },

  defaults: {},
  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url);

    addPlugin(resolver.resolve('./runtime/plugin'));
	addComponentsDir(resolver.resolve('./runtime/components'));
	addImportsDir(resolver.resolve('./runtime/utils'));
  },
})
