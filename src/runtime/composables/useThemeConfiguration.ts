import { computed, isRef, watch, type Ref } from 'vue';
import { useState } from '#app';
import { useHead } from '#imports';
import rules from '#theme-configuration/rules';
import { sanitizeKey } from '../shared/helpers';
import { generateThemeCss, mergeThemeConfigs } from '../shared/theme-engine';
import { normalizeThemeConfiguration } from '../shared/normalize-theme-configuration';
import getThemeModuleOptions from '../utils/getThemeModuleOptions';
import getThemeConfigurations from '../utils/getThemeConfigurations';
import type { ThemeConfiguration } from '../utils/theme-configuration.types';

type ThemeOption = string | ThemeConfiguration;

export interface ThemeConfigurationOptions {
	config?: ThemeOption;
	media?: Record<string, ThemeOption>;
	useThemeClasses?: boolean | string[];
	mergeThemeClassesWithBaseConfig?: boolean;
	cssLayer?: string;
	selector?: string;
	partial?: boolean;
	styleTagId?: string;
}

export function useThemeConfiguration(
	options?: ThemeConfigurationOptions | Ref<ThemeConfigurationOptions>
) {
	const iterationCounter = useState(() => 0);
	const opts = computed(() =>
		isRef(options) ? options.value : (options ?? {})
	);
	const moduleOptions = getThemeModuleOptions();
	const availableConfigs = getThemeConfigurations();
	const defaultConfig = availableConfigs.default ?? {};

	function resolveConfig(config?: ThemeOption): ThemeConfiguration {
		if (typeof config === 'string') {
			const theme = availableConfigs[config];
			if (!theme)
				throw new Error(
					`themeConfiguration: theme "${config}" not found.`
				);
			return theme;
		}
		return normalizeThemeConfiguration(config ?? {});
	}

	const sourceConfig = computed(() => resolveConfig(opts.value.config));
	const compConfig = computed(() =>
		mergeThemeConfigs(defaultConfig, sourceConfig.value, moduleOptions)
	);

	function includeTheme(key: string) {
		const o = opts.value;
		return (
			o.config !== key &&
			!(!o.config && key === 'default') &&
			(!Array.isArray(o.useThemeClasses) ||
				o.useThemeClasses.includes(key))
		);
	}

	function baseSelector() {
		const o = opts.value;
		if (o.selector) return o.selector;
		const selectors = [':root'];
		if (o.useThemeClasses) {
			selectors.push('.u-theme');
			if (typeof o.config === 'string')
				selectors.push(`.u-theme-${o.config}`);
			else if (!o.config) selectors.push('.u-theme-default');
		}
		return selectors.join(', ');
	}

	function render(
		config: ThemeConfiguration,
		selector: string,
		baseConfig = compConfig.value
	) {
		return generateThemeCss(config, {
			selector,
			cssLayer: opts.value.cssLayer,
			defaults: moduleOptions,
			baseConfig,
			rules,
		});
	}

	const cssText = computed(() => {
		const o = opts.value;
		const output = [
			render(
				o.partial ? sourceConfig.value : compConfig.value,
				baseSelector()
			),
		];
		if (o.useThemeClasses) {
			for (const [key, value] of Object.entries(availableConfigs)) {
				if (!includeTheme(key)) continue;
				const merge =
					o.mergeThemeClassesWithBaseConfig ??
					(o.partial === undefined ? false : !o.partial);
				const config = merge
					? mergeThemeConfigs(
							compConfig.value,
							value,
							moduleOptions,
							true
						)
					: value;
				output.push(render(config, `.u-theme-${key}`));
			}
		}
		return output.filter(Boolean).join('\n');
	});

	const media = computed(() =>
		Object.entries(opts.value.media ?? {}).map(([query, config]) => {
			const resolved = resolveConfig(config);
			const output = [render(resolved, baseSelector())];
			if (opts.value.useThemeClasses) {
				for (const key of Object.keys(availableConfigs)) {
					if (includeTheme(key))
						output.push(render(resolved, `.u-theme-${key}`));
				}
			}
			return { query, cssText: output.filter(Boolean).join('\n') };
		})
	);

	watch([cssText, media], () => iterationCounter.value++, { flush: 'sync' });

	useHead(
		computed(() => {
			const o = opts.value;
			const iteration = iterationCounter.value;
			const scope = o.selector ? `${sanitizeKey(o.selector)}-` : '';
			const baseId = o.styleTagId
				? [o.styleTagId, iteration].filter(Boolean).join('-')
				: `theme-configuration-${scope}${iteration}`;
			return {
				style: [
					...(cssText.value
						? [
								{
									key: baseId,
									id: baseId,
									type: 'text/css',
									innerHTML: cssText.value,
								},
							]
						: []),
					...media.value.map((entry) => ({
						key: `${baseId}-${entry.query}`,
						id: `${baseId}-${entry.query}`,
						type: 'text/css',
						media: entry.query,
						innerHTML: entry.cssText,
					})),
				],
			};
		})
	);

	return {
		compConfig: computed(() =>
			opts.value.partial ? sourceConfig.value : compConfig.value
		),
	};
}
