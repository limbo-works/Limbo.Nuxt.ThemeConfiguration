import { dimensionUtilities } from '../adapters/uno-helpers';
import { defineThemeRule } from '../rule-helpers/types';

export default defineThemeRule({
	css: (value, context) => context.responsive('borderRadius', value),
	adapters: {
		uno: (value) => ({
			rules: dimensionUtilities(value, 'borderRadius', {
				rounded: 'border-radius',
				'rounded-tl': 'border-top-left-radius',
				'rounded-tr': 'border-top-right-radius',
				'rounded-br': 'border-bottom-right-radius',
				'rounded-bl': 'border-bottom-left-radius',
				'rounded-s': [
					'border-start-start-radius',
					'border-end-start-radius',
				],
				'rounded-e': [
					'border-start-end-radius',
					'border-end-end-radius',
				],
				'rounded-t': [
					'border-top-left-radius',
					'border-top-right-radius',
				],
				'rounded-r': [
					'border-top-right-radius',
					'border-bottom-right-radius',
				],
				'rounded-b': [
					'border-bottom-left-radius',
					'border-bottom-right-radius',
				],
				'rounded-l': [
					'border-top-left-radius',
					'border-bottom-left-radius',
				],
			}),
		}),
	},
});
