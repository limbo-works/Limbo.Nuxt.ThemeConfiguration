export default function mergeThemeConfigurations(...configs) {
	return Object.assign({}, ...configs);
}
