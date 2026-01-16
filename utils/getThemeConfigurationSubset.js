export default function getThemeConfigurationSubset(obj, subset) {
	if (!obj || !subset || typeof obj === 'string') return undefined;

	if (typeof subset === 'string') {
		return obj[subset] !== undefined ? { [subset]: obj[subset] } : undefined;
	}

	if (Array.isArray(subset)) {
		const result = {};
		for (const key of subset) {
			if (obj[key] !== undefined) result[key] = obj[key];
		}
		return Object.keys(result).length ? result : undefined;
	}

	if (subset instanceof RegExp) {
		const result = {};
		for (const key in obj) {
			if (subset.test(key)) result[key] = obj[key];
		}
		return Object.keys(result).length ? result : undefined;
	}

	if (typeof subset === 'object') {
		const result = {};
		for (const key in subset) {
			if (!subset[key]) continue;

			const regexMatch = key.match(/^\/(.*)\/([gimy]*)$/);
			if (regexMatch) {
				const regex = new RegExp(regexMatch[1], regexMatch[2]);
				for (const objKey in obj) {
					if (regex.test(objKey)) {
						result[objKey] = typeof subset[key] === 'boolean'
							? obj[objKey]
							: getThemeConfigurationSubset(obj[objKey], subset[key]);
					}
				}
			} else if (obj[key] !== undefined) {
				result[key] = typeof subset[key] === 'boolean'
					? obj[key]
					: getThemeConfigurationSubset(obj[key], subset[key]);
			}
		}

		// Filter undefined values
		for (const key in result) {
			if (result[key] === undefined || (typeof result[key] === 'object' && Object.keys(result[key] || {}).length === 0)) {
				delete result[key];
			}
		}

		return Object.keys(result).length ? result : undefined;
	}

	return undefined;
}
