import type { Variant, PresetMiniTheme as Theme } from 'unocss';
import { isRecord } from '../normalize-theme-configuration';
import type { ThemeUnoOutput } from './uno.types';

const lengthPattern =
	/^(\d*\.?\d+)(px|rem|em|ch|ex|cap|ic|lh|rlh|cm|mm|in|pt|pc|q)$/i;

function length(value: string) {
	const match = lengthPattern.exec(value);
	if (!match) return undefined;
	const amount = Number(match[1]);
	if (!Number.isFinite(amount)) return undefined;
	return { amount, unit: match[2]!.toLowerCase() };
}

export function containerQueries(value: unknown = {}): ThemeUnoOutput {
	if (!isRecord(value))
		throw new Error('themeConfiguration: containers must be a map.');
	const containers: Record<string, string> = {};
	for (const [name, width] of Object.entries(value)) {
		if (
			!/^[\w-]+$/.test(name) ||
			name.startsWith('lt-') ||
			name === 'container' ||
			typeof width !== 'string' ||
			!length(width)
		)
			throw new Error(
				`themeConfiguration: invalid container "${name}"; use a named CSS length such as "640px" or "32rem".`
			);
		containers[name] = width;
	}
	const suggestions = Object.keys(containers).flatMap((name) => [
		`@${name}:`,
		`@lt-${name}:`,
	]);
	const variant: Variant<Theme> = {
		name: 'theme-container',
		order: -1,
		multiPass: true,
		match(matcher, context) {
			if (/^@container(?:[/:]|$)/.test(matcher)) return;
			const match =
				/^@(lt-)?(\[[^\]]+\]|[\w.-]+)(?:\/([a-zA-Z_][\w-]*))?:(.*)$/.exec(
					matcher
				);
			if (!match) return;
			const [, less, token, label, rest] = match;
			if (!token) return;
			const raw =
				context.theme.containers?.[token] ??
				(/^\d+(?:\.\d+)?$/.test(token)
					? `${token}px`
					: token.startsWith('[')
						? token.slice(1, -1)
						: token);
			if (typeof raw !== 'string') return;
			const size = length(raw);
			if (!size) return;
			const threshold = less
				? Number((size.amount - 0.1).toFixed(10))
				: size.amount;
			const condition = `(${less ? 'max' : 'min'}-width: ${threshold}${size.unit})`;
			const sortWidth =
				size.amount *
				(size.unit === 'rem' || size.unit === 'em' ? 16 : 1);
			return {
				matcher: rest,
				handle: (input, next) =>
					next({
						...input,
						parent: `${input.parent ? `${input.parent} $$ ` : ''}@container${label ? ` ${label}` : ''} ${condition}`,
						parentOrder: 1000 + (less ? -sortWidth : sortWidth),
					}),
			};
		},
		autocomplete: [
			(input) =>
				suggestions.filter((suggestion) =>
					suggestion.startsWith(input)
				),
			'@<num>:',
			'@(lt)-<num>:',
		],
	};
	return {
		theme: { containers },
		rules: [
			[
				/^@container(?:\/([a-zA-Z_][\w-]*))?$/,
				([, name]) => ({
					'container-type': 'inline-size',
					...(name ? { 'container-name': name } : {}),
				}),
				{ autocomplete: '@container' },
			],
		],
		variants: [variant],
	};
}
