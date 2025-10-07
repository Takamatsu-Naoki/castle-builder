import type { number } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import * as RA from 'fp-ts/ReadonlyArray';

type KeyConfig = {
  goUp: string;
  goDown: string;
  goLeft: string;
  goRight: string;
  jumpUp: string;
  jumpDown: string;
  jumpLeft: string;
  jumpRight: string;
  enter: string;
  reset: string;
};

const keyConfigSet = {
  arrow: {
    goUp: 'ArrowUp',
    goDown: 'ArrowDown',
    goLeft: 'ArrowLeft',
    goRight: 'ArrowRight',
    jumpUp: 'Shift+ArrowUp',
    jumpDown: 'Shift+ArrowDown',
    jumpLeft: 'Shift+ArrowLeft',
    jumpRight: 'Shift+ArrowRight',
    enter: 'Enter',
    reset: 'r'
  } satisfies KeyConfig,
  hjkl: {
    goUp: 'k',
    goDown: 'j',
    goLeft: 'h',
    goRight: 'l',
    jumpUp: 'Shift+K',
    jumpDown: 'Shift+J',
    jumpLeft: 'Shift+H',
    jumpRight: 'Shift+L',
    enter: ';',
    reset: 'r'
  } satisfies KeyConfig
};

export type Stage = {
  tableSize: { row: number; column: number };
  initialCoordinate: { x: number; y: number };
  enemyCount: number;
  rewardCount: number;
};

export const defaultStage: Stage = {
      tableSize: { row: 5, column: 5 },
      initialCoordinate: { x: 1, y: 1 },
      enemyCount: 1,
      rewardCount: 1
    }

export const stageSet: ReadonlyMap<string, Stage> = new Map([
  [
    'amateur',
    {
      tableSize: { row: 5, column: 5 },
      initialCoordinate: { x: 1, y: 1 },
      enemyCount: 1,
      rewardCount: 1
    }
  ],
  [
    'normal',
    {
      tableSize: { row: 9, column: 7 },
      initialCoordinate: { x: 1, y: 1 },
      enemyCount: 2,
      rewardCount: 2
    }
  ],
  [
    'professional',
    {
      tableSize: { row: 11, column: 19 },
      initialCoordinate: { x: 1, y: 1 },
      enemyCount: 3,
      rewardCount: 5
    }
  ]
]);

export const config = {
  keyConfig: keyConfigSet.arrow
};

export const Symbol = {
  Wall: 'X',
  Blank: ' ',
  Fence: '0',
  MainCharacter: 'u',
  Enemy: 'e',
  Reward: '*'
} as const;

export type Symbol = (typeof Symbol)[keyof typeof Symbol];

export const isMovingKey =
  (keyConfig: KeyConfig) =>
    (key: string): boolean =>
      pipe(
        [
          keyConfig.goUp,
          keyConfig.goDown,
          keyConfig.goLeft,
          keyConfig.goRight,
          keyConfig.jumpUp,
          keyConfig.jumpDown,
          keyConfig.jumpLeft,
          keyConfig.jumpRight
        ],
        RA.exists((a) => a === key)
      );

export const isGoingKey =
  (keyConfig: KeyConfig) =>
    (key: string): boolean =>
      pipe(
        [keyConfig.goUp, keyConfig.goDown, keyConfig.goLeft, keyConfig.goRight],
        RA.exists((a) => a === key)
      );

export const isJumpingKey =
  (keyConfig: KeyConfig) =>
    (key: string): boolean =>
      pipe(
        [keyConfig.jumpUp, keyConfig.jumpDown, keyConfig.jumpLeft, keyConfig.jumpRight],
        RA.exists((a) => a === key)
      );
