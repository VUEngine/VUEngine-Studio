export interface Coord {
  x: number;
  y: number;
}

export interface PanZoom {
  scale: number;
  offset: Coord;
}

export interface Indices {
  topRowIndex: number;
  bottomRowIndex: number;
  leftColumnIndex: number;
  rightColumnIndex: number;
}

export interface Index {
  rowIndex: number;
  columnIndex: number;
}
