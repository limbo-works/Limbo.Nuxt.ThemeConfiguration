export {
	sanitizeKey,
	restructureFontSizeObject,
	cloneDeep,
	deepmerge,
	typographyProperties,
};

type GenericRecord = Record<string, unknown>;

function sanitizeKey(key: string | number) {
	return String(key).replace(/[^a-zA-Z0-9]/g, '-');
}

const typographyProperties = [
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
] as const;

function restructureFontSizeObject(
	object: GenericRecord
): Record<string, GenericRecord> {
	const result: Record<string, GenericRecord> = {};
	const add = (property: string, token: string, value: unknown) => {
		(result[property] ??= {})[token] = value;
	};
	for (const [name, entry] of Object.entries(object)) {
		if (typeof entry === 'number') {
			add('fontSize', name, entry);
			continue;
		}
		if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
			throw new Error(
				`themeConfiguration: invalid typography token "${name}".`
			);
		}
		const token = entry as GenericRecord;
		const properties = typographyProperties.filter(
			(property) => property in token
		);
		if (properties.length) {
			for (const property of properties)
				add(property, name, token[property]);
		} else if (
			Object.values(token).some(
				(value) => value && typeof value === 'object'
			)
		) {
			for (const [width, values] of Object.entries(token)) {
				if (
					!values ||
					typeof values !== 'object' ||
					Array.isArray(values)
				) {
					throw new Error(
						`themeConfiguration: invalid typography breakpoint "${width}".`
					);
				}
				for (const property of typographyProperties) {
					const value = (values as GenericRecord)[property];
					if (value === undefined) continue;
					const tokens = (result[property] ??= {});
					const points = (tokens[name] ??= {}) as GenericRecord;
					points[width] = value;
				}
			}
		} else {
			add('fontSize', name, token);
		}
	}
	return result;
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
