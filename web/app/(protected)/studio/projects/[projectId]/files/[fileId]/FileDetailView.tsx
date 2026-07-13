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
} from './sidebars';
import { FileVersionsTab } from './FileVersionsTab';
import { TaskFormDialog } from './TaskFormDialog';
import { CreateFrameCommentDialog } from './CreateFrameCommentDialog';
import { AiFrameDetectionDialog } from './AiFrameDetectionDialog';

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
    aiFrameDialogOpen,
    canCreateTask,
    canReviewTask,
    canSubmitTask,
    canvasRef,
    desktopSidebarOpen,
    discussionContextKey,
    discussionContextLabel,
    discussionFrameComments,
    commentFilterMode,
    setCommentFilterMode,
    error,
    file,
    fileComments,
    taskComments,
    folder,
    focusFileTask,
    focusedTask,
    handleCreateAnnotatedTask,
    handleCancelAiFrame,
    handleCreateDiscussionComment,
    handleCreateFrameComment,
    handleReplyToFrame,
    handleCreateReview,
    handleDetectAiFrame,
    handleDeleteDiscussionComment,
    handleFocusedTaskChange,
    handleSubmitTaskWork,
    handleMarkReadyForReview,
    handleUpdateDiscussionComment,
    isLoading,
    isAiFrameReviewing,
    isDetectingAiFrame,
    isTaskContextLoading,
    isSavingComment,
    isSubmittingReview,
    loadFile,
    quietReload,
    refreshFrameComments,
    members,
    mobileTasksOpen,
    pendingFrameRegion,
    projectId,
    resourceTab,
    selectedTaskId,
    selectedVersion,
    selectedVersionForDetails,
    setAnnotationMode,
    setAnnotationStart,
    setDesktopSidebarOpen,
    setDraftRegion,
    setError,
    setFrameAnnotationMode,
    setIsSubmittingReview,
    setMobileTasksOpen,
    setPendingFrameRegion,
    setPendingTaskRegion,
    setResourceTab,
    setSelectedVersion,
    setSelectedVersionForDetails,
    setTaskDialogOpen,

    setDiscussionContext,

    taskDialogOpen,
    tasks,
    versions,
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
        const metadata = latestActivity.metadata as { frameId?: string | number } | null;
        if (latestActivity.action === 'COMMENT_CREATED' && metadata?.frameId) {
          const frameId = Number(metadata.frameId);
          if (Number.isFinite(frameId)) {
            void refreshFrameComments(frameId);
          }
        } else {
          void quietReload();
        }
      }
    }
  }, [activities, activities.length, file?.id, quietReload, refreshFrameComments]);

  // Reload file comments when there is a new direct file comment event
  useEffect(() => {
    if (!file?.id) return;
    if (createdComments.length > 0 || updatedComments.length > 0 || deletedCommentIds.length > 0) {
      void quietReload();
    }
  }, [createdComments.length, updatedComments.length, deletedCommentIds.length, file?.id, quietReload]);

  if (!file) {
    return null;
  }
  return (
    <section className="h-full flex flex-col overflow-hidden bg-[#101820]">

      <FileDetailHeader
        assignedToName={assignedToName}
        file={file}
        folderTitle={folder?.title}
        project={controller.project}
        folders={controller.folders}
        folder={folder}
        isSubmittingReview={isSubmittingReview}
        onCreateReview={handleCreateReview}
        onOpenMobileTasks={() => setMobileTasksOpen(true)}

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
                    frameComments={discussionFrameComments}
                    filterMode={commentFilterMode}
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


                  canvasRef={canvasRef}


                  isLoading={isLoading}
                  isSubmittingReview={isSubmittingReview}
                  setIsSubmittingReview={setIsSubmittingReview}
                  fileId={file.id}
                  loadFile={loadFile}
                  file={file}
                  setError={setError}

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
          selectedTaskId={selectedTaskId}
          selectedVersion={selectedVersion}
          tasks={tasks}
          versions={versions}
          members={members}
          onRefresh={loadFile}
          discussionContextKey={discussionContextKey}
          setDiscussionContext={setDiscussionContext}
          commentFilterMode={commentFilterMode}
          setCommentFilterMode={setCommentFilterMode}
          discussionFrameComments={discussionFrameComments}
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
          selectedTaskId={selectedTaskId}
          selectedVersion={selectedVersion}
          tasks={tasks}
          versions={versions}
          members={members}
          onRefresh={loadFile}
          discussionContextKey={discussionContextKey}
          setDiscussionContext={setDiscussionContext}
          commentFilterMode={commentFilterMode}
          setCommentFilterMode={setCommentFilterMode}
          discussionFrameComments={discussionFrameComments}
        />
      </div>


      <TaskFormDialog
        mode="create"
        members={members}
        tasks={tasks}
        onCancel={() => {
          setPendingTaskRegion(null);
          setDraftRegion(null);
          setAnnotationMode(false);
          setTaskDialogOpen(false);
        }}
        onSubmit={handleCreateAnnotatedTask}
        open={taskDialogOpen}
      />
      <CreateFrameCommentDialog
        onCancel={() => {
          setPendingFrameRegion(null);
          setDraftRegion(null);
          setFrameAnnotationMode(false);
        }}
        onCreate={handleCreateFrameComment}
        region={isAiFrameReviewing ? null : pendingFrameRegion}
      />
      <AiFrameDetectionDialog
        isDetecting={isDetectingAiFrame}
        onCancel={handleCancelAiFrame}
        onDetect={handleDetectAiFrame}
        open={aiFrameDialogOpen}
      />
    </section>
  );
}

