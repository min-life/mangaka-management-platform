'use client';

import { useState } from 'react';
import { Upload, FileType2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { parseCsvStats, mergeProjectStats, StatRow } from '@/lib/project-stats';
import { getProjectStats, importProjectStats } from '@/services/project.service';

type UploadStatsDialogProps = {
  numericId: number;
  folders: any[]; // Project folders
  onUploadSuccess: () => void;
};

export function UploadStatsDialog({ numericId, folders, onUploadSuccess }: UploadStatsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');

  const chapters = folders.filter((f) => f.type === 'CHAPTER');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedChapterId) {
      toast.error('Please select a chapter and a CSV file.');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Parse CSV
      const parsedData = await parseCsvStats(file);
      
      // 2. Fetch existing stats
      const existingStatsResponse = await getProjectStats(numericId);
      const existingMetrics = existingStatsResponse?.metrics;

      // 3. Merge parsed data into existing metrics for the specific chapter
      const newMetrics = mergeProjectStats(existingMetrics, selectedChapterId, parsedData);

      // 4. Save merged stats to backend
      await importProjectStats(numericId, newMetrics);

      toast.success('Project statistics uploaded successfully.');
      setOpen(false);
      setFile(null);
      setSelectedChapterId('');
      onUploadSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to upload statistics.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 bg-[#FFD369] px-4 text-xs font-black text-[#101820] hover:bg-[#eac04f]">
          <Upload className="mr-2 size-4" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[#39424f] bg-[#151c25]">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-white">Upload Statistics</DialogTitle>
          <DialogDescription className="text-xs text-[#aeb7c2]">
            Upload a CSV file containing statistics for a specific chapter. 
            The file must include Month and Year columns.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <span className="text-[11px] font-semibold uppercase text-[#aeb7c2]">Chapter</span>
            <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
              <SelectTrigger className="h-10 rounded-[4px] border-[#50555D] bg-[#161c25] text-xs text-[#dde3ef]">
                <SelectValue placeholder="Select a chapter" />
              </SelectTrigger>
              <SelectContent className="border-[#50555D] bg-[#1a2029] text-white">
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={String(chapter.id)}>
                    {chapter.title}
                  </SelectItem>
                ))}
                {chapters.length === 0 && (
                  <SelectItem value="none" disabled>No chapters available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <span className="text-[11px] font-semibold uppercase text-[#aeb7c2]">CSV File</span>
            <div className="flex items-center justify-center w-full">
              <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#50555D] border-dashed rounded-[4px] cursor-pointer bg-[#161c25] hover:bg-[#1a2029] transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileType2 className="w-8 h-8 mb-3 text-[#8b94a1]" />
                  <p className="mb-2 text-sm text-[#aeb7c2]">
                    <span className="font-semibold text-white">Click to select</span> or drag and drop
                  </p>
                  <p className="text-xs text-[#8b94a1]">CSV format only</p>
                </div>
                <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            {file && (
              <p className="text-xs font-bold text-[#9df2c7] mt-1">
                Selected: {file.name}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="h-9 border-[#39424f] text-[#aeb7c2] hover:bg-[#1a222d] hover:text-white"
            onClick={() => setOpen(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            className="h-9 bg-[#FFD369] text-xs font-black text-[#101820] hover:bg-[#eac04f]"
            onClick={() => void handleUpload()}
            disabled={isUploading || !file || !selectedChapterId}
          >
            {isUploading ? 'Uploading...' : 'Confirm Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
