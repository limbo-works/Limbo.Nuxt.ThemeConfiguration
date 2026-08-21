export { sanitizeKey, restructureFontSizeObject, cloneDeep, deepmerge };

type GenericRecord = Record<string, unknown>;

function sanitizeKey(key: string | number) {
	return String(key).replace(/[^a-zA-Z0-9]/g, '-');
}

function restructureFontSizeObject(object: GenericRecord): GenericRecord {
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
	return Object.keys(
		typeof object === 'object' ? object : {}
	).reduce<GenericRecord>((newObject: GenericRecord, key) => {
		const objectEntry = object[key] as GenericRecord;
		// We got properties as the outermost shell
		propertyList.forEach((property) => {
			if (objectEntry[property]) {
				// Make base object if it doesn't exist
				if (!newObject[property]) {
					newObject[property] = {};
				}

				// Add the sub objects
				(newObject[property] as GenericRecord)[key] =
					objectEntry[property];
			}
		});
		// We got sizes as the outermost shell
		if (objectEntry.lg || objectEntry.md || objectEntry.sm) {
			if (
				[objectEntry.lg, objectEntry.md, objectEntry.sm]
					.map((val) => typeof val)
					.some((type) => type === 'object')
			) {
				propertyList.forEach((property) => {
					['sm', 'md', 'lg'].forEach((size) => {
						const sizeObject = objectEntry[size] as GenericRecord;
						if (sizeObject?.[property]) {
							// Make base object if it doesn't exist
							if (!newObject[property]) {
								newObject[property] = {};
							}

							// Add the sub objects
							const propertyObject = newObject[
								property
							] as GenericRecord;
							propertyObject[key] =
								(propertyObject[key] as GenericRecord) || {};
							(propertyObject[key] as GenericRecord)[size] =
								sizeObject[property];
						}
					});
				});
			} else {
				newObject.fontSize = newObject.fontSize || {};
				(newObject.fontSize as GenericRecord)[key] = objectEntry;
			}
		}
		return newObject;
	}, {} as GenericRecord);
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
	const cloned: GenericRecord = {};
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			cloned[key] = recursiveClone((obj as GenericRecord)[key]);
		}
	}
	return cloned as T;
}

const isObject = (item: unknown) =>
	item && typeof item === 'object' && !Array.isArray(item);
function deepmerge(target: GenericRecord, ...sources: GenericRecord[]) {
	if (!sources.length) return target;
	const source = sources.shift();
	if (!source) return target;

	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} });
				deepmerge(
					target[key] as GenericRecord,
					source[key] as GenericRecord
				);
			} else {
				Object.assign(target, { [key]: source[key] });
			}
		}
	}

	return deepmerge(target, ...sources);
}
