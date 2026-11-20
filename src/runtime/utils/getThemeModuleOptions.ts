import type { ThemeOptions } from './theme-configuration.types';

export default function getThemeModuleOptions(): ThemeOptions {
	return useRuntimeConfig().public.themeConfiguration ?? {};
}
import { useRuntimeConfig } from '#app';
