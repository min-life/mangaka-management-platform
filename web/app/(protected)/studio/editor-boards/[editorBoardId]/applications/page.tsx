import { ApplicationsClient } from './ApplicationsClient';

type ApplicationsPageProps = {
  params: Promise<{
    editorBoardId: string;
  }>;
};

// PhucTD #editor-board start
export default async function ApplicationsPage({ params }: ApplicationsPageProps) {
  const { editorBoardId } = await params;

  return <ApplicationsClient editorBoardId={Number(editorBoardId)} />;
}
// PhucTD #editor-board end
