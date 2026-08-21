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
import type { ThemeConfiguration } from '~/utils/theme-configuration.types';

const props = defineProps<{
	config?: string | ThemeConfiguration;
	media?: Record<string, string | ThemeConfiguration>;
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
