export default defineNuxtPlugin(async (nuxtApp) => {
	try {
		const themeConfigurations = await getThemeConfigurationsAsync();
		// Ensure completely plain object for Nuxt's serialization
		const plainConfigurations = JSON.parse(JSON.stringify(themeConfigurations || {}));
		nuxtApp.provide('themeConfigurations', plainConfigurations);
	} catch (error) {
		console.warn(`Failed to load theme configurations: ${error?.message || String(error)}`);
		nuxtApp.provide('themeConfigurations', {});
	}
});
