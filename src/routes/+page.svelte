<script lang="ts">
	import { pipe } from 'fp-ts/function';
	import * as RA from 'fp-ts/ReadonlyArray';
	import * as O from 'fp-ts/Option';
	import { onMount } from 'svelte';
	import { config, stageSet } from '$lib/code/Config';

	const keyConfig = config.keyConfig;

	const stageArray = Array.from(stageSet.keys());

	let formattedStageArray = pipe(
		stageArray,
		RA.map((a) => '   ' + a)
	);

	let selectedStage = 0;

	const isMoving = (key: string): boolean => key === keyConfig.goDown || key === keyConfig.goUp;

	const addHighlight = (a: string): string => a.replace('  ', '=>');

	const removeHighlight = (a: string): string => a.replace('=>', '  ');

	const onKeyDown = (event: KeyboardEvent) => {
		const key = event.key;

		formattedStageArray = isMoving(key)
			? pipe(
					formattedStageArray,
					RA.updateAt(selectedStage, removeHighlight(formattedStageArray[selectedStage])),
					O.getOrElse(() => formattedStageArray)
				)
			: stageArray;

		selectedStage =
			key === keyConfig.goDown && selectedStage < stageArray.length - 1
				? selectedStage + 1
				: key === keyConfig.goDown
					? 0
					: key === keyConfig.goUp && 0 < selectedStage
						? selectedStage - 1
						: key === keyConfig.goUp
							? stageArray.length - 1
							: selectedStage;

		formattedStageArray = isMoving(key)
			? pipe(
					formattedStageArray,
					RA.updateAt(selectedStage, addHighlight(formattedStageArray[selectedStage])),
					O.getOrElse(() => formattedStageArray)
				)
			: stageArray;

		if (key === keyConfig.enter) window.location.href = '/game/' + stageArray[selectedStage];
	};

	onMount(() => {
		formattedStageArray = pipe(
			formattedStageArray,
			RA.updateAt(selectedStage, addHighlight(formattedStageArray[selectedStage])),
			O.getOrElse(() => formattedStageArray)
		);
	});
</script>

<svelte:window on:keydown|preventDefault={onKeyDown} />

<svelte:head>
	<title>Castle Builder</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@100..900&family=Roboto&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div id="stage-list-container">
	<ol id="stage-list">
		{#each formattedStageArray as stage}
			<li>{stage}</li>
		{/each}
	</ol>
</div>

<style>
	#stage-list-container {
		text-align: center;
	}

	#stage-list {
		display: inline-block;
		list-style: none;
		text-align: left;
		white-space: pre;
	}

	#stage-list li {
		margin: 0.8em;
	}
</style>
