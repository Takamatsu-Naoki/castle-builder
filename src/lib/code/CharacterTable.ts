import { pipe } from 'fp-ts/function';
import * as RA from 'fp-ts/ReadonlyArray';
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray';
import * as O from 'fp-ts/Option';
import * as S from 'fp-ts/string';
import { type Stage, Symbol } from '$lib/code/Config';

export type CharacterArray = RNEA.ReadonlyNonEmptyArray<string>;
export type CharacterTable = RNEA.ReadonlyNonEmptyArray<CharacterArray>;

type TableSize = {
  row: number;
  column: number;
};

export const generateCharacterTable =
  (size: TableSize) =>
    (character: string): CharacterTable =>
      pipe(size.row, RNEA.replicate(pipe(size.column, RNEA.replicate(character))));

const getRowSize = (table: CharacterTable): number => table.length;

const getColumnSize = (table: CharacterTable): number => pipe(table, RNEA.head, RA.size);

type Coordinate = {
  x: number;
  y: number;
};

export const isSameCoordinate =
  (a: Coordinate) =>
    (b: Coordinate): boolean =>
      a.x === b.x && a.y === b.y;

const lookup =
  (coordinate: Coordinate) =>
    (table: CharacterTable): O.Option<string> =>
      pipe(table, RA.lookup(coordinate.y), O.flatMap(RA.lookup(coordinate.x)));

const isValidCoordinate =
  (table: CharacterTable) =>
    (coordinate: Coordinate): boolean =>
      0 < coordinate.x &&
      coordinate.x < getColumnSize(table) - 1 &&
      0 < coordinate.y &&
      coordinate.y < getRowSize(table) - 1 &&
      pipe(
        table,
        lookup(coordinate),
        O.exists((a) => a !== Symbol.Wall && a !== Symbol.Enemy)
      );

export const moveCharacter =
  (table: CharacterTable) =>
    (coordinate: Coordinate) =>
      (difference: Coordinate): Coordinate => {
        const targetCoordinate = {
          x: coordinate.x + difference.x,
          y: coordinate.y + difference.y
        };

        return isValidCoordinate(table)(targetCoordinate) ? targetCoordinate : coordinate;
      };

const fillRow =
  (index: number) =>
    (character: string) =>
      (table: CharacterTable): O.Option<CharacterTable> =>
        pipe(table, RNEA.updateAt(index, RNEA.replicate(character)(getColumnSize(table))));

const addTopFrame =
  (character: string) =>
    (table: CharacterTable): CharacterTable =>
      pipe(
        table,
        fillRow(0)(character),
        O.getOrElse(() => table)
      );

const addBottomFrame =
  (character: string) =>
    (table: CharacterTable): CharacterTable =>
      pipe(
        table,
        fillRow(table.length - 1)(character),
        O.getOrElse(() => table)
      );

const fillColumn =
  (index: number) =>
    (character: string) =>
      (table: CharacterTable): O.Option<CharacterTable> =>
        0 <= index && index < getColumnSize(table)
          ? pipe(
            table,
            RNEA.map((a) =>
              pipe(
                a,
                RNEA.updateAt(index, character),
                O.getOrElse(() => a)
              )
            ),
            O.some
          )
          : O.none;

const addLeftFrame =
  (character: string) =>
    (table: CharacterTable): CharacterTable =>
      pipe(
        table,
        fillColumn(0)(character),
        O.getOrElse(() => table)
      );

const addRightFrame =
  (character: string) =>
    (table: CharacterTable): CharacterTable =>
      pipe(
        table,
        fillColumn(getColumnSize(table) - 1)(character),
        O.getOrElse(() => table)
      );

export const addFrame =
  (character: string) =>
    (table: CharacterTable): CharacterTable =>
      pipe(
        table,
        addTopFrame(character),
        addBottomFrame(character),
        addLeftFrame(character),
        addRightFrame(character)
      );

const updateArrayAt =
  (index: number) =>
    (character: string) =>
      (array: CharacterArray): CharacterArray =>
        pipe(
          array,
          RNEA.updateAt(index, character),
          O.getOrElse(() => array)
        );

export const updateTableAt =
  (coordinate: Coordinate) =>
    (character: string) =>
      (table: CharacterTable): CharacterTable =>
        pipe(
          table,
          RNEA.modifyAt(coordinate.y, updateArrayAt(coordinate.x)(character)),
          O.getOrElse(() => table)
        );

