export default function getThemeConfiguration(theme, subset) {
	const nuxtApp = useNuxtApp();
	const { provides } = nuxtApp.vueApp._context;

	let config = undefined;
	if (typeof theme === 'string') {
		const configs = provides['themeConfigurations'] || {};
		if (configs[theme]) {
			config = { ...configs[theme] };
		}
	} else if (typeof theme === 'object') {
		config = { ...theme };
	}

	if (subset) {
		config = getSubsetOfObject(config, subset);
	}

	return config;
}

/* Helper function to get a subset of an object */
function getSubsetOfObject(obj, subset) {
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
									newObj[objKey] = getSubsetOfObject(
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
							newObj[key] = getSubsetOfObject(obj[key], value);
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
