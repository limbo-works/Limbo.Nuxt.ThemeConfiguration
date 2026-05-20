<!-- eslint-disable -->
<template>
	<slot></slot>
</template>

<script lang="ts">
const observedData = ref({});
export { observedData as config };
</script>

<script setup lang="ts">
import { useThemeConfiguration } from '~/composables/useThemeConfiguration';

const props = defineProps<{
	config?: string | Record<string, any>;
	media?: Record<string, string | Record<string, any>>;
	useThemeClasses?: boolean | string[];
	mergeThemeClassesWithBaseConfig?: boolean;
	cssLayer?: string;
}>();

defineExpose({
	config: observedData,
});

const { compConfig } = useThemeConfiguration(props);
watch(compConfig, (value) => (observedData.value = value), {
	immediate: true,
	deep: true,
});
</script>
