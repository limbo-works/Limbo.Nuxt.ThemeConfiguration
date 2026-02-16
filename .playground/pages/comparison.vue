<template>
	<div style="font-family: system-ui; padding: 2rem;">
		<h1 style="margin-bottom: 2rem;">Theme Configuration: Breakpoint Properties Comparison</h1>

		<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
			<div style="border: 2px solid #ccc; padding: 1rem; border-radius: 8px;">
				<h2 style="margin-top: 0;">With Breakpoint Properties (Default)</h2>
				<p style="color: #666; font-size: 0.9rem;">
					disableBreakpointSpecificCustomProperties: <strong>false</strong>
				</p>
				<ThemeConfiguration
					ref="themeConfigDefault"
					config="default"
				/>
				<div style="margin-top: 1rem;">
					<p style="font-size: 0.875rem;">Generated properties include:</p>
					<ul style="font-family: monospace; font-size: 0.8rem; color: #444;">
						<li>--theme-spacing-small--sm</li>
						<li>--theme-spacing-small--md</li>
						<li>--theme-spacing-small--lg</li>
						<li>--theme-layout-margin--sm</li>
						<li>--theme-layout-margin--md</li>
						<li>--theme-layout-margin--lg</li>
						<li style="color: #999;">...and more</li>
					</ul>
				</div>
			</div>

			<div style="border: 2px solid #4b43be; padding: 1rem; border-radius: 8px;">
				<h2 style="margin-top: 0; color: #4b43be;">Without Breakpoint Properties</h2>
				<p style="color: #666; font-size: 0.9rem;">
					disableBreakpointSpecificCustomProperties: <strong>true</strong>
				</p>
				<ThemeConfiguration
					ref="themeConfigNoBreakpoints"
					config="no-breakpoints"
				/>
				<div style="margin-top: 1rem;">
					<p style="font-size: 0.875rem;">Generated properties exclude:</p>
					<ul style="font-family: monospace; font-size: 0.8rem; color: #444;">
						<li style="text-decoration: line-through; color: #999;">--theme-spacing-small--sm</li>
						<li style="text-decoration: line-through; color: #999;">--theme-spacing-small--md</li>
						<li style="text-decoration: line-through; color: #999;">--theme-spacing-small--lg</li>
						<li style="color: #4b43be;">Values hardcoded in clamps instead</li>
					</ul>
				</div>
			</div>
		</div>

		<div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
			<h3 style="margin-top: 0;">Key Differences</h3>
			<table style="width: 100%; border-collapse: collapse;">
				<thead>
					<tr style="border-bottom: 2px solid #ccc;">
						<th style="text-align: left; padding: 0.5rem;">Aspect</th>
						<th style="text-align: left; padding: 0.5rem;">Default (false)</th>
						<th style="text-align: left; padding: 0.5rem;">Disabled (true)</th>
					</tr>
				</thead>
				<tbody>
					<tr style="border-bottom: 1px solid #ddd;">
						<td style="padding: 0.5rem;">Custom Properties</td>
						<td style="padding: 0.5rem;">Generates --sm, --md, --lg variants</td>
						<td style="padding: 0.5rem;">Does not generate --sm, --md, --lg</td>
					</tr>
					<tr style="border-bottom: 1px solid #ddd;">
						<td style="padding: 0.5rem;">Clamp Functions</td>
						<td style="padding: 0.5rem;">Uses var(--property--sm)</td>
						<td style="padding: 0.5rem;">Uses hardcoded values</td>
					</tr>
					<tr style="border-bottom: 1px solid #ddd;">
						<td style="padding: 0.5rem;">CSS Output Size</td>
						<td style="padding: 0.5rem;">Larger (more properties)</td>
						<td style="padding: 0.5rem;">Smaller (fewer properties)</td>
					</tr>
					<tr style="border-bottom: 1px solid #ddd;">
						<td style="padding: 0.5rem;">Flexibility</td>
						<td style="padding: 0.5rem;">Can reference breakpoint values</td>
						<td style="padding: 0.5rem;">Breakpoint values not accessible</td>
					</tr>
					<tr>
						<td style="padding: 0.5rem;">Use Case</td>
						<td style="padding: 0.5rem;">When you need individual breakpoint values</td>
						<td style="padding: 0.5rem;">When you want smaller CSS output</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div style="background: #e8f4f8; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #0066cc;">
			<h3 style="margin-top: 0; color: #0066cc;">💡 Usage Tip</h3>
			<p style="margin: 0;">
				Enable <code style="background: white; padding: 0.2rem 0.4rem; border-radius: 3px;">disableBreakpointSpecificCustomProperties: true</code>
				when you don't need to directly reference individual breakpoint values (like <code style="background: white; padding: 0.2rem 0.4rem; border-radius: 3px;">var(--theme-spacing-small--md)</code>)
				in your custom CSS. The responsive behavior will still work perfectly via the clamp functions.
			</p>
		</div>
	</div>
</template>

<script setup>
const themeConfigDefault = ref(null);
const themeConfigNoBreakpoints = ref(null);

onMounted(() => {
	console.log('Theme configurations loaded');
	console.log('Default config:', themeConfigDefault.value?.config);
	console.log('No-breakpoints config:', themeConfigNoBreakpoints.value?.config);
});
</script>
