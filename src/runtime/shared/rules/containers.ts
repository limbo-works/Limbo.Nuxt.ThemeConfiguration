import { defineThemeRule } from '../rule-helpers/types';
import { containerQueries } from '../adapters/container-queries';

export default defineThemeRule({
	adapters: {
		uno: containerQueries,
	},
});
