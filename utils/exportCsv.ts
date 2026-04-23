import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Papa from 'papaparse';

type ExportActivity = {
  id: number;
  title: string;
  date: string;
  category: string;
  metricValue: number;
  metricUnit: string;
  status: string;
  notes: string;
};

function formatDisplayDate(value: string) {
  const parts = value.split('-');

  if (parts[0]?.length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return value;
}

export async function exportTripActivitiesToCsv(
  tripName: string,
  activities: ExportActivity[]
) {
  const rows = activities.map((activity) => ({
    ID: activity.id,
    Title: activity.title,
    Date: formatDisplayDate(activity.date),
    Category: activity.category,
    Value: activity.metricValue,
    Unit: activity.metricUnit,
    Status: activity.status,
    Notes: activity.notes,
  }));

  const csv = Papa.unparse(rows);

  const safeTripName = tripName
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();

  const fileUri =
    FileSystem.documentDirectory +
    `${safeTripName}_activities.csv`;

  await FileSystem.writeAsStringAsync(fileUri, csv);

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export CSV',
    UTI: 'public.comma-separated-values-text',
  });
}