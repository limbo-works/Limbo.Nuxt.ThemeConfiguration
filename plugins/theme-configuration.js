export default defineNuxtPlugin(async (nuxtApp) => {
	const themeConfigurations = await nuxtApp.runWithContext(async () => ((await getThemeConfigurationsAsync()) || {}));
	nuxtApp.provide('themeConfigurations', themeConfigurations);
});
