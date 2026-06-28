import { getEditorBoardById } from '@/services/editor-board.service';

import { EditorBoardShell } from '../components/EditorBoardShell';

type EditorBoardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    editorBoardId: string;
  }>;
};

// PhucTD #editor-board start
export default async function EditorBoardLayout({ children, params }: EditorBoardLayoutProps) {
  const { editorBoardId } = await params;
  
  // Fetch board details to get the name
  let boardName = 'Editorial Board';
  try {
    const board = await getEditorBoardById(Number(editorBoardId));
    if (board && board.name) {
      boardName = board.name;
    }
  } catch (error) {
    // Ignore error
  }

  return (
    <EditorBoardShell
      boardName={boardName}
      editorBoardId={editorBoardId}
    >
      {children}
    </EditorBoardShell>
  );
}
// PhucTD #editor-board end