const renderCharacterArray = (array: CharacterArray): string =>
  pipe(
    array,
    RNEA.reduce('', (b, a) => b + a)
  );

export const renderCharacterTable = (table: CharacterTable): string =>
  pipe(
    table,
    RNEA.reduce('', (b, a) => b + renderCharacterArray(a) + '\n'),
    (a) => a.slice(0, -1)
  );

export const updateTableByArray =
  (character: string) =>
    (array: CoordinateArray) =>
      (table: CharacterTable): CharacterTable =>
        pipe(
          array,
          RA.reduce(table, (b, a) => pipe(b, updateTableAt(a)(character)))
        );

const replaceArray =
  (original: string) =>
    (result: string) =>
      (array: CharacterArray): CharacterArray =>
        pipe(array, RNEA.map(S.replace(original, result)));

export const replaceTable =
  (original: string) =>
    (result: string) =>
      (table: CharacterTable): CharacterTable =>
        pipe(table, RNEA.map(replaceArray(original)(result)));

export type CoordinateArray = ReadonlyArray<Coordinate>;

const findBlankCharactersFromArray =
  (rowNumber: number) =>
    (array: CharacterArray): CoordinateArray =>
      pipe(
        array,
        RNEA.reduceWithIndex([] as CoordinateArray, (i, b, a) =>
          a === Symbol.Blank ? pipe(b, RA.append({ x: i, y: rowNumber })) : b
        )
      );

export const findBlankCharacters = (table: CharacterTable): CoordinateArray =>
  pipe(
    table,
    RNEA.reduceWithIndex([] as CoordinateArray, (i, b, a) =>
      pipe(b, RA.concat(findBlankCharactersFromArray(i)(a)))
    )
  );

const countCharacter =
  (table: CharacterTable) =>
    (character: string): number =>
      pipe(
        table,
        RNEA.flatten,
        RA.filter((a) => a === character),
        (a) => a.length
      );

export const hasEnoughBlank = (stage: Stage) => (table: CharacterTable): boolean =>
  stage.enemyCount + stage.rewardCount <= countCharacter(table)(Symbol.Blank);

const calculateCoordinateDifference =
  (a: Coordinate) =>
    (b: Coordinate): Coordinate => ({ x: b.x - a.x, y: b.y - a.y });

const addCoordinate =
  (a: Coordinate) =>
    (b: Coordinate): Coordinate => ({ x: b.x + a.x, y: b.y + a.y });

const calculateAngle =
  (table: CharacterTable) =>
    (targetCoordinate: Coordinate) =>
      (enemyCoordinateArray: CoordinateArray) =>
        (coordinate: Coordinate): Coordinate => {
          const difference = pipe(targetCoordinate, calculateCoordinateDifference(coordinate));

          const angle = { x: Math.sign(difference.x), y: Math.sign(difference.y) };

          const absoluteAngle = { x: Math.abs(difference.x), y: Math.abs(difference.y) };

          const resultX = addCoordinate(coordinate)({ x: angle.x, y: 0 });

          const resultY = addCoordinate(coordinate)({ x: 0, y: angle.y });

          const canMoveTo = (a: Coordinate) =>
            isValidCoordinate(table)(a) && !pipe(enemyCoordinateArray, RA.exists(isSameCoordinate(a)));

          return absoluteAngle.x < absoluteAngle.y && canMoveTo(resultY)
            ? resultY
            : absoluteAngle.y <= absoluteAngle.x && canMoveTo(resultX)
              ? resultX
              : canMoveTo(resultX)
                ? resultX
                : canMoveTo(resultY)
                  ? resultY
                  : coordinate;
        };

export const moveEnemy =
  (table: CharacterTable) =>
    (targetCoordinate: Coordinate) =>
      (enemyCoordinateArray: CoordinateArray): CoordinateArray =>
        pipe(
          enemyCoordinateArray,
          RA.reduceWithIndex(enemyCoordinateArray, (i, b, a) =>
            pipe(
              b,
              RA.updateAt(i, calculateAngle(table)(targetCoordinate)(b)(a)),
              O.getOrElse(() => b)
            )
          )
        );
