/**
 * Returns the index of an object in an array by matching object properties
 * @param arr Array to search in
 * @param obj Object with properties to match
 * @returns Index of the first matching object, or -1 if not found
 */
export declare function indexOfObject<T extends object>(arr: T[], obj: Partial<T>): number;
/**
 * Moves an item from one position in array to another
 */
export declare function arrayMove<T>(arr: T[], previousIndex: number, newIndex: number): T[];
/**
 * Swaps two elements in an array
 */
export declare function swap<T>(arr: T[], i: number, j: number): void;
