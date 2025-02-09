/**
 * Returns the index of an object in an array by matching object properties
 * @param arr Array to search in
 * @param obj Object with properties to match
 * @returns Index of the first matching object, or -1 if not found
 */
export function indexOfObject<T extends object>(arr: T[], obj: Partial<T>): number {
  for (let i = 0; i < arr.length; i++) {
    const matches = Object.keys(obj).every((key) => {
      return obj[key as keyof T] === arr[i][key as keyof T];
    });

    if (matches) return i;
  }
  return -1;
}

/**
 * Moves an item from one position in array to another
 */
export function arrayMove<T>(arr: T[], previousIndex: number, newIndex: number): T[] {
  const array = arr.slice(0);
  if (newIndex >= array.length) {
    let k = newIndex - array.length;
    while (k-- + 1) {
      array.push(undefined as any);
    }
  }
  array.splice(newIndex, 0, array.splice(previousIndex, 1)[0]);
  return array;
}

/**
 * Swaps two elements in an array
 */
export function swap<T>(arr: T[], i: number, j: number): void {
  [arr[i], arr[j]] = [arr[j], arr[i]];
}
