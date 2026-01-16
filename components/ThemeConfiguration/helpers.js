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

	if (!object || typeof object !== 'object') {
		return {};
	}

	const newObject = {};
	const objectKeys = Object.keys(object);

	for (let i = 0; i < objectKeys.length; i++) {
		const key = objectKeys[i];
		const item = object[key];

		// Process properties directly without forEach
		for (let j = 0; j < propertyList.length; j++) {
			const property = propertyList[j];
			if (item[property]) {
				if (!newObject[property]) {
					newObject[property] = {};
				}
				newObject[property][key] = item[property];
			}
		}

		// Handle size objects
		if (item.lg || item.md || item.sm) {
			const sizeValues = [item.lg, item.md, item.sm];
			let hasObjectSizes = false;
			for (let k = 0; k < sizeValues.length; k++) {
				if (typeof sizeValues[k] === 'object') {
					hasObjectSizes = true;
					break;
				}
			}

			if (hasObjectSizes) {
				const sizes = ['sm', 'md', 'lg'];
				for (let j = 0; j < propertyList.length; j++) {
					const property = propertyList[j];
					for (let k = 0; k < sizes.length; k++) {
						const size = sizes[k];
						if (item[size] && item[size][property]) {
							if (!newObject[property]) {
								newObject[property] = {};
							}
							if (!newObject[property][key]) {
								newObject[property][key] = {};
							}
							newObject[property][key][size] = item[size][property];
						}
					}
				}
			} else {
				if (!newObject.fontSize) {
					newObject.fontSize = {};
				}
				newObject.fontSize[key] = item;
			}
		}
	}

	return newObject;
}

function cloneDeep(object) {
	// Use structuredClone when available (faster and handles more types)
	if (typeof structuredClone !== 'undefined') {
		try {
			return structuredClone(object);
		} catch (error) {
			// structuredClone can throw DOMException for objects containing
			// non-cloneable values (functions, symbols, DOM nodes, etc.)
			// Fall through to manual cloning
		}
	}
	// Fallback for primitives and simple objects
	if (object === null || typeof object !== 'object') {
		return object;
	}
	if (Array.isArray(object)) {
		return object.map(cloneDeep);
	}
	// For objects, avoid JSON stringify for better performance
	const clone = {};
	for (const key in object) {
		// Use Object.hasOwn when available, otherwise just iterate (safer than hasOwnProperty)
		if (typeof Object.hasOwn !== 'undefined' ? Object.hasOwn(object, key) : key in object) {
			clone[key] = cloneDeep(object[key]);
		}
	}
	return clone;
}

const isObject = (item) =>
	item && typeof item === 'object' && !Array.isArray(item);

// More efficient version that avoids unnecessary copies
function deepmerge(target, ...sources) {
	if (!sources.length) return target;

	for (let i = 0; i < sources.length; i++) {
		const source = sources[i];
		if (!source || typeof source !== 'object') continue;

		if (isObject(target) && isObject(source)) {
			for (const key in source) {
				if (isObject(source[key])) {
					if (!target[key]) target[key] = {};
					deepmerge(target[key], source[key]);
				} else {
					target[key] = source[key];
				}
			}
		}
	}

	return target;
}
