<template>
	<section
		id="verification"
		ref="section"
		class="verification"
		data-testid="verification"
		:data-ready="ready"
	>
		<div class="verification__heading">
			<div>
				<p class="eyebrow">Interactive diagnostics</p>
				<h2>See the theme engine at work</h2>
				<p>
					Change the controls and resize the viewport. Checks compare
					computed browser styles with expected values; they are not a
					replacement for the automated test suite.
				</p>
			</div>
			<div class="viewport-readout">
				Viewport
				<strong>{{
					viewportWidth ? `${viewportWidth}px` : 'Waiting for browser'
				}}</strong>
			</div>
		</div>

		<div class="checks">
			<div
				v-for="check in checks"
				:key="check.name"
				class="check"
				:class="{ 'check--fail': !check.pass }"
				:data-check="check.name"
			>
				<span class="check__status">{{
					check.pass ? 'PASS' : 'FAIL'
				}}</span>
				<strong>{{ check.name }}</strong>
				<span>{{ check.actual }} / expected {{ check.expected }}</span>
			</div>
			<p v-if="!checks.length" class="checks__pending">
				Waiting for browser styles...
			</p>
		</div>

		<ThemeConfiguration
			ref="baseTheme"
			:config="verificationTheme"
			partial
			selector=".verification-base"
			css-layer="verification"
			style-tag-id="verification-base"
		/>
		<div class="verification-base">
			<div class="demo-grid">
				<article class="demo">
					<p class="eyebrow">01 / Container queries</p>
					<h3>Resize the container, not the viewport</h3>
					<p>
						At 400px, minimum queries switch to half width and
						<code>@lt-400:</code> switches from full to half. Drag
						across 400px and 600px to compare the bars.
					</p>
					<label class="slider-label" for="container-width"
						>Container width
						<strong>{{ queryWidth }}px</strong></label
					>
					<input
						id="container-width"
						v-model.number="queryWidth"
						data-testid="container-width"
						type="range"
						min="240"
						max="720"
						step="1"
					/>
					<div class="query-scroll">
						<div
							data-testid="query-container"
							class="@container query-container"
							:style="queryStyle"
						>
							<p
								data-testid="query-named"
								class="query-bar w-full @testCard:w-1/2"
							>
								<code>@testCard:</code> named min
							</p>
							<p
								data-testid="query-numeric"
								class="query-bar w-full @400:w-1/2"
							>
								<code>@400:</code> numeric min
							</p>
							<p
								data-testid="query-less"
								class="query-bar w-1/2 @lt-400:w-full"
							>
								<code>@lt-400:</code> numeric max
							</p>
							<p
								data-testid="query-named-less"
								class="query-bar w-1/2 @lt-testCard:w-full"
							>
								<code>@lt-testCard:</code> named max
							</p>
							<p
								data-testid="query-rem"
								class="query-bar w-full @testCardRem:w-1/2"
							>
								<code>@testCardRem:</code> 25rem min
							</p>
							<p
								data-testid="query-rem-less"
								class="query-bar w-1/2 @lt-testCardRem:w-full"
							>
								<code>@lt-testCardRem:</code> 25rem max
							</p>
							<p
								data-testid="query-hover"
								class="query-bar hover:@400:underline"
							>
								Hover: <code>hover:@400:underline</code>
							</p>
							<p
								data-testid="query-min-order"
								class="query-bar w-full @600:w-1/3 @400:w-1/2"
							>
								Ordered minimums: 400 / 600
							</p>
							<p
								data-testid="query-max-order"
								class="query-bar w-1/3 @lt-400:w-full @lt-600:w-1/2"
							>
								Ordered maximums: 400 / 600
							</p>
						</div>
					</div>
					<details open>
						<summary>Named ancestor vs nearest container</summary>
						<p>
							The outer container is 500px and the inner container
							is 200px. Only the named ancestor reaches 400px.
						</p>
						<div class="query-scroll">
							<div
								data-testid="query-outer"
								class="@container/sidebar query-container"
								style="width: 500px"
							>
								<div
									data-testid="query-inner"
									class="@container"
									style="width: 200px"
								>
									<p
										data-testid="query-targeted"
										class="query-bar w-full @400/sidebar:w-1/2"
									>
										Named ancestor
									</p>
									<p
										data-testid="query-nearest"
										class="query-bar w-full @400:w-1/2"
									>
										Nearest ancestor
									</p>
								</div>
							</div>
						</div>
					</details>
				</article>

				<article class="demo">
					<p class="eyebrow">02 / Reactive updates</p>
					<h3>Change values without a reload</h3>
					<p>
						Toggle the scoped theme. Its spacing, background and
						typography change together; other scopes remain
						unchanged.
					</p>
					<button
						data-testid="toggle-reactive"
						type="button"
						@click="expanded = !expanded"
					>
						Switch to {{ expanded ? 'compact' : 'expanded' }} values
					</button>
					<p
						data-testid="reactive"
						class="verification-reactive p-testRamp bg-testPanel text-testHeading reactive-sample"
					>
						{{ expanded ? 'Expanded' : 'Compact' }} theme
					</p>
					<p class="hint">
						At 768px: padding {{ expanded ? 44 : 22 }}px, font
						{{ expanded ? 32 : 20 }}px. Other widths interpolate
						spacing.
					</p>
					<button
						data-testid="toggle-mounted"
						type="button"
						@click="mountedTheme = !mountedTheme"
					>
						{{ mountedTheme ? 'Remove' : 'Restore' }} scoped style
					</button>
					<ThemeConfiguration
						v-if="mountedTheme"
						:config="mountedConfig"
						partial
						selector=".verification-mounted"
						style-tag-id="verification-mounted"
					/>
					<p
						data-testid="mounted"
						class="verification-mounted p-testFixed sample-surface"
					>
						Scoped padding:
						{{ mountedTheme ? '28px' : '12px inherited' }}
					</p>
					<p class="hint">
						Removing the instance should remove its style tag and
						restore inherited padding.
					</p>
				</article>
			</div>

			<div class="demo-grid">
				<article class="demo">
					<p class="eyebrow">03 / Responsive values</p>
					<h3>Spacing and typography</h3>
					<p>
						Resize the viewport. The tinted area shows padding; each
						token uses different endpoints or interpolation.
					</p>
					<div class="sample-list">
						<p data-testid="ramp" class="p-testRamp sample-surface">
							<code>p-testRamp</code> · four endpoints
						</p>
						<p
							data-testid="sparse"
							class="p-testSparse sample-surface"
						>
							<code>p-testSparse</code> · two endpoints
						</p>
						<p
							data-testid="descending"
							class="p-testDescending sample-surface"
						>
							<code>p-testDescending</code> · decreasing / flat
						</p>
						<p
							data-testid="fixed"
							class="p-testFixed sample-surface"
						>
							<code>p-testFixed</code> · 12px
						</p>
						<p data-testid="zero" class="p-testZero sample-surface">
							<code>p-testZero</code> · 0px
						</p>
						<p
							data-testid="negative"
							class="-m-testFixed sample-surface"
						>
							<code>-m-testFixed</code> · -12px margin
						</p>
					</div>
					<p data-testid="typography" class="text-testHeading">
						Fluid font and midpoint typography
					</p>
					<p
						data-testid="text-min"
						class="text-testHeading text-min-32"
					>
						Minimum 32px
					</p>
					<p
						data-testid="text-max"
						class="text-testHeading text-max-36"
					>
						Maximum 36px
					</p>
				</article>
				<article class="demo">
					<p class="eyebrow">04 / Colors and scopes</p>
					<h3>Context-aware contrast</h3>
					<p>
						Nested backgrounds should select their own text colors.
						Scope-only applies contrast without painting a
						background.
					</p>
					<div class="color-sample bg-testPanel">
						<p data-testid="on-background" class="text-contrast">
							Outer: rgb(230, 240, 250)
						</p>
						<div class="color-sample bg-testPanelAlt">
							<p
								data-testid="nested-background"
								class="text-contrast"
							>
								Nested: rgb(200, 210, 220)
							</p>
						</div>
					</div>
					<div class="color-sample bg-testPanelAlt">
						<p
							data-testid="scope-only"
							class="bg-scope-testPanel text-contrast"
						>
							Scope only: outer contrast, transparent background
						</p>
					</div>
					<p data-testid="hex" class="text-testHex">
						Hex text: #123456
					</p>
					<p data-testid="comma" class="text-testComma">
						RGB text: 70, 80, 90
					</p>
					<p data-testid="opacity" class="bg-testPanel/50">
						Background with 50% opacity
					</p>
					<p
						data-testid="radius"
						class="rounded-t-testCard border-testBorder sample-surface"
						style="border-width: 1px; border-style: solid"
					>
						Responsive top corners and border color
					</p>
					<h4>Theme class override</h4>
					<p>
						Toggle <code>u-theme-print</code> on this scoped sample.
						The print theme replaces primary with white while the
						base theme remains purple.
					</p>
					<button
						data-testid="toggle-class"
						type="button"
						@click="previewPrintClass = !previewPrintClass"
					>
						{{ previewPrintClass ? 'Remove' : 'Apply' }} print class
					</button>
					<p
						data-testid="class-preview"
						class="theme-preview verification-class bg-primary"
						:class="{ 'u-theme-print': previewPrintClass }"
						:style="{
							color: previewPrintClass ? '#171727' : '#fff',
						}"
					>
						{{ previewPrintClass ? 'Print class' : 'Scoped base' }}
					</p>
				</article>
			</div>

			<article class="demo">
				<p class="eyebrow">05 / Layout</p>
				<h3>Choose column count in CSS</h3>
				<p>
					Widths include the configured margin, gutter and 1600px
					layout cap. Equivalent fractions should match; the
					fractional span is supported too. Bars can exceed this panel
					because they use viewport dimensions.
				</p>
				<ThemeConfiguration
					:config="layoutTheme"
					partial
					selector=".verification-layout"
					style-tag-id="verification-layout"
				/>
				<div class="layout-scroll">
					<div class="verification-layout">
						<div data-testid="columns" class="column-bar w-3/12col">
							w-3/12col
						</div>
						<div
							data-testid="third-columns"
							class="column-bar w-1/3col"
						>
							w-1/3col
						</div>
						<div
							data-testid="four-columns"
							class="column-bar w-4/12col"
						>
							w-4/12col
						</div>
						<div
							data-testid="fifth-columns"
							class="column-bar w-2/5col"
						>
							w-2/5col
						</div>
						<div
							data-testid="fractional-columns"
							class="column-bar w-2.5/12col"
						>
							w-2.5/12col
						</div>
						<div
							data-testid="layout-max"
							class="column-bar w-layout-max"
						>
							w-layout-max · 1600px
						</div>
					</div>
				</div>
			</article>
			<p data-testid="motion" class="duration-theme-fast hint">
				Project motion plugin: <code>duration-theme-fast</code> = 120ms.
			</p>
		</div>

		<details class="advanced">
			<summary>
				More regression examples and exposed configuration
			</summary>
			<p>
				These fixtures exercise breakpoint counts, partial inheritance,
				rounding, custom viewports and theme classes.
			</p>
			<div v-for="example in breakExamples" :key="example.name">
				<ThemeConfiguration
					:config="example.config"
					partial
					:selector="`.verification-${example.name}`"
					:style-tag-id="`verification-${example.name}`"
				/>
				<p
					:class="`verification-${example.name} p-testRamp`"
					class="break-sample"
					:data-testid="example.name"
				>
					{{ example.name }} · {{ example.description }}
				</p>
			</div>
			<ThemeConfiguration
				ref="partialInstance"
				:config="partialTheme"
				partial
				selector=".verification-partial"
				style-tag-id="verification-partial"
			/>
			<p
				class="verification-partial p-testRamp bg-testPanel"
				data-testid="partial"
			>
				One overridden endpoint; other endpoints inherited
			</p>
			<ThemeConfiguration
				:config="roundedTheme"
				partial
				selector=".verification-rounded"
				style-tag-id="verification-rounded"
			/>
			<p class="verification-rounded p-testFixed" data-testid="rounded">
				Rounding to two pixels
			</p>
			<ThemeConfiguration
				:config="emTheme"
				partial
				selector=".verification-em"
				style-tag-id="verification-em"
			/>
			<p
				class="verification-em text-testHeading"
				data-testid="em-threshold"
			>
				Twenty-pixel base font; font-weight switches at 24em
			</p>
			<ThemeConfiguration
				:config="typographyOverride"
				partial
				selector=".verification-typography-override"
				style-tag-id="verification-typography-override"
			/>
			<p
				class="verification-typography-override text-testHeading"
				data-testid="typography-override"
			>
				Property-group override retains other typography endpoints
			</p>
			<ThemeConfiguration
				:config="viewportTheme"
				partial
				selector=".verification-viewport"
				style-tag-id="verification-viewport"
			/>
			<p
				class="verification-viewport p-testRamp"
				data-testid="custom-viewport"
			>
				Fluid spacing based on half viewport width
			</p>
			<p>
				Base configuration:
				<output data-testid="exposed-base">{{
					JSON.stringify(baseTheme?.config.spacing?.testRamp)
				}}</output>
			</p>
			<p>
				Partial override:
				<output data-testid="exposed-partial">{{
					JSON.stringify(partialInstance?.config.spacing?.testRamp)
				}}</output>
			</p>
			<ThemeConfiguration
				:config="classTheme"
				:use-theme-classes="['print']"
				:merge-theme-classes-with-base-config="true"
				selector=".verification-class"
				style-tag-id="verification-class"
			/>
			<p
				data-testid="theme-class"
				class="verification-class u-theme-print bg-testPanel p-testRamp"
			>
				Merged print class
			</p>
		</details>

		<div class="runtime">
			<div>
				<p class="eyebrow">06 / Runtime API</p>
				<h3>Theme registry</h3>
				<p>
					Available: {{ runtimeApi.available.join(', ') }}. Clear and
					reload print to exercise the async loader.
				</p>
			</div>
			<button
				data-testid="reload-theme"
				type="button"
				:disabled="runtimeLoading"
				@click="reloadPrint"
			>
				Clear and reload print theme
			</button>
			<p
				v-if="runtimeMessage"
				class="runtime__message"
				:class="{ 'runtime__message--error': runtimeFailed }"
				role="status"
			>
				{{ runtimeMessage }}
			</p>
			<details>
				<summary>Inspect runtime result</summary>
				<output data-testid="runtime-api">{{
					JSON.stringify(runtimeApi)
				}}</output>
			</details>
		</div>
	</section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useNuxtApp } from '#app';
