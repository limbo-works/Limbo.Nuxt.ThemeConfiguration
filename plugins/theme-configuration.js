export default defineNuxtPlugin(async (nuxtApp) => {
	const themeConfigurations = (await getThemeConfigurationsAsync()) || {};
	nuxtApp.provide('themeConfigurations', themeConfigurations);
});
