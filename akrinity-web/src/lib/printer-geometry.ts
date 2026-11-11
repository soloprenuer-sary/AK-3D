/** Geometry for the flat printer illustration (640 x 560 viewBox). Pure functions, no DOM. */
export const N = 30; // layers in the printed vase
export const LH = 6.4; // layer height in viewBox units
export const BED = 430; // y of the bed surface
export const CX = 320; // centre x
const T = 0.5; // seconds per layer in the looping demo
const HOLD = 2.4; // seconds the finished part is shown before the loop restarts

export type Mode = 'hero' | 'loop';

export interface LayerRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PrinterState {
  layers: LayerRect[];
  headX: number;
  headY: number;
  complete: boolean;
  /** 1-based number of the layer being printed (N when complete). */
  layer: number;
  /** Fraction of the whole part that is printed, 0 to 1. */
  fraction: number;
}

/** Half-width of the vase at height t (0 bottom, 1 top). */
export function prof(t: number): number {
  let r = 44 + 30 * Math.sin(Math.PI * Math.pow(t, 0.8));
  if (t > 0.8) r += (t - 0.8) * 70;
  if (t < 0.08) r -= (0.08 - t) * 120;
  return r;
}

/** Layers printed at a given time in the looping demo (0 to N). */
export function loopProgress(clock: number): number {
  const period = N * T + HOLD;
  const phase = clock % period;
  return phase >= N * T ? N : phase / T;
}

/** State of the printer when `progress` layers (0 to N, fractional) are printed. */
export function printerState(progress: number, clock: number, mode: Mode): PrinterState {
  const complete = progress >= N;
  const done = complete ? N : Math.floor(progress);
  const frac = complete ? 0 : progress - done;
  let headX = CX;
  let headY = 218;
  const layers: LayerRect[] = [];

  for (let i = 0; i < N; i++) {
    const w = prof(i / (N - 1));
    let x = CX;
    let width = 0;
    if (i < done) {
      x = CX - w;
      width = 2 * w;
    } else if (i === done && !complete) {
      width = 2 * w * frac;
      x = i % 2 === 0 ? CX - w : CX + w - width;
      headX = i % 2 === 0 ? CX - w + width : CX + w - width;
      headY = BED - (i + 0.5) * LH;
    }
    layers.push({ x, y: BED - (i + 1) * LH + 1, width, height: LH - 1.2 });
  }

  if (mode === 'hero' && !complete) headX += Math.sin(clock * 1.7) * 1.2;

  return {
    layers,
    headX,
    headY,
    complete,
    layer: Math.min(done + 1, N),
    fraction: Math.min(1, progress / N),
  };
}
