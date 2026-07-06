'use client';

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
    handleCreateReview,
    handleDeleteDiscussionComment,
    handleDeleteVersion,
    handleFocusedTaskChange,
    handleRestoreVersion,
    handleSubmitTaskWork,
    handleUpdateDiscussionComment,
    isLoading,
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
    startTaskFrameSelection,
    taskDialogOpen,
    tasks,
    versionHistoryOpen,
    versionTabMode,
    versions,
    zoom,
  } = controller;

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
                <div className="text-white max-w-4xl mx-auto">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#26303b] pb-3">
                    <div>
                      <h3 className="text-sm font-black text-white">Task Discussion</h3>
                      <p className="text-[10px] text-[#8b94a1] mt-0.5">Select a task context below to discuss or view regional frame comments.</p>
                    </div>
                    <select
                      className="h-9 rounded-[4px] border border-[#39424f] bg-[#151c25] px-3 text-xs font-bold text-white outline-none"
                      value={discussionContextKey}
                      onChange={(e) => {
                        const key = e.target.value;
                        if (key === 'file') {
                          setSelectedTaskId(null);
                          setSelectedSubmissionId(null);
                        } else if (key.startsWith('task:')) {
                          const tid = key.split(':')[1];
                          const matchedTask = tasks.find(t => t.id === tid);
                          if (matchedTask) {
                            focusFileTask(matchedTask);
                          }
                        } else if (key.startsWith('submission:')) {
                          const sid = key.split(':')[1];
                          setSelectedSubmissionId(sid);
                        }
                      }}
                    >
                      <option value="file">Overall File Discussion</option>
                      {tasks.map((task) => (
                        <option key={task.id} value={`task:${task.id}`}>
                          Task: {task.title}
                        </option>
                      ))}
                      {focusedTask?.submissions.map((sub, idx) => (
                        <option key={sub.id} value={`submission:${sub.id}`}>
                          Submission #{focusedTask.submissions.length - idx} (Review)
                        </option>
                      ))}
                    </select>
                  </div>

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
                <FileActivityPanel fileId={file.id} />
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
          onTaskChange={handleFocusedTaskChange}
          selectedSubmissionId={selectedSubmissionId}
          selectedTaskId={selectedTaskId}
          selectedVersion={selectedVersion}
          tasks={tasks}
          versions={versions}
          members={members}
          onRefresh={loadFile}
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
          onTaskChange={handleFocusedTaskChange}
          open={mobileTasksOpen}
          selectedSubmissionId={selectedSubmissionId}
          selectedTaskId={selectedTaskId}
          selectedVersion={selectedVersion}
          tasks={tasks}
          versions={versions}
          members={members}
          onRefresh={loadFile}
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
        onRequestFrame={startTaskFrameSelection}
        open={taskDialogOpen}
        region={pendingTaskRegion}
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

