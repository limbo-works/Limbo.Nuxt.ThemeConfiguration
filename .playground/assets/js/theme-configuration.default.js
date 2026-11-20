/*
	The default config should typically be set as the values of
	the main solution. These can then be overwritten by the values
	coming from backend or solution-specific files (handled in the
	ThemeConfiguration.vue component).

	Only the keys in this default file will be the grounds for unocss
	rules - overwriting configurations should never introduce new keys,
	unless they are added to this file too. Only the values of the keys
	are overwritten.
*/
import { defineThemeConfig } from '../../../src/runtime/shared/normalize-theme-configuration.ts';
import verificationTheme from './verification-theme';

export default defineThemeConfig({
	options: {
		// Testing only - set to false when done testing
		minify: false, // Can be turned to false for a more readable output in the style tag
		round: '1px', // Round to nearest pixel
		disableBreakpointSpecificCustomProperties: false, // Enable this setting to disable breakpoint-specific custom properties

		// Breakpoint names used in the config below, mapped to their viewport widths
		namedBreaks: {
			sm: 375, // Lowest value clamp
			tablet: 768,
			md: 1440,
			lg: 1920, // Highest value clamp
		},

		viewportWidth: undefined, // Default to "100dvw", what to base scalings on. A string inserted in the CSS, e.g. "100dvw" or "var(--my-width, 100vw)".

		// Setup
		baseFontSize: 16, // For rem conversion
	},

	spacing: {
		...verificationTheme.spacing,
		demo: { 375: 8, 768: 20, 1440: 36, 1920: 48 },
	},
	testDisabled: { unused: 99 },
	motion: {
		fast: 120,
	},

	layout: {
		margin: {
			375: 16,
			1440: 96,
			1920: 124,
		},

		gutter: {
			375: 16,
			1440: 24,
			1920: 32,
		},

		// The max value that the design can be scaled to (single value).
		// The max will impact columns max scaling as well.
		// undefined equals no max.
		max: undefined,
	},

	// Rules
	colors: {
		/*
			CSS variables will be created and used for the colors,
			which will in turn be used in the UnoCSS config. Keys
			will be directly transfered to the UnoCSS config.

			"primary: '#000000'" will result in the UnoCSS rule:
			"primary: var(--theme-colors-primary, #000000)"

			If configuring a color with three comma-separated numbers,
			the built-in UnoCSS color opacities will be used in the
			rules.
		*/
		// Core text and surface colors
		onSurface: [33, 33, 33],
		onSurfaceInverse: [255, 255, 255],
		onSurfaceVariant: [73, 73, 73],

		// Primary variant
		onSurfacePrimary: [251, 251, 254],
		onSurfacePrimarySubtle: [96, 89, 179],
		onSurfacePrimaryMedium: [117, 114, 188],

		// Secondary variant
		onSurfaceSecondary: [255, 255, 255],
		onSurfaceSecondarySubtle: [207, 124, 97],
		onSurfaceSecondaryMedium: [193, 114, 89],

		// Success variant
		onSurfaceSuccess: [255, 255, 255],
		onSurfaceSuccessSubtle: [76, 175, 80],
		onSurfaceSuccessMedium: [56, 142, 60],

		// Danger variant
		onSurfaceDanger: [255, 255, 255],
		onSurfaceDangerSubtle: [189, 109, 114],
		onSurfaceDangerMedium: [211, 47, 47],

		// Warning variant
		onSurfaceWarning: [255, 255, 255],
		onSurfaceWarningSubtle: [255, 152, 0],
		onSurfaceWarningMedium: [245, 127, 23],

		// Info variant
		onSurfaceInfo: [255, 255, 255],
		onSurfaceInfoSubtle: [2, 136, 209],
		onSurfaceInfoMedium: [3, 155, 229],

		// Fish stick theme
		onSurfaceFishStick: [33, 33, 33],

		// Legacy support
		onPrimaryStrong: [251, 251, 254],
		onPrimaryMedium: [209, 214, 250],
		'on-primary-medium': [209, 214, 250],
		onFishStickStrong: [0, 0, 0],
	},

	backgroundColors: {
		...verificationTheme.backgroundColors,
		surface: [255, 255, 255],
		surfaceVariant: [240, 240, 240],
		surfaceInverse: [33, 33, 33],

		primary: [75, 67, 190],
		primarySubtle: [230, 224, 250],
		primaryMedium: [117, 110, 200],

		secondary: [255, 87, 34],
		secondarySubtle: [255, 224, 178],
		secondaryMedium: [255, 152, 0],

		success: [76, 175, 80],
		successSubtle: [200, 230, 201],
		successMedium: [129, 199, 132],

		danger: [244, 67, 54],
		dangerSubtle: [255, 205, 210],
		dangerMedium: [229, 57, 53],

		warning: [255, 152, 0],
		warningSubtle: [255, 243, 224],
		warningMedium: [251, 188, 5],

		info: [33, 150, 243],
		infoSubtle: [227, 242, 253],
		infoMedium: [66, 165, 245],

		fishStick: [255, 255, 255],
	},

	textColors: {
		...verificationTheme.textColors,
		onSurface: [33, 33, 33],
		onSurfaceInverse: [255, 255, 255],
		onSurfaceVariant: [97, 97, 97],

		onPrimarySubtle: [96, 89, 179],
		onPrimaryMedium: [0, 0, 255],
		onPrimaryStrong: [117, 114, 188],
		onPrimaryExtraStrong: [140, 147, 198],

		onSecondarySubtle: [207, 124, 97],
		onSecondaryMedium: [193, 114, 89],

		onSuccessSubtle: [76, 175, 80],
		onSuccessMedium: [56, 142, 60],

		onDangerSubtle: [189, 109, 114],
		onDangerMedium: [211, 47, 47],

		onWarningSubtle: [255, 152, 0],
		onWarningMedium: [245, 127, 23],

		onInfoSubtle: [2, 136, 209],
		onInfoMedium: [3, 155, 229],
	},

	borderColors: {
		...verificationTheme.borderColors,
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

	containers: {
		...verificationTheme.containers,
		fish: '1000px',
	},

	// fontSize (and lineHeight and letterSpacing) is a special setup, as special rules are generated
	fontSize: {
		...verificationTheme.fontSize,
		h1: {
			fontSize: {
				375: 30,
				1440: 48,
				1920: 64,
			},
			lineHeight: {
				375: 1.2,
				1440: 1.2,
				1920: 1.2,
			},
			letterSpacing: {
				375: 0,
				1440: 0.1,
				1920: 0,
			},
		},
		h2: {
			fontSize: {
				375: 25,
				1440: 36,
				1920: 48,
			},
			lineHeight: {
				375: 1.2,
				1440: 1.2,
				1920: 1.2,
			},
			letterSpacing: {
				375: 0.025,
				1440: 0.05,
				1920: 0,
			},
		},
		h3: {
			fontSize: {
				375: 18,
				1440: 24,
				1920: 32,
			},
			lineHeight: {
				375: 1.4,
				1440: 1.2,
				1920: 1.2,
			},
			letterSpacing: {
				375: 0,
				1440: 0.05,
				1920: 0.05,
			},
		},
		h4: {
			fontSize: {
				375: 16,
				1440: 20,
				1920: 24,
			},
			lineHeight: {
				375: 1.4,
				1440: 1.4,
				1920: 1.4,
			},
			letterSpacing: {
				375: 0.01,
				1440: 0.01,
				1920: 0.01,
			},
		},
		h5: {
			fontSize: {
				375: 16,
				1440: 20,
				1920: 24,
			},
			lineHeight: {
				375: 1.4,
				1440: 1.4,
				1920: 1.4,
			},
			letterSpacing: {
				375: 0.01,
				1440: 0.01,
				1920: 0.01,
			},
		},
		body1: {
			fontSize: {
				375: 16,
				1440: 20,
				1920: 24,
			},
			lineHeight: {
				375: 1.4,
				1440: 1.4,
				1920: 1.4,
			},
			letterSpacing: {
				375: 0.02,
				1440: 0.02,
				1920: 0.025,
			},
		},
		body2: {
			fontSize: {
				375: 14,
				1440: 16,
				1920: 20,
			},
			lineHeight: {
				375: 1.4,
				1440: 1.4,
				1920: 1.4,
			},
			letterSpacing: {
				375: 0.02,
				1440: 0.02,
				1920: 0.025,
			},
		},
		button: {
			fontSize: {
				375: 16,
				1440: 16,
				1920: 20,
			},
			lineHeight: {
				375: 1.4,
				1440: 1.4,
				1920: 1.4,
			},
			letterSpacing: {
				375: 0.025,
				1440: 0.025,
				1920: 0.025,
			},
		},
		caption: {
			fontSize: {
				375: 12,
				1440: 12,
				1920: 14,
			},
			lineHeight: {
				375: 1.2,
				1440: 1.2,
				1920: 1.2,
			},
			letterSpacing: {
				375: 0.025,
				1440: 0.025,
				1920: 0.05,
			},
		},
		overline: {
			fontSize: {
				375: 10,
				1440: 10,
				1920: 12,
			},
			lineHeight: {
				375: 1.2,
				1440: 1.2,
				1920: 1.2,
			},
			letterSpacing: {
				375: 0.5,
				1440: 0.5,
				1920: 0,
			},
		},
	},

	borderRadius: {
		...verificationTheme.borderRadius,
	},
});
