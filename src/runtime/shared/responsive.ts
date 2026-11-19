import { sanitizeKey } from './helpers';
import { isRecord } from './normalize-theme-configuration';
import { emptyCss } from './rule-helpers/types';
import type {
	ThemeBreakpoint,
	ThemeCss,
	ThemeResponsiveOptions,
	ThemeRuleContext,
} from './rule-helpers/types';

export interface ThemePoint extends ThemeBreakpoint {
	value: string | number;
}

export function tokenPoints(
	value: unknown,
	breaks: ThemeBreakpoint[]
): ThemePoint[] {
	if (!isRecord(value))
		throw new Error(
			'themeConfiguration: expected responsive token object.'
		);
	const byKey = new Map(
		breaks.flatMap((point) => [
			[point.name, point] as const,
			[String(point.width), point] as const,
		])
	);
	const entries = new Map<number, string | number>();
	for (const [key, entry] of Object.entries(value)) {
		const point = byKey.get(key);
		if (!point) {
			throw new Error(
				`themeConfiguration: token breakpoint "${key}" is not a configured namedBreaks name or width.`
			);
		}
		if (entries.has(point.width))
			throw new Error(
				`themeConfiguration: duplicate token breakpoint "${key}" for width ${point.width}.`
			);
		if (typeof entry !== 'string' && typeof entry !== 'number') {
			throw new Error(
				`themeConfiguration: invalid token value at ${point.width}.`
			);
		}
		entries.set(point.width, entry);
	}
	return breaks.flatMap((point) => {
		const entry = entries.get(point.width);
		if (entry === undefined) return [];
		return [{ ...point, value: entry }];
	});
}

export function numericValue(value: unknown): number {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new Error(
			`themeConfiguration: expected finite numeric dimension, received ${String(value)}.`
		);
	}
	return value;
}

export function valueAt(points: ThemePoint[], width: number): number {
	if (!points.length)
		throw new Error(
			'themeConfiguration: responsive token must have at least one value.'
		);
	const first = points[0]!;
	if (width <= first.width) return numericValue(first.value);
	for (let i = 1; i < points.length; i++) {
		const right = points[i]!;
		const left = points[i - 1]!;
		if (width <= right.width) {
			return (
				numericValue(left.value) +
				((numericValue(right.value) - numericValue(left.value)) *
					(width - left.width)) /
					(right.width - left.width)
			);
		}
	}
	return numericValue(points[points.length - 1]!.value);
}

const precision = (value: number) => Number(value.toFixed(6));

export function generateResponsiveRules(
	context: ThemeRuleContext,
	prefix: string,
	tokens: unknown,
	settings: ThemeResponsiveOptions = {}
): ThemeCss {
	const output = emptyCss();
	if (tokens === undefined) return output;
	if (!isRecord(tokens))
		throw new Error(`themeConfiguration: ${prefix} must be a token map.`);
	const {
		unit = 'px',
		mode = 'fluid',
		transform = (value: number) => value,
		format,
	} = settings;
	const formatted = (value: string | number) =>
		format
			? format(value)
			: `${typeof value === 'number' ? precision(transform(value)) : value}${unit}`;
	const roundTo = context.options.round;
	const rounding =
		typeof roundTo === 'boolean'
			? '1px'
			: typeof roundTo === 'number'
				? `${roundTo}px`
				: roundTo;
	const emit = (rules: string[], property: string, value: string) => {
		rules.push(`${property}: ${value};`);
		if (roundTo && mode === 'fluid') {
			rules.push(
				`@supports (padding: round(1%, ${rounding})) { ${property}: round(${value}, ${rounding}); }`
			);
		}
	};
	for (const [name, token] of Object.entries(tokens)) {
		const property = `--theme-${sanitizeKey(prefix)}-${sanitizeKey(name)}`;
		if (typeof token === 'string' || typeof token === 'number') {
			if (mode === 'fluid') numericValue(token);
			emit(output.base, property, formatted(token));
			continue;
		}
		const points = tokenPoints(token, context.breaks);
		if (!points.length)
			throw new Error(
				`themeConfiguration: ${prefix}.${name} has no breakpoint values.`
			);
		if (mode === 'fluid')
			for (const point of points) numericValue(point.value);
		if (!context.options.disableBreakpointSpecificCustomProperties) {
			for (const point of points) {
				emit(
					output.base,
					`${property}--${point.name}`,
					formatted(point.value)
				);
			}
		}
		if (mode === 'step' || points.length === 1) {
			emit(output.base, property, formatted(points[0]!.value));
			for (let i = 1; i < points.length; i++) {
				const left = points[i - 1]!;
				const right = points[i]!;
				if (left.value === right.value) continue;
				emit(
					(output.media[(left.width + right.width) / 2] ??= []),
					property,
					formatted(right.value)
				);
			}
			continue;
		}
		for (let i = 0; i < points.length - 1; i++) {
			const left = points[i]!;
			const right = points[i + 1]!;
			const start = numericValue(left.value);
			const end = numericValue(right.value);
			const rules =
				i === 0 ? output.base : (output.media[left.width] ??= []);
			if (start === end) {
				emit(rules, property, formatted(start));
				continue;
			}
			const slope = (end - start) / (right.width - left.width);
			const intercept = start - slope * left.width;
			const min = formatted(Math.min(start, end));
			const max = formatted(Math.max(start, end));
			// Font endpoints use rem, while viewport slope stays in CSS pixels.
			const fluid = `${formatted(intercept)} + ${precision(Math.abs(slope))} * ${context.options.viewportWidth}`;
			const preferred =
				slope < 0
					? `${formatted(intercept)} - ${precision(Math.abs(slope))} * ${context.options.viewportWidth}`
					: fluid;
			emit(rules, property, `clamp(${min}, ${preferred}, ${max})`);
		}
	}
	return output;
}
