'use client';

import { Badge } from '@/components/ui/badge';
import type { FileExplorerItem, FileTaskItem } from '../file-ui';
import { fileStatusClassName, fileStatusLabels } from '../file-ui';
import type { ProjectFolderResponse } from '@/services/project.service';

type FileOverviewTabProps = {
  file: FileExplorerItem;
  folder?: ProjectFolderResponse | null;
  tasks: FileTaskItem[];
};

export function FileOverviewTab({ file, folder, tasks }: FileOverviewTabProps) {
  return (
    <div className="text-white">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="border border-[#303842] bg-[#151c25] p-5 rounded-[4px]">
          <h3 className="text-xs font-black uppercase tracking-[0.08em] text-[#FFD369] mb-4">
            File Specification
          </h3>
          <dl className="grid grid-cols-2 gap-4">
            {[
              ['File Type', file.category || 'Production File'],
              ['Created At', new Date(file.createdAt).toLocaleDateString()],
              ['Last Updated', new Date(file.updatedAt).toLocaleDateString()],
              ['Uploaded By', file.createdByLabel],
              ['Location', folder?.title ?? 'Production Folder'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[8px] font-black uppercase text-[#8b94a1]">{label}</dt>
                <dd className="mt-1 text-xs font-bold text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border border-[#303842] bg-[#151c25] p-5 rounded-[4px]">
          <h3 className="text-xs font-black uppercase tracking-[0.08em] text-[#FFD369] mb-4">
            Linked Tasks
          </h3>
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between border-b border-[#26303b] pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-xs font-black text-white">{task.title}</p>
                    <p className="text-[9px] text-[#8b94a1] mt-0.5">Assignee: {task.assignedTo}</p>
                  </div>
                  <Badge className={`rounded-[3px] border text-[8px] ${fileStatusClassName[task.status]}`}>
                    {fileStatusLabels[task.status]}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#8b94a1] italic">No tasks currently linked to this file.</p>
          )}
        </div>
      </div>

      {file.description && (
        <div className="mt-6 border border-[#303842] bg-[#151c25] p-5 rounded-[4px]">
          <h3 className="text-xs font-black uppercase tracking-[0.08em] text-[#FFD369] mb-2">
            Description
          </h3>
          <p className="text-xs font-medium leading-5 text-[#dce7f3]">{file.description}</p>
        </div>
      )}
    </div>
  );
}