import { useThemeConfiguration } from '../../src/runtime/composables/useThemeConfiguration';
import getThemeConfigurations from '../../src/runtime/utils/getThemeConfigurations';
import getThemeConfiguration from '../../src/runtime/utils/getThemeConfiguration';
import getThemeConfigurationAsync from '../../src/runtime/utils/getThemeConfigurationAsync';
import verificationTheme from '../assets/js/verification-theme';
import type { ThemeConfiguration } from '../../src/runtime/utils/theme-configuration.types';

const ready = ref(false);
const section = ref<HTMLElement | null>(null);
const viewportWidth = ref(0);
const queryWidth = ref(399);
const queryStyle = computed(() => ({ width: `${queryWidth.value}px` }));
const checks = ref<
	Array<{ name: string; pass: boolean; actual: string; expected: string }>
>([]);
const baseTheme = ref<{ config: ThemeConfiguration } | null>(null);
const partialInstance = ref<{ config: ThemeConfiguration } | null>(null);
const expanded = ref(false);
const mountedTheme = ref(true);
const previewPrintClass = ref(false);
let frame = 0;
let resizeObserver: ResizeObserver | undefined;
let styleObserver: MutationObserver | undefined;

function interpolate(points: Array<[number, number]>, width: number) {
	const [firstWidth, firstValue] = points[0]!;
	if (width <= firstWidth) return firstValue;
	for (let index = 1; index < points.length; index++) {
		const [end, value] = points[index]!;
		const [start, previous] = points[index - 1]!;
		if (width <= end)
			return (
				previous +
				((value - previous) * (width - start)) / (end - start)
			);
	}
	return points[points.length - 1]![1];
}

