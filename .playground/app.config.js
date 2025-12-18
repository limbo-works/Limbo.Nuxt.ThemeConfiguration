import { joinRelativeURL } from 'ufo';

const pathParts = import.meta.url.split('/');
pathParts.pop();
const path = pathParts.join('/');

export default defineAppConfig({
	themeConfiguration: {
		themes: [{
			name: 'citiDefault',
			path: joinRelativeURL(path, './assets/js/theme-configuration.default.js'),
		}],
	},
});
