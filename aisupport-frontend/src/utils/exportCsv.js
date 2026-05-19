export const toCsv = (rows) => {
  if (!rows?.length) return '';
  const fields = Object.keys(rows[0]);
  const escape = (value) => `"${String(Array.isArray(value) ? value.join('|') : value ?? '').replace(/"/g, '""')}"`;
  return [
    fields.join(','),
    ...rows.map((row) => fields.map((field) => escape(row[field])).join(',')),
  ].join('\n');
};

export const downloadCsv = (rows, filename = 'demo-export.csv') => {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