function measureChecks() {
	if (!section.value) return;
	viewportWidth.value = window.innerWidth;
	const style = (id: string) => {
		const element = section.value!.querySelector<HTMLElement>(
			`[data-testid="${id}"]`
		);
		if (!element) throw new Error(`Missing playground check: ${id}`);
		return getComputedStyle(element);
	};
	const numberCheck = (
		name: string,
		actual: number,
		expected: number,
		unit = 'px'
	) => ({
		name,
		pass: Number.isFinite(actual) && Math.abs(actual - expected) < 0.1,
		actual: `${Number.isFinite(actual) ? actual.toFixed(1) : 'unavailable'}${unit}`,
		expected: `${expected.toFixed(1)}${unit}`,
	});
	const width = window.innerWidth;
	const expectedRamp = interpolate(
		[
			[375, 8],
			[768, 20],
			[1440, 36],
			[1920, 48],
		],
		width
	);
	const margin = interpolate(
		[
			[375, 16],
			[768, 32],
			[1440, 48],
			[1920, 64],
		],
		width
	);
	const gutter = interpolate(
		[
			[375, 8],
			[768, 16],
			[1440, 24],
			[1920, 32],
		],
		width
	);
	const columnWidth = (Math.min(width, 1600) - 2 * margin - 2 * gutter) / 3;
	const thirdWidth = parseFloat(style('third-columns').width);
	const fourthWidth = parseFloat(style('four-columns').width);
	const columns = numberCheck('Equivalent columns', fourthWidth, columnWidth);
	columns.pass = columns.pass && Math.abs(thirdWidth - columnWidth) < 0.1;
	columns.actual = `${thirdWidth.toFixed(1)}px / ${fourthWidth.toFixed(1)}px`;
	const containerWidth = parseFloat(style('query-container').width);
	const contrast = style('nested-background').color;
	const headingSize =
		24 + Math.min(1, Math.max(0, (width - 375) / 1545)) * 24;
	checks.value = [
		numberCheck(
			'Fluid spacing',
			parseFloat(style('ramp').paddingLeft),
			expectedRamp
		),
		numberCheck(
			'Container query',
			parseFloat(style('query-numeric').width),
			containerWidth >= 400 ? containerWidth / 2 : containerWidth
		),
		numberCheck(
			'Reactive font size',
			parseFloat(style('reactive').fontSize),
			expanded.value ? 32 : 20
		),
		numberCheck(
			'Scoped style cleanup',
			parseFloat(style('mounted').paddingLeft),
			mountedTheme.value ? 28 : 12
		),
		numberCheck(
			'Minimum font size',
			parseFloat(style('text-min').fontSize),
			Math.max(32, headingSize)
		),
		columns,
		{
			name: 'Nested contrast',
			pass: contrast === 'rgb(200, 210, 220)',
			actual: contrast,
			expected: 'rgb(200, 210, 220)',
		},
		numberCheck(
			'Motion plugin',
			parseFloat(style('motion').transitionDuration) * 1000,
			120,
			'ms'
		),
	];
}

