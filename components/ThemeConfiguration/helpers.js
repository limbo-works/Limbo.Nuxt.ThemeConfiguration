export {
	sanitizeKey,
	restructureFontSizeObject,
	cloneDeep,
	getThemeConfigurations,
};

function sanitizeKey(key) {
	return String(key).replace(/[^a-zA-Z0-9]/g, '-');
}

function restructureFontSizeObject(object) {
	const propertyList = [
		'fontFamily',
		'fontWeight',
		'fontSize',
		'fontStyle',
		'lineHeight',
		'letterSpacing',
		'textCase',
		'textDecoration',
		'paragraphSpacing',
		'paragraphIndent',
	];
	return Object.keys(typeof object === 'object' ? object : {}).reduce(
		(newObject, key) => {
			// We got properties as the outermost shell
			propertyList.forEach((property) => {
				if (object[key][property]) {
					// Make base object if it doesn't exist
					if (!newObject[property]) {
						newObject[property] = {};
					}

					// Add the sub objects
					newObject[property][key] = object[key][property];
				}
			});
			// We got sizes as the outermost shell
			if (object[key].lg || object[key].md || object[key].sm) {
				if (
					[object[key].lg, object[key].md, object[key].sm]
						.map((val) => typeof val)
						.some((type) => type === 'object')
				) {
					propertyList.forEach((property) => {
						['sm', 'md', 'lg'].forEach((size) => {
							if (object[key][size][property]) {
								// Make base object if it doesn't exist
								if (!newObject[property]) {
									newObject[property] = {};
								}

								// Add the sub objects
								newObject[property][key] =
									newObject[property][key] || {};
								newObject[property][key][size] =
									object[key][size][property];
							}
						});
					});
				} else {
					newObject.fontSize = newObject.fontSize || {};
					newObject.fontSize[key] = object[key];
				}
			}
			return newObject;
		},
		{}
	);
}

function cloneDeep(object) {
	return JSON.parse(JSON.stringify(object));
}

const globs = await import.meta.glob(
	'~/assets/js/theme-configuration.*.(js|cjs|mjs)',
	{ as: 'json' }
);
async function getThemeConfigurations() {
	const themeConfigurations = {};
	for (const key in globs) {
		const themeName = key.match(/theme-configuration\.([a-z]+)\./)[1];
		themeConfigurations[themeName] = (await globs[key]())?.default;
	}

	return themeConfigurations;
}
