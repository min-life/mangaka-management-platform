'use client';

import { useEffect } from 'react';
import { FileActivityPanel } from './FileActivityPanel';
import { FileCanvas } from './FileCanvas';
import { FileCommentsPanel } from './FileCommentsPanel';
import { FileDetailHeader } from './FileDetailHeader';
import { FileOverviewTab } from './FileOverviewTab';
import {
  DesktopTaskSidebar,
  ExpandTaskSidebarButton,
  MobileTaskDrawer,
} from './FileTaskSidebars';
import { FileVersionsTab } from './FileVersionsTab';
import { CreateAnnotatedTaskDialog } from './CreateAnnotatedTaskDialog';
import { CreateFrameCommentDialog } from './CreateFrameCommentDialog';
import { VersionHistoryDrawer } from './VersionHistoryDrawer';
import { type FileVersionItem } from '../file-ui';
import type { FileDetailController } from './hooks/useFileDetailController';
import { useRealtimeProjectActivity, useRealtimeComments } from '@/hooks/use-realtime-activity';

type FileDetailViewProps = {
  controller: FileDetailController;
};

export function FileDetailView({ controller }: FileDetailViewProps) {
  const {
    annotationMode,
    assignedToName,
    canCreateTask,
    canReviewTask,
    canSubmitTask,
    canRestoreVersion,
    canDeleteVersion,
    canvasFrameComments,
    canvasRef,
    comparisonOpacity,
    currentMaterialId,
    currentVersionName,
    deletingVersionId,
    desktopSidebarOpen,
    discussionContextKey,
    discussionContextLabel,
    discussionFrameComments,
    displayedPreviewUrl,
    draftRegion,
    error,
    file,
    fileComments,
    taskComments,
    folder,
    focusFileTask,
    focusedTask,
    frameAnnotationMode,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCreateAnnotatedTask,
    handleCreateDiscussionComment,
    handleCreateFrameComment,
    handleReplyToFrame,
    handleCreateReview,
    handleDeleteDiscussionComment,
    handleDeleteVersion,
    handleFocusedTaskChange,
    handleRestoreVersion,
    handleSubmitTaskWork,
    handleMarkReadyForReview,
    handleUpdateDiscussionComment,
    isLoading,
    isTaskContextLoading,
    isPanning,
    isSavingComment,
    isSubmittingReview,
    isViewingHistoricalVersion,
    loadFile,
    members,
    mobileTasksOpen,
    panOffset,
    pendingFrameRegion,
    pendingTaskRegion,
    projectId,
    resourceTab,
    rotation,
    selectedSubmission,
    selectedSubmissionId,
    selectedTaskId,
    selectedVersion,
    selectedVersionForDetails,
    setAnnotationMode,
    setAnnotationStart,
    setComparisonOpacity,
    setDesktopSidebarOpen,
    setDraftRegion,
    setError,
    setFrameAnnotationMode,
    setIsSubmittingReview,
    setMobileTasksOpen,
    setPanOffset,
    setPendingFrameRegion,
    setPendingTaskRegion,
    setReplyingFrameId,
    setResourceTab,
    setRotation,
    setSelectedSubmissionId,
    setSelectedTaskId,
    setSelectedVersion,
    setSelectedVersionForDetails,
    setTaskDialogOpen,
    setVersionHistoryOpen,
    setVersionTabMode,
    setZoom,
    setDiscussionContext,
    startTaskFrameSelection,
    taskDialogOpen,
    tasks,
    versionHistoryOpen,
    versionTabMode,
    versions,
    zoom,
  } = controller;

  const { activities } = useRealtimeProjectActivity(projectId);
  const { createdComments, updatedComments, deletedCommentIds } = useRealtimeComments(
    'FILE',
    file?.id ?? 0
  );

  // Reload file data when there is any new activity related to this file
  useEffect(() => {
    if (!file?.id) return;
    if (activities.length > 0) {
      const latestActivity = activities[0];
      if (latestActivity?.fileId === Number(file.id)) {
        void loadFile();
      }
    }
  }, [activities.length, file?.id, loadFile]);

  // Reload file comments when there is a new direct file comment event
  useEffect(() => {
    if (!file?.id) return;
    if (createdComments.length > 0 || updatedComments.length > 0 || deletedCommentIds.length > 0) {
      void loadFile();
    }
  }, [createdComments.length, updatedComments.length, deletedCommentIds.length, file?.id, loadFile]);

  if (!file) {
    return null;
  }
  return (
    <section className="h-full flex flex-col overflow-hidden bg-[#101820]">

      <FileDetailHeader
        assignedToName={assignedToName}
        file={file}
        folderTitle={folder?.title}
        isSubmittingReview={isSubmittingReview}
        onCreateReview={handleCreateReview}
        onOpenMobileTasks={() => setMobileTasksOpen(true)}
        projectId={projectId}
        taskCount={tasks.length}
        versions={versions}
      />



      {error ? (
        <p className="mx-5 mt-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
          {error}
        </p>
      ) : null}


      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <main className="min-w-0 bg-[#091018] h-full overflow-y-auto relative flex-1">

          <div className="p-5 lg:p-8">
            <div className="mx-auto max-w-6xl">




              <FileCanvas controller={controller} />
              
              {isTaskContextLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#091018]/90 backdrop-blur-xl transition-all duration-300">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#39424f] border-t-[#FFD369]"></div>
                    <span className="mt-3 text-xs font-black text-[#aeb7c2]">Loading context...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <section className="border-t border-[#26303b] bg-[#0d151e]" id="discussion-section">
            <div className="border-b border-[#26303b] px-5 lg:px-8">
              <div className="mx-auto flex h-11 max-w-6xl items-center gap-1">
                {(['overview', 'discussion', 'versions', 'activity'] as const).map((tab) => (
                  <button
                    className={`relative h-full px-4 text-xs font-black capitalize ${resourceTab === tab
                      ? 'text-[#FFD369]'
                      : 'text-[#aeb7c2] hover:text-white'
                      }`}
                    key={tab}
                    onClick={() => setResourceTab(tab)}
                    type="button"
                  >
                    {tab}
                    {resourceTab === tab ? (
                      <span className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-[#FFD369]" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
            <div className="mx-auto max-w-6xl p-5 lg:p-8">
              {resourceTab === 'overview' ? (
                <FileOverviewTab file={file} folder={folder} tasks={tasks} />
              ) : resourceTab === 'discussion' ? (
                <div className="text-white">
                  <FileCommentsPanel
                    comments={discussionContextKey === 'file' ? fileComments : taskComments}
                    fileId={file.id}
                    taskId={focusedTask?.id ? Number(focusedTask.id) : null}
                    contextKey={discussionContextKey}
                    contextLabel={discussionContextLabel}
                    currentMaterialId={currentMaterialId}
                    frameComments={discussionFrameComments}
                    isSaving={isSavingComment}
                    onCreateComment={handleCreateDiscussionComment}
                    onUpdateComment={handleUpdateDiscussionComment}
                    onDeleteComment={handleDeleteDiscussionComment}
                    onReplyToFrame={handleReplyToFrame}
                    replyingFrameId={controller.replyingFrameId}
                    setReplyingFrameId={controller.setReplyingFrameId}
                    onSelectFrame={(comment) => {
                      let nextVersion: FileVersionItem | null = null;
                      if (comment.materialId) {
                        nextVersion = versions.find((v) => String(v.id) === comment.materialId) ?? null;
                      } else if (comment.materialVersion) {
                        nextVersion = versions.find((v) => `v${v.version}` === comment.materialVersion) ?? null;
                      }
                      if (comment.taskId) {
                        const matchedTask = tasks.find(t => t.id === comment.taskId);
                        if (matchedTask) {
                          focusFileTask(matchedTask);
                        }
                      }
                      if (nextVersion) {
                        setSelectedVersion(nextVersion.isCurrent ? null : nextVersion);
                      }
                      setSelectedSubmissionId(null);
                      canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  />
                </div>
              ) : resourceTab === 'versions' ? (
                <FileVersionsTab
                  versions={versions}
                  selectedVersion={selectedVersion}
                  setSelectedVersion={setSelectedVersion}
                  selectedVersionForDetails={selectedVersionForDetails}
                  setSelectedVersionForDetails={setSelectedVersionForDetails}
                  versionTabMode={versionTabMode}
                  setVersionTabMode={setVersionTabMode}
                  setVersionHistoryOpen={setVersionHistoryOpen}
                  canvasRef={canvasRef}
                  setSelectedSubmissionId={setSelectedSubmissionId}
                  handleRestoreVersion={handleRestoreVersion}
                  handleDeleteVersion={handleDeleteVersion}
                  deletingVersionId={deletingVersionId}
                  isLoading={isLoading}
                  isSubmittingReview={isSubmittingReview}
                  setIsSubmittingReview={setIsSubmittingReview}
                  fileId={file.id}
                  loadFile={loadFile}
                  file={file}
                  setError={setError}
                  canRestore={canRestoreVersion}
                  canDelete={canDeleteVersion}
                />
              ) : resourceTab === 'activity' ? (
                <FileActivityPanel fileId={file.id} projectId={projectId} />
              ) : null}
            </div>
          </section>
          {!desktopSidebarOpen ? (
            <ExpandTaskSidebarButton onClick={() => setDesktopSidebarOpen(true)} />
          ) : null}
        </main>

        <DesktopTaskSidebar
          annotationMode={annotationMode}
          canCreateTask={canCreateTask}
          canReviewTask={canReviewTask}
          canSubmitTask={canSubmitTask}
          file={file}
          focusedTask={focusedTask}
          isOpen={desktopSidebarOpen}
          onClose={() => setDesktopSidebarOpen(false)}
          onCloseFocusedTask={() => focusFileTask(null)}
          onCreateTask={() => {
            setPendingTaskRegion(null);
            setDraftRegion(null);
            setAnnotationMode(false);
            setTaskDialogOpen(true);
          }}
          onSelectTask={(taskId) => {
            focusFileTask(tasks.find((task) => task.id === taskId) ?? null);
            canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          onStartFrameComment={() => {
            setAnnotationMode(false);
            setPendingTaskRegion(null);
            setDraftRegion(null);
            setAnnotationStart(null);
            setFrameAnnotationMode(true);
          }}
          onSubmitTaskWork={handleSubmitTaskWork}
          onMarkReadyForReview={handleMarkReadyForReview}
          onTaskChange={handleFocusedTaskChange}
          selectedSubmissionId={selectedSubmissionId}
          selectedTaskId={selectedTaskId}
          selectedVersion={selectedVersion}
          tasks={tasks}
          versions={versions}
          members={members}
          onRefresh={loadFile}
          discussionContextKey={discussionContextKey}
          setDiscussionContext={setDiscussionContext}
        />

        <MobileTaskDrawer
          annotationMode={annotationMode}
          canCreateTask={canCreateTask}
          canReviewTask={canReviewTask}
          canSubmitTask={canSubmitTask}
          file={file}
          focusedTask={focusedTask}
          onClose={() => setMobileTasksOpen(false)}
          onCloseFocusedTask={() => focusFileTask(null)}
          onCreateTask={() => {
            setPendingTaskRegion(null);
            setDraftRegion(null);
            setAnnotationMode(false);
            setTaskDialogOpen(true);
            setMobileTasksOpen(false);
          }}
          onSelectTask={(taskId) => {
            focusFileTask(tasks.find((task) => task.id === taskId) ?? null);
          }}
          onStartFrameComment={() => {
            setAnnotationMode(false);
            setPendingTaskRegion(null);
            setDraftRegion(null);
            setAnnotationStart(null);
            setFrameAnnotationMode(true);
            setMobileTasksOpen(false);
          }}
          onSubmitTaskWork={handleSubmitTaskWork}
          onMarkReadyForReview={handleMarkReadyForReview}
          onTaskChange={handleFocusedTaskChange}
          open={mobileTasksOpen}
          selectedSubmissionId={selectedSubmissionId}
          selectedTaskId={selectedTaskId}
          selectedVersion={selectedVersion}
          tasks={tasks}
          versions={versions}
          members={members}
          onRefresh={loadFile}
          discussionContextKey={discussionContextKey}
          setDiscussionContext={setDiscussionContext}
        />
      </div>

      <VersionHistoryDrawer
        onOpenChange={setVersionHistoryOpen}
        onViewVersion={setSelectedVersion}
        onRestoreVersion={handleRestoreVersion}
        open={versionHistoryOpen}
        versions={versions}
      />
      <CreateAnnotatedTaskDialog
        members={members}
        tasks={tasks}
        onCancel={() => {
          setPendingTaskRegion(null);
          setDraftRegion(null);
          setAnnotationMode(false);
          setTaskDialogOpen(false);
        }}
        onCreate={handleCreateAnnotatedTask}
        open={taskDialogOpen}
      />
      <CreateFrameCommentDialog
        onCancel={() => {
          setPendingFrameRegion(null);
          setDraftRegion(null);
          setFrameAnnotationMode(false);
        }}
        onCreate={handleCreateFrameComment}
        region={pendingFrameRegion}
      />
    </section>
  );
}