function scheduleChecks() {
	cancelAnimationFrame(frame);
	frame = requestAnimationFrame(measureChecks);
}

onMounted(() => {
	ready.value = true;
	window.addEventListener('resize', scheduleChecks);
	resizeObserver = new ResizeObserver(scheduleChecks);
	resizeObserver.observe(
		section.value!.querySelector('[data-testid="query-container"]')!
	);
	styleObserver = new MutationObserver(scheduleChecks);
	styleObserver.observe(document.head, {
		childList: true,
		subtree: true,
		characterData: true,
	});
	scheduleChecks();
});
onBeforeUnmount(() => {
	window.removeEventListener('resize', scheduleChecks);
	resizeObserver?.disconnect();
	styleObserver?.disconnect();
	cancelAnimationFrame(frame);
});
watch([expanded, mountedTheme, queryWidth], scheduleChecks, { flush: 'post' });
const partialTheme = {
	options: { round: false },
	spacing: { testRamp: { 768: 40 } },
} satisfies ThemeConfiguration;
const roundedTheme = {
	options: { round: 2, disableBreakpointSpecificCustomProperties: true },
	spacing: { testFixed: 13.25 },
} satisfies ThemeConfiguration;
const emTheme = {
	options: {
		baseFontSize: 20,
		namedBreaks: { narrow: 320, wide: 640 },
		round: false,
		disableBreakpointSpecificCustomProperties: true,
	},
	fontSize: {
		testHeading: {
			fontSize: { 320: 20, 640: 40 },
			fontWeight: { 320: 400, 640: 700 },
		},
	},
} satisfies ThemeConfiguration;
const viewportTheme = {
	options: {
		viewportWidth: 'var(--verification-width, 50vw)',
		namedBreaks: { start: 400, end: 1200 },
		round: false,
	},
	spacing: { testRamp: { 400: 10, 1200: 30 } },
} satisfies ThemeConfiguration;
const typographyOverride = {
	options: { round: false },
	fontWeight: { testHeading: { 768: 550 } },
} satisfies ThemeConfiguration;
const mountedConfig = {
	options: { round: false },
	spacing: { testFixed: 28 },
} satisfies ThemeConfiguration;
const classTheme = {
	options: { round: false },
	spacing: { testRamp: { 375: 10, 768: 20, 1440: 30, 1920: 40 } },
	backgroundColors: { testPanel: [60, 70, 80] },
} satisfies ThemeConfiguration;
const layoutTheme = {
	options: { round: false },
	layout: {
		margin: { 375: 16, 768: 32, 1440: 48, 1920: 64 },
		gutter: { 375: 8, 768: 16, 1440: 24, 1920: 32 },
		max: 1600,
	},
} satisfies ThemeConfiguration;
const breakExamples: Array<{
	name: string;
	description: string;
	config: ThemeConfiguration;
}> = [
	{
		name: 'single-break',
		description: 'fixed at 18px',
		config: {
			options: { namedBreaks: { only: 600 }, round: false },
			spacing: { testRamp: { 600: 18 } },
		},
	},
	{
		name: 'two-breaks',
		description: '10px at 400px to 30px at 1200px',
		config: {
			options: { namedBreaks: { start: 400, end: 1200 }, round: false },
			spacing: { testRamp: { 400: 10, 1200: 30 } },
		},
	},
	{
		name: 'five-breaks',
		description: 'increasing, decreasing and flat segments',
		config: {
			options: {
				namedBreaks: {
					last: 1600,
					first: 320,
					fourth: 1280,
					second: 640,
					third: 960,
				},
				round: false,
			},
			spacing: {
				testRamp: { 320: 8, 640: 24, 960: 16, 1280: 16, 1600: 32 },
			},
		},
	},
];

