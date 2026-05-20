export { sanitizeKey, restructureFontSizeObject, cloneDeep, deepmerge };

function sanitizeKey(key: string | number) {
	return String(key).replace(/[^a-zA-Z0-9]/g, '-');
}

function restructureFontSizeObject(
	object: Record<string, any>
): Record<string, any> {
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
	return Object.keys(typeof object === 'object' ? object : {}).reduce<
		Record<string, any>
	>(
		(newObject: Record<string, any>, key) => {
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
		{} as Record<string, any>
	);
}

function cloneDeep<T>(object: T): T {
	if (typeof structuredClone === 'function') {
		try {
			return structuredClone(object);
		} catch (e) {
			// Fall through to recursive clone if structuredClone fails
		}
	}
	return recursiveClone(object);
}

function recursiveClone<T>(obj: T): T {
	// Handle primitives and null
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}

	// Handle Date
	if (obj instanceof Date) {
		return new Date(obj.getTime()) as T;
	}

	// Handle Array
	if (Array.isArray(obj)) {
		return obj.map((item) => recursiveClone(item)) as T;
	}

	// Handle Object
	const cloned: Record<string, any> = {};
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			cloned[key] = recursiveClone(obj[key]);
		}
	}
	return cloned as T;
}

const isObject = (item: any) =>
	item && typeof item === 'object' && !Array.isArray(item);
function deepmerge(
	target: Record<string, any>,
	...sources: Record<string, any>[]
) {
	if (!sources.length) return target;
	const source = sources.shift();
	if (!source) return target;

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
