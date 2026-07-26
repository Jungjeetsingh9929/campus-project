import { campusBuildings } from '../data/campus';

export type RouteMode = 'Shortest path' | 'Accessible route' | 'Emergency route';

export type RoutePlan = {
  mode: RouteMode;
  title: string;
  distanceMeters: number;
  durationMinutes: number;
  steps: string[];
};

export function getRoutePlan(fromId: string, toId: string, mode: RouteMode): RoutePlan {
  const from = campusBuildings.find((building) => building.id === fromId) ?? campusBuildings[0];
  const to = campusBuildings.find((building) => building.id === toId) ?? campusBuildings[2];
  const baseDistance = Math.round(Math.hypot(from.x - to.x, from.z - to.z) * 42 + 110);
  const modeMultiplier =
    mode === 'Accessible route' ? 1.15 : mode === 'Emergency route' ? 0.88 : 1;

  const distanceMeters = Math.round(baseDistance * modeMultiplier);
  const durationMinutes = Math.max(2, Math.round(distanceMeters / (mode === 'Emergency route' ? 95 : 70)));

  const stepsByMode: Record<RouteMode, string[]> = {
    'Shortest path': [
      `Exit ${from.block} from the north gate.`,
      'Follow the central avenue past the courtyard.',
      `Turn right at the fountain and arrive at ${to.block}.`,
    ],
    'Accessible route': [
      `Use the ramp beside ${from.block}.`,
      'Stay on the level walkway with tactile guidance tiles.',
      `Take the elevator in ${to.block} to the target floor.`,
    ],
    'Emergency route': [
      `Move to the nearest emergency exit in ${from.block}.`,
      'Follow illuminated evacuation markers to the assembly point.',
      `Proceed to the safe zone outside ${to.block}.`,
    ],
  };

  return {
    mode,
    title: `${from.block} to ${to.block}`,
    distanceMeters,
    durationMinutes,
    steps: stepsByMode[mode],
  };
}

export function speakDirections(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return true;
}
