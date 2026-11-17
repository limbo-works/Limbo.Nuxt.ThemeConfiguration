import { defineThemeConfig } from '../../../src/runtime/shared/normalize-theme-configuration';

export default defineThemeConfig({
	options: {
		round: false,
		minify: false,
	},
	containers: { testCard: '400px', testCardRem: '25rem' },
	spacing: {
		testRamp: { 375: 8, 768: 20, 1440: 36, 1920: 48 },
		testSparse: { 375: 8, 1920: 48 },
		testDescending: { 375: 48, 768: 24, 1440: 24, 1920: 8 },
		testFixed: 12,
		testZero: 0,
	},
	fontSize: {
		testHeading: {
			fontSize: { 375: 24, 1920: 48 },
			fontWeight: { 375: 400, 768: 500, 1440: 700, 1920: 900 },
			lineHeight: { 375: 1.2, 1920: 1.5 },
			letterSpacing: { 375: 0, 1920: '2%' },
			fontFamily: { 375: 'Arial', 1920: 'Times New Roman' },
		},
	},
	backgroundColors: {
		testPanel: [10, 20, 30],
		testPanelAlt: [40, 50, 60],
	},
	textColors: {
		onTestPanelContrast: [230, 240, 250],
		onTestPanelAltContrast: [200, 210, 220],
		testHex: '#123456',
		testComma: '70, 80, 90',
	},
	borderColors: {
		testBorder: [100, 110, 120],
	},
	borderRadius: {
		testCard: { 375: 4, 1920: 20 },
	},
});
