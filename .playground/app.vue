<template>
	<div>
		<ThemeConfiguration
			:config="selectedTheme"
			use-theme-classes
			:media="{ print: 'print' }"
		/>

		<header class="hero">
			<div class="hero__content">
				<p class="hero__overline">Limbo / developer playground</p>
				<h1 class="hero__title">Theme Configuration</h1>
				<p class="hero__sub">
					Explore generated utilities, responsive tokens and live
					theme overrides. Resize the viewport or use the controls to
					see changes.
				</p>
				<div class="hero__controls">
					<label for="theme-select">Global theme</label>
					<select id="theme-select" v-model="selectedTheme">
						<option value="default">Default</option>
						<option value="citiDefault">Citi default</option>
						<option value="print">Print</option>
						<option value="tokenBundle">
							Transformed token bundle
						</option>
					</select>
					<span>Theme values update without a page reload.</span>
				</div>
				<nav class="hero__nav" aria-label="Playground sections">
					<a href="#verification">Live checks</a>
					<a href="#typography">Typography</a>
					<a href="#colors">Colors</a>
					<a href="#layout">Layout</a>
					<a href="#scopes">Scopes</a>
				</nav>
			</div>
		</header>

		<ThemeVerification />

		<section
			id="typography"
			class="section px-layout-margin py-layout-gutter"
		>
			<h2 class="section__title text-h4 text-onSurface">
				Typography Scale
			</h2>
			<p class="section__intro text-body2 text-onSurfaceVariant">
				Resize the viewport to see each utility interpolate between its
				configured sizes. Labels show default-theme endpoints at 375px
				and 1920px.
			</p>

			<div class="type-stack">
				<div v-for="size in fontSizes" :key="size.key" class="type-row">
					<span
						class="type-row__label text-caption text-onSurfaceVariant"
						>{{ size.label }}</span
					>
					<p
						:class="[size.utility, 'text-onSurface']"
						class="type-row__sample"
					>
						{{ size.sample }}
					</p>
				</div>
			</div>
		</section>

		<!-- Section: Min/Max Constraints -->
		<section
			class="section section--tinted px-layout-margin py-layout-gutter"
		>
			<h2 class="section__title text-h4 text-onSurface">
				Min / Max Font Size Constraints
			</h2>
			<p class="section__intro text-body2 text-onSurfaceVariant">
				Combine any <code>text-*</code> size with
				<code>text-min-*</code> and/or <code>text-max-*</code>. Resize
				your window to see the constraints in action.
			</p>

			<div class="constraint-grid">
				<div class="constraint-card constraint-card--a">
					<code class="constraint-card__label"
						>text-h1 text-min-24</code
					>
					<p
						class="text-h1 text-min-24 text-onSurface constraint-card__demo"
					>
						Never smaller than 24px
					</p>
				</div>

				<div class="constraint-card constraint-card--b">
					<code class="constraint-card__label"
						>text-h1 text-max-h3</code
					>
					<p
						class="text-h1 text-max-h3 text-onSurface constraint-card__demo"
					>
						Capped at h3 font size
					</p>
				</div>

				<div class="constraint-card constraint-card--c">
					<code class="constraint-card__label"
						>text-h1 text-min-20 text-max-48</code
					>
					<p
						class="text-h1 text-min-20 text-max-48 text-onSurface constraint-card__demo"
					>
						Clamped between 20&ndash;48px
					</p>
				</div>

				<div class="constraint-card constraint-card--d">
					<code class="constraint-card__label"
						>text-body2 text-min-[1rem]</code
					>
					<p
						class="text-body2 text-min-[1rem] text-onSurface constraint-card__demo"
					>
						Arbitrary unit: won't shrink below 1rem
					</p>
				</div>
			</div>
		</section>

		<!-- Section: Colors -->
		<section id="colors" class="section px-layout-margin py-layout-gutter">
			<h2 class="section__title text-h4 text-onSurface">Color System</h2>
			<p class="section__intro text-body2 text-onSurfaceVariant">
				Background colors defined in the theme config, available as
				UnoCSS utilities. Labels use a fixed backing for readability.
			</p>

			<div class="color-groups">
				<div class="color-group">
					<h3
						class="color-group__heading text-caption text-onSurfaceVariant"
					>
						Primary
					</h3>
					<div class="color-swatches">
						<div class="swatch bg-primary">
							<span class="text-onSurfacePrimary text-caption"
								>primary</span
							>
						</div>
						<div class="swatch bg-primaryMedium">
							<span class="text-onSurfacePrimary text-caption"
								>medium</span
							>
						</div>
						<div class="swatch bg-primarySubtle swatch--light">
							<span class="text-onSurface text-caption"
								>subtle</span
							>
						</div>
					</div>
				</div>

				<div class="color-group">
					<h3
						class="color-group__heading text-caption text-onSurfaceVariant"
					>
						Secondary
					</h3>
					<div class="color-swatches">
						<div class="swatch bg-secondary">
							<span class="text-onSurfaceSecondary text-caption"
								>secondary</span
							>
						</div>
						<div class="swatch bg-secondaryMedium">
							<span class="text-onSurfaceSecondary text-caption"
								>medium</span
							>
						</div>
						<div class="swatch bg-secondarySubtle swatch--light">
							<span class="text-onSurface text-caption"
								>subtle</span
							>
						</div>
					</div>
				</div>

				<div class="color-group">
					<h3
						class="color-group__heading text-caption text-onSurfaceVariant"
					>
						Status
					</h3>
					<div class="color-swatches">
						<div class="swatch bg-success">
							<span class="text-onSurfaceSuccess text-caption"
								>success</span
							>
						</div>
						<div class="swatch bg-warning">
							<span class="text-onSurfaceWarning text-caption"
								>warning</span
							>
						</div>
						<div class="swatch bg-danger">
							<span class="text-onSurfaceDanger text-caption"
								>danger</span
							>
						</div>
						<div class="swatch bg-info">
							<span class="text-onSurfaceInfo text-caption"
								>info</span
							>
						</div>
					</div>
				</div>

				<div class="color-group">
					<h3
						class="color-group__heading text-caption text-onSurfaceVariant"
					>
						Surface
					</h3>
					<div class="color-swatches">
						<div
							class="swatch bg-surface swatch--light swatch--border"
						>
							<span class="text-onSurface text-caption"
								>surface</span
							>
						</div>
						<div class="swatch bg-surfaceVariant swatch--light">
							<span class="text-onSurface text-caption"
								>variant</span
							>
						</div>
						<div class="swatch bg-surfaceInverse">
							<span class="text-onSurfaceInverse text-caption"
								>inverse</span
							>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Section: Layout spacing -->
		<section
			id="layout"
			class="section section--tinted px-layout-margin py-layout-gutter"
		>
			<h2 class="section__title text-h4 text-onSurface">
				Layout Spacing
			</h2>
			<p class="section__intro text-body2 text-onSurfaceVariant">
				<code>layout-margin</code> and <code>layout-gutter</code> scale
				responsively based on the viewport.
			</p>

			<div class="spacing-demo">
				<div class="spacing-demo__ruler">
					<div
						class="spacing-demo__track bg-primarySubtle px-layout-margin"
					>
						<span
							class="text-caption text-onSurface spacing-demo__inner"
							>&#8592; <code>px-layout-margin</code> &#8594;</span
						>
					</div>
				</div>
				<div class="spacing-demo__ruler">
					<div
						class="spacing-demo__track bg-secondarySubtle p-layout-gutter"
					>
						<span
							class="text-caption text-onSurface spacing-demo__inner"
							><code>p-layout-gutter</code></span
						>
					</div>
				</div>
			</div>
		</section>

		<!-- Section: Theme scope -->
		<section id="scopes" class="section px-layout-margin py-layout-gutter">
			<h2 class="section__title text-h4 text-onSurface">Theme Scope</h2>
			<p class="section__intro text-body2 text-onSurfaceVariant">
				The same <code>text-contrast</code> utility resolves to
				different colors inside each background scope.
			</p>

			<div class="scope-demo">
				<div class="scope-demo__pane bg-testPanel bg-scope-testPanel">
					<p class="text-h4 text-contrast scope-demo__label">
						bg-scope-testPanel
					</p>
					<p class="text-body2 text-contrast scope-demo__body">
						Uses the contrast color configured for testPanel.
					</p>
				</div>
				<div
					class="scope-demo__pane bg-testPanelAlt bg-scope-testPanelAlt"
				>
					<p class="text-h4 text-contrast scope-demo__label">
						bg-scope-testPanelAlt
					</p>
					<p class="text-body2 text-contrast scope-demo__body">
						The same utility now uses testPanelAlt's contrast color.
					</p>
				</div>
			</div>
		</section>

		<!-- Section: Component-scoped theme -->
		<section
			class="section section--tinted px-layout-margin py-layout-gutter"
		>
			<h2 class="section__title text-h4 text-onSurface">
				Component-scoped Theme
			</h2>
			<p class="section__intro text-body2 text-onSurfaceVariant">
				<code>useThemeConfiguration</code> with the
				<code>selector</code> option scopes a theme to a class. Both
				instances below receive the same scoped CSS.
			</p>

			<div class="scope-demo">
				<ClassThemeDemo label="Instance 1" />
				<ClassThemeDemo label="Instance 2" />
			</div>
		</section>
		<section class="section px-layout-margin py-layout-gutter">
			<h2 class="section__title text-h4 text-onSurface">
				Pluggable rules and named breaks
			</h2>
			<p
				data-testid="dynamic-breaks"
				class="text-body2 p-demo duration-theme-fast"
				style="transition-property: padding"
			>
				Four named breaks produce three spacing ramps. Project motion
				plugin supplies both CSS variables and UnoCSS utilities.
			</p>
		</section>
	</div>
