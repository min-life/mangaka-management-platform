import { Suspense } from 'react';
import { WorkspaceDashboard } from './components/WorkspaceDashboard';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#222831]" />}>
      <WorkspaceDashboard />
    </Suspense>
  );
}
