<template>
	<div class="class-theme-demo bg-primary px-layout-margin py-layout-gutter">
		<p class="text-h4 text-onSurfacePrimary">{{ label }}</p>
		<p class="text-body2 text-onSurfacePrimaryMedium">
			Primary color is overridden by <code>.class-theme-demo</code>.
		</p>
	</div>
</template>

<script setup>
defineProps({ label: { type: String, required: true } });

const styleTagId = useId();
useThemeConfiguration({
	selector: '.class-theme-demo',
	partial: true,
	config: {
		backgroundColors: {
			primary: [190, 60, 90],
		},
	},
	styleTagId,
});
</script>

<style scoped>
.class-theme-demo {
	border-radius: 6px;
}

p {
	margin: 0;
}
</style>
