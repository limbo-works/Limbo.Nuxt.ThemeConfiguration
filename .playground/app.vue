<template>
	<div class="test bg-fishStick bg-scope-fishStick">
		<ThemeConfiguration
			ref="themeConfiguration"
			use-theme-classes
			:media="{
				print: 'print',
			}"
		/>
		<div class="text-strong @fish:bg-[red]">Test?</div>
	</div>
	<div class="bg-primary px-layout-margin py-layout-gutter">
		<div class="u-theme-default bg-primary border-3 border-danger">
			<div class="text-onSurfaceDanger">Test?</div>
		</div>
	</div>
</template>

<script setup>
const themeConfiguration = ref(null);

// Get a subset with all color rules that start with 'on' from the default theme
const testSubset = getThemeConfiguration('default', {
	[/colors/i]: /^on[A-Z]/,
});
console.log('subset', testSubset);
console.log('getThemeConfigurations', getThemeConfigurations());
</script>

<style>
.test {
	@apply @container;
}
</style>
