"use client";

interface FramingWarningsProps {
  showNotStraightened: boolean;
  showMissingCalibration: boolean;
}

export function FramingWarnings({
  showNotStraightened,
  showMissingCalibration,
}: FramingWarningsProps) {
  if (!showNotStraightened && !showMissingCalibration) {
    return null;
  }

  return (
    <div className="space-y-2 px-4 pt-3">
      {showNotStraightened ? (
        <p
          className="rounded-lg border border-fs-warning/25 bg-fs-warning-bg px-3 py-2 text-xs text-fs-warning"
          role="status"
        >
          Artwork has not been straightened yet. Mark corners and run straighten for
          accurate proportions.
        </p>
      ) : null}
      {showMissingCalibration ? (
        <p
          className="rounded-lg border border-fs-warning/25 bg-fs-warning-bg px-3 py-2 text-xs text-fs-warning"
          role="status"
        >
          Corner frame sample is missing calibration. Mark inner/outer corners and
          rail strips for accurate frame rendering.
        </p>
      ) : null}
    </div>
  );
}
