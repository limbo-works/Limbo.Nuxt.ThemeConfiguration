<!-- eslint-disable -->
<template>
	<slot></slot>
</template>

<script lang="ts">
import { ref } from 'vue';
const observedData = ref({});
export { observedData as config };
</script>

<script setup lang="ts">
import { watch } from 'vue';
import { useThemeConfiguration } from '../composables/useThemeConfiguration';
import type { ThemeConfiguration } from '../utils/theme-configuration.types';

const props = defineProps<{
	config?: string | ThemeConfiguration;
	media?: Record<string, string | ThemeConfiguration>;
	useThemeClasses?: boolean | string[];
	mergeThemeClassesWithBaseConfig?: boolean;
	cssLayer?: string;
	selector?: string;
	partial?: boolean;
	styleTagId?: string;
}>();

const { compConfig } = useThemeConfiguration(props);
defineExpose({
	config: compConfig,
});
watch(compConfig, (value) => (observedData.value = value), {
	immediate: true,
	deep: true,
});
</script>
