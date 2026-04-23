import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Papa from 'papaparse';

type CsvSection = {
  title: string;
  rows: Record<string, string | number | boolean | null | undefined>[];
};

// small helper to keep file names safe
function makeSafeFileName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w-]/g, '');
}

// builds one csv string with multiple sections
function buildSectionedCsv(sections: CsvSection[]) {
  const parts: string[] = [];

  sections.forEach((section, index) => {
    parts.push(section.title);

    if (section.rows.length === 0) {
      parts.push('No data');
    } else {
      const csv = Papa.unparse(section.rows);
      parts.push(csv);
    }

    if (index < sections.length - 1) {
      parts.push('');
      parts.push('');
    }
  });

  return parts.join('\n');
}

// export csv with multiple sections
export async function exportTripDataToCsv(
  tripName: string,
  sections: CsvSection[]
) {
  const isAvailable = await Sharing.isAvailableAsync();

  if (!isAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  const safeTripName = makeSafeFileName(tripName || 'trip');
  const fileName = `${safeTripName}_trip_export.csv`;
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;

  const csvContent = buildSectionedCsv(sections);

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Trip CSV',
    UTI: 'public.comma-separated-values-text',
  });
}