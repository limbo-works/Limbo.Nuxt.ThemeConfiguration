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
	minify: true, // Can be turned to false for a more readable output in the style tag

	// Setup
	baseFontSize: 16, // For rem conversion
	smViewport: 375, // Lowest value clamp
	mdViewport: 1440, // Midpoint (used for both low-clamp and high-clamp)
	lgViewport: 1920, // Highest value clamp

	// Rules
	colors: {
		/*
			CSS variables will be created and used for the colors,
			which will in turn be used in the Tailwind config. Keys
			will be directly transfered to the Tailwind config.

			"primary: '#000000'" will result in the Tailwind rule:
			"primary: var(--theme-colors-primary, #000000)"

			If configuring a color with three comma-separated numbers,
			the built-in Tailwind color opacities will be used in the
			rules.
		*/
		text: '#000000',
		onPrimaryStrong: [251, 251, 254],
		onPrimaryMedium: [209, 214, 250],
		'on-primary-medium': [209, 214, 250],
		onFishStickStrong: [0, 0, 0],
		onFishStickMediumFried: [0, 0, 0],
		'on-fishStick-oldAndMusky': [0, 0, 0],
		'on-test-test-another-test': [0, 0, 0],
		onSurfaceDanger: [100, 100, 100],
		// ...other colors here
	},

	backgroundColors: {
		primary: [75, 67, 190],
		fishStick: [255, 255, 255],
		'test-test': [255, 255, 255],
	},
	textColors: {
		onPrimarySubtle: [96, 89, 179],
		onPrimaryMedium: [0, 0, 255],
		onPrimaryStrong: [117, 114, 188],
		onPrimaryExtraStrong: [140, 147, 198],
		'test-textColors': [140, 147, 198],
	},
	borderColors: {
		onPrimarySubtle: [96, 89, 179],
		onPrimaryMedium: [104, 98, 183],
		onPrimaryStrong: [117, 114, 188],
		onPrimaryExtraStrong: [140, 147, 198],
		onPrimaryInteractive: [245, 245, 255],
		onPrimaryDanger: [157, 43, 63],
		onSurfaceSubtle: [205, 206, 218],
		onSurfaceMedium: [195, 196, 209],
		onSurfaceStrong: [178, 179, 193],
		onSurfaceExtraStrong: [145, 146, 162],
		onSurfaceInteractive: [62, 50, 171],
		onSurfaceDanger: [157, 43, 63],
		onSurfaceVariantSubtle: [184, 188, 215],
		onSurfaceVariantMedium: [174, 176, 205],
		onSurfaceVariantStrong: [155, 157, 189],
		onSurfaceVariantExtraStrong: [119, 121, 156],
		onSurfaceVariantInteractive: [62, 50, 171],
		onSurfaceVariantDanger: [157, 43, 63],
		onPrimaryVariantSubtle: [117, 116, 207],
		onPrimaryVariantMedium: [128, 128, 214],
		onPrimaryVariantStrong: [147, 147, 224],
		onPrimaryVariantExtraStrong: [181, 188, 246],
		onPrimaryVariantInteractive: [251, 251, 254],
		onPrimaryVariantDanger: [254, 250, 250],
		onCanvasSubtle: [223, 223, 223],
		onCanvasMedium: [206, 206, 206],
		onCanvasStrong: [173, 173, 173],
		onCanvasExtraStrong: [133, 133, 133],
		onCanvasInteractive: [75, 67, 190],
		onCanvasDanger: [157, 43, 63],
		onSecondarySubtle: [207, 124, 97],
		onSecondaryMedium: [193, 114, 89],
		onSecondaryStrong: [171, 99, 76],
		onSecondaryExtraStrong: [129, 70, 51],
		onSecondaryInteractive: [52, 24, 16],
		onSecondaryDanger: [134, 31, 51],
		onDangerSubtle: [189, 109, 114],
		onDangerMedium: [200, 127, 132],
		onDangerStrong: [219, 159, 162],
		onDangerExtraStrong: [253, 224, 225],
		onDangerInteractive: [254, 250, 250],
		onDangerDanger: [254, 250, 250],
	},

	layout: {
		margin: {
			sm: 16,
			md: 96,
			lg: 124,
		},

		gutter: {
			sm: 16,
			md: 24,
			lg: 32,
		},

		// These rules will be turned into `X/Ycol` rules, which can then be used like `w-3/12col`.
		// There should always be at least one column, both on sm, md and lg.
		columns: {
			sm: 8,
			md: 12,
			lg: 12,
		},

		// The max value that the design can be scaled to (single value, not sm-md-lg).
		// The max will impact columns max scaling as well.
		// undefined equals no max.
		max: undefined,
	},

	horizontalSpacing: {
		'xs/h': {
			sm: 8,
			md: 8,
			lg: 12,
		},
		'sm/h': {
			sm: 16,
			md: 16,
			lg: 20,
		},
		'md/h': {
			sm: 24,
			md: 24,
			lg: 32,
		},
		'lg/h': {
			sm: 28,
			md: 32,
			lg: 44,
		},
		'xl/h': {
			sm: 32,
			md: 48,
			lg: 64,
		},
		'2xl/h': {
			sm: 48,
			md: 64,
			lg: 88,
		},
		'3xl/h': {
			sm: 64,
			md: 96,
			lg: 128,
		},
	},

	verticalSpacing: {
		'xs/v': {
			sm: 8,
			md: 8,
			lg: 12,
		},
		'sm/v': {
			sm: 16,
			md: 16,
			lg: 20,
		},
		'md/v': {
			sm: 24,
			md: 24,
			lg: 32,
		},
		'lg/v': {
			sm: 28,
			md: 32,
			lg: 44,
		},
		'xl/v': {
			sm: 32,
			md: 48,
			lg: 64,
		},
		'2xl/v': {
			sm: 48,
			md: 64,
			lg: 88,
		},
		'3xl/v': {
			sm: 64,
			md: 96,
			lg: 128,
		},
	},

	// fontSize (and lineHeight and letterSpacing) is a special setup, as special rules are generated
	fontSize: {
		h1: {
			fontSize: {
				sm: 30,
				md: 48,
				lg: 64,
			},
			lineHeight: {
				sm: 1.2,
				md: 1.2,
				lg: 1.2,
			},
			letterSpacing: {
				sm: -0.5,
				md: -1,
				lg: -0.5,
			},
		},
		h2: {
			fontSize: {
				sm: 25,
				md: 36,
				lg: 48,
			},
			lineHeight: {
				sm: 1.2,
				md: 1.2,
				lg: 1.2,
			},
			letterSpacing: {
				sm: -0.25,
				md: -0.5,
				lg: -1,
			},
		},
		h3: {
			fontSize: {
				sm: 18,
				md: 24,
				lg: 32,
			},
			lineHeight: {
				sm: 1.4,
				md: 1.2,
				lg: 1.2,
			},
			letterSpacing: {
				sm: 0,
				md: -0.5,
				lg: -0.5,
			},
		},
		h4: {
			fontSize: {
				sm: 16,
				md: 20,
				lg: 24,
			},
			lineHeight: {
				sm: 1.4,
				md: 1.4,
				lg: 1.4,
			},
			letterSpacing: {
				sm: -0.1,
				md: -0.1,
				lg: -0.1,
			},
		},
		h5: {
			fontSize: {
				sm: 16,
				md: 20,
				lg: 24,
			},
			lineHeight: {
				sm: 1.4,
				md: 1.4,
				lg: 1.4,
			},
			letterSpacing: {
				sm: -0.1,
				md: -0.1,
				lg: -0.1,
			},
		},
		body1: {
			fontSize: {
				sm: 16,
				md: 20,
				lg: 24,
			},
			lineHeight: {
				sm: 1.4,
				md: 1.4,
				lg: 1.4,
			},
			letterSpacing: {
				sm: -0.2,
				md: -0.2,
				lg: -0.25,
			},
		},
		body2: {
			fontSize: {
				sm: 14,
				md: 16,
				lg: 20,
			},
			lineHeight: {
				sm: 1.4,
				md: 1.4,
				lg: 1.4,
			},
			letterSpacing: {
				sm: -0.2,
				md: -0.2,
				lg: -0.25,
			},
		},
		button: {
			fontSize: {
				sm: 16,
				md: 16,
				lg: 20,
			},
			lineHeight: {
				sm: 1.4,
				md: 1.4,
				lg: 1.4,
			},
			letterSpacing: {
				sm: 0.25,
				md: 0.25,
				lg: 0.25,
			},
		},
		caption: {
			fontSize: {
				sm: 12,
				md: 12,
				lg: 14,
			},
			lineHeight: {
				sm: 1.2,
				md: 1.2,
				lg: 1.2,
			},
			letterSpacing: {
				sm: 0.25,
				md: 0.25,
				lg: 0.5,
			},
		},
		overline: {
			fontSize: {
				sm: 10,
				md: 10,
				lg: 12,
			},
			lineHeight: {
				sm: 1.2,
				md: 1.2,
				lg: 1.2,
			},
			letterSpacing: {
				sm: 1.5,
				md: 1.5,
				lg: 2,
			},
		},
	},

	borderRadius: {
		/* to be added */
	},
};
