/*
	Example configuration with disableBreakpointSpecificCustomProperties enabled.
	This configuration will not generate --sm, --md, and --lg custom properties.
	Instead, values will be hardcoded directly into clamp functions.
*/
export default {
	// Enable this setting to disable breakpoint-specific custom properties
	disableBreakpointSpecificCustomProperties: true,

	// Testing and setup
	minify: false, // Set to false for readable output
	round: '1px',

	// Setup
	baseFontSize: 16,
	smViewport: 375,
	mdViewport: 1440,
	lgViewport: 1920,

	// Rules
	colors: {
		text: '#000000',
		primary: [75, 67, 190],
		secondary: [255, 100, 50],
	},

	spacing: {
		// These will not generate --theme-spacing-small--sm, --md, --lg properties
		// Values will be hardcoded into clamps instead
		small: {
			sm: 8,
			md: 12,
			lg: 16,
		},
		medium: {
			sm: 16,
			md: 24,
			lg: 32,
		},
		large: {
			sm: 24,
			md: 36,
			lg: 48,
		},
	},

	fontSize: {
		// Font sizes will also not generate breakpoint-specific properties
		body: {
			sm: 14,
			md: 16,
			lg: 18,
		},
		heading: {
			sm: 24,
			md: 32,
			lg: 40,
		},
	},

	layout: {
		margin: {
			sm: 16,
			md: 32,
			lg: 48,
		},
		gutter: {
			sm: 12,
			md: 24,
			lg: 32,
		},
		columns: {
			sm: 4,
			md: 12,
			lg: 12,
		},
		max: 1920,
	},

	borderRadius: {
		small: {
			sm: 4,
			md: 6,
			lg: 8,
		},
		medium: {
			sm: 8,
			md: 12,
			lg: 16,
		},
	},
};
