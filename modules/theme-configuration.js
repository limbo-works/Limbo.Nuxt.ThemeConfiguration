import { defineNuxtModule } from '@nuxt/kit';

export default defineNuxtModule({
	meta: {
		name: '@limbo-works/theme-configuration',
	},

	defaults: {
		layers: false,
	},

	setup(options, nuxt) {
		for (const layer of nuxt.options._layers) {
		  // You can check for a custom directory existence to extend for each layer
		  console.log(layer.cwd);
		}
	},
});
