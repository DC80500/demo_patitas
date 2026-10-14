/** Every item appears once per cycle; adjacent cycles never repeat an item. */
export function createShuffleBag<T>(
  items: readonly T[],
  random: () => number = Math.random,
  previous?: T,
): () => T {
  if (items.length < 2 || new Set(items).size !== items.length) {
    throw new Error('La bolsa necesita al menos dos elementos distintos.')
  }

  let bag: T[] = []
  let index = 0
  let last = previous

  return () => {
    if (index === bag.length) {
      bag = [...items]
      for (let position = bag.length - 1; position > 0; position--) {
        const other = Math.floor(random() * (position + 1))
        ;[bag[position], bag[other]] = [bag[other], bag[position]]
      }
      if (bag[0] === last) {
        const other = 1 + Math.floor(random() * (bag.length - 1))
        ;[bag[0], bag[other]] = [bag[other], bag[0]]
      }
      index = 0
    }
    const item = bag[index++]
    last = item
    return item
  }
}
