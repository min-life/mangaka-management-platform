'use client';

import { useState } from 'react';

export function useCanvasViewport() {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [comparisonOpacity, setComparisonOpacity] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  return {
    zoom,
    setZoom,
    rotation,
    setRotation,
    comparisonOpacity,
    setComparisonOpacity,
    panOffset,
    setPanOffset,
    panStart,
    setPanStart,
    isPanning,
    setIsPanning,
  };
}

export type CanvasViewport = ReturnType<typeof useCanvasViewport>;
