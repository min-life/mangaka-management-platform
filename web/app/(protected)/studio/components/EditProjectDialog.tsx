'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { updateProject, type ProjectResponse } from '@/services/project.service';
import type { EditorBoardResponse } from '@/services/editor-board.service';

type EditProjectDialogProps = {
  project: ProjectResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editorBoards: EditorBoardResponse[];
  onUpdated: () => void;
};

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
  editorBoards,
  onUpdated,
}: EditProjectDialogProps) {
  const [name, setName] = useState('');
  const [editorBoardId, setEditorBoardId] = useState('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setEditorBoardId(project.editorBoardId ? String(project.editorBoardId) : 'none');
      setError(null);
    }
  }, [project]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project || !name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateProject(project.id, {
        name: name.trim(),
        editorBoardId: editorBoardId === 'none' ? null : Number(editorBoardId),
      });
      toast.success(`Project "${name.trim()}" updated successfully.`);
      onUpdated();
      onOpenChange(false);
    } catch (err) {
      setError('Failed to update project details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] w-full sm:max-w-[500px] flex-col gap-0 overflow-hidden rounded-[8px] border border-[#212936] bg-[#0c1219] p-0 text-white shadow-2xl"
        showCloseButton
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b border-[#212936] px-6 py-5 shrink-0">
          <DialogTitle className="text-lg font-black text-white tracking-wide">
            Edit Project Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-[#8b94a1] mt-0.5">
            Update the project details. Click Save Changes when you are done.
          </DialogDescription>
        </DialogHeader>

        <form className="min-h-0 flex-1 flex flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* Project Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]" htmlFor="edit_project_name">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                id="edit_project_name"
                className="h-11 w-full rounded-[6px] border border-[#212936] bg-[#0d151e] px-4 text-sm font-bold text-white outline-none focus:border-[#FFD369] transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shadow Over Kyoto"
                required
              />
            </div>

            {/* Editor Board select */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]" htmlFor="edit_project_board">
                Editor Board
              </label>
              <select
                id="edit_project_board"
                className="h-11 w-full rounded-[6px] border border-[#212936] bg-[#0d151e] px-4 text-sm font-bold text-white outline-none focus:border-[#FFD369] transition-all"
                value={editorBoardId}
                onChange={(e) => setEditorBoardId(e.target.value)}
              >
                <option value="none">No editor board yet</option>
                {editorBoards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] font-bold text-[#8b94a1]">
                Assign a production editorial board to this workspace.
              </p>
            </div>

            {error && (
              <p className="text-xs font-bold text-red-300">{error}</p>
            )}
          </div>

          <DialogFooter className="mx-0 mb-0 border-t border-[#212936] bg-[#0c1219] px-6 py-4 shrink-0">
            <div className="flex w-full justify-end gap-3">
              <Button
                className="h-10 rounded-[6px] border border-[#212936] bg-[#0c1219] px-5 text-xs font-black text-[#8b94a1] hover:bg-[#151c25] hover:text-white"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                className="h-10 rounded-[6px] bg-[#FFD369] px-5 text-xs font-black text-[#222831] hover:bg-[#eac04f] disabled:opacity-50"
                disabled={isSubmitting || !name.trim()}
                type="submit"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
