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
    <div className="space-y-2">
      {showNotStraightened ? (
        <p
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
          role="status"
        >
          Artwork has not been straightened yet. Mark corners and run straighten for
          accurate proportions.
        </p>
      ) : null}
      {showMissingCalibration ? (
        <p
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
          role="status"
        >
          Corner frame sample is missing calibration. Mark inner/outer corners and
          rail strips for accurate frame rendering.
        </p>
      ) : null}
    </div>
  );
}
