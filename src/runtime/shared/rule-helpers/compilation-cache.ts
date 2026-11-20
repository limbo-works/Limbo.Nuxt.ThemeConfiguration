import type { ThemeRuleContext } from './types';

export function memoizeCompilation<T>(
	collect: (context: ThemeRuleContext) => T
) {
	const cache = new WeakMap<
		ThemeRuleContext['responsive'],
		Pick<ThemeRuleContext, 'config' | 'rules' | 'options' | 'breaks'> & {
			value: T;
		}
	>();
	return (context: ThemeRuleContext): T => {
		const { config, rules, options, breaks, responsive } = context;
		const entry = cache.get(responsive);
		if (
			entry?.config === config &&
			entry.rules === rules &&
			entry.options === options &&
			entry.breaks === breaks
		)
			return entry.value;
		const value = collect(context);
		// Each compilation creates a new responsive function, shared by its section contexts.
		cache.set(responsive, { config, rules, options, breaks, value });
		return value;
	};
}