</template>

<script setup>
const selectedTheme = ref('default');

const fontSizes = [
	{
		key: 'h1',
		utility: 'text-h1',
		label: 'h1 — 30→64px',
		sample: 'The quick brown fox',
	},
	{
		key: 'h2',
		utility: 'text-h2',
		label: 'h2 — 25→48px',
		sample: 'The quick brown fox',
	},
	{
		key: 'h3',
		utility: 'text-h3',
		label: 'h3 — 18→32px',
		sample: 'The quick brown fox jumps',
	},
	{
		key: 'h4',
		utility: 'text-h4',
		label: 'h4 — 16→24px',
		sample: 'The quick brown fox jumps over',
	},
	{
		key: 'body1',
		utility: 'text-body1',
		label: 'body1 — 16→24px',
		sample: 'The quick brown fox jumps over the lazy dog',
	},
	{
		key: 'body2',
		utility: 'text-body2',
		label: 'body2 — 14→20px',
		sample: 'The quick brown fox jumps over the lazy dog',
	},
	{
		key: 'caption',
		utility: 'text-caption',
		label: 'caption — 12→14px',
		sample: 'The quick brown fox jumps over the lazy dog',
	},
	{
		key: 'overline',
		utility: 'text-overline',
		label: 'overline — 10→12px',
		sample: 'THE QUICK BROWN FOX',
	},
];
</script>

