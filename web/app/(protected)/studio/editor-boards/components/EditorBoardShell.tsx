import type { ReactNode } from 'react';

import { EditorBoardHeader } from './EditorBoardHeader';
import { EditorBoardSidebar } from './EditorBoardSidebar';

type EditorBoardShellProps = {
  boardName: string;
  children: ReactNode;
  editorBoardId: string;
};

// PhucTD #editor-board start
export function EditorBoardShell({
  boardName,
  children,
  editorBoardId,
}: EditorBoardShellProps) {
  return (
    <main className="workspace-scrollbar flex h-screen overflow-hidden bg-[#101820] text-[#eeeeee]">
      <EditorBoardSidebar editorBoardId={editorBoardId} />

      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <EditorBoardHeader
          boardName={boardName}
          editorBoardId={editorBoardId}
        />

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </main>
  );
}
// PhucTD #editor-board end
