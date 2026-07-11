import Papa from 'papaparse';

export type StatRow = {
  Month: number;
  Year: number;
  [key: string]: number;
};

export type ProjectMetrics = {
  chapters: {
    [chapterId: string]: StatRow[];
  };
};

export function parseCsvStats(file: File): Promise<StatRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        // Validate required columns
        const data = results.data as any[];
        if (data.length > 0) {
          const firstRow = data[0];
          if (!('Month' in firstRow) || !('Year' in firstRow)) {
            reject(new Error('CSV must contain "Month" and "Year" columns.'));
            return;
          }
        }
        resolve(data as StatRow[]);
      },
      error: (error) => reject(error),
    });
  });
}

export function mergeProjectStats(
  existingMetrics: ProjectMetrics | unknown,
  chapterId: string,
  parsedData: StatRow[]
): ProjectMetrics {
  const metrics: ProjectMetrics =
    existingMetrics && typeof existingMetrics === 'object' && 'chapters' in existingMetrics
      ? (existingMetrics as ProjectMetrics)
      : { chapters: {} };

  // Overwrite the chapter's data
  metrics.chapters[chapterId] = parsedData;

  return metrics;
}

export function aggregateStats(
  metrics: ProjectMetrics | unknown,
  filters: { year?: number; arcId?: string; chapterId?: string },
  folders: any[] // Folders array to resolve Arc -> Chapters relationship
) {
  if (!metrics || typeof metrics !== 'object' || !('chapters' in metrics)) {
    return { summary: {}, months: [] };
  }

  const { chapters } = metrics as ProjectMetrics;

  // Determine the year to use if not provided
  let targetYear = filters.year;
  if (!targetYear) {
    let maxYear = 0;
    for (const rows of Object.values(chapters)) {
      for (const row of rows) {
        if (row.Year > maxYear) maxYear = row.Year;
      }
    }
    targetYear = maxYear > 0 ? maxYear : new Date().getFullYear();
  }

  // Determine which chapters to include based on filters
  let targetChapterIds: string[] = [];

  if (filters.chapterId) {
    targetChapterIds = [filters.chapterId];
  } else if (filters.arcId) {
    // Find all chapters under the arcId
    const arcFolders = folders.filter((f) => String(f.parentId) === String(filters.arcId));
    targetChapterIds = arcFolders.map((f) => String(f.id));
  } else {
    // Include all chapters
    targetChapterIds = Object.keys(chapters);
  }

  // Aggregate by month for the target year
  const monthlyAggregations: { [month: number]: { [key: string]: number } } = {};
  const monthCounts: { [month: number]: { [key: string]: number } } = {};

  for (const chapterId of targetChapterIds) {
    const rows = chapters[chapterId] || [];
    for (const row of rows) {
      if (row.Year === targetYear) {
        const month = row.Month;
        if (!monthlyAggregations[month]) {
          monthlyAggregations[month] = {};
          monthCounts[month] = {};
        }
        for (const key of Object.keys(row)) {
          if (key === 'Month' || key === 'Year') continue;
          
          if (!monthlyAggregations[month][key]) {
            monthlyAggregations[month][key] = 0;
            monthCounts[month][key] = 0;
          }
          
          monthlyAggregations[month][key] += row[key];
          monthCounts[month][key] += 1;
        }
      }
    }
  }

  // Calculate averages if necessary (simple heuristic: if column name contains "Average" or "Rating")
  for (const month of Object.keys(monthlyAggregations)) {
    const m = Number(month);
    for (const key of Object.keys(monthlyAggregations[m])) {
      if (key.toLowerCase().includes('average') || key.toLowerCase().includes('rating')) {
        monthlyAggregations[m][key] = monthlyAggregations[m][key] / monthCounts[m][key];
      }
    }
  }

  // Generate months array
  const months = [];
  for (let m = 1; m <= 12; m++) {
    if (monthlyAggregations[m]) {
      months.push({ Month: m, Year: targetYear, ...monthlyAggregations[m] });
    } else {
      months.push({ Month: m, Year: targetYear }); // Empty month
    }
  }

  // Compute summary (total for the year)
  const summary: { [key: string]: number } = {};
  const summaryCounts: { [key: string]: number } = {};

  for (const row of months) {
    for (const key of Object.keys(row)) {
      if (key === 'Month' || key === 'Year') continue;
      if (!summary[key]) {
        summary[key] = 0;
        summaryCounts[key] = 0;
      }
      if (row[key as keyof typeof row] !== undefined) {
          summary[key] += row[key as keyof typeof row] as number;
          summaryCounts[key] += 1;
      }
    }
  }

  for (const key of Object.keys(summary)) {
    if (summaryCounts[key] > 0 && (key.toLowerCase().includes('average') || key.toLowerCase().includes('rating'))) {
      summary[key] = summary[key] / summaryCounts[key];
    }
  }

  return { summary, months };
}
