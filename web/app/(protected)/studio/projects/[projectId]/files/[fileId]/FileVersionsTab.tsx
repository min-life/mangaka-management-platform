'use client';

import { useState, useEffect } from 'react';
import { History, ChevronRight, Plus, Eye, RotateCw, X, Trash2, Download, FileImage, FileText, FileArchive, FileCode, FileQuestion, Upload, Loader2 } from 'lucide-react';

import { getMaterialById, updateMaterial } from '@/services/material.service';
import { toast } from '@/lib/toast';
import {
  type FileExplorerItem,
  type FileVersionItem,
} from '../file-ui';


// Let's import proper components: Button should be imported from @/components/ui/button
import { Button as UIButton } from '@/components/ui/button';

type FileVersionsTabProps = {
  versions: FileVersionItem[];
  selectedVersion: FileVersionItem | null;
  setSelectedVersion: (version: FileVersionItem | null) => void;
  selectedVersionForDetails: FileVersionItem | null;
  setSelectedVersionForDetails: (version: FileVersionItem | null) => void;
  versionTabMode: 'list' | 'detail';
  setVersionTabMode: (mode: 'list' | 'detail') => void;
  setVersionHistoryOpen: (open: boolean) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  setSelectedSubmissionId: (id: string | null) => void;
  handleRestoreVersion: (version: FileVersionItem) => void;
  handleDeleteVersion: (version: FileVersionItem) => Promise<void>;
  deletingVersionId: string | null;
  isLoading: boolean;
  isSubmittingReview: boolean;
  setIsSubmittingReview: (loading: boolean) => void;
  fileId: number;
  loadFile: () => Promise<void>;
  file: FileExplorerItem;
  setError: (err: string | null) => void;
  canRestore?: boolean;
  canDelete?: boolean;
};

const fileStatusLabels: Record<string, string> = {
  PENDING: 'Pending Draft',
  INPROGRESS: 'In Progress',
  REVIEW: 'In Review',
  DONE: 'Completed',
};

