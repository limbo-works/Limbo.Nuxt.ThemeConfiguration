export default function getThemeConfigurationSubset(obj, subset) {
	if (!obj || !subset || typeof obj === 'string') return undefined;

	if (typeof subset === 'string') {
		return obj[subset] !== undefined ? { [subset]: obj[subset] } : undefined;
	}

	if (Array.isArray(subset)) {
		let result;
		for (const key of subset) {
			if (obj[key] !== undefined) {
				if (!result) result = {};
				result[key] = obj[key];
			}
		}
		return result;
	}

	if (subset instanceof RegExp) {
		let result;
		for (const key in obj) {
			if (subset.test(key)) {
				if (!result) result = {};
				result[key] = obj[key];
			}
		}
		return result;
	}

	if (typeof subset === 'object') {
		let result;
		for (const key in subset) {
			if (!subset[key]) continue;

			const regexMatch = key.match(/^\/(.*)\/([gimy]*)$/);
			if (regexMatch) {
				const regex = new RegExp(regexMatch[1], regexMatch[2]);
				for (const objKey in obj) {
					if (regex.test(objKey)) {
						const value = typeof subset[key] === 'boolean'
							? obj[objKey]
							: getThemeConfigurationSubset(obj[objKey], subset[key]);
						if (value !== undefined) {
							if (!result) result = {};
							result[objKey] = value;
						}
					}
				}
			} else if (obj[key] !== undefined) {
				const value = typeof subset[key] === 'boolean'
					? obj[key]
					: getThemeConfigurationSubset(obj[key], subset[key]);
				if (value !== undefined) {
					if (!result) result = {};
					result[key] = value;
				}
			}
		}
		return result;
	}

	return undefined;
}
