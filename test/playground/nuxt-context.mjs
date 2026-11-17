import { ref } from 'vue';
export { useHead } from '@unhead/vue';

let nuxtApp;
let states;

export function resetNuxtContext() {
	states = new Map();
	nuxtApp = {
		provide(name, value) {
			this[`$${name}`] = value;
		},
	};
	return nuxtApp;
}

export function useNuxtApp() {
	return nuxtApp;
}

export function useState(key) {
	if (!states.has(key)) states.set(key, ref(0));
	return states.get(key);
}

export function useRuntimeConfig() {
	return {
		public: {
			themeConfiguration: { minify: true, viewportWidth: '100dvw' },
		},
	};
}

export function useAppConfig() {
	return {
		themeConfiguration: {
			themes: [
				{
					name: 'citiDefault',
					path: '~/assets/js/theme-configuration.default.js',
				},
			],
		},
	};
}

export const defineNuxtPlugin = (plugin) => plugin;
