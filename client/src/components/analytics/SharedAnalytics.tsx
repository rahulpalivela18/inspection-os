import { ChevronLeft, ChevronRight } from "lucide-react";

/* ── Severity / status palette ── */
export const SEVERITY_COLORS = {
  Major: "#dc2626",
  Minor: "#f59e0b",
  Cosmetic: "#3b82f6",
} as const;
export const STATUS_COLORS = {
  Open: "#dc2626",
  Resolved: "#16a34a",
  "In Progress": "#f59e0b",
} as const;

export type AreaSummaryItem = {
  area: string;
  major: number;
  minor: number;
  cosmetic: number;
  resolved: number;
  total: number;
};

export type AreaTotals = {
  major: number;
  minor: number;
  cosmetic: number;
  resolved: number;
  total: number;
};

export type SegmentItem = {
  label: string;
  count: number;
  color: string;
};

/* ── Stacked Bar (progress / resolution bars) ── */
export function StackedBar({
  segments,
  height = 14,
}: {
  segments: SegmentItem[];
  height?: number;
}) {
  const total = segments.reduce((s, d) => s + d.count, 0);
  if (total === 0) {
    return (
      <div className="w-full rounded-lg bg-slate-100" style={{ height }} />
    );
  }
  return (
    <div
      className="flex w-full gap-[3px] rounded-lg overflow-hidden bg-slate-100"
      style={{ height }}
    >
      {segments.map((seg) => {
        if (seg.count === 0) return null;
        const pct = (seg.count / total) * 100;
        return (
          <div
            key={seg.label}
            className="h-full"
            style={{ width: `${pct}%`, backgroundColor: seg.color }}
            title={`${seg.label}: ${seg.count}`}
          />
        );
      })}
    </div>
  );
}

