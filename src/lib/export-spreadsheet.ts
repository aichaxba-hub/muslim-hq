type ExportRow = Record<string, unknown>;

export type ExportBundle = {
  app?: string;
  exported_at?: string;
  user_id?: string;
  profile?: ExportRow | null;
  [section: string]: string | ExportRow | ExportRow[] | null | undefined;
};

const LABELS: Record<string, string> = {
  worship_logs: "Salah", qada_prayers: "Qada", quran_logs: "Quran",
  fasting_logs: "Fasting", dhikr_logs: "Dhikr", duas: "Duas",
  answered_duas: "Answered Duas", reflections: "Reflections", goals: "Goals",
  zakat_payments: "Zakat Payments", zakat_entries: "Zakat Entries",
  sadaqah_logs: "Giving", quran_study_goals: "Quran Study",
};

function sections(data: ExportBundle) {
  return Object.entries(data)
    .filter(([key, value]) => key === "profile" || Array.isArray(value))
    .map(([key, value]) => ({
      name: key === "profile" ? "Profile" : LABELS[key] ?? key,
      rows: (key === "profile" ? (value ? [value] : []) : value) as ExportRow[],
    }));
}

function cell(value: unknown): string | number | boolean {
  if (value == null) return "";
  if (typeof value === "number" || typeof value === "boolean") return value;
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return /^[\s\uFEFF]*[=+@-]/u.test(text) ? `'${text}` : text;
}

function csvCell(value: string | number | boolean) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function download(blob: Blob, extension: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `muslim-hq-export-${new Date().toISOString().slice(0, 10)}.${extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadExport(data: ExportBundle, format: "json" | "csv" | "xlsx") {
  if (format === "json") {
    download(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), "json");
    return;
  }

  const groups = sections(data);
  if (format === "csv") {
    const fields = Array.from(new Set(groups.flatMap(({ rows }) => rows.flatMap((row) => Object.keys(row)))));
    const lines = [
      ["Section", ...fields].map(csvCell).join(","),
      ...groups.flatMap(({ name, rows }) => rows.map((row) =>
        [name, ...fields.map((field) => cell(row[field]))].map(csvCell).join(",")
      )),
    ];
    download(new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" }), "csv");
    return;
  }

  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Muslim HQ";
  const overview = workbook.addWorksheet("About");
  overview.addRows([["Muslim HQ data export", ""], ["Exported at", data.exported_at ?? ""], ["Account ID", data.user_id ?? ""]]);
  overview.getColumn(1).width = 25;
  overview.getColumn(2).width = 40;

  for (const { name, rows } of groups) {
    const sheet = workbook.addWorksheet(name);
    const fields = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
    if (fields.length === 0) {
      sheet.addRow(["No records"]);
      continue;
    }
    sheet.addRow(fields);
    for (const row of rows) sheet.addRow(fields.map((field) => cell(row[field])));
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, rows.length + 1), column: fields.length } };
    fields.forEach((field, index) => {
      sheet.getColumn(index + 1).width = Math.min(48, Math.max(16, field.length + 3));
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  download(new Blob([buffer as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "xlsx");
}