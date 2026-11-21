// Easing curves for the animated sidebar

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

export const SPRING_LAYOUT = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

export const SPRING_PRESS = {
  type: "spring" as const,
  stiffness: 500,
  damping: 30,
  mass: 0.5,
};