/* ── Issue Breakdown Card ── */
export function IssueBreakdownCard({
  items,
  totalCount,
}: {
  items: SegmentItem[];
  totalCount: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <p className="text-[15px] font-bold text-slate-900 mb-2">
        Issue Breakdown
      </p>
      <div>
        {items.map((s) => {
          const p =
            totalCount > 0 ? (s.count / totalCount) * 100 : 0;
          return (
            <div
              key={s.label}
              className="grid grid-cols-[64px_1fr_auto] items-center gap-3.5 py-2.5"
            >
              <span className="text-[12.5px] font-semibold text-slate-600">
                {s.label}
              </span>
              <div className="h-2.5 bg-slate-100 rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all"
                  style={{
                    width: `${p}%`,
                    backgroundColor: s.color,
                  }}
                />
              </div>
              <span className="text-[13px] font-semibold text-slate-800 tabular-nums text-right">
                {s.count}
                <span className="text-xs font-normal text-slate-400 ml-1.5">
                  ({p.toFixed(1)}%)
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100">
        <span className="text-[12.5px] font-semibold text-slate-600">
          Total
        </span>
        <span className="text-[15px] font-extrabold text-slate-900 tabular-nums">
          {totalCount}
        </span>
      </div>
    </div>
  );
}

/* ── Resolution Status Card ── */
export function ResolutionStatusCard({
  segments,
  resolvedCount,
  totalCount,
}: {
  segments: SegmentItem[];
  resolvedCount: number;
  totalCount: number;
}) {
  const total = segments.reduce((s, d) => s + d.count, 0);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
      <p className="text-[15px] font-bold text-slate-900">
        Resolution Status
      </p>
      <div className="flex-1 flex flex-col justify-center gap-[18px] py-1.5">
        <div className="flex items-baseline gap-3">
          <div className="text-[42px] font-extrabold tracking-tight leading-none text-emerald-600 tabular-nums">
            {totalCount > 0
              ? ((resolvedCount / totalCount) * 100).toFixed(1)
              : "0.0"}
            <span className="text-[22px] font-bold">%</span>
          </div>
          <div className="text-[12.5px] font-medium text-slate-500">
            resolved &middot; {resolvedCount} of {totalCount} issues closed
          </div>
        </div>
        <StackedBar segments={segments} height={16} />
      </div>
      <div className="flex flex-wrap gap-x-7 gap-y-3">
        {segments.map((s) => {
          const p =
            total > 0
              ? ((s.count / total) * 100).toFixed(1)
              : "0.0";
          return (
            <div key={s.label} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </div>
              <span className="text-sm font-bold text-slate-800 tabular-nums pl-[18px]">
                {s.count}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  ({p}%)
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Area Summary Table ── */
const numCell = (v: number) =>
  v ? (
    <span className="text-slate-600">{v}</span>
  ) : (
    <span className="text-slate-300">&mdash;</span>
  );

export function AreaSummaryTable({
  areas,
  totals,
  totalCount,
  page,
  totalPages,
  safePage,
  onPageChange,
  emptyMessage = "No results match your filters.",
}: {
  areas: AreaSummaryItem[];
  totals: AreaTotals;
  totalCount: number;
  page: number;
  totalPages: number;
  safePage: number;
  onPageChange: (p: number) => void;
  emptyMessage?: string;
}) {
  const showTotal = areas.length > 1;
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-[10.5px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                Area
              </th>
              {[
                { label: "Major", color: SEVERITY_COLORS.Major },
                { label: "Minor", color: SEVERITY_COLORS.Minor },
                { label: "Cosmetic", color: SEVERITY_COLORS.Cosmetic },
                { label: "Resolved", color: STATUS_COLORS.Resolved },
              ].map((c) => (
                <th
                  key={c.label}
                  className="px-5 py-3 text-right text-[10.5px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1.5 justify-end">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.label}
                  </span>
                </th>
              ))}
              <th className="px-5 py-3 text-right text-[10.5px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                Total
              </th>
              <th className="px-6 py-3 text-left text-[10.5px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 min-w-[160px]">
                Progress
              </th>
            </tr>
          </thead>
          <tbody>
            {areas.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              areas.map((a) => {
                const p =
                  a.total > 0
                    ? Math.round((a.resolved / a.total) * 100)
                    : 0;
                return (
                  <tr
                    key={a.area}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-left font-semibold text-slate-800">
                      {a.area}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {numCell(a.major)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {numCell(a.minor)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {numCell(a.cosmetic)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {numCell(a.resolved)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                      {a.total}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${p}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 w-9 text-right">
                          {p}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {showTotal && (
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t border-slate-200">
                <td className="px-6 py-3.5 text-left text-slate-900">
                  Total
                </td>
                <td className="px-5 py-3.5 text-right text-slate-700">
                  {totals.major || (
                    <span className="text-slate-400">&mdash;</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right text-slate-700">
                  {totals.minor || (
                    <span className="text-slate-400">&mdash;</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right text-slate-700">
                  {totals.cosmetic || (
                    <span className="text-slate-400">&mdash;</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right text-slate-700">
                  {totals.resolved || (
                    <span className="text-slate-400">&mdash;</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right text-slate-900">
                  {totals.total}
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all"
                        style={{
                          width: `${
                            totals.total > 0
                              ? Math.round(
                                  (totals.resolved / totals.total) * 100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-9 text-right">
                      {totals.total > 0
                        ? Math.round(
                            (totals.resolved / totals.total) * 100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {totalPages > 0 && (
        <div className="flex items-center justify-end gap-3 px-5 py-3.5 text-[12.5px] text-slate-500">
          <span>
            {totalCount === 0
              ? "No areas"
              : `Showing ${
                  (safePage - 1) * 8 + 1
                } to ${Math.min(safePage * 8, totalCount)} of ${
                  totalCount
                } areas`}
          </span>
          <div className="flex gap-1.5">
            <button
              disabled={safePage <= 1}
              onClick={() => onPageChange(Math.max(1, safePage - 1))}
              className="w-[30px] h-[30px] grid place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-default"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={safePage >= totalPages}
              onClick={() =>
                onPageChange(Math.min(totalPages, safePage + 1))
              }
              className="w-[30px] h-[30px] grid place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-default"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Defects Table — one row per issue (hotspot) matching the active filters ──
   Replaces the old "area-wise" count table. Each row is a single defect with
   the capture context, severity and status, so filtered = exactly the issues
   the user is looking for. Row click jumps into the capture with that pin. ── */
const SEV_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  Major: { bg: "#fee2e2", text: "#991b1b", dot: "#dc2626" },
  Minor: { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  Cosmetic: { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6" },
  Info: { bg: "#f1f5f9", text: "#475569", dot: "#64748b" },
};
const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  Open: { bg: "#fee2e2", text: "#991b1b" },
  "In Progress": { bg: "#ffedd5", text: "#9a3412" },
  Resolved: { bg: "#dcfce7", text: "#166534" },
};

export type DefectRow = {
  capture: any;
  hotspot: any;
  visitTitle?: string;
};

export function DefectsTable({
  rows,
  totalCount,
  page,
  totalPages,
  onPageChange,
  onOpenRow,
  emptyMessage = "No issues match your filters.",
}: {
  rows: DefectRow[];
  totalCount: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onOpenRow: (row: DefectRow) => void;
  emptyMessage?: string;
}) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-[10.5px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                Capture
              </th>
              <th className="px-4 py-3 text-left text-[10.5px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                Block / Floor / Flat
              </th>
              <th className="px-4 py-3 text-left text-[10.5px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                Issue
              </th>
              <th className="px-4 py-3 text-right text-[10.5px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">
                Severity
              </th>
              <th className="px-4 py-3 text-right text-[10.5px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const sev = SEV_BADGE[r.hotspot.issueSeverity ?? "Info"] ?? SEV_BADGE.Info;
                const st = STATUS_BADGE[r.hotspot.issueStatus ?? "Open"] ?? STATUS_BADGE.Open;
                const issueTitle =
                  r.hotspot.issueTitle || r.hotspot.label || "Untitled issue";
                const notes = r.hotspot.notes || r.hotspot.label;
                return (
                  <tr
                    key={`${r.capture.id}:${r.hotspot.id}`}
                    onClick={() => onOpenRow(r)}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={r.capture.thumbnailUrl || r.capture.imageUrl}
                          alt={r.capture.title}
                          className="h-10 w-14 rounded-md object-cover bg-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">
                            {r.capture.title}
                          </p>
                          {r.visitTitle && (
                            <p className="text-[11.5px] text-slate-400 truncate">
                              {r.visitTitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(["block", "floor", "flat"] as const).map((cat) => {
                          const t = (r.capture.tags ?? []).find(
                            (x: any) => x.category === cat
                          );
                          return t ? (
                            <span
                              key={cat}
                              className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                            >
                              {t.value}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{issueTitle}</p>
                      {notes !== issueTitle && (
                        <p className="text-[12px] text-slate-400 truncate max-w-[260px]">
                          {notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: sev.bg, color: sev.text }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: sev.dot }}
                        />
                        {r.hotspot.issueSeverity ?? "Info"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: st.bg, color: st.text }}
                      >
                        {r.hotspot.issueStatus ?? "Open"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 px-5 py-3.5 text-[12.5px] text-slate-500">
          <span>
            {totalCount === 0
              ? "No issues"
              : `Showing ${(page - 1) * 8 + 1} to ${Math.min(
                  page * 8,
                  totalCount
                )} of ${totalCount} issues`}
          </span>
          <div className="flex gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className="w-[30px] h-[30px] grid place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-default"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              className="w-[30px] h-[30px] grid place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-default"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
