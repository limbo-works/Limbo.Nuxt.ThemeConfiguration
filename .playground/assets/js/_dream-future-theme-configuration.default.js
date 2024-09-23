/* Note: This file is just to examplify structure for a future config file */
export default defineThemeConfig({
	options: {
		minify: true,
		round: '1px',

		namedBreaks: {
			sm: 375,
			md: 1440,
			lg: 1920,
		},

		baseFontSize: 16,

		handlers: {
			colors: myCustomColorsHandler,
		},
	},

	// Rules
	colors: {
		text: '#000000',
		onPrimaryStrong: [251, 251, 254],
		onPrimaryMedium: [209, 214, 250],
		'on-primary-medium': [209, 214, 250],
		onFishStickStrong: [0, 0, 0],
		onFishStickMediumFried: [0, 0, 0],
		'on-fishStick-oldAndMusky': [0, 0, 0],
		'on-test-test-another-test': [0, 0, 0],
		onSurfaceDanger: [100, 100, 100],
	},

	background: {
		simple: [75, 67, 190],
		fancy: 'linear-gradient(#e66465, #9198e5)',
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
			375: 16,
			1440: 96,
			1920: 124,
		},

		gutter: {
			375: 16,
			1440: 24,
			1920: 32,
		},

		columns: {
			375: 8,
			1440: 12,
			1920: 12,
		},

		max: undefined,
	},

	containers: {
		fish: '1000px',
	},

	horizontalSpacing: {
		'xs/h': {
			375: 8,
			1440: 8,
			1920: 12,
		},
		'sm/h': {
			375: 16,
			1440: 16,
			1920: 20,
		},
		'md/h': {
			375: 24,
			1440: 24,
			1920: 32,
		},
		'lg/h': {
			375: 28,
			1440: 32,
			1920: 44,
		},
		'xl/h': {
			375: 32,
			1440: 48,
			1920: 64,
		},
		'2xl/h': {
			375: 48,
			1440: 64,
			1920: 88,
		},
		'3xl/h': {
			375: 64,
			1440: 96,
			1920: 128,
		},
	},

	verticalSpacing: {
		'xs/v': {
			375: 8,
			1440: 8,
			1920: 12,
		},
		'sm/v': {
			375: 16,
			1440: 16,
			1920: 20,
		},
		'md/v': {
			375: 24,
			1440: 24,
			1920: 32,
		},
		'lg/v': {
			375: 28,
			1440: 32,
			1920: 44,
		},
		'xl/v': {
			375: 32,
			1440: 48,
			1920: 64,
		},
		'2xl/v': {
			375: 48,
			1440: 64,
			1920: 88,
		},
		'3xl/v': {
			375: 64,
			1440: 96,
			1920: 128,
		},
	},

	fontSize: {
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
				375: -0.5,
				1440: -1,
				1920: -0.5,
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
				375: -0.25,
				1440: -0.5,
				1920: -1,
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
				1440: -0.5,
				1920: -0.5,
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
				375: -0.1,
				1440: -0.1,
				1920: -0.1,
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
				375: -0.1,
				1440: -0.1,
				1920: -0.1,
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
				375: -0.2,
				1440: -0.2,
				1920: -0.25,
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
				375: -0.2,
				1440: -0.2,
				1920: -0.25,
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
				375: 0.25,
				1440: 0.25,
				1920: 0.25,
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
				375: 0.25,
				1440: 0.25,
				1920: 0.5,
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
				375: 1.5,
				1440: 1.5,
				1920: 2,
			},
		},
	},
});

//
function defineThemeConfig(obj) {
	return obj;
}

function myCustomColorsHandler() {}
