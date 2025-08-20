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
    const hasUnoCSS = nuxt.options.modules?.some(m => {
      if (typeof m === 'string') {
        return m.includes('@unocss/nuxt') || m.includes('unocss')
      }
      if (Array.isArray(m) && m.length > 0) {
        return m[0]?.includes('@unocss/nuxt') || m[0]?.includes('unocss')
      }
      return false
    })

    if (!hasUnoCSS) {
      nuxt.options.modules = nuxt.options.modules || []
      nuxt.options.modules.push('@unocss/nuxt')
    }
  }
})

// Export helper functions for use in UnoCSS configs
export { makeThemeUtilities, makeRules } from '../components/ThemeConfiguration/helpers.uno.js'