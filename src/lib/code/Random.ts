import { pipe } from 'fp-ts/function';
import * as RA from 'fp-ts/ReadonlyArray';
import * as O from 'fp-ts/Option';

const generateRandomInt = (max: number): number => Math.floor(Math.random() * (max + 1));

export const pickRandomElement =
  (max: number) =>
    <A>(state: { counter: number; result: ReadonlyArray<A> } = { counter: 0, result: [] }) =>
      (array: ReadonlyArray<A>): ReadonlyArray<A> => {
        const index = generateRandomInt(array.length - 1);

        const updatedCounter = state.counter + 1;

        const updatedResult = pipe(
          array,
          RA.lookup(index),
          O.match(
            () => state.result,
            (a) => pipe(state.result, RA.append(a))
          )
        );

        const updatedArray = pipe(
          array,
          RA.deleteAt(index),
          O.getOrElse(() => array)
        );

        return updatedCounter !== max
          ? pipe(
            updatedArray,
            pickRandomElement(max)({ counter: updatedCounter, result: updatedResult })
          )
          : updatedResult;
      };
