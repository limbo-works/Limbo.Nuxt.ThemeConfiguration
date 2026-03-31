<template>
	<slot></slot>
</template>

<script>
const observedData = ref({});
export { observedData as config };
</script>

<script setup>
import { useThemeConfiguration } from '~/composables/useThemeConfiguration.js';

const props = defineProps({
	config: [String, Object],

	// Add specific media queries with their own theme configuration.
	media: Object,

	// If true, theme classes will be generated for each theme
	// configuration, which can be used to apply different themes
	// to different parts of the page. If an array is provided,
	// only theme classes for the specified themes will be generated.
	useThemeClasses: [Boolean, Array],

	// If each theme class should be a "hard reset" to the current
	// theme + the theme class, instead of being able to cascade on
	// top of each other. This is useful to prevent unexpected
	// results when using multiple theme classes together, but also
	// causes more CSS to be generated.
	mergeThemeClassesWithBaseConfig: {
		type: Boolean,
		default: false,
	},

	// Apply the generated CSS in a CSS layer.
	cssLayer: String,
});

defineExpose({
	config: observedData,
});

const { compConfig } = useThemeConfiguration(props);
watch(compConfig, (value) => (observedData.value = value), {
	immediate: true,
	deep: true,
});
</script>
