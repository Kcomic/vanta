export type Unit = 'cm' | 'in';
export type SizeRow = { size: string; chestCm: number; lengthCm: number };

const CM_PER_INCH = 2.54;

export function toUnit(valueCm: number, unit: Unit): number {
  if (unit === 'cm') return Math.round(valueCm);
  return Math.round((valueCm / CM_PER_INCH) * 10) / 10;
}

export function formatMeasure(valueCm: number, unit: Unit): string {
  return `${toUnit(valueCm, unit)} ${unit}`;
}
