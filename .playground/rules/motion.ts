import { defineThemeRule } from '../../src/runtime/shared/rules';

export default defineThemeRule({
	css: (value, context) =>
		context.responsive('motion', value, { unit: 'ms', mode: 'step' }),
	adapters: {
		uno: () => ({
			rules: [
				[
					/^duration-theme-(.+)$/,
					([, name]) => ({
						'transition-duration': `var(--theme-motion-${name})`,
					}),
				],
			],
		}),
	},
});
