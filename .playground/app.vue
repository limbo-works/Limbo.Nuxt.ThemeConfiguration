<template>
	<div>
		<ThemeConfiguration
			ref="themeConfiguration"
			use-theme-classes
			:media="{ print: 'print' }"
		/>

		<!-- Hero -->
		<header class="hero bg-primary px-layout-margin py-layout-gutter">
			<p class="hero__overline text-caption text-onSurfacePrimaryMedium">
				Limbo.Nuxt.ThemeConfiguration
			</p>
			<h1 class="hero__title text-h2 text-onSurfacePrimary">
				Theme Configuration Playground
			</h1>
			<p class="hero__sub text-body2 text-onSurfacePrimaryMedium">
				Responsive typography &middot; CSS variable theming &middot;
				Min/max constraints
			</p>
		</header>

		<!-- Section: Typography -->
		<section class="section px-layout-margin py-layout-gutter">
			<h2 class="section__title text-h4 text-onSurface">
				Typography Scale
			</h2>
			<p class="section__intro text-body2 text-onSurfaceVariant">
				All sizes are fluid, scaling between
				<code>smViewport</code> (375px) and
				<code>lgViewport</code> (1920px).
			</p>

			<div class="type-stack">
				<div v-for="size in fontSizes" :key="size.key" class="type-row">
					<span
						class="type-row__label text-caption text-onSurfaceVariant"
						>{{ size.label }}</span
					>
					<p
						:class="`text-${size.key} text-onSurface`"
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
		<section class="section px-layout-margin py-layout-gutter">
			<h2 class="section__title text-h4 text-onSurface">Color System</h2>
			<p class="section__intro text-body2 text-onSurfaceVariant">
				Background and text colors defined in the theme config,
				available as UnoCSS utilities.
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
		<section class="section px-layout-margin py-layout-gutter">
			<h2 class="section__title text-h4 text-onSurface">Theme Scope</h2>
			<p class="section__intro text-body2 text-onSurfaceVariant">
				Use <code>bg-scope-*</code> to scope CSS variable overrides to a
				subtree.
			</p>

			<div class="scope-demo">
				<div class="scope-demo__pane bg-primary bg-scope-primary">
					<p class="text-h4 text-onSurfacePrimary scope-demo__label">
						bg-scope-primary
					</p>
					<p
						class="text-body2 text-onSurfacePrimaryMedium scope-demo__body"
					>
						Text colors shift to ensure contrast against the primary
						background.
					</p>
				</div>
				<div class="scope-demo__pane bg-fishStick bg-scope-fishStick">
					<p
						class="text-h4 text-onSurfaceFishStick scope-demo__label"
					>
						bg-scope-fishStick
					</p>
					<p
						class="text-body2 text-onSurfaceFishStick scope-demo__body"
					>
						Text colors shift to ensure contrast against the
						fishStick background.
					</p>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup>
const themeConfiguration = ref(null);

const fontSizes = [
	{ key: 'h1', label: 'h1 — 30→64px', sample: 'The quick brown fox' },
	{ key: 'h2', label: 'h2 — 25→48px', sample: 'The quick brown fox' },
	{ key: 'h3', label: 'h3 — 18→32px', sample: 'The quick brown fox jumps' },
	{
		key: 'h4',
		label: 'h4 — 16→24px',
		sample: 'The quick brown fox jumps over',
	},
	{
		key: 'body1',
		label: 'body1 — 16→24px',
		sample: 'The quick brown fox jumps over the lazy dog',
	},
	{
		key: 'body2',
		label: 'body2 — 14→20px',
		sample: 'The quick brown fox jumps over the lazy dog',
	},
	{
		key: 'caption',
		label: 'caption — 12→14px',
		sample: 'The quick brown fox jumps over the lazy dog',
	},
	{
		key: 'overline',
		label: 'overline — 10→12px',
		sample: 'THE QUICK BROWN FOX',
	},
];
</script>

<style scoped>
/* ─── Base ────────────────────────────────────────────── */
* {
	box-sizing: border-box;
}

/* ─── Hero ────────────────────────────────────────────── */
.hero {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}
.hero__overline {
	margin: 0;
	text-transform: uppercase;
	letter-spacing: 0.08em;
}
.hero__title {
	margin: 0;
}
.hero__sub {
	margin: 0;
}

/* ─── Section ─────────────────────────────────────────── */
.section {
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.section--tinted {
	background: rgba(0, 0, 0, 0.025);
}
.section__title {
	margin: 0 0 0.375rem;
}
.section__intro {
	margin: 0 0 1.75rem;
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
</style>
