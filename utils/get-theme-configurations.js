export default function getThemeConfigurations() {
	const nuxtApp = useNuxtApp();
	const { provides } = nuxtApp.vueApp._context;
	return provides['themeConfigurations'] || {};
}
