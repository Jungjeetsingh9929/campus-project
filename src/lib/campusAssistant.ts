import { complaints, campusBuildings, findBuilding, findComplaint } from '../data/campus';
import { getRoutePlan } from './navigation';

function freeClassroomsText() {
  const freeRooms = campusBuildings
    .flatMap((building) => building.classrooms.map((room) => ({ room, building })))
    .filter(({ room }) => room.availability === 'Available')
    .slice(0, 3);

  if (!freeRooms.length) {
    return 'All visible rooms are currently occupied or reserved.';
  }

  return `Free classrooms: ${freeRooms
    .map(({ room, building }) => `${room.roomNumber} in ${building.block}`)
    .join(', ')}.`;
}

export function answerCampusQuestion(query: string): string {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return 'Ask me about classrooms, complaints, navigation, Wi-Fi, energy, or emergency routing.';
  }

  if (normalized.includes('nearest free classroom')) {
    return `${freeClassroomsText()} Recommended choice: A-203 in Block A.`;
  }

  if (normalized.includes('take me to library') || normalized.includes('library')) {
    const route = getRoutePlan('block-b', 'block-c', 'Shortest path');
    return `To reach the library, walk ${route.distanceMeters} meters via the central avenue and expect about ${route.durationMinutes} minutes. ${route.steps.join(' ')}`;
  }

  if (normalized.includes('most electricity')) {
    const worst = campusBuildings.reduce((max, building) => (building.energyScore > max.energyScore ? building : max), campusBuildings[0]);
    return `${worst.name} currently consumes the most energy with an energy score of ${worst.energyScore}.`;
  }

  if (normalized.includes('unresolved complaints') || normalized.includes('open complaints')) {
    const unresolved = complaints.filter((item) => item.status !== 'Resolved');
    return `${unresolved.length} complaints are still active. Top items: ${unresolved
      .slice(0, 3)
      .map((item) => `${item.title} (${item.status})`)
      .join('; ')}.`;
  }

  if (normalized.includes('nearest washroom')) {
    return 'The nearest washroom is beside Block E on the ground-floor concourse and currently has low waiting time.';
  }

  if (normalized.includes('navigate to block c')) {
    const route = getRoutePlan('block-a', 'block-c', 'Accessible route');
    return `Accessible route to Block C: ${route.steps.join(' ')}`;
  }

  if (normalized.includes('wi-fi outage') || normalized.includes('wifi outage')) {
    return 'Wi-Fi health is weakest in Block C and Block F. IT services should prioritize AP-C1 and AP-F1.';
  }

  if (normalized.includes('complaint') && normalized.includes('room')) {
    const complaint = findComplaint('cmp-1001');
    return complaint ? `Selected complaint: ${complaint.title}. Status: ${complaint.status}.` : 'No complaint found.';
  }

  if (normalized.includes('building')) {
    const building = findBuilding('block-a');
    return building ? `${building.name} includes ${building.classrooms.length} monitored classrooms and a current occupancy of ${building.occupancy}%.` : 'No matching building found.';
  }

  return `I found ${complaints.length} complaints, ${campusBuildings.length} major buildings, and live routes across the campus. Try asking for a classroom, complaint, navigation path, or an energy insight.`;
}
