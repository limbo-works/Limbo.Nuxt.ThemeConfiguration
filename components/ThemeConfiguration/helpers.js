export { sanitizeKey, restructureFontSizeObject, cloneDeep, deepmerge };

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

const isObject = (item) =>
	item && typeof item === 'object' && !Array.isArray(item);
function deepmerge(target, ...sources) {
	if (!sources.length) return target;
	const source = sources.shift();

	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} });
				deepmerge(target[key], source[key]);
			} else {
				Object.assign(target, { [key]: source[key] });
			}
		}
	}

	return deepmerge(target, ...sources);
}
