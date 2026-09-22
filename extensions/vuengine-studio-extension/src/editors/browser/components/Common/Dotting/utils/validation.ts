import { Indices } from './types';

export function isValidIndicesRange(
  rowIndex: number,
  columnIndex: number,
  indices: Indices,
): boolean {
  const { topRowIndex, bottomRowIndex, leftColumnIndex, rightColumnIndex } =
    indices;

  return !(
    rowIndex < topRowIndex ||
    rowIndex > bottomRowIndex ||
    columnIndex < leftColumnIndex ||
    columnIndex > rightColumnIndex
  );
}
