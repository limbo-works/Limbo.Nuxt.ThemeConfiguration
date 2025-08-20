import { createResolver, defineNuxtModule, addComponent, addImports } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

export default defineNuxtModule({
  meta: {
    name: '@limbo-works/theme-configuration',
    configKey: 'themeConfiguration',
    compatibility: {
      nuxt: '^3.0.0'
    }
  },
  defaults: {},
  setup(options, nuxt) {
    // Register the ThemeConfiguration component
    addComponent({
      name: 'ThemeConfiguration',
      filePath: resolve('../components/ThemeConfiguration/ThemeConfiguration.vue')
    })

    // Auto-import utilities
    addImports([
      {
        name: 'default',
        as: 'getThemeConfigurations',
        from: resolve('../utils/get-theme-configurations.js')
      },
      {
        name: 'default', 
        as: 'getThemeConfiguration',
        from: resolve('../utils/get-theme-configuration.js')
      },
      {
        name: 'makeThemeUtilities',
        from: resolve('../components/ThemeConfiguration/helpers.uno.js')
      },
      {
        name: 'makeRules',
        from: resolve('../components/ThemeConfiguration/helpers.uno.js')
      }
    ])

    // Add UnoCSS module if not already present
    if (!nuxt.options.modules.some(m => 
      (typeof m === 'string' && m.includes('@unocss/nuxt')) ||
      (Array.isArray(m) && m[0]?.includes('@unocss/nuxt'))
    )) {
      nuxt.options.modules.push('@unocss/nuxt')
    }
  }
})

// Export helper functions for use in UnoCSS configs
export { makeThemeUtilities, makeRules } from '../components/ThemeConfiguration/helpers.uno.js'