/** Unidades estándar (mismo catálogo que MeasurementUnitService::DEFAULT_NAMES). */
export const DEFAULT_MEASUREMENT_UNITS = [
  'Unidad',
  'Arroba',
  'Bulto',
  'Galón',
  'Libra',
  'Kilogramo',
  'Caja',
  'Paquete',
  'Bolsa',
  'Litro',
  'Metro',
  'Docena',
] as const

export type MeasurementUnitName = (typeof DEFAULT_MEASUREMENT_UNITS)[number]

export function defaultMeasurementUnit(): MeasurementUnitName {
  return 'Unidad'
}

export function normalizeProductUnit(value?: string | null): MeasurementUnitName {
  if (!value) {
    return defaultMeasurementUnit()
  }

  const match = DEFAULT_MEASUREMENT_UNITS.find(
    (unit) => unit.toLowerCase() === value.toLowerCase(),
  )

  return match ?? defaultMeasurementUnit()
}
