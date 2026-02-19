export function isNumberBetweenOrEqual({
  value,
  min,
  max,
}: {
  value: number;
  min: number;
  max: number;
}) {
  return value >= min && value <= max;
}
