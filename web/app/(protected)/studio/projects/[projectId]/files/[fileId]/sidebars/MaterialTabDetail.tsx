'use client';

import { useState } from 'react';
import { Eye, Download, Upload, Trash2, X, Image as ImageIcon, FileText, FileArchive, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UpdateMaterialsDialog } from './UpdateMaterialsDialog';
import type { FileVersionItem } from '../../file-ui';
import type { TaskWorkspaceItem } from '../../../tasks/task-ui';

export function MaterialTabDetail({
  versions,
  latestMaterialVersion,
  focusedTask,
  fileId,
  onRefresh,
}: {
  versions: FileVersionItem[];
  latestMaterialVersion?: FileVersionItem | null;
  focusedTask: TaskWorkspaceItem | null;
  fileId: number;
  onRefresh?: () => void | Promise<void>;
}) {
  const [pendingFiles, setPendingFiles] = useState<{
    img?: File | null;
    text?: File | null;
    src?: File | null;
  }>({});
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Get the most recent version for the focused task, or the most recent overall version
  const targetVersion = focusedTask 
    ? (versions.find(v => v.taskId === Number(focusedTask.id) && v.isCurrent) ?? versions.find(v => v.taskId === Number(focusedTask.id)))
    : (versions[0] ?? latestMaterialVersion);
    
  const imgMat: any = (targetVersion?.materials as any[] || []).find((m: any) => m.type === 'IMAGE' || m.originalName?.match(/\.(png|jpe?g)$/i) || m.name?.match(/\.(png|jpe?g)$/i));
  const textMat: any = (targetVersion?.materials as any[] || []).find((m: any) => m.type === 'TEXT' || m.originalName?.match(/\.(txt|md|docx?)$/i) || m.name?.match(/\.(txt|md|docx?)$/i));
  const srcMat: any = (targetVersion?.materials as any[] || []).find((m: any) => m.type === 'SOURCE' || m.originalName?.match(/\.(zip|rar|clip|psd)$/i) || m.name?.match(/\.(zip|rar|clip|psd)$/i));

  const items = [
    { type: 'img', label: 'IMG', icon: ImageIcon, current: imgMat?.originalName || imgMat?.name, url: imgMat?.url, downloadUrl: imgMat?.downloadUrl || imgMat?.url, pending: pendingFiles.img, accept: 'image/png, image/jpeg, image/jpg' },
    { type: 'text', label: 'TEXT', icon: FileText, current: textMat?.originalName || textMat?.name, url: textMat?.url, downloadUrl: textMat?.downloadUrl || textMat?.url, pending: pendingFiles.text, accept: '.txt, .md, .doc, .docx' },
    { type: 'src', label: 'SRC', icon: FileArchive, current: srcMat?.originalName || srcMat?.name, url: srcMat?.url, downloadUrl: srcMat?.downloadUrl || srcMat?.url, pending: pendingFiles.src, accept: '.zip, .rar, .clip, .psd' },
  ] as const;

  const handleFileChange = (type: 'img' | 'text' | 'src', file: File | null | undefined) => {
    setPendingFiles(prev => ({ ...prev, [type]: file }));
  };

  const hasPending = Object.values(pendingFiles).some(v => v !== undefined);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="mb-2">
        <h3 className="text-xs font-black uppercase text-white">Latest Materials</h3>
        <p className="text-[10px] text-[#8b94a1] mt-1">
          {focusedTask ? `Task: ${focusedTask.title}` : `Overall File Materials`}
          {targetVersion ? ` (v${targetVersion.version})` : ''}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.type} className="flex flex-col rounded-[4px] border border-[#26303b] bg-[#151c25] overflow-hidden">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3 overflow-hidden pr-3">
                <div className="grid size-8 shrink-0 place-items-center rounded bg-[#202832]">
                  <item.icon className="size-4 text-[#8b94a1]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-black uppercase text-[#8b94a1]">{item.label}</span>
                  {item.pending instanceof File ? (
                    <span className="block truncate text-xs font-bold text-[#FFD369]">{item.pending.name}</span>
                  ) : item.pending === null ? (
                    <span className="block truncate text-xs font-bold text-red-500 line-through">{item.current}</span>
                  ) : item.current ? (
                    <span className="block truncate text-xs font-bold text-white">{item.current}</span>
                  ) : (
                    <span className="block text-xs italic text-[#5b626d]">No file uploaded</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {item.current && item.url && item.pending !== null && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-7 items-center justify-center rounded text-[#8b94a1] hover:bg-[#202832] hover:text-white transition-colors"
                    title="View"
                  >
                    <Eye className="size-4" />
                  </a>
                )}
                {item.current && item.downloadUrl && item.pending !== null && (
                  <a
                    href={item.downloadUrl}
                    download
                    className="flex size-7 items-center justify-center rounded text-[#8b94a1] hover:bg-[#202832] hover:text-white transition-colors"
                    title="Download"
                  >
                    <Download className="size-4" />
                  </a>
                )}
                
                <label className="flex size-7 cursor-pointer items-center justify-center rounded text-[#8b94a1] hover:bg-[#202832] hover:text-[#FFD369] transition-colors" title={item.current ? 'Update' : 'Upload'}>
                  <Upload className="size-4" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept={item.accept}
                    onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                    onChange={(e) => handleFileChange(item.type, e.target.files?.[0])} 
                  />
                </label>

                {item.current && item.pending !== null && (
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded text-[#8b94a1] hover:bg-[#202832] hover:text-red-500 transition-colors"
                    title="Delete"
                    onClick={() => handleFileChange(item.type, null)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
                {item.pending !== undefined && (
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded text-[#FFD369] hover:bg-[#202832] transition-colors"
                    title="Undo Changes"
                    onClick={() => handleFileChange(item.type, undefined)}
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasPending && (
        <Button 
          className="mt-2 w-full gap-2 bg-[#FFD369] text-[#222831] hover:bg-[#eac04f]"
          onClick={() => setIsUpdateModalOpen(true)}
        >
          <Save className="size-4" />
          Save Uploads
        </Button>
      )}

      {isUpdateModalOpen && (
        <UpdateMaterialsDialog
          open={isUpdateModalOpen}
          onClose={() => {
            setIsUpdateModalOpen(false);
            setPendingFiles({});
          }}
          pendingFiles={pendingFiles}
          targetVersion={targetVersion}
          focusedTask={focusedTask}
          fileId={fileId}
          onRefresh={onRefresh}
          items={items}
        />
      )}
    </div>
  );
}
