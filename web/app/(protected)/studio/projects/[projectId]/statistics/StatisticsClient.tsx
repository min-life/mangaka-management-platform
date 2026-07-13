'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Filter, AlertCircle } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';

import { getProjectStats, getProjectFolders, type ProjectFolderResponse } from '@/services/project.service';
import { aggregateStats } from '@/lib/project-stats';
import { UploadStatsDialog } from './UploadStatsDialog';

import { useProjectParams } from '@/hooks/useProjectParams';

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, index) => currentYear - index);
}

function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-4">
      <div className="flex items-center gap-2 text-[#8b94a1]">
        <p className="text-[11px] font-black uppercase tracking-[0.04em] text-[#aeb7c2]">
          {label}
        </p>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-black text-white">{value}</span>
      </div>
    </article>
  );
}

function StatisticsLineChart({
  color,
  data,
  title,
}: {
  color: string;
  data: any[];
  title: string;
}) {
  return (
    <div className="rounded-[5px] border border-[#39424f] bg-[#0e141c] p-4">
      <div className="flex items-center gap-2 text-[#8b94a1]">
        <TrendingUp className="size-4" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#aeb7c2]">
          {title}
        </p>
      </div>
      <ChartContainer
        className="mt-3 aspect-auto h-[220px] w-full"
        config={{ value: { color, label: title } }}
      >
        <LineChart data={data} margin={{ bottom: 0, left: 4, right: 4, top: 8 }}>
          <CartesianGrid stroke="#26303c" vertical={false} />
          <XAxis dataKey="Month" fontSize={11} stroke="#5b626d" tickLine={false} tickFormatter={(val) => `Tháng ${val}`} />
          <YAxis
            fontSize={11}
            stroke="#5b626d"
            tickFormatter={(value) => value.toLocaleString()}
            tickLine={false}
            width={56}
          />
          <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: '#39424f' }} />
          <Line
            dataKey={title}
            dot={{ r: 3, fill: color }}
            name={title}
            stroke={color}
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

export function StatisticsClient() {
  const { numericId } = useProjectParams();
  const [year, setYear] = useState(new Date().getFullYear());
  const [arcId, setArcId] = useState<string>('all');
  const [chapterId, setChapterId] = useState<string>('all');
  
  const [folders, setFolders] = useState<ProjectFolderResponse[]>([]);
  const [rawMetrics, setRawMetrics] = useState<unknown>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, foldersRes] = await Promise.all([
        getProjectStats(numericId),
        getProjectFolders(numericId)
      ]);
      setRawMetrics(statsRes?.metrics || null);
      setFolders(foldersRes.folders || []);
    } catch (err: any) {
      console.error(err);
      setError('Unable to load statistics data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [numericId]);

  const arcs = folders.filter((f) => f.type === 'ARC');
  const chapters = folders.filter((f) => f.type === 'CHAPTER' && (arcId === 'all' || String(f.parentId) === arcId));

  const { summary, months } = aggregateStats(rawMetrics, { 
    year, 
    arcId: arcId !== 'all' ? arcId : undefined, 
    chapterId: chapterId !== 'all' ? chapterId : undefined 
  }, folders);

  const summaryKeys = Object.keys(summary).filter(k => k !== 'Month' && k !== 'Year');
  const hasData = summaryKeys.length > 0;

  return (
    <section className="px-5 py-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-black leading-8 text-white">Project Statistics</h1>
          </div>
          <p className="mt-1 text-sm font-medium text-[#aeb7c2]">
            Detailed metrics and aggregation via CSV
          </p>
        </div>

        <div className="flex items-center gap-3">
          <UploadStatsDialog numericId={numericId} folders={folders} onUploadSuccess={() => { void loadData(); }} />
        </div>
      </div>

      <div className="mt-5 flex items-end gap-3 rounded-[5px] border border-[#39424f] bg-[#1a222d] p-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#aeb7c2]">Year</span>
          <Select onValueChange={(val) => setYear(Number(val))} value={String(year)}>
            <SelectTrigger className="h-9 w-[120px] rounded-[4px] border-[#50555D] bg-[#161c25] text-xs text-[#dde3ef]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-[#50555D] bg-[#1a2029] text-white">
              {getYearOptions().map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#aeb7c2]">Arc</span>
          <Select onValueChange={(val) => { setArcId(val); setChapterId('all'); }} value={arcId}>
            <SelectTrigger className="h-9 w-[160px] rounded-[4px] border-[#50555D] bg-[#161c25] text-xs text-[#dde3ef]">
              <SelectValue placeholder="All Arcs" />
            </SelectTrigger>
            <SelectContent className="border-[#50555D] bg-[#1a2029] text-white">
              <SelectItem value="all">All Arcs</SelectItem>
              {arcs.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#aeb7c2]">Chapter</span>
          <Select onValueChange={setChapterId} value={chapterId}>
            <SelectTrigger className="h-9 w-[200px] rounded-[4px] border-[#50555D] bg-[#161c25] text-xs text-[#dde3ef]">
              <SelectValue placeholder="All Chapters" />
            </SelectTrigger>
            <SelectContent className="border-[#50555D] bg-[#1a2029] text-white">
              <SelectItem value="all">All Chapters</SelectItem>
              {chapters.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <LoadingState message="Loading statistics..." variant="detail" />
        ) : error ? (
          <p className="rounded-[6px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
            {error}
          </p>
        ) : !hasData ? (
          <div className="flex h-[280px] flex-col items-center justify-center gap-3 rounded-[5px] border border-dashed border-[#303842] bg-[#1a222d]">
            <BarChart3 className="size-7 text-[#5b626d]" />
            <p className="text-xs font-bold text-[#8b94a1]">No data found for this selection.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
              {summaryKeys.map((key) => {
                const val = summary[key];
                const formattedValue = (key.toLowerCase().includes('average') || key.toLowerCase().includes('rating')) 
                  ? val.toFixed(1) 
                  : val.toLocaleString();
                
                return <KpiCard key={key} label={key} value={formattedValue} />;
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {summaryKeys.map((key, i) => (
                <StatisticsLineChart
                  key={key}
                  color={['#FFD369', '#60A5FA', '#34d399', '#f87171', '#a78bfa'][i % 5]}
                  data={months}
                  title={key}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

