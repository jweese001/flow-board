/**
 * Animation Engine - Transform Interpolation
 *
 * Provides keyframe-based animation with easing functions.
 */

import type { Keyframe, KeyframeTransforms, EasingType } from '@/types/nodes';

// Easing functions
const easingFunctions: Record<EasingType, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  spring: (t) => {
    // Spring easing with slight overshoot
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

/**
 * Apply easing function to a normalized time value (0-1)
 */
export function applyEasing(t: number, easing: EasingType): number {
  const fn = easingFunctions[easing] || easingFunctions.linear;
  return fn(Math.max(0, Math.min(1, t)));
}

/**
 * Interpolate a single numeric value
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolate between two transform states
 */
function lerpTransforms(
  from: KeyframeTransforms,
  to: KeyframeTransforms,
  t: number
): KeyframeTransforms {
  return {
    scale: lerp(from?.scale ?? 1, to?.scale ?? 1, t),
    offsetX: lerp(from?.offsetX ?? 0, to?.offsetX ?? 0, t),
    offsetY: lerp(from?.offsetY ?? 0, to?.offsetY ?? 0, t),
    rotation: lerpRotation(from?.rotation ?? 0, to?.rotation ?? 0, t),
    opacity: lerp(from?.opacity ?? 100, to?.opacity ?? 100, t),
  };
}

/**
 * Interpolate rotation, handling the 360° wrap-around correctly
 */
function lerpRotation(from: number, to: number, t: number): number {
  // Normalize angles to 0-360
  from = ((from % 360) + 360) % 360;
  to = ((to % 360) + 360) % 360;

  // Take the shortest path
  let delta = to - from;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;

  return ((from + delta * t) % 360 + 360) % 360;
}

/**
 * Find the two keyframes surrounding a given time
 */
function findSurroundingKeyframes(
  keyframes: Keyframe[],
  time: number
): { before: Keyframe | null; after: Keyframe | null } {
  if (keyframes.length === 0) {
    return { before: null, after: null };
  }

  // Sort by time
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Find before and after
  let before: Keyframe | null = null;
  let after: Keyframe | null = null;

  for (const kf of sorted) {
    if (kf.time <= time) {
      before = kf;
    }
    if (kf.time >= time && !after) {
      after = kf;
      break;
    }
  }

  // Handle edge cases
  if (!before) before = sorted[0];
  if (!after) after = sorted[sorted.length - 1];

  return { before, after };
}

/**
 * Default transform values (no transformation)
 */
export const DEFAULT_TRANSFORMS: KeyframeTransforms = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  opacity: 100,
};

/**
 * Interpolate transforms at a given time using keyframes
 */
export function interpolateTransforms(
  keyframes: Keyframe[],
  time: number,
  defaultEasing: EasingType = 'ease-in-out'
): KeyframeTransforms {
  if (!keyframes || keyframes.length === 0) {
    return { ...DEFAULT_TRANSFORMS };
  }

  if (keyframes.length === 1) {
    const transforms = keyframes[0]?.transforms;
    if (!transforms) return { ...DEFAULT_TRANSFORMS };
    return { ...DEFAULT_TRANSFORMS, ...transforms };
  }

  const { before, after } = findSurroundingKeyframes(keyframes, time);

  if (!before || !after) {
    return { ...DEFAULT_TRANSFORMS };
  }

  // Ensure transforms exist
  const beforeTransforms = before.transforms || DEFAULT_TRANSFORMS;
  const afterTransforms = after.transforms || DEFAULT_TRANSFORMS;

  // Same keyframe or time before first/after last
  if (before === after || before.time === after.time) {
    return { ...DEFAULT_TRANSFORMS, ...beforeTransforms };
  }

  // Calculate normalized time between keyframes
  const t = (time - before.time) / (after.time - before.time);

  // Use the after keyframe's easing, or default
  const easing = after.easing || defaultEasing;
  const easedT = applyEasing(t, easing);

  return lerpTransforms(beforeTransforms, afterTransforms, easedT);
}

/**
 * Generate all frames for an animation
 */
export function generateFrameTransforms(
  keyframes: Keyframe[],
  fps: number,
  duration: number,
  defaultEasing: EasingType = 'ease-in-out'
): KeyframeTransforms[] {
  const frameCount = Math.ceil(fps * duration);
  const frames: KeyframeTransforms[] = [];

  for (let i = 0; i < frameCount; i++) {
    const time = (i / fps);
    frames.push(interpolateTransforms(keyframes, time, defaultEasing));
  }

  return frames;
}

/**
 * Calculate the frame number for a given time
 */
export function timeToFrame(time: number, fps: number): number {
  return Math.floor(time * fps);
}

/**
 * Calculate the time for a given frame number
 */
export function frameToTime(frame: number, fps: number): number {
  return frame / fps;
}

/**
 * Get the total frame count for an animation
 */
export function getTotalFrames(duration: number, fps: number): number {
  return Math.ceil(duration * fps);
}

/**
 * Clamp time to valid range
 */
export function clampTime(time: number, duration: number, loop: boolean): number {
  if (loop) {
    return ((time % duration) + duration) % duration;
  }
  return Math.max(0, Math.min(time, duration));
}

/**
 * Check if animation has any keyframes
 */
export function hasAnimation(keyframes: Keyframe[]): boolean {
  return keyframes.length >= 2;
}

/**
 * Get transform at exact keyframe time (no interpolation)
 */
export function getKeyframeAtTime(
  keyframes: Keyframe[],
  time: number,
  tolerance: number = 0.05
): Keyframe | null {
  return keyframes.find((kf) => Math.abs(kf.time - time) < tolerance) || null;
}