const reactiveOptions = computed(() => ({
	selector: '.verification-reactive',
	partial: true,
	styleTagId: 'verification-reactive',
	config: {
		options: { round: false },
		spacing: { testRamp: { 768: expanded.value ? 44 : 22 } },
		backgroundColors: {
			testPanel: expanded.value ? [90, 100, 110] : [30, 40, 50],
		},
		fontSize: {
			testHeading: {
				fontSize: expanded.value ? 32 : 20,
				fontWeight: expanded.value ? 800 : 400,
				lineHeight: expanded.value ? 1.5 : 1.2,
			},
		},
	},
}));
useThemeConfiguration(reactiveOptions);

const { $themeConfigurations } = useNuxtApp();
const themes = getThemeConfigurations();
const runtimeLoading = ref(false);
const runtimeFailed = ref(false);
const runtimeMessage = ref('');
const runtimeApi = ref({
	available: Object.keys(themes).sort(),
	subset: getThemeConfiguration('default', 'spacing'),
	asyncLoaded: false,
	cleared: false,
	unloaded: false,
	reloaded: false,
});
async function reloadPrint() {
	runtimeLoading.value = true;
	runtimeMessage.value = '';
	try {
		runtimeApi.value.cleared = $themeConfigurations.$clearTheme('print');
		runtimeApi.value.unloaded =
			!$themeConfigurations.$isThemeLoaded('print');
		const loaded = await getThemeConfigurationAsync('print');
		runtimeApi.value.asyncLoaded = !!loaded?.backgroundColors?.primary;
		runtimeApi.value.reloaded =
			$themeConfigurations.$isThemeLoaded('print');
		runtimeFailed.value =
			!runtimeApi.value.cleared ||
			!runtimeApi.value.unloaded ||
			!runtimeApi.value.asyncLoaded ||
			!runtimeApi.value.reloaded;
		runtimeMessage.value = runtimeFailed.value
			? 'Print theme reload failed. Inspect the runtime result below.'
			: 'Print theme cleared and reloaded.';
	} catch (error) {
		runtimeFailed.value = true;
		runtimeMessage.value = `Print theme reload failed: ${error instanceof Error ? error.message : String(error)}`;
		console.error('Print theme reload failed:', error);
	} finally {
		runtimeLoading.value = false;
	}
}
</script>

