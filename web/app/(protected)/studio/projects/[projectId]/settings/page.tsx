'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Settings, Save, Unlink } from 'lucide-react';
import { toast } from '@/lib/toast';

import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';

import {
  getProjectById,
  linkProjectEditorBoard,
  unlinkProjectEditorBoard,
  type ProjectResponse,
} from '@/services/project.service';
import { getEditorBoards, type EditorBoardResponse } from '@/services/editor-board.service';

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = params.projectId ? String(params.projectId) : '';

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [editorBoards, setEditorBoards] = useState<EditorBoardResponse[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projData, boardsData] = await Promise.all([
        getProjectById(Number(projectId)),
        getEditorBoards({ limit: 100, page: 1 }),
      ]);
      setProject(projData);
      setEditorBoards(boardsData.boards);
      
      if (projData?.editorBoardId) {
        setSelectedBoardId(String(projData.editorBoardId));
      } else {
        setSelectedBoardId('');
      }
    } catch (err) {
      console.error('Failed to load settings data:', err);
      toast.error('Failed to load project settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      void loadData();
    }
  }, [projectId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!selectedBoardId) {
        // Unlink if empty
        if (project?.editorBoardId) {
          await unlinkProjectEditorBoard(projectId);
          toast.success('Editor Board unlinked successfully');
        }
      } else {
        // Link new board
        await linkProjectEditorBoard(projectId, Number(selectedBoardId));
        toast.success('Editor Board linked successfully');
      }
      await loadData();
    } catch (err) {
      console.error('Failed to update editor board:', err);
      toast.error('Failed to update Editor Board link');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <LoadingState className="text-[#FFD369]" message="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-[#FFD369]/10 text-[#FFD369]">
            <Settings className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-white">
              Project Settings
            </h1>
            <p className="mt-1 text-xs font-bold text-[#8b94a1]">
              Manage your project configurations
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-[4px] border border-[#303842] bg-[#151c25] p-6">
          <div className="mb-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Editor Board Connection
            </h2>
            <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
              Link this project to an Editor Board to share tasks and resources with external publishers or editorial teams.
            </p>
          </div>

          <div className="max-w-md space-y-4">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#aeb7c2]">
                Select Editor Board
              </label>
              <select
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                className="w-full rounded-[4px] border border-[#39424f] bg-[#0d151e] px-4 py-2.5 text-sm font-medium text-white outline-none transition-colors focus:border-[#FFD369] focus:ring-1 focus:ring-[#FFD369]"
              >
                <option value="">-- No Editor Board (Unlinked) --</option>
                {editorBoards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="h-9 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black uppercase tracking-wider text-[#101820] hover:bg-[#eac04f] disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <LoadingState className="h-3 w-3" /> Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="size-3.5" /> Save Changes
                  </span>
                )}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
