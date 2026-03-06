/**
 * Rental Power-Decay Curve formula (frontend mirror of RentalEngineService.php)
 *
 * Multiplier = (d^exponentCurve × decayFactor(d)) + durationOffset
 * decayFactor(d) = 1 - (ln(d) / ln(maxDurationReference)) × decayStrength
 *
 * Caso speciale: d=1 → 1.0
 * Floor stagionale: d > maxPeriodCapDays → max(Mult(cap), formula(d))
 *
 * Valori calibrati di default:
 *   7gg≈3.39× | 30gg≈7.78× | 90gg≈14.49×
 */

export interface RentalCurveParams {
  exponentCurve: number;
  decayStrength: number;
  maxDurationReference: number;
  durationOffset: number;
  maxPeriodCapDays: number;
}

export const DEFAULT_RENTAL_PARAMS: RentalCurveParams = {
  exponentCurve: 0.69,
  decayStrength: 0.27,
  maxDurationReference: 30,
  durationOffset: 0.15,
  maxPeriodCapDays: 90,
};

function calculateRaw(
  duration: number,
  params: RentalCurveParams,
): number {
  const decayFactor =
    1 - (Math.log(duration) / Math.log(params.maxDurationReference)) * params.decayStrength;
  return Math.pow(duration, params.exponentCurve) * decayFactor + params.durationOffset;
}

export function calculateDurationMultiplier(
  duration: number,
  params: RentalCurveParams = DEFAULT_RENTAL_PARAMS,
): number {
  if (duration <= 0) return 0;
  if (duration === 1) return 1.0;

  const capMultiplier = calculateRaw(params.maxPeriodCapDays, params);
  const raw = calculateRaw(duration, params);

  if (duration > params.maxPeriodCapDays) {
    return Math.max(capMultiplier, raw);
  }

  return raw;
}
