declare module '@limbo-works/theme-configuration' {
  interface ModuleOptions {}

  interface ThemeConfiguration {
    // Add type definitions based on your theme configuration structure
    baseFontSize?: number
    smViewport?: number
    mdViewport?: number
    lgViewport?: number
    colors?: Record<string, string | number[]>
    fontSize?: Record<string, any>
    [key: string]: any
  }

  // Helper function types
  export function makeThemeUtilities(config: ThemeConfiguration): Record<string, any>
  export function makeRules(config: ThemeConfiguration): Array<any>
  export function getThemeConfigurations(): Promise<Record<string, ThemeConfiguration>>
  export function getThemeConfiguration(name: string, subset?: any): Promise<ThemeConfiguration | undefined>

  // Component export
  export const ThemeConfiguration: any

  const module: any
  export default module
}