'use client';

import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import { type FileTaskRegion } from '../../file-ui';
import { type NormalizedPoint } from '../file-detail-types';

type UseCanvasAnnotationsProps = {
  isPanning: boolean;
  setIsPanning: (val: boolean) => void;
  panOffset: { x: number; y: number };
  setPanOffset: (val: { x: number; y: number }) => void;
  panStart: { x: number; y: number };
  setPanStart: (val: { x: number; y: number }) => void;
  setSelectedTaskId: (val: string | null) => void;
  setTaskDialogOpen: (val: boolean) => void;
};

export function useCanvasAnnotations({
  isPanning,
  setIsPanning,
  panOffset,
  setPanOffset,
  panStart,
  setPanStart,
  setSelectedTaskId,
  setTaskDialogOpen,
}: UseCanvasAnnotationsProps) {
  const [annotationMode, setAnnotationMode] = useState(false);
  const [frameAnnotationMode, setFrameAnnotationMode] = useState(false);
  const [annotationStart, setAnnotationStart] = useState<NormalizedPoint | null>(null);
  const [draftRegion, setDraftRegion] = useState<FileTaskRegion | null>(null);
  const [pendingTaskRegion, setPendingTaskRegion] = useState<FileTaskRegion | null>(null);
  const [pendingFrameRegion, setPendingFrameRegion] = useState<FileTaskRegion | null>(null);

  const getCanvasPoint = (event: ReactPointerEvent<HTMLDivElement>): NormalizedPoint => {
    const bounds = event.currentTarget.getBoundingClientRect();

    return {
      x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
      y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
    };
  };

  const buildRegion = (start: NormalizedPoint, end: NormalizedPoint): FileTaskRegion => ({
    endX: Math.max(start.x, end.x),
    endY: Math.max(start.y, end.y),
    startX: Math.min(start.x, end.x),
    startY: Math.min(start.y, end.y),
  });

  const handleCanvasPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!annotationMode && !frameAnnotationMode) {
      setIsPanning(true);
      setPanStart({ x: event.clientX - panOffset.x, y: event.clientY - panOffset.y });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getCanvasPoint(event);
    setAnnotationStart(point);
    setDraftRegion(buildRegion(point, point));
    if (annotationMode) {
      setSelectedTaskId(null);
    }
  };

  const handleCanvasPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPanOffset({
        x: event.clientX - panStart.x,
        y: event.clientY - panStart.y,
      });
      return;
    }

    if ((!annotationMode && !frameAnnotationMode) || !annotationStart) {
      return;
    }

    setDraftRegion(buildRegion(annotationStart, getCanvasPoint(event)));
  };

  const handleCanvasPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
      return;
    }

    if ((!annotationMode && !frameAnnotationMode) || !annotationStart) {
      return;
    }

    const region = buildRegion(annotationStart, getCanvasPoint(event));
    setAnnotationStart(null);

    if (region.endX - region.startX < 0.02 || region.endY - region.startY < 0.02) {
      setDraftRegion(null);
      return;
    }

    setDraftRegion(region);
    if (frameAnnotationMode) {
      setPendingFrameRegion(region);
      setFrameAnnotationMode(false);
    } else {
      setPendingTaskRegion(region);
      setAnnotationMode(false);
      setTaskDialogOpen(true);
    }
  };

  return {
    annotationMode,
    setAnnotationMode,
    frameAnnotationMode,
    setFrameAnnotationMode,
    annotationStart,
    setAnnotationStart,
    draftRegion,
    setDraftRegion,
    pendingTaskRegion,
    setPendingTaskRegion,
    pendingFrameRegion,
    setPendingFrameRegion,
    getCanvasPoint,
    buildRegion,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
  };
}

export type CanvasAnnotations = ReturnType<typeof useCanvasAnnotations>;
