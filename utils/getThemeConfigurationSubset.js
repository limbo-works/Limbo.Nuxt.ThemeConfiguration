export default function getThemeConfigurationSubset(obj, subset) {
	if (typeof obj === 'string') {
		obj = getThemeConfiguration(obj);
	}

	if (!obj || !subset) {
		return undefined;
	}
	const newObj = {};

	if (typeof subset === 'string') {
		// Just a single key
		newObj[subset] = obj[subset];
	} else if (Array.isArray(subset)) {
		// An array of keys (or arrays, or objects, or regexes, etc.)
		subset.forEach((key) => {
			newObj[key] = obj[key];
		});
	} else if (typeof subset === 'object') {
		if (subset instanceof RegExp) {
			// A regex to match keys
			for (const key in obj) {
				if (subset.test(key)) {
					newObj[key] = obj[key];
				}
			}
		} else {
			// An object of keys and/or nested subsets
			for (const key in subset) {
				const value = subset[key];
				if (value) {
					const isRegExp = new RegExp('^/(.*?)/([gimy]*)$');
					if (isRegExp.test(key)) {
						// The key is a regex
						const regExp = new RegExp(
							isRegExp.exec(key)[1],
							isRegExp.exec(key)[2]
						);
						for (const objKey in obj) {
							if (regExp.test(objKey)) {
								if (typeof value === 'boolean') {
									// We just want to include it all
									newObj[objKey] = obj[objKey];
								} else {
									// We have nested subsets!
									newObj[objKey] = getThemeConfigurationSubset(
										obj[objKey],
										value
									);
								}
							}
						}
					} else {
						// Regular key
						if (typeof value === 'boolean') {
							// We just want to include it all
							newObj[key] = obj[key];
						} else {
							// We have nested subsets!
							newObj[key] = getThemeConfigurationSubset(obj[key], value);
						}
					}
				}
			}
		}
	}

	// Remove undefined values and empty objects
	for (const key in newObj) {
		if (
			newObj[key] === undefined ||
			(typeof newObj[key] === 'object' &&
				Object.keys(newObj[key]).length === 0)
		) {
			delete newObj[key];
		}
	}

	// Return a fresh copy
	return JSON.parse(JSON.stringify(newObj));
}
