// /lib/exercises.ts
export const LIFT_EXERCISES = [
  'Incline Chest Press (Machine)',
  'Shoulder Press (Machine)',
  'Assisted Chest Dips',
  'Seated Rows (Machine)',
  'Assisted Pull-ups/Chin-ups',
  'Lat Pulldowns (Machine)',
  'Leg Press (Machine)',
  'Hamstring Curl (Machine)',
  'Calf Raises (Machine)',
  'Ab Work (Minor)',
] as const;

export type LiftExercise = typeof LIFT_EXERCISES[number];

export const RUN_TYPES = ['Easy', 'Tempo', 'MP', 'Recovery', 'Speed'] as const;
export type RunType = typeof RUN_TYPES[number];
