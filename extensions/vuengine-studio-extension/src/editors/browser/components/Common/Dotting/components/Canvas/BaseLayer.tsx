import { DefaultPanZoom } from './config';
import { DottingData, PanZoom } from './types';
import {
  createColumnKeyOrderMapfromData,
  createRowKeyOrderMapfromData,
} from '../../utils/data';

export abstract class BaseLayer {
  protected ctx: CanvasRenderingContext2D;
  protected element: HTMLCanvasElement;
  protected clonedElement: HTMLCanvasElement;
  protected dpr: number;
  protected panZoom: PanZoom = DefaultPanZoom;
  protected width: number;
  protected height: number;
  protected criterionDataForRendering: DottingData | null;
  // TODO: We needed a key value sorted map!
  protected rowKeyOrderMap: Map<number, number> = new Map();
  protected columnKeyOrderMap: Map<number, number> = new Map();

  protected topRowIndex = 0;
  protected leftColumnIndex = 0;

  constructor({ canvas }: { canvas: HTMLCanvasElement }) {
    this.ctx = canvas.getContext('2d')!;
    this.element = canvas;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getElement(): HTMLCanvasElement {
    return this.element;
  }

  getRowKeyOrderMap(): Map<number, number> {
    return this.rowKeyOrderMap;
  }

  getColumnKeyOrderMap(): Map<number, number> {
    return this.columnKeyOrderMap;
  }

  setPanZoom(panZoom: PanZoom): void {
    this.panZoom = panZoom;
  }

  setCriterionDataForRendering(criterionDataForRendering: DottingData): void {
    this.criterionDataForRendering = criterionDataForRendering;
    const { rowKeyOrderMap, minRowKey } = createRowKeyOrderMapfromData(
      criterionDataForRendering,
    );
    const { columnKeyOrderMap, minColumnKey } = createColumnKeyOrderMapfromData(
      criterionDataForRendering,
    );
    this.rowKeyOrderMap = rowKeyOrderMap;
    this.columnKeyOrderMap = columnKeyOrderMap;
    this.topRowIndex = minRowKey;
    this.leftColumnIndex = minColumnKey;
  }

  scale(x: number, y: number): void {
    this.ctx.scale(x, y);
  }

  setWidth(width: number, devicePixelRatio?: number): void {
    this.width = width;
    this.element.width = devicePixelRatio ? width * devicePixelRatio : width;
    this.element.style.width = `${width}px`;
  }

  setHeight(height: number, devicePixelRatio?: number): void {
    this.height = height;
    this.element.height = devicePixelRatio ? height * devicePixelRatio : height;
    this.element.style.height = `${height}px`;
  }

  setDpr(dpr: number): void {
    this.dpr = dpr;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  setSize(width: number, height: number, devicePixelRatio?: number): void {
    this.setWidth(width, devicePixelRatio);
    this.setHeight(height, devicePixelRatio);
    this.dpr = devicePixelRatio ? devicePixelRatio : this.dpr;
  }

  setTopRowIndex(topRowIndex: number): void {
    this.topRowIndex = topRowIndex;
  }

  setLeftColumnIndex(leftColumnIndex: number): void {
    this.leftColumnIndex = leftColumnIndex;
  }

  getTopRowIndex(): number {
    return this.topRowIndex;
  }

  getLeftColumnIndex(): number {
    return this.leftColumnIndex;
  }

  abstract render(): void;
}