<style scoped>
.verification {
	padding: clamp(2rem, 5vw, 4.5rem) clamp(1.25rem, 6vw, 6rem);
	color: #25233c;
	background: #f5f5fb;
	font-family: ui-sans-serif, system-ui, sans-serif;
	font-size: 0.9375rem;
	line-height: 1.55;
}
.verification__heading {
	display: flex;
	align-items: end;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 1rem;
}
.verification__heading > div:first-child {
	max-width: 46rem;
}
.verification h2,
.verification h3,
.verification p {
	margin-top: 0;
}
.verification h2 {
	margin-bottom: 0.5rem;
	font-size: clamp(1.75rem, 3vw, 2.5rem);
	line-height: 1.15;
	letter-spacing: -0.025em;
}
.verification h3 {
	margin-bottom: 0.5rem;
	font-size: 1.15rem;
	line-height: 1.3;
}
.eyebrow {
	margin-bottom: 0.5rem;
	color: #6157a0;
	font-size: 0.7rem;
	font-weight: 750;
	letter-spacing: 0.1em;
	text-transform: uppercase;
}
.viewport-readout {
	padding: 0.7rem 0.9rem;
	border: 1px solid #dcd9eb;
	border-radius: 0.6rem;
	background: white;
	font-size: 0.8rem;
}
.viewport-readout strong {
	display: block;
	font-size: 1.1rem;
}
.checks {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
	gap: 0.6rem;
	margin: 1.5rem 0 2rem;
}
.check {
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
	padding: 0.8rem 0.9rem;
	border: 1px solid #c7e4d7;
	border-radius: 0.6rem;
	background: #f4fcf8;
	font-size: 0.75rem;
	overflow-wrap: anywhere;
}
.check--fail {
	border-color: #efb4b1;
	background: #fff3f2;
}
.check__status {
	color: #176849;
	font-size: 0.65rem;
	font-weight: 800;
	letter-spacing: 0.08em;
}
.check--fail .check__status {
	color: #a32c26;
}
.checks__pending {
	color: #625f74;
}
.demo-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 26rem), 1fr));
	gap: 1rem;
	margin-bottom: 1rem;
}
.demo,
.advanced,
.runtime {
	min-width: 0;
	padding: clamp(1.15rem, 2vw, 1.75rem);
	border: 1px solid #e0dfeb;
	border-radius: 0.8rem;
	color: #5b596d;
	background: white;
}
.demo h3,
.runtime h3 {
	color: #25233c;
}
.verification code,
.verification output {
	font-family: ui-monospace, monospace;
	font-size: 0.85em;
	overflow-wrap: anywhere;
}
.verification button {
	padding: 0.6rem 0.9rem;
	border: 1px solid #50439b;
	border-radius: 0.4rem;
	color: white;
	background: #50439b;
	font: inherit;
	font-weight: 650;
	cursor: pointer;
}
.verification button:hover,
.verification button:focus-visible {
	background: #322874;
}
.slider-label {
	display: flex;
	justify-content: space-between;
	gap: 1rem;
	margin-top: 1.25rem;
	font-size: 0.85rem;
}
input[type='range'] {
	width: 100%;
	margin: 0.5rem 0 1rem;
	accent-color: #50439b;
}
.query-scroll,
.layout-scroll {
	overflow-x: auto;
}
.query-container {
	outline: 1px dashed #9d95c9;
	outline-offset: -1px;
	background: #f4f2fb;
}
.query-bar {
	margin: 0.25rem 0;
	background: #d7d1f4;
	font-size: 0.75rem;
	white-space: nowrap;
}
.query-bar:nth-child(even) {
	background: #c1e4dc;
}
summary {
	margin: 1rem 0 0.75rem;
	color: #433889;
	font-weight: 700;
	cursor: pointer;
}
.sample-list {
	display: grid;
	gap: 0.5rem;
	overflow: hidden;
}
.sample-list p {
	margin-block: 0;
}
.sample-surface {
	background: #eeedf8;
}
.reactive-sample {
	margin-top: 1rem;
	margin-bottom: 0;
	color: white;
}
.demo .hint,
.hint {
	margin: 0.75rem 0 1rem;
	color: #646176;
	font-size: 0.8rem;
}
.color-sample {
	padding: 1rem;
}
.color-sample p {
	margin: 0;
}
.demo h4 {
	margin: 1.5rem 0 0.5rem;
	color: #25233c;
}
.theme-preview {
	margin: 0.75rem 0 0;
	padding: 1rem;
	border: 1px solid #dcd9eb;
	border-radius: 0.4rem;
}
.column-bar {
	margin: 0.35rem 0;
	color: #28224f;
	background: #d8d1f4;
	font-size: 0.8rem;
	white-space: nowrap;
}
.column-bar:nth-child(even) {
	background: #c7e8df;
}
.advanced,
.runtime {
	margin-top: 1rem;
}
.advanced > summary {
	margin: 0;
}
.advanced > p:first-of-type {
	margin-top: 0.75rem;
}
.break-sample {
	background: #eeedf8;
}
.advanced [data-testid='partial'],
.advanced [data-testid='theme-class'] {
	color: white;
}
.runtime__message {
	margin: 0.75rem 0 0;
	color: #176849;
	font-weight: 700;
}
.runtime__message--error {
	color: #a32c26;
}
@media (max-width: 600px) {
	.verification {
		padding-right: 1rem;
		padding-left: 1rem;
	}
}
</style>
