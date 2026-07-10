'use client';

import { useState, type ReactNode } from 'react';
import {
  FileQuestion,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Minus,
  Plus,
  RotateCw,
  ScanLine,
  Loader2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

import type { FileDetailController } from './hooks/useFileDetailController';

type FileCanvasProps = {
  controller: FileDetailController;
};

export function FileCanvas({ controller }: FileCanvasProps) {
  const {
    annotationMode,
    canvasFrameComments,
    canvasRef,
    comparisonOpacity,
    discussionFrameComments,
    displayedPreviewUrl,
    draftRegion,
    focusFileTask,
    focusedTask,
    frameAnnotationMode,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    isPanning,
    isViewingHistoricalVersion,
    isLoading,
    isRefreshing,
    panOffset,
    pendingFrameRegion,
    pendingTaskRegion,
    rotation,
    selectedSubmissionId,
    selectedTaskId,
    selectedVersion,
    setAnnotationMode,
    setAnnotationStart,
    setComparisonOpacity,
    setDraftRegion,
    setFrameAnnotationMode,
    setPanOffset,
    setPendingFrameRegion,
    setPendingTaskRegion,
    setResourceTab,
    setRotation,
    setSelectedSubmissionId,
    setSelectedVersion,
    setZoom,
    tasks,
    versions,
    zoom,
  } = controller;

  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);

  return (
    <>
      {/* Status & Review Banners */}
      {focusedTask && selectedSubmissionId ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-[4px] border border-[#303842] bg-[#151c25] px-4 py-2.5">
          <div>
            <p className="text-xs font-black text-[#FFD369]">
              Review Mode: Previewing Submission for &ldquo;{focusedTask.title}&rdquo;
            </p>
            <p className="mt-1 text-[10px] font-bold text-[#8b94a1]">
              Submitted by{' '}
              {focusedTask.submissions.find((s) => s.id === selectedSubmissionId)?.submittedBy ||
                'Assignee'}
            </p>
          </div>
          <Badge className="rounded-[3px] border border-[#FFD369]/30 bg-[#2b2413] text-[9px] text-[#FFD369] font-black uppercase tracking-wider">
            Reviewing Submission
          </Badge>
        </div>
      ) : selectedVersion && isViewingHistoricalVersion ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-[4px] border border-[#6c5516] bg-[#30270d] px-4 py-3">
          <div>
            <p className="text-xs font-black text-[#ffd35b]">
              Viewing v{selectedVersion.version} · Read only *
            </p>
            <p className="mt-1 text-[10px] font-bold text-[#d9bd70]">{selectedVersion.note}</p>
          </div>
          <Button
            className="h-8 rounded-[4px] border-[#806719] bg-[#101820] px-3 text-[10px] font-black text-white hover:bg-[#303842]"
            onClick={() => {
              setSelectedVersion(null);
              setSelectedSubmissionId(null);
            }}
            variant="outline"
          >
            Back to Current
          </Button>
        </div>
      ) : tasks.some((t) => t.status === 'REVIEW') ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-[4px] border border-[#6c5516] bg-[#30270d]/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#FFD369] animate-pulse shrink-0" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">
              {tasks.filter((t) => t.status === 'REVIEW').length === 1
                ? '1 task is waiting for review'
                : `${tasks.filter((t) => t.status === 'REVIEW').length} tasks are waiting for review`}
            </span>
          </div>
          <Button
            className="h-7 rounded-[4px] border-[#806719] bg-[#FFD369] px-3 text-[9px] font-black text-[#222831] hover:bg-[#eac04f]"
            onClick={() => {
              const reviewTask = tasks.find((t) => t.status === 'REVIEW');
              if (reviewTask) {
                focusFileTask(reviewTask);
                canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
          >
            Review Now →
          </Button>
        </div>
      ) : null}

      {frameAnnotationMode ? (
        <p className="mb-3 border border-[#6c5516] bg-[#30270d] px-3 py-2 text-[10px] font-bold text-[#ffd35b]">
          Drag a rectangle on the submission to place a review comment.
        </p>
      ) : null}

      {/* Version Strip — quick switcher above canvas */}
      {versions.length > 1 && (
        <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.08em] text-[#8b94a1] select-none">
            Version:
          </span>
          <div className="flex items-center gap-1.5">
            {versions.map((version) => {
              const isActive = selectedVersion
                ? String(selectedVersion.id) === String(version.id)
                : version.isCurrent;
              return (
                <button
                  className={`relative h-7 shrink-0 rounded-full border px-3 text-[10px] font-black transition-all duration-100 ${isActive
                    ? 'border-[#FFD369] bg-[#FFD369] text-[#222831] shadow-[0_0_8px_rgba(255,211,105,0.35)]'
                    : 'border-[#39424f] bg-[#0d151e] text-[#aeb7c2] hover:border-[#FFD369]/50 hover:text-white'
                    }`}
                  key={version.id}
                  onClick={() => {
                    setSelectedSubmissionId(null);
                    setSelectedVersion(version.isCurrent ? null : version);
                  }}
                  title={version.note || `Version ${version.version}`}
                  type="button"
                >
                  v{version.version}
                  {version.isCurrent && (
                    <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full border border-[#101820] bg-[#9df2c7]" />
                  )}
                </button>
              );
            })}
          </div>
          {isViewingHistoricalVersion && (
            <button
              className="ml-1 shrink-0 text-[9px] font-black text-[#8b94a1] underline hover:text-white transition-colors"
              onClick={() => {
                setSelectedVersion(null);
                setSelectedSubmissionId(null);
              }}
              type="button"
            >
              ← Back to current
            </button>
          )}
        </div>
      )}

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
          <ToolbarButton
            active={annotationMode}
            label="Annotate"
            onClick={() => {
              setSelectedVersion(null);
              setSelectedSubmissionId(null);
              setFrameAnnotationMode(false);
              setPendingFrameRegion(null);
              setPendingTaskRegion(null);
              setDraftRegion(null);
              setAnnotationStart(null);
              setAnnotationMode((current) => !current);
            }}
          >
            <ScanLine className="size-4" />
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
                onLoad={() => setLoadedImageUrl(displayedPreviewUrl)}
                alt="preload"
              />
              
              <div
                className={`w-full h-full absolute inset-0 transition-all duration-300 ${
                  loadedImageUrl !== displayedPreviewUrl || isLoading || isRefreshing
                    ? 'opacity-30 blur-[2px] grayscale-[0.5]'
                    : 'opacity-100'
                }`}
                style={{
                  backgroundImage: `url(${displayedPreviewUrl})`,
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'contain',
                }}
              />
              
              {(loadedImageUrl !== displayedPreviewUrl || isLoading || isRefreshing) && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className="flex flex-col items-center gap-3 bg-[#0d151e]/80 p-4 rounded-lg shadow-2xl backdrop-blur-sm border border-[#39424f]">
                    <Loader2 className="size-8 animate-spin text-[#FFD369]" />
                    <span className="text-xs font-bold text-[#FFD369] uppercase tracking-wider">Loading Version...</span>
                  </div>
                </div>
              )}
            </>
          ) : isRefreshing ? (
            /* versions was just cleared (task switch) – show full-canvas spinner */
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="flex flex-col items-center gap-3 bg-[#0d151e]/80 p-4 rounded-lg shadow-2xl backdrop-blur-sm border border-[#39424f]">
                <Loader2 className="size-8 animate-spin text-[#FFD369]" />
                <span className="text-xs font-bold text-[#FFD369] uppercase tracking-wider">Loading Version...</span>
              </div>
            </div>
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

          {tasks.map((task, taskIndex) => {
            const canvasVersion = selectedVersion
              ? `v${selectedVersion.version}`
              : versions[0]
                ? `v${versions[0].version}`
                : 'v1';

            if (task.region && selectedTaskId === task.id) {
              if (canvasVersion !== 'v1') {
                return null;
              }

              return (
                <button
                  aria-label={`Open task ${task.title}`}
                  className={`absolute border-2 transition-all ${selectedTaskId === task.id
                    ? 'z-20 border-[#FFD369] bg-[#FFD369]/20'
                    : selectedTaskId
                      ? 'z-10 border-transparent bg-transparent opacity-30 hover:opacity-100 hover:border-[#FFD369]/30 hover:bg-[#FFD369]/5'
                      : 'z-10 border-transparent bg-transparent hover:border-[#FFD369]/50 hover:bg-[#FFD369]/10'
                    }`}
                  key={task.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    focusFileTask(task);
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  style={{
                    height: `${(task.region.endY - task.region.startY) * 100}%`,
                    left: `${task.region.startX * 100}%`,
                    top: `${task.region.startY * 100}%`,
                    width: `${(task.region.endX - task.region.startX) * 100}%`,
                  }}
                  type="button"
                >
                  <span className="absolute -left-3 -top-3 grid size-6 place-items-center rounded-full border-2 border-[#101820] bg-[#FFD369] text-[10px] font-black text-[#222831]">
                    {taskIndex + 1}
                  </span>
                </button>
              );
            }
            return null;
          })}

          {canvasFrameComments.map((comment, index) => {
            const globalIdx = discussionFrameComments.findIndex((c) => c.id === comment.id);
            const displayIndex = globalIdx !== -1 ? globalIdx + 1 : index + 1;

            return (
              <button
                aria-label={`Open frame comment ${displayIndex}`}
                className="absolute z-30 border-2 border-[#ff9ab3] bg-[#6b2637]/20 text-left hover:bg-[#6b2637]/35"
                key={comment.id}
                onClick={(event) => {
                  event.stopPropagation();
                  requestAnimationFrame(() =>
                    document
                      .getElementById('sidebar-discussion')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  );
                }}
                onPointerDown={(event) => event.stopPropagation()}
                style={{
                  height: `${(comment.region.endY - comment.region.startY) * 100}%`,
                  left: `${comment.region.startX * 100}%`,
                  top: `${comment.region.startY * 100}%`,
                  width: `${(comment.region.endX - comment.region.startX) * 100}%`,
                }}
                type="button"
              >
                <span className="absolute -left-3 -top-3 grid size-6 place-items-center rounded-full border-2 border-[#101820] bg-[#ff9ab3] text-[9px] font-black text-[#371522]">
                  F{displayIndex}
                </span>
              </button>
            );
          })}

          {draftRegion ? (
            <div
              className="pointer-events-none absolute z-30 border-2 border-dashed border-[#FFD369] bg-[#FFD369]/15"
              style={{
                height: `${(draftRegion.endY - draftRegion.startY) * 100}%`,
                left: `${draftRegion.startX * 100}%`,
                top: `${draftRegion.startY * 100}%`,
                width: `${(draftRegion.endX - draftRegion.startX) * 100}%`,
              }}
            />
          ) : null}
        </div>
      </div>
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
