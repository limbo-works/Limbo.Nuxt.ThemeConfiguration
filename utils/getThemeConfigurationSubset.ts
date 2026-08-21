import type {
	ThemeConfiguration,
	ThemeSubset,
} from './theme-configuration.types';

export default function getThemeConfigurationSubset(
	obj: ThemeConfiguration | undefined,
	subset: ThemeSubset | undefined
): ThemeConfiguration | undefined {
	if (!obj || !subset || typeof obj === 'string') return undefined;

	if (typeof subset === 'string') {
		return obj[subset] !== undefined
			? { [subset]: obj[subset] }
			: undefined;
	}

	if (Array.isArray(subset)) {
		let result: ThemeConfiguration | undefined;
		for (const key of subset) {
			if (obj[key] !== undefined) {
				if (!result) result = {};
				result[key] = obj[key]!;
			}
		}
		return result;
	}

	if (subset instanceof RegExp) {
		let result: ThemeConfiguration | undefined;
		for (const key in obj) {
			if (subset.test(key)) {
				if (!result) result = {};
				result[key] = obj[key]!;
			}
		}
		return result;
	}

	if (typeof subset === 'object') {
		let result: ThemeConfiguration | undefined;
		for (const key in subset) {
			if (!subset[key]) continue;

			const regexMatch = key.match(/^\/(.*)\/([gimy]*)$/);
			if (regexMatch?.[1]) {
				const regex = new RegExp(regexMatch[1], regexMatch[2]);
				for (const objKey in obj) {
					if (regex.test(objKey)) {
						const subsetValue = subset[key];
						const value =
							typeof subsetValue === 'boolean'
								? obj[objKey]
								: getThemeConfigurationSubset(
										obj[objKey] as ThemeConfiguration,
										subsetValue
									);
						if (value !== undefined) {
							if (!result) result = {};
							result[objKey] =
								value as ThemeConfiguration[keyof ThemeConfiguration];
						}
					}
				}
			} else if (obj[key] !== undefined) {
				const subsetValue = subset[key];
				const value =
					typeof subsetValue === 'boolean'
						? obj[key]
						: getThemeConfigurationSubset(
								(obj[key] as ThemeConfiguration) || undefined,
								subsetValue
							);
				if (value !== undefined) {
					if (!result) result = {};
					result[key] =
						value as ThemeConfiguration[keyof ThemeConfiguration];
				}
			}
		}
		return result;
	}

	return undefined;
}
