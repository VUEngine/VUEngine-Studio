import { MutableRefObject, useEffect, useState } from 'react';

import useHandlers from './useHandlers';
import { CanvasGridChangeHandler } from '../components/Canvas/types';
import { DottingRef } from '../components/Dotting';

const useGrids = (ref: MutableRefObject<DottingRef | null>) => {
  const { addGridChangeListener, removeGridChangeListener } = useHandlers(ref);
  const [dimensions, setDimensions] = useState({
    columnCount: 0,
    rowCount: 0,
  });
  const [indices, setIndices] = useState({
    topRowIndex: 0,
    bottomRowIndex: 0,
    leftColumnIndex: 0,
    rightColumnIndex: 0,
  });

  useEffect(() => {
    const listener: CanvasGridChangeHandler = ({
      dimensions: changedDimensions,
      indices: changedIndices,
    }) => {
      setDimensions({
        columnCount: changedDimensions.columnCount,
        rowCount: changedDimensions.rowCount,
      });
      setIndices({
        topRowIndex: changedIndices.topRowIndex,
        bottomRowIndex: changedIndices.bottomRowIndex,
        leftColumnIndex: changedIndices.leftColumnIndex,
        rightColumnIndex: changedIndices.rightColumnIndex,
      });
    };

    addGridChangeListener(listener);

    return () => {
      removeGridChangeListener(listener);
    };
  }, [addGridChangeListener, removeGridChangeListener]);

  return {
    dimensions,
    indices,
  };
};

export default useGrids;
