<template>
	<div class="bg-fishStick bg-scope-fishStick">
		<ThemeConfiguration
			ref="themeConfiguration"
			use-theme-classes
			:media="{
				print: 'print',
			}"
		/>
		<div class="text-strong">Test?</div>
	</div>
	<div class="bg-primary">
		<div class="u-theme-default bg-primary border-3 border-danger">
			<div class="text-onSurfaceDanger">Test?</div>
		</div>
	</div>
</template>

<script setup>
const themeConfiguration = ref(null);
const configurations = await getThemeConfigurations();
</script>
