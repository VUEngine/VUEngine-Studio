import { MutableRefObject, useCallback, useEffect, useState } from 'react';

import useHandlers from './useHandlers';
import {
  BRUSH_PATTERN_ELEMENT,
  BrushTool,
  CanvasBrushChangeParams,
} from '../components/Canvas/types';
import { DottingRef } from '../components/Dotting';

const useBrush = (ref: MutableRefObject<DottingRef | null>) => {
  const [brushTool, setBrushTool] = useState<BrushTool>(BrushTool.DOT);
  const [brushColor, setBrushColor] = useState<string>('');
  const [brushPattern, setBrushPattern] = useState<
    Array<Array<BRUSH_PATTERN_ELEMENT>>
  >([[BRUSH_PATTERN_ELEMENT.FILL]]);
  const { addBrushChangeListener, removeBrushChangeListener } =
    useHandlers(ref);

  useEffect(() => {
    const listener = ({
      brushColor: changedColor,
      brushTool: changedTool,
      brushPattern: changedPattern,
    }: CanvasBrushChangeParams) => {
      setBrushTool(changedTool);
      setBrushColor(changedColor);
      setBrushPattern(changedPattern);
    };
    addBrushChangeListener(listener);
    return () => {
      removeBrushChangeListener(listener);
    };
  }, [addBrushChangeListener, removeBrushChangeListener]);
  const changeBrushColor = useCallback(
    (color: string) => {
      ref.current?.changeBrushColor(color);
    },
    [ref],
  );

  const changeBrushPattern = useCallback(
    (pattern: Array<Array<BRUSH_PATTERN_ELEMENT>>) => {
      ref.current?.changeBrushPattern(pattern);
    },
    [ref],
  );

  const changeBrushTool = useCallback(
    (brushMode: BrushTool) => {
      ref.current?.changeBrushTool(brushMode);
    },
    [ref],
  );

  return {
    changeBrushColor,
    changeBrushTool,
    changeBrushPattern,
    brushTool,
    brushColor,
    brushPattern,
  };
};

export default useBrush;
