<script lang="ts">
	import { onMount } from 'svelte';
	import { pipe } from 'fp-ts/function';
	import * as RA from 'fp-ts/ReadonlyArray';
  import * as RM from 'fp-ts/ReadonlyMap';
  import * as S from 'fp-ts/string';
  import * as O from 'fp-ts/Option';
	import { config, Symbol, isMovingKey, stageSet, defaultStage } from '$lib/code/Config';
	import type { CharacterTable, CoordinateArray } from '$lib/code/CharacterTable';
	import {
		generateCharacterTable,
		addFrame,
		renderCharacterTable,
		updateTableAt,
		updateTableByArray,
		moveCharacter,
		moveEnemy,
		replaceTable,
		hasEnoughBlank,
		findBlankCharacters,
		isSameCoordinate
	} from '$lib/code/CharacterTable';
	import { pickRandomElement } from '$lib/code/Random';

  export let data;

	const keyConfig = config.keyConfig;
	const isMovingKeyFor = isMovingKey(keyConfig);
  const stageName = data.params.stage;
  let stage = pipe(stageSet, RM.lookup(S.Eq)(stageName), O.getOrElse(() => defaultStage));

	let mainCharacterCoordinate = stage.initialCoordinate;
	let enemyCoordinateArray: CoordinateArray = [];
	let rewardCoordinateArray: CoordinateArray = [];

	let mapTable: CharacterTable;
	let characterTable: CharacterTable;
	let screen: string = "";

	let isWallPlaced = false;
	let isGameFailed = false;
	let isGameSucceeded = false;

	const normalizeKey = (event: KeyboardEvent): string =>
		event.shiftKey == true ? 'Shift+' + event.key : event.key;

	const isGameFinished = () => isGameFailed || isGameSucceeded;

	const onKeyDown = (event: KeyboardEvent) => {
		const key = normalizeKey(event);

		const canPlaceWall = key === keyConfig.enter && hasEnoughBlank(stage)(mapTable);

		// When the main character moves, mark the previous position as Blank.
		mapTable = isMovingKeyFor(key)
			? pipe(mapTable, updateTableAt(mainCharacterCoordinate)(Symbol.Blank))
			: mapTable;

		// Place walls.
		mapTable =
			key == keyConfig.enter && canPlaceWall && !isWallPlaced
				? pipe(mapTable, replaceTable(Symbol.Fence)(Symbol.Wall))
				: mapTable;

		// Move the main character.
		mainCharacterCoordinate =
			key === keyConfig.goUp && !isGameFinished()
				? moveCharacter(characterTable)(mainCharacterCoordinate)({ x: 0, y: -1 })
				: key === keyConfig.goDown && !isGameFinished()
					? moveCharacter(characterTable)(mainCharacterCoordinate)({ x: 0, y: 1 })
					: key === keyConfig.goLeft && !isGameFinished()
						? moveCharacter(characterTable)(mainCharacterCoordinate)({ x: -1, y: 0 })
						: key === keyConfig.goRight && !isGameFinished()
							? moveCharacter(characterTable)(mainCharacterCoordinate)({ x: 1, y: 0 })
							: mainCharacterCoordinate;

    /*
		// Handle character jumps.
		mainCharacterCoordinate =
			key === keyConfig.jumpUp && !isGameFinished()
				? moveCharacter(characterTable)(mainCharacterCoordinate)({ x: 0, y: -2 })
				: key === keyConfig.jumpDown && !isGameFinished()
					? moveCharacter(characterTable)(mainCharacterCoordinate)({ x: 0, y: 2 })
					: key === keyConfig.jumpLeft && !isGameFinished()
						? moveCharacter(characterTable)(mainCharacterCoordinate)({ x: -2, y: 0 })
						: key === keyConfig.jumpRight && !isGameFinished()
							? moveCharacter(characterTable)(mainCharacterCoordinate)({ x: 2, y: 0 })
							: mainCharacterCoordinate;
    */

		// Render the main character.
		characterTable = pipe(mapTable, updateTableAt(mainCharacterCoordinate)(Symbol.MainCharacter));

		// Determine reward positions.
		rewardCoordinateArray =
			key === keyConfig.enter && canPlaceWall && !isWallPlaced
				? pipe(findBlankCharacters(characterTable), pickRandomElement(stage.rewardCount)())
				: rewardCoordinateArray;

		// Remove any rewards collected by the main character.
		rewardCoordinateArray = isMovingKeyFor(key)
			? pipe(
					rewardCoordinateArray,
					RA.filter((a) => !isSameCoordinate(mainCharacterCoordinate)(a))
				)
			: rewardCoordinateArray;

		// Render rewards.
		characterTable = pipe(characterTable, updateTableByArray(Symbol.Reward)(rewardCoordinateArray));

		// Determine enemy positions.
		enemyCoordinateArray =
			key === keyConfig.enter && canPlaceWall && !isWallPlaced
				? pipe(findBlankCharacters(characterTable), pickRandomElement(stage.enemyCount)())
				: enemyCoordinateArray;

		// Move enemies.
		enemyCoordinateArray = isMovingKeyFor(key)
			? pipe(enemyCoordinateArray, moveEnemy(characterTable)(mainCharacterCoordinate))
			: enemyCoordinateArray;

		// Render enemies.
		characterTable = pipe(characterTable, updateTableByArray(Symbol.Enemy)(enemyCoordinateArray));

		// Check if walls have been placed (set to true after placing rewards and enemies).
		isWallPlaced = isWallPlaced ? true : key === keyConfig.enter && canPlaceWall;

		// Mark the game as succeeded if all rewards have been collected.
		isGameSucceeded = isWallPlaced && rewardCoordinateArray.length === 0;

		// Instantly mark the game as succeeded if the reset key is pressed.
		isGameSucceeded = key === keyConfig.reset ? true : isGameSucceeded;

		// Mark the game as failed if an enemy reaches the main character.
		isGameFailed = pipe(enemyCoordinateArray, RA.exists(isSameCoordinate(mainCharacterCoordinate)));

		// Reset all game data when the game ends.
		mainCharacterCoordinate = isGameFinished() ? stage.initialCoordinate : mainCharacterCoordinate;
		rewardCoordinateArray = isGameFinished() ? [] : rewardCoordinateArray;
		enemyCoordinateArray = isGameFinished() ? [] : enemyCoordinateArray;

		mapTable = isGameFinished()
			? pipe(Symbol.Fence, generateCharacterTable(stage.tableSize), addFrame(Symbol.Wall))
			: mapTable;

		characterTable = isGameFinished()
			? pipe(mapTable, updateTableAt(mainCharacterCoordinate)(Symbol.MainCharacter))
			: characterTable;

		isWallPlaced = isGameFinished() ? false : isWallPlaced;

		// Render the game screen.
		screen = isGameSucceeded
			? 'You Succeeded!'
			: isGameFailed
				? 'You Failed...'
				: pipe(characterTable, renderCharacterTable);
	};

	onMount(() => {
		mapTable = pipe(Symbol.Fence, generateCharacterTable(stage.tableSize), addFrame(Symbol.Wall));

		characterTable = pipe(mapTable, updateTableAt(mainCharacterCoordinate)(Symbol.MainCharacter));

		screen = pipe(characterTable, renderCharacterTable);
	});
</script>

<svelte:window on:keydown|preventDefault={onKeyDown} />

<svelte:head>
	<title>Castle Builder - {stageName}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@100..900&family=Roboto&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<p id="screen">{screen}</p>

<style>
	#screen {
		text-align: center;
		white-space: pre;
	}
</style>
