/*
	The default config should typically be set as the values of
	the main solution. These can then be overwritten by the values
	coming from backend or solution-specific files (handled in the
	ThemeConfiguration.vue component).

	Only the keys in this default file will be the grounds for tailwind
	rules - overwriting configurations should never introduce new keys,
	unless they are added to this file too. Only the values of the keys
	are overwritten.
*/
export default {
	// Testing only - set to false when done testing
	minify: false, // Can be turned to false for a more readable output in the style tag

	// Rules
	colors: {
		onPrimaryStrong: [0, 0, 0],
		onPrimaryMedium: [0, 0, 0],
		'on-primary-medium': [0, 0, 0],
	},
	backgroundColors: {
		primary: [255, 255, 255],
	},
	textColors: {
		onPrimarySubtle: [0, 0, 0],
		onPrimaryMedium: [0, 0, 0],
		onPrimaryStrong: [0, 0, 0],
		onPrimaryExtraStrong: [0, 0, 0],
	},
	borderColors: {
		onPrimarySubtle: [0, 0, 0],
		onPrimaryMedium: [0, 0, 0],
		onPrimaryStrong: [0, 0, 0],
		onPrimaryExtraStrong: [0, 0, 0],
		onPrimaryInteractive: [0, 0, 0],
		onPrimaryDanger: [255, 0, 0],
	},

	layout: {
		margin: {
			sm: 0,
			md: 0,
			lg: 0,
		},
	},
};
