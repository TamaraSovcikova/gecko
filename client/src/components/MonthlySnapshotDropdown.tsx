import { useMemo } from "react";

type Props = {
  snapshots: any[];
  snapshotIndex: number | null;
  setSnapshotIndex: (i: number | null) => void;
};

export default function SnapshotMonthDropdown({
  snapshots,
  snapshotIndex,
  setSnapshotIndex,
}: Props) {
  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort((a, b) => {
      if (a.year === b.year) return b.month - a.month;
      return b.year - a.year;
    });
  }, [snapshots]);

  const formatMonth = (month: number, year: number) => {
    const date = new Date(year, month - 1);
    return date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <label style={{ fontWeight: 600, marginRight: "10px" }}>
        Select Snapshot:
      </label>

      <select
        value={snapshotIndex ?? "live"}
        onChange={(e) => {
          const val = e.target.value;

          if (val === "live") {
            setSnapshotIndex(null);
          } else {
            setSnapshotIndex(Number(val));
          }
        }}
        style={{
          padding: "8px 12px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      >
        <option value="live">Live (Current Month)</option>

        {sortedSnapshots.map((snap, idx) => (
          <option key={snap._id} value={idx}>
            {formatMonth(snap.month, snap.year)}
          </option>
        ))}
      </select>
    </div>
  );
}