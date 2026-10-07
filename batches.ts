/**
 * Batches offered when a volunteer registers (value = 2-digit joining year).
 * Next year, add { value: '26', label: '2026 batch (1st year)' } and drop the oldest.
 */
export const BATCH_OPTIONS: { value: string; label: string }[] = [
  { value: '24', label: '2024 batch (2nd year)' },
  { value: '25', label: '2025 batch (1st year)' },
];
