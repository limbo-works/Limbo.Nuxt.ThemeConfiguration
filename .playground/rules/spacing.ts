import { defineThemeRule, spacing } from '../../src/runtime/shared/rules';

export default defineThemeRule({
	...spacing,
	css(value, context) {
		const result = spacing.css(value, context);
		result.base.push('--playground-spacing-plugin: 1;');
		return result;
	},
});
