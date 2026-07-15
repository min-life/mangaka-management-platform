import { useCallback, useMemo, useRef, useState } from 'react';

import { fetchTaskMaterials } from '@/src/services/resourceApi';
import { ResourceFileMaterialVersion } from '@/src/types/resources';

export function useTaskMaterialVersions(fileVersions: ResourceFileMaterialVersion[]) {
  const [versionsByTaskId, setVersionsByTaskId] = useState<
    Record<string, ResourceFileMaterialVersion[]>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const requestIdRef = useRef(0);

  const previewVersions = useMemo(() => {
    const versionsById = new Map<string, ResourceFileMaterialVersion>();

    fileVersions.forEach((version) => versionsById.set(version.id, version));
    Object.values(versionsByTaskId).forEach((taskVersions) => {
      taskVersions.forEach((version) => versionsById.set(version.id, version));
    });

    return Array.from(versionsById.values());
  }, [fileVersions, versionsByTaskId]);

  const versionCountsByTaskId = useMemo(() => {
    const counts = fileVersions.reduce<Record<string, number>>((acc, version) => {
      if (!version.taskId) return acc;
      acc[version.taskId] = (acc[version.taskId] ?? 0) + 1;
      return acc;
    }, {});

    Object.entries(versionsByTaskId).forEach(([taskId, taskVersions]) => {
      counts[taskId] = taskVersions.length;
    });

    return counts;
  }, [fileVersions, versionsByTaskId]);

  const resetTaskMaterials = useCallback(() => {
    requestIdRef.current += 1;
    setVersionsByTaskId({});
    setErrorMessage('');
    setIsLoading(false);
  }, []);

  const loadTaskMaterials = useCallback(
    async (taskId: string, options: { force?: boolean } = {}) => {
      if (!options.force && versionsByTaskId[taskId]) {
        return versionsByTaskId[taskId];
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setErrorMessage('');
      setIsLoading(true);

      try {
        const nextVersions = await fetchTaskMaterials(taskId);
        if (requestId !== requestIdRef.current) return [];

        setVersionsByTaskId((prev) => ({ ...prev, [taskId]: nextVersions }));
        return nextVersions;
      } catch (error) {
        if (requestId !== requestIdRef.current) return [];

        setVersionsByTaskId((prev) => ({ ...prev, [taskId]: [] }));
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load task versions.');
        return [];
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [versionsByTaskId],
  );

  return {
    errorMessage,
    isLoading,
    loadTaskMaterials,
    previewVersions,
    resetTaskMaterials,
    versionCountsByTaskId,
    versionsByTaskId,
  };
}
