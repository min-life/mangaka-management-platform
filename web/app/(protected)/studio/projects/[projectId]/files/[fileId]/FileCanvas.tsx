'use client';

import { useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import {
  FileQuestion,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Minus,
  Plus,
  RotateCw,
  Loader2,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { FileDetailController } from './hooks/useFileDetailController';
import type { FileTaskRegion, SubmissionFrameComment } from '../file-ui';

type CanvasFrameThread = {
  comment: SubmissionFrameComment;
  displayIndex: number;
  frameId: string;
};

type FileCanvasProps = {
  controller: FileDetailController;
};

export function FileCanvas({ controller }: FileCanvasProps) {
  const {
    annotationMode,
    handleCancelAiFrame,
    handleConfirmAiFrame,
    handleOpenAiFrameDialog,
    canvasFrameComments,
    canvasRef,
    comparisonOpacity,
    discussionFrameComments,
    displayedPreviewUrl,
    draftRegion,
    focusFileTask,
    focusedTask,
    frameAnnotationMode,
    getCanvasPointFromClient,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    isPanning,
    isAiFrameReviewing,
    isViewingHistoricalVersion,
    isLoading,
    isRefreshing,
    panOffset,
    pendingFrameRegion,
    pendingTaskRegion,
    rotation,
    selectedTaskId,
    selectedVersion,
    setAnnotationMode,
    setAnnotationStart,
    setCanvasImageMetrics,
    setComparisonOpacity,
    setDraftRegion,
    setFrameAnnotationMode,
    setPanOffset,
    setPendingFrameRegion,
    setPendingTaskRegion,
    setReplyingFrameId,
    setResourceTab,
    setRotation,
    setSelectedVersion,
    setZoom,
    tasks,
    versions,
    zoom,
  } = controller;

  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
  const [editState, setEditState] = useState<{
    initialPoint: { x: number; y: number };
    initialRegion: FileTaskRegion;
    mode: 'move' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
  } | null>(null);

  const updateAiDraftRegion = (nextRegion: FileTaskRegion) => {
    setDraftRegion(nextRegion);
    setPendingFrameRegion(nextRegion);
  };

  const getRegionEditPoint = (event: ReactPointerEvent<HTMLElement>) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) {
      return null;
    }

    return getCanvasPointFromClient(event.clientX, event.clientY, bounds);
  };

  const normalizeEditableRegion = (region: FileTaskRegion): FileTaskRegion => {
    const nextRegion = {
      endX: Math.min(1, Math.max(0, Math.max(region.startX, region.endX))),
      endY: Math.min(1, Math.max(0, Math.max(region.startY, region.endY))),
      startX: Math.min(1, Math.max(0, Math.min(region.startX, region.endX))),
      startY: Math.min(1, Math.max(0, Math.min(region.startY, region.endY))),
    };

    if (nextRegion.endX - nextRegion.startX < 0.02) {
      nextRegion.endX = Math.min(1, nextRegion.startX + 0.02);
      nextRegion.startX = Math.max(0, nextRegion.endX - 0.02);
    }

    if (nextRegion.endY - nextRegion.startY < 0.02) {
      nextRegion.endY = Math.min(1, nextRegion.startY + 0.02);
      nextRegion.startY = Math.max(0, nextRegion.endY - 0.02);
    }

    return nextRegion;
  };

  const handleAiFrameEditStart = (
    event: ReactPointerEvent<HTMLElement>,
    mode: NonNullable<typeof editState>['mode'],
  ) => {
    if (!pendingFrameRegion) {
      return;
    }

    const point = getRegionEditPoint(event);
    if (!point) {
      return;
    }

    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setEditState({
      initialPoint: point,
      initialRegion: pendingFrameRegion,
      mode,
    });
  };

  const handleAiFrameEditMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!editState) {
      return;
    }

    const point = getRegionEditPoint(event);
    if (!point) {
      return;
    }

    event.stopPropagation();
    const deltaX = point.x - editState.initialPoint.x;
    const deltaY = point.y - editState.initialPoint.y;
    const region = { ...editState.initialRegion };

    if (editState.mode === 'move') {
      const width = region.endX - region.startX;
      const height = region.endY - region.startY;
      const startX = Math.min(1 - width, Math.max(0, region.startX + deltaX));
      const startY = Math.min(1 - height, Math.max(0, region.startY + deltaY));
      updateAiDraftRegion({
        endX: startX + width,
        endY: startY + height,
        startX,
        startY,
      });
      return;
    }

    if (editState.mode.includes('n')) region.startY += deltaY;
    if (editState.mode.includes('s')) region.endY += deltaY;
    if (editState.mode.includes('w')) region.startX += deltaX;
    if (editState.mode.includes('e')) region.endX += deltaX;

    updateAiDraftRegion(normalizeEditableRegion(region));
  };

  const handleAiFrameEditEnd = (event: ReactPointerEvent<HTMLElement>) => {
    if (!editState) {
      return;
    }

    event.stopPropagation();
    event.currentTarget.releasePointerCapture(event.pointerId);
    setEditState(null);
  };

  return (
    <>
      {/* Status & Review Banners */}
      {frameAnnotationMode ? (
        <p className="mb-3 border border-[#6c5516] bg-[#30270d] px-3 py-2 text-[10px] font-bold text-[#ffd35b]">
          Drag a rectangle on the submission to place a review comment.
        </p>
      ) : null}


      <div className="mb-3 flex h-10 items-center justify-between gap-3 border border-[#26303b] bg-[#0d151e] px-3">
        <div className="flex items-center gap-1">
          <ToolbarButton
            label="Zoom out"
            onClick={() => {
              setZoom((prev) => {
                const next = Math.max(50, prev - 25);
                if (next === 100) setPanOffset({ x: 0, y: 0 });
                return next;
              });
            }}
          >
            <Minus className="size-4" />
          </ToolbarButton>
          <span className="grid h-7 min-w-14 place-items-center rounded-[3px] bg-[#151c25] px-2 text-[10px] font-black text-[#dce7f3] select-none">
            {zoom}%
          </span>
          <ToolbarButton
            label="Zoom in"
            onClick={() => setZoom((prev) => Math.min(300, prev + 25))}
          >
            <Plus className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Fit Width"
            onClick={() => {
              setZoom((current) => (current === 200 ? 100 : 200));
              setRotation(0);
              setPanOffset({ x: 0, y: 0 });
            }}
          >
            <Maximize2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Rotate"
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
          >
            <RotateCw className="size-4" />
          </ToolbarButton>

          {isViewingHistoricalVersion && versions[0]?.previewUrl && (
            <div className="flex items-center gap-2 border-l border-[#26303b] pl-3 ml-2">
              <span className="text-[9px] font-black text-[#8b94a1] uppercase select-none">
                Compare Opacity:
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={comparisonOpacity}
                onChange={(e) => setComparisonOpacity(Number(e.target.value))}
                className="w-16 accent-[#FFD369] h-1 bg-[#26303b] rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[9px] font-black text-white w-7 text-right select-none">
                {comparisonOpacity}%
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <ToolbarButton
            label="Comment"
            onClick={() => {
              setResourceTab('discussion');
              setTimeout(() => {
                document.getElementById('discussion-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
          >
            <MessageCircle className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={frameAnnotationMode}
            label="Frame Comment"
            onClick={() => {
              setPendingTaskRegion(null);
              setPendingFrameRegion(null);
              setDraftRegion(null);
              setAnnotationStart(null);
              setAnnotationMode(false);
              setFrameAnnotationMode((current) => !current);
            }}
          >
            <MessageSquare className="size-4 text-[#FFD369]" />
          </ToolbarButton>
          <ToolbarButton label="AI Frame Detection" onClick={handleOpenAiFrameDialog}>
            <Sparkles className="size-4 text-[#FFD369]" />
          </ToolbarButton>

        </div>
      </div>

      <div
        className={`relative grid aspect-[16/10] max-h-[680px] w-full touch-none place-items-center overflow-hidden rounded-[4px] border bg-[#111923] shadow-[0_20px_60px_rgba(0,0,0,0.35)] ${annotationMode || frameAnnotationMode
          ? 'cursor-crosshair border-[#FFD369]'
          : isPanning
            ? 'cursor-grabbing border-[#303842]'
            : 'cursor-grab border-[#303842]'
          }`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        ref={canvasRef}
      >
        <div
          className="w-full h-full absolute inset-0 origin-center"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100
              }) rotate(${rotation}deg)`,
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {/* Layer 1: Base Image (The clicked version or current version when no historical version is selected) */}
          {displayedPreviewUrl ? (
            <>
              {/* Hidden img to track load state */}
              <img
                src={displayedPreviewUrl}
                className="hidden"
                onLoad={(event) => {
                  setLoadedImageUrl(displayedPreviewUrl);
                  setCanvasImageMetrics({
                    imageUrl: displayedPreviewUrl,
                    naturalHeight: event.currentTarget.naturalHeight,
                    naturalWidth: event.currentTarget.naturalWidth,
                  });
                }}
                onError={() => {
                  setLoadedImageUrl(displayedPreviewUrl);
                  setCanvasImageMetrics(null);
                }}
                alt="preload"
              />
              
              <div
                className={`w-full h-full absolute inset-0 transition-opacity duration-150 ${
                  loadedImageUrl !== displayedPreviewUrl || isLoading
                    ? 'opacity-0'
                    : 'opacity-100'
                }`}
                style={{
                  backgroundImage: `url(${displayedPreviewUrl})`,
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'contain',
                }}
              />
              
              {(loadedImageUrl !== displayedPreviewUrl) && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className="flex flex-col items-center gap-3 bg-[#0d151e]/80 p-4 rounded-lg shadow-2xl backdrop-blur-sm border border-[#39424f]">
                    <Loader2 className="size-8 animate-spin text-[#FFD369]" />
                    <span className="text-xs font-bold text-[#FFD369] uppercase tracking-wider">Loading Version...</span>
                  </div>
                </div>
              )}
            </>
          ) : null}

          {/* Layer 2: Overlay Image (Current version on top, only active during historical comparison with comparisonOpacity > 0) */}
          {isViewingHistoricalVersion && comparisonOpacity > 0 && versions[0]?.previewUrl && (
            <div
              className="w-full h-full absolute inset-0 pointer-events-none transition-opacity duration-150"
              style={{
                backgroundImage: `url(${versions[0].previewUrl})`,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                opacity: comparisonOpacity / 100,
              }}
            />
          )}
          {/* Refresh overlay: semi-transparent pulse when refreshing in background */}
          {isRefreshing && (
            <div className="absolute inset-0 pointer-events-none z-10 flex items-start justify-end p-3">
              <div className="flex items-center gap-1.5 rounded-[4px] border border-[#39424f] bg-[#0d151e]/80 px-2.5 py-1.5 backdrop-blur-sm">
                <Loader2 className="size-3 text-[#FFD369] animate-spin" />
                <span className="text-[10px] font-black text-[#aeb7c2]">Updating...</span>
              </div>
            </div>
          )}
          {/* Initial load overlay: full blocking spinner when no preview yet */}
          {isLoading && !isRefreshing ? (
            <div className="absolute inset-0 grid place-items-center px-6 text-center bg-[#111923]/80 z-10">
              <div>
                <Loader2 className="mx-auto size-10 text-[#FFD369] animate-spin" />
                <p className="mt-3 text-sm font-black text-white">Loading preview...</p>
                <p className="mt-1 text-xs font-bold text-[#8b94a1]">
                  Please wait while the image preview is being retrieved.
                </p>
              </div>
            </div>
          ) : !displayedPreviewUrl ? (
            <div className="absolute inset-0 grid place-items-center px-6 text-center">
              <div>
                <FileQuestion className="mx-auto size-10 text-[#5b626d]" />
                <p className="mt-3 text-sm font-black text-white">Preview unavailable</p>
                <p className="mt-1 text-xs font-bold text-[#8b94a1]">
                  FileMaterial does not currently provide a reachable media URL.
                </p>
              </div>
            </div>
          ) : null}

          {(() => {
            // Match the exact thread generation logic from FileCommentsPanel
            const frameThreadsMap = new Map<string, CanvasFrameThread>();
            discussionFrameComments.forEach(fc => {
              const fId = fc.frameId || fc.id;
              if (!frameThreadsMap.has(fId)) {
                frameThreadsMap.set(fId, {
                  frameId: fId,
                  comment: fc,
                  displayIndex: frameThreadsMap.size + 1
                });
              }
            });
            
            // Only render threads that exist in canvasFrameComments
            const canvasFrameIds = new Set(canvasFrameComments.map(c => c.frameId || c.id));
            const activeThreads = Array.from(frameThreadsMap.values()).filter(t => canvasFrameIds.has(t.frameId));

            return activeThreads.map(({ comment, displayIndex }) => (
              <button
                aria-label={`Open frame comment ${displayIndex}`}
                className="absolute z-30 border-2 border-[#ff9ab3] bg-[#6b2637]/20 text-left hover:bg-[#6b2637]/35"
                key={comment.id}
                onClick={(event) => {
                  event.stopPropagation();
                  setResourceTab('discussion');
                  const targetFrameId = comment.frameId || comment.id;
                  setReplyingFrameId(targetFrameId);
                  requestAnimationFrame(() => {
                    const el = document.getElementById(`frame-thread-${targetFrameId}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                      document.getElementById('sidebar-discussion')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  });
                }}
                onPointerDown={(event) => event.stopPropagation()}
                style={{
                  height: `${Math.max(comment.region.endY - comment.region.startY, 0.04) * 100}%`,
                  left: `${comment.region.startX * 100}%`,
                  top: `${comment.region.startY * 100}%`,
                  width: `${Math.max(comment.region.endX - comment.region.startX, 0.04) * 100}%`,
                }}
                type="button"
              >
                <span className="absolute -left-3 -top-3 grid size-6 place-items-center rounded-full border-2 border-[#101820] bg-[#ff9ab3] text-[9px] font-black text-[#371522]">
                  F{displayIndex}
                </span>
              </button>
            ));
          })()}

          {draftRegion ? (
            <div
              className={`absolute z-30 border-2 border-dashed border-[#FFD369] bg-[#FFD369]/15 ${
                isAiFrameReviewing ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
              onPointerDown={
                isAiFrameReviewing ? (event) => handleAiFrameEditStart(event, 'move') : undefined
              }
              onPointerMove={isAiFrameReviewing ? handleAiFrameEditMove : undefined}
              onPointerUp={isAiFrameReviewing ? handleAiFrameEditEnd : undefined}
              onPointerCancel={isAiFrameReviewing ? handleAiFrameEditEnd : undefined}
              style={{
                height: `${(draftRegion.endY - draftRegion.startY) * 100}%`,
                left: `${draftRegion.startX * 100}%`,
                top: `${draftRegion.startY * 100}%`,
                width: `${(draftRegion.endX - draftRegion.startX) * 100}%`,
              }}
            >
              {isAiFrameReviewing && pendingFrameRegion ? (
                <AiDraftFrameControls
                  onCancel={handleCancelAiFrame}
                  onConfirm={handleConfirmAiFrame}
                  onEditEnd={handleAiFrameEditEnd}
                  onEditMove={handleAiFrameEditMove}
                  onEditStart={handleAiFrameEditStart}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function AiDraftFrameControls({
  onCancel,
  onConfirm,
  onEditEnd,
  onEditMove,
  onEditStart,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  onEditEnd: (event: ReactPointerEvent<HTMLElement>) => void;
  onEditMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onEditStart: (
    event: ReactPointerEvent<HTMLElement>,
    mode: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw',
  ) => void;
}) {
  const handles = [
    ['nw', '-left-1.5 -top-1.5 cursor-nwse-resize'],
    ['n', 'left-1/2 -top-1.5 -translate-x-1/2 cursor-ns-resize'],
    ['ne', '-right-1.5 -top-1.5 cursor-nesw-resize'],
    ['e', '-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize'],
    ['se', '-bottom-1.5 -right-1.5 cursor-nwse-resize'],
    ['s', '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize'],
    ['sw', '-bottom-1.5 -left-1.5 cursor-nesw-resize'],
    ['w', '-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize'],
  ] as const;

  return (
    <>
      <span className="absolute -left-3 -top-3 grid h-6 min-w-8 place-items-center rounded-full border-2 border-[#101820] bg-[#FFD369] px-2 text-[9px] font-black text-[#222831]">
        AI
      </span>
      <div
        className="absolute left-1/2 top-full z-40 mt-2 flex -translate-x-1/2 items-center gap-2 rounded-[4px] border border-[#39424f] bg-[#0d151e] p-1 shadow-xl"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          className="h-7 rounded-[3px] px-2 text-[10px] font-black text-[#aeb7c2] hover:bg-[#26303b] hover:text-white"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="h-7 rounded-[3px] bg-[#FFD369] px-2 text-[10px] font-black text-[#222831] hover:brightness-110"
          onClick={onConfirm}
          type="button"
        >
          Confirm
        </button>
      </div>
      {handles.map(([mode, className]) => (
        <button
          aria-label={`Resize AI frame ${mode}`}
          className={`absolute size-3 rounded-full border border-[#101820] bg-[#FFD369] ${className}`}
          key={mode}
          onPointerCancel={onEditEnd}
          onPointerDown={(event) => onEditStart(event, mode)}
          onPointerMove={onEditMove}
          onPointerUp={onEditEnd}
          type="button"
        />
      ))}
    </>
  );
}

function ToolbarButton({
  active = false,
  children,
  label,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Button
      aria-label={label}
      className={`size-7 rounded-[3px] ${active ? 'bg-[#303842] text-[#FFD369]' : 'text-[#aeb7c2] hover:bg-[#17202b] hover:text-white'
        }`}
      onClick={onClick}
      size="icon"
      title={label}
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
  );
}