export function FileVersionsTab({
  versions,
  selectedVersion,
  setSelectedVersion,
  selectedVersionForDetails,
  setSelectedVersionForDetails,
  versionTabMode,
  setVersionTabMode,
  setVersionHistoryOpen,
  canvasRef,
  setSelectedSubmissionId,
  handleRestoreVersion,
  handleDeleteVersion,
  deletingVersionId,
  isLoading,
  isSubmittingReview,
  setIsSubmittingReview,
  fileId,
  loadFile,
  file,
  setError,
  canRestore = false,
  canDelete = false,
}: FileVersionsTabProps) {
  type LocalMaterialSlot = {
    file?: File;
    url?: string;
    originalName: string;
    size?: number;
    type: 'IMAGE' | 'TEXT' | 'SOURCE';
    isNew?: boolean;
    isDeleted?: boolean;
  };

  type LocalMaterialState = {
    image: LocalMaterialSlot | null;
    text: LocalMaterialSlot | null;
    source: LocalMaterialSlot | null;
  };


  const [localMaterials, setLocalMaterials] = useState<LocalMaterialState>({
    image: null,
    text: null,
    source: null,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const getFileIcon = (name: string, type: 'IMAGE' | 'TEXT' | 'SOURCE', url?: string) => {
    const extension = name.split('.').pop()?.toLowerCase() || '';

    if (type === 'IMAGE') {
      if (url && url.trim() !== '') {
        return (
          <div className="size-6 rounded-[3px] overflow-hidden border border-[#303842] bg-[#091018] shrink-0">
            <img src={url || undefined} alt={name} className="h-full w-full object-cover" />
          </div>
        );
      }
      return <FileImage className="size-5 text-cyan-400 shrink-0" />;
    }

    if (type === 'TEXT') {
      return <FileText className="size-5 text-purple-400 shrink-0" />;
    }

    if (type === 'SOURCE') {
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
        return <FileArchive className="size-5 text-amber-400 shrink-0" />;
      }
      return <FileCode className="size-5 text-emerald-400 shrink-0" />;
    }

    return <FileQuestion className="size-5 text-[#8b94a1] shrink-0" />;
  };

  const getCategoryBadge = (type: 'IMAGE' | 'TEXT' | 'SOURCE') => {
    switch (type) {
      case 'IMAGE':
        return (
          <span className="rounded bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">
            Image
          </span>
        );
      case 'TEXT':
        return (
          <span className="rounded bg-purple-950/40 border border-purple-800/60 text-purple-300 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">
            Doc
          </span>
        );
      case 'SOURCE':
        return (
          <span className="rounded bg-amber-950/40 border border-amber-800/60 text-amber-300 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">
            Source
          </span>
        );
    }
  };

  const getFormatBadge = (name: string) => {
    const extension = name.split('.').pop()?.toUpperCase() || '';
    if (extension === 'PSD') {
      return (
        <span className="rounded bg-[#001c3d] border border-[#003c80] text-[#31a8ff] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">
          PSD
        </span>
      );
    }
    if (extension === 'CLIP') {
      return (
        <span className="rounded bg-[#2b0000] border border-[#660000] text-[#ff5555] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">
          CLIP
        </span>
      );
    }
    if (extension) {
      return (
        <span className="rounded bg-[#1a232d] border border-[#26303b] text-[#8b94a1] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">
          {extension}
        </span>
      );
    }
    return null;
  };

  useEffect(() => {
    if (!selectedVersionForDetails) {
      setLocalMaterials({ image: null, text: null, source: null });
      setHasChanges(false);
      setIsLoadingDetail(false);
      return;
    }

    const mats = (selectedVersionForDetails as any).materials ?? [];

    // Nếu material chưa có data (task material chỉ có id+name), gọi API getMaterialById để lấy chi tiết
    if (mats.length === 0 && selectedVersionForDetails.id) {
      setIsLoadingDetail(true);
      getMaterialById(selectedVersionForDetails.id)
        .then((res: any) => {
          const fullMaterial = res.data ?? res;
          const fullMats = (fullMaterial?.materials as any[]) ?? [];
          const imageMat = fullMats.find((m: any) => m.type === 'IMAGE') ?? null;
          const textMat = fullMats.find((m: any) => m.type === 'TEXT') ?? null;
          const sourceMat = fullMats.find((m: any) => m.type === 'SOURCE') ?? null;
          setLocalMaterials({
            image: imageMat ? { url: imageMat.downloadUrl || imageMat.url, originalName: imageMat.originalName || imageMat.name, size: imageMat.size, type: 'IMAGE' } : null,
            text: textMat ? { url: textMat.downloadUrl || textMat.url, originalName: textMat.originalName || textMat.name, size: textMat.size, type: 'TEXT' } : null,
            source: sourceMat ? { url: sourceMat.downloadUrl || sourceMat.url, originalName: sourceMat.originalName || sourceMat.name, size: sourceMat.size, type: 'SOURCE' } : null,
          });
        })
        .catch((err) => {
          console.error('Failed to load material detail:', err);
          toast.error('Could not load material details.');
        })
        .finally(() => {
          setIsLoadingDetail(false);
        });
      setHasChanges(false);
      return;
    }

    const imageMat = mats.find((m: any) => m.type === 'IMAGE') ?? null;
    const textMat = mats.find((m: any) => m.type === 'TEXT') ?? null;
    const sourceMat = mats.find((m: any) => m.type === 'SOURCE') ?? null;

    setLocalMaterials({
      image: imageMat ? { url: imageMat.downloadUrl || imageMat.url, originalName: imageMat.originalName || imageMat.name, size: imageMat.size, type: 'IMAGE' } : null,
      text: textMat ? { url: textMat.downloadUrl || textMat.url, originalName: textMat.originalName || textMat.name, size: textMat.size, type: 'TEXT' } : null,
      source: sourceMat ? { url: sourceMat.downloadUrl || sourceMat.url, originalName: sourceMat.originalName || sourceMat.name, size: sourceMat.size, type: 'SOURCE' } : null,
    });
    setHasChanges(false);
  }, [selectedVersionForDetails?.id]);

  return (
    <div className="space-y-4">
      {versionTabMode === 'list' ? (
        <>


          {/* Versions Grid */}
          {versions.length === 0 ? (
            <p className="py-10 text-center text-xs italic text-[#8b94a1]">
              No versions uploaded yet.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {versions.map((version) => {
                const isSelected = selectedVersion && String(selectedVersion.id) === String(version.id);

                return (
                  <div
                    key={version.id}
                    className={`group relative flex flex-col overflow-hidden rounded-[6px] border cursor-pointer transition-all duration-150 ${isSelected
                        ? 'border-[#FFD369] bg-[#151c25]'
                        : 'border-[#26303b] bg-[#0d151e] hover:border-[#FFD369]/40 hover:bg-[#111923]'
                      }`}
                    onClick={() => {
                      setSelectedVersion(version.isCurrent ? null : version);
                      setSelectedSubmissionId(null);
                    }}
                  >
                    {/* Info area */}
                    <div className="flex min-w-0 flex-col gap-1.5 px-2.5 pt-3 pb-2">
                      <div className="flex items-start justify-between gap-1">
                        <span
                          className="block truncate text-[11px] font-black text-white leading-snug"
                          title={version.note || `Material #${version.id}`}
                        >
                          {version.note || `Material #${version.id}`}
                        </span>
                        {version.isCurrent && (
                          <span className="shrink-0 rounded-full border border-[#FFD369]/40 bg-[#FFD369]/10 px-1 py-px text-[8px] font-black text-[#FFD369]">
                            Now
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-medium text-[#8b94a1]">
                        {version.author && (
                          <span className="truncate max-w-[60px]" title={version.author}>
                            {version.author}
                          </span>
                        )}
                        {version.author && version.createdAt && (
                          <span className="text-[#303842]">·</span>
                        )}
                        {version.createdAt && (
                          <span className="shrink-0">{version.createdAt}</span>
                        )}
                      </div>
                    </div>

                    {/* View Details button — hiện khi hover hoặc selected */}
                    <button
                      className={`flex items-center justify-center gap-1 border-t border-[#26303b] py-1.5 text-[10px] font-black transition-all duration-150 ${isSelected
                          ? 'bg-[#FFD369] text-[#222831] border-[#FFD369]'
                          : 'text-[#8b94a1] opacity-0 group-hover:opacity-100 hover:bg-[#FFD369]/10 hover:text-[#FFD369]'
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVersionForDetails(version);
                        setSelectedVersion(version.isCurrent ? null : version);
                        setSelectedSubmissionId(null);
                        setVersionTabMode('detail');
                      }}
                      type="button"
                    >
                      <Eye className="size-2.5" />
                      Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : selectedVersionForDetails ? (
        <>
          {/* Detail View Header & Back Button */}
          <div className="flex items-center justify-between gap-3 border-b border-[#26303b] pb-3 mb-4">
            <UIButton
              className="h-8 text-xs font-black text-[#aeb7c2] hover:text-white rounded-[4px] p-0"
              onClick={() => {
                setVersionTabMode('list');
                setSelectedVersionForDetails(null);
                setSelectedVersion(null);
              }}
              variant="ghost"
            >
              ← Back to Version History
            </UIButton>
          </div>

          {/* Main Details Stacked Container */}
          <div className="border border-[#26303b] bg-[#0d151e] rounded-[6px] p-6 space-y-6">
            {/* Loading overlay when fetching material detail on click */}
            {isLoadingDetail ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="size-7 text-[#FFD369] animate-spin" />
                <p className="text-xs font-bold text-[#8b94a1]">Loading material details...</p>
              </div>
            ) : (
              <>
                {/* Section 1: Header / Primary Actions at Top */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#26303b]">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white">Version v{selectedVersionForDetails.version}</h3>
                    <div className="flex items-center gap-1.5">
                      {selectedVersionForDetails.isCurrent ? (
                        <span className="rounded-[3px] border border-[#315846] bg-[#14291f] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#9df2c7]">
                          Current Version
                        </span>
                      ) : (
                        <span className="rounded-[3px] border border-[#6c5516] bg-[#30270d] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#FFD369]">
                          Viewing Snapshot
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canRestore && !selectedVersionForDetails.isCurrent && (
                      <UIButton
                        className="h-8 rounded-[4px] border-[#6c5516] bg-[#30270d] text-xs font-black text-[#ffd35b] hover:bg-[#3a3011]"
                        disabled={isLoading}
                        onClick={() => {
                          handleRestoreVersion(selectedVersionForDetails);
                        }}
                        variant="outline"
                      >
                        <RotateCw className="mr-1.5 size-3.5" />
                        Restore Version
                      </UIButton>
                    )}

                    {canDelete && !selectedVersionForDetails.isCurrent && (
                      <UIButton
                        className="h-8 rounded-[4px] border-red-950/60 text-xs font-black text-red-400 hover:border-red-500/50 hover:bg-red-950/30 hover:text-red-300"
                        disabled={deletingVersionId === String(selectedVersionForDetails.id) || isLoading}
                        onClick={() => {
                          if (window.confirm(`Delete v${selectedVersionForDetails.version}? This action cannot be undone.`)) {
                            void handleDeleteVersion(selectedVersionForDetails);
                          }
                        }}
                        variant="outline"
                      >
                        <X className="mr-1.5 size-3.5" />
                        {deletingVersionId === String(selectedVersionForDetails.id) ? 'Deleting…' : 'Delete'}
                      </UIButton>
                    )}
                  </div>
                </div>

                {/* Section 2: Version Note */}
                <div className="space-y-2 pb-5 border-b border-[#26303b]">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#8b94a1]">
                    Version Note
                  </span>
                  <p className="text-xs font-medium leading-relaxed text-[#dce7f3]">
                    {selectedVersionForDetails.note || 'No notes provided for this version.'}
                  </p>
                </div>

                {/* Section 3: Materials */}
                <div className="space-y-4 pb-5 border-b border-[#26303b]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#8b94a1]">
                      Materials ({
                        [localMaterials.image, localMaterials.text, localMaterials.source].filter(
                          (m) => m !== null && !m.isDeleted
                        ).length
                      }/3)
                    </span>
                  </div>

                  {/* Hidden file inputs for each slot */}
                  <input
                    accept="image/*"
                    className="hidden"
                    id={`material-upload-image-${selectedVersionForDetails.id}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setLocalMaterials((prev) => ({
                        ...prev,
                        image: { file, originalName: file.name, size: file.size, type: 'IMAGE', isNew: true },
                      }));
                      setHasChanges(true);
                    }}
                    type="file"
                  />
                  <input
                    accept=".txt,.doc,.docx,.pdf,.csv"
                    className="hidden"
                    id={`material-upload-text-${selectedVersionForDetails.id}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setLocalMaterials((prev) => ({
                        ...prev,
                        text: { file, originalName: file.name, size: file.size, type: 'TEXT', isNew: true },
                      }));
                      setHasChanges(true);
                    }}
                    type="file"
                  />
                  <input
                    accept=".psd,.clip,.zip,.rar,.7z"
                    className="hidden"
                    id={`material-upload-source-${selectedVersionForDetails.id}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setLocalMaterials((prev) => ({
                        ...prev,
                        source: { file, originalName: file.name, size: file.size, type: 'SOURCE', isNew: true },
                      }));
                      setHasChanges(true);
                    }}
                    type="file"
                  />

                  {(() => {
                    const slotsData = [
                      {
                        type: 'IMAGE' as const,
                        key: 'image' as const,
                        title: 'Artwork / Preview Image',
                        acceptDesc: 'PNG, JPG, WebP, GIF',
                        inputId: `material-upload-image-${selectedVersionForDetails.id}`,
                        data: localMaterials.image,
                      },
                      {
                        type: 'TEXT' as const,
                        key: 'text' as const,
                        title: 'Review Note / Document',
                        acceptDesc: 'TXT, DOC, DOCX, PDF, CSV',
                        inputId: `material-upload-text-${selectedVersionForDetails.id}`,
                        data: localMaterials.text,
                      },
                      {
                        type: 'SOURCE' as const,
                        key: 'source' as const,
                        title: 'Source File',
                        acceptDesc: 'PSD, CLIP, ZIP, RAR, 7Z',
                        inputId: `material-upload-source-${selectedVersionForDetails.id}`,
                        data: localMaterials.source,
                      },
                    ];

                    return (
                      <div className="space-y-4">
                        {slotsData.map((slot) => {
                          const mat = slot.data;
                          const hasFile = mat !== null && !mat.isDeleted;

                          if (!hasFile) {
                            return (
                              <div key={slot.type} className="space-y-1.5">
                                <span className="text-[9px] font-black uppercase tracking-wider text-[#8b94a1]">
                                  {slot.title}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => document.getElementById(slot.inputId)?.click()}
                                  className="w-full flex items-center justify-between gap-4 rounded-[6px] border border-dashed border-[#303842] bg-[#0d151e]/20 px-4 py-3 text-left transition-all duration-200 hover:border-[#FFD369]/40 hover:bg-[#111923]/40 group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-[4px] border border-dashed border-[#303842] bg-[#0d151e]/40 flex items-center justify-center text-[#8b94a1] group-hover:text-white group-hover:border-[#FFD369]/30 transition-colors">
                                      <Plus className="size-4" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-[#aeb7c2] group-hover:text-white transition-colors">
                                        Attach File
                                      </p>
                                      <p className="text-[9px] text-[#5c6573] mt-0.5">
                                        Accepted formats: {slot.acceptDesc}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              </div>
                            );
                          }

                          // Slot is filled
                          const name = mat.originalName;
                          const sizeLabel = mat.size
                            ? `${(mat.size / 1024 / 1024).toFixed(2)} MB`
                            : '';
                          const url = mat.url;

                          return (
                            <div key={slot.type} className="space-y-1.5">
                              <span className="text-[9px] font-black uppercase tracking-wider text-[#8b94a1]">
                                {slot.title}
                              </span>
                              <div
                                className="flex items-center justify-between gap-4 rounded-[6px] border border-[#26303b] bg-[#0d151e]/30 px-3.5 py-3 transition-all duration-200 hover:border-[#FFD369]/30 hover:bg-[#111923]"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {getFileIcon(name, mat.type, url)}
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <p className="truncate text-xs font-bold text-white max-w-[180px] sm:max-w-xs" title={name}>
                                        {name}
                                      </p>
                                      {mat.isNew && (
                                        <span className="rounded bg-[#ffb100]/25 text-[#ffb100] px-1 text-[8px] font-black uppercase tracking-wider">
                                          New
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      {getCategoryBadge(mat.type)}
                                      {getFormatBadge(name)}
                                      {sizeLabel && (
                                        <span className="text-[10px] font-bold text-[#8b94a1]">
                                          {sizeLabel}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {/* View Action (Only for images) */}
                                  {mat.type === 'IMAGE' && url && (
                                    <a
                                      aria-label="View image in new tab"
                                      className="p-1.5 rounded text-[#8b94a1] hover:text-[#FFD369] hover:bg-[#1b2530] transition-colors"
                                      href={url}
                                      rel="noopener noreferrer"
                                      target="_blank"
                                    >
                                      <Eye className="size-3.5" />
                                    </a>
                                  )}

                                  {/* Download Action */}
                                  {url ? (
                                    <a
                                      aria-label={`Download ${name}`}
                                      className="p-1.5 rounded text-[#8b94a1] hover:text-[#FFD369] hover:bg-[#1b2530] transition-colors"
                                      download={name}
                                      href={url}
                                      rel="noopener noreferrer"
                                      target="_blank"
                                    >
                                      <Download className="size-3.5" />
                                    </a>
                                  ) : (
                                    <button
                                      aria-label="Download not available yet"
                                      className="p-1.5 rounded text-[#4f5662] cursor-not-allowed"
                                      onClick={() => toast.info('Save changes to upload and make it downloadable.')}
                                      type="button"
                                    >
                                      <Download className="size-3.5" />
                                    </button>
                                  )}

                                  {/* Replace Action */}
                                  <button
                                    aria-label={`Replace ${slot.title}`}
                                    className="p-1.5 rounded text-[#8b94a1] hover:text-[#FFD369] hover:bg-[#1b2530] transition-colors"
                                    onClick={() => document.getElementById(slot.inputId)?.click()}
                                    type="button"
                                  >
                                    <Upload className="size-3.5" />
                                  </button>

                                  {/* Delete Action */}
                                  <button
                                    aria-label="Remove material file"
                                    className="p-1.5 rounded text-[#8b94a1] hover:text-red-400 hover:bg-red-950/20 transition-colors"
                                    onClick={() => {
                                      setLocalMaterials((prev) => {
                                        const next = { ...prev };
                                        if (mat.type === 'IMAGE' && next.image) {
                                          next.image = next.image.isNew ? null : { ...next.image, isDeleted: true };
                                        } else if (mat.type === 'TEXT' && next.text) {
                                          next.text = next.text.isNew ? null : { ...next.text, isDeleted: true };
                                        } else if (mat.type === 'SOURCE' && next.source) {
                                          next.source = next.source.isNew ? null : { ...next.source, isDeleted: true };
                                        }
                                        setHasChanges(true);
                                        return next;
                                      });
                                    }}
                                    type="button"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {hasChanges && (
                    <div className="flex items-center justify-end gap-2 p-3 bg-[#111923] border border-[#ffb100]/30 rounded-[4px] mt-4">
                      <p className="text-[10px] text-[#ffb100] font-bold mr-auto">
                        You have unsaved changes in materials.
                      </p>
                      <UIButton
                        className="h-7 text-[10px] font-black text-[#aeb7c2] hover:text-white rounded-[4px] px-3"
                        onClick={() => {
                          if (selectedVersionForDetails) {
                            const mats = (selectedVersionForDetails as any).materials ?? [];
                            const imageMat = mats.find((m: any) => m.type === 'IMAGE') ?? null;
                            const textMat = mats.find((m: any) => m.type === 'TEXT') ?? null;
                            const sourceMat = mats.find((m: any) => m.type === 'SOURCE') ?? null;

                            setLocalMaterials({
                              image: imageMat ? { url: imageMat.downloadUrl || imageMat.url, originalName: imageMat.originalName || imageMat.name, size: imageMat.size, type: 'IMAGE' } : null,
                              text: textMat ? { url: textMat.downloadUrl || textMat.url, originalName: textMat.originalName || textMat.name, size: textMat.size, type: 'TEXT' } : null,
                              source: sourceMat ? { url: sourceMat.downloadUrl || sourceMat.url, originalName: sourceMat.originalName || sourceMat.name, size: sourceMat.size, type: 'SOURCE' } : null,
                            });
                            setHasChanges(false);
                          }
                        }}
                        type="button"
                        variant="ghost"
                      >
                        Reset
                      </UIButton>
                      <UIButton
                        className="h-7 bg-[#FFD369] hover:bg-[#ffc107] text-[10px] font-black text-[#101820] rounded-[4px] px-4"
                        disabled={isSaving || isSubmittingReview}
                        onClick={async () => {
                          setIsSaving(true);
                          try {
                            const formData = new FormData();
                            const deleteOptions: any = {};

                            if (localMaterials.image?.isNew && localMaterials.image.file) {
                              formData.append('image', localMaterials.image.file);
                            }
                            if (localMaterials.text?.isNew && localMaterials.text.file) {
                              formData.append('text', localMaterials.text.file);
                            }
                            if (localMaterials.source?.isNew && localMaterials.source.file) {
                              formData.append('source', localMaterials.source.file);
                            }

                            if (localMaterials.image?.isDeleted) {
                              deleteOptions.deleteImage = true;
                            }
                            if (localMaterials.text?.isDeleted) {
                              deleteOptions.deleteText = true;
                            }
                            if (localMaterials.source?.isDeleted) {
                              deleteOptions.deleteSource = true;
                            }

                            await updateMaterial(selectedVersionForDetails.id, formData, deleteOptions);
                            toast.success('Materials updated successfully.');
                            await loadFile();

                            // Refresh the detail view with updated data
                            const freshRes = await getMaterialById(selectedVersionForDetails.id);
                            const freshMaterial = (freshRes as any)?.data ?? freshRes;
                            if (freshMaterial) {
                              setSelectedVersionForDetails({
                                ...selectedVersionForDetails,
                                materials: freshMaterial.materials ?? [],
                              });
                            }
                          } catch {
                            setError('Failed to save material changes.');
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        type="button"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-1.5 size-3 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </UIButton>
                    </div>
                  )}
                </div>

                {/* Section 4: Metadata (Simple key-value rows) */}
                <div className="space-y-3">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#8b94a1]">
                    Metadata
                  </span>
                  <div className="space-y-2 text-xs font-bold">
                    <div className="flex items-center justify-between border-b border-[#26303b]/40 pb-1.5 last:border-b-0">
                      <span className="text-[#8b94a1]">Uploaded by</span>
                      <span className="text-white">{selectedVersionForDetails.author}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#26303b]/40 pb-1.5 last:border-b-0">
                      <span className="text-[#8b94a1]">Created</span>
                      <span className="text-white">{selectedVersionForDetails.createdAt}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b94a1]">Status</span>
                      <span className="text-[#FFD369]">
                        {selectedVersionForDetails.isCurrent ? 'Current' : 'Historical Snapshot'}
                      </span>
                    </div>
                  </div>
                </div>

              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