<style scoped>
* {
	box-sizing: border-box;
}

.hero {
	padding: clamp(2.5rem, 6vw, 5rem) clamp(1.25rem, 6vw, 6rem);
	color: #f8f8ff;
	background: linear-gradient(125deg, #191744, #35317d 65%, #56479a);
	font-family: ui-sans-serif, system-ui, sans-serif;
}
.hero__content {
	max-width: 90rem;
	margin: auto;
}
.hero__overline {
	margin: 0 0 1rem;
	color: #c3bbff;
	font-size: 0.75rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.12em;
}
.hero__title {
	margin: 0;
	font-size: clamp(2.2rem, 5vw, 4.5rem);
	line-height: 1.05;
	letter-spacing: -0.035em;
}
.hero__sub {
	max-width: 42rem;
	margin: 1rem 0 0;
	color: #dddaf5;
	font-size: 1rem;
	line-height: 1.6;
}
.hero__controls {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 0.75rem;
	margin-top: 1.75rem;
	font-size: 0.875rem;
}
.hero__controls label {
	font-weight: 700;
}
.hero__controls select {
	padding: 0.6rem 2rem 0.6rem 0.75rem;
	border: 1px solid #bbb5ec;
	border-radius: 0.4rem;
	color: #191744;
	background: white;
	font: inherit;
}
.hero__controls span {
	color: #dddaf5;
}
.hero__nav {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-top: 1.75rem;
}
.hero__nav a {
	padding: 0.45rem 0.75rem;
	border: 1px solid #7770b5;
	border-radius: 999px;
	color: white;
	font-size: 0.8rem;
	text-decoration: none;
}
.hero__nav a:hover,
.hero__nav a:focus-visible {
	background: #514a9b;
}

.section {
	padding-top: clamp(2rem, 4vw, 4rem);
	padding-bottom: clamp(2rem, 4vw, 4rem);
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.section--tinted {
	background: rgba(0, 0, 0, 0.025);
}
.section__title {
	margin: 0 0 0.5rem;
}
.section__intro {
	max-width: 54rem;
	margin: 0 0 1.75rem;
	line-height: 1.6;
}

code {
	font-family: 'Menlo', 'Monaco', monospace;
	font-size: 0.8em;
	background: rgba(0, 0, 0, 0.06);
	padding: 0.1em 0.35em;
	border-radius: 3px;
}

/* ─── Type stack ──────────────────────────────────────── */
.type-stack {
	display: flex;
	flex-direction: column;
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 6px;
	overflow: hidden;
}
.type-row {
	display: flex;
	align-items: baseline;
	gap: 1.5rem;
	padding: 1rem 1.25rem;
	background: #fff;
}
.type-row + .type-row {
	border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.type-row__label {
	width: 10rem;
	flex-shrink: 0;
	white-space: nowrap;
}
.type-row__sample {
	margin: 0;
	min-width: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

/* ─── Constraint cards ────────────────────────────────── */
.constraint-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
	gap: 1rem;
}
.constraint-card {
	padding: 1.25rem;
	border-radius: 6px;
	border: 1px solid rgba(0, 0, 0, 0.08);
	background: #fff;
	overflow: hidden;
}
.constraint-card__label {
	display: block;
	margin-bottom: 0.75rem;
}
.constraint-card__demo {
	margin: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.constraint-card--a {
	border-left: 3px solid rgb(75, 67, 190);
}
.constraint-card--b {
	border-left: 3px solid rgb(255, 87, 34);
}
.constraint-card--c {
	border-left: 3px solid rgb(76, 175, 80);
}
.constraint-card--d {
	border-left: 3px solid rgb(33, 150, 243);
}

/* ─── Color system ────────────────────────────────────── */
.color-groups {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}
.color-group__heading {
	margin: 0 0 0.5rem;
	text-transform: uppercase;
	letter-spacing: 0.06em;
}
.color-swatches {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}
.swatch {
	display: flex;
	align-items: flex-end;
	padding: 0.6rem 0.75rem;
	border-radius: 6px;
	min-width: 7rem;
	min-height: 4rem;
}
.swatch span {
	padding: 0.15rem 0.4rem;
	border-radius: 0.25rem;
	color: white;
	background: rgba(0, 0, 0, 0.75);
}
.swatch--light {
	border: 1px solid rgba(0, 0, 0, 0.1);
}
.swatch--border {
	border: 1px solid rgba(0, 0, 0, 0.15);
}

/* ─── Spacing demo ────────────────────────────────────── */
.spacing-demo {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}
.spacing-demo__ruler {
	border: 1px dashed rgba(0, 0, 0, 0.2);
	border-radius: 4px;
	overflow: hidden;
}
.spacing-demo__track {
	display: flex;
	justify-content: center;
}
.spacing-demo__inner {
	padding: 0.5rem 0;
}

/* ─── Scope demo ──────────────────────────────────────── */
.scope-demo {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(min(100%, 24rem), 1fr));
	gap: 1rem;
}
.scope-demo__pane {
	padding: 1.5rem;
	border-radius: 6px;
}
.scope-demo__label {
	margin: 0 0 0.5rem;
}
.scope-demo__body {
	margin: 0;
}
@media (max-width: 600px) {
	.type-row {
		flex-direction: column;
		gap: 0.4rem;
	}
	.type-row__sample {
		max-width: 100%;
	}
}
</style>
