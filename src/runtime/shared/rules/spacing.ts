import { dimensionUtilities } from '../adapters/uno-helpers';
import { defineThemeRule } from '../rule-helpers/types';

export default defineThemeRule({
	css: (value, context) => context.responsive('spacing', value),
	adapters: {
		uno: (value) => ({ rules: dimensionUtilities(value, 'spacing') }),
	},
});
