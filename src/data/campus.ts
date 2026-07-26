import {
  AnalyticsPoint,
  CampusBuilding,
  Complaint,
  EnergySnapshot,
  NotificationItem,
  SearchResult,
  WifiAccessPoint,
} from '../types';

export const complaintCategories = [
  'Electrical',
  'Water',
  'Internet',
  'Furniture',
  'Cleaning',
  'Hostel',
  'Library',
  'Laboratory',
] as const;

export const campusBuildings: CampusBuilding[] = [
  {
    id: 'block-a',
    name: 'Academic Block A',
    block: 'Block A',
    department: 'Computer Science',
    purpose: 'Lecture halls and labs',
    floors: 4,
    x: -10,
    z: -6,
    size: [5.2, 4.2, 4.2],
    color: '#2b7de9',
    occupancy: 68,
    capacity: 180,
    wifiHealth: 'Online',
    energyScore: 72,
    metadata: {
      currentLecture: 'Data Structures',
      nextLecture: 'AI Systems',
      acStatus: 'On',
      projectorStatus: 'On',
      availability: 'Reserved',
    },
    classrooms: [
      {
        id: 'a-101',
        buildingId: 'block-a',
        roomNumber: 'A-101',
        department: 'Computer Science',
        capacity: 60,
        currentLecture: 'Data Structures',
        nextLecture: 'Machine Learning',
        occupancy: 54,
        availability: 'Occupied',
        projectorStatus: 'On',
        acStatus: 'On',
      },
      {
        id: 'a-203',
        buildingId: 'block-a',
        roomNumber: 'A-203',
        department: 'Computer Science',
        capacity: 48,
        currentLecture: 'Compiler Design',
        nextLecture: 'AI Systems',
        occupancy: 18,
        availability: 'Available',
        projectorStatus: 'Off',
        acStatus: 'On',
      },
    ],
  },
  {
    id: 'block-b',
    name: 'Administration Block',
    block: 'Block B',
    department: 'Administration',
    purpose: 'Admissions and governance',
    floors: 5,
    x: 0,
    z: -6,
    size: [4.5, 5.5, 4.5],
    color: '#184e77',
    occupancy: 49,
    capacity: 120,
    wifiHealth: 'Weak Signal',
    energyScore: 58,
    metadata: {
      currentLecture: 'Board Review',
      nextLecture: 'Budget Meeting',
      acStatus: 'On',
      projectorStatus: 'On',
      availability: 'Occupied',
    },
    classrooms: [
      {
        id: 'b-501',
        buildingId: 'block-b',
        roomNumber: 'B-501',
        department: 'Administration',
        capacity: 24,
        currentLecture: 'Board Review',
        nextLecture: 'Budget Meeting',
        occupancy: 24,
        availability: 'Occupied',
        projectorStatus: 'On',
        acStatus: 'On',
      },
    ],
  },
  {
    id: 'block-c',
    name: 'Library & Knowledge Hub',
    block: 'Block C',
    department: 'Library',
    purpose: 'Study, research and collaboration',
    floors: 3,
    x: 10,
    z: -6,
    size: [4.8, 3.8, 4.8],
    color: '#0b8f8f',
    occupancy: 86,
    capacity: 220,
    wifiHealth: 'Online',
    energyScore: 64,
    metadata: {
      currentLecture: 'Study Hall',
      nextLecture: 'Research Clinic',
      acStatus: 'On',
      projectorStatus: 'Off',
      availability: 'Occupied',
    },
    classrooms: [
      {
        id: 'c-studio',
        buildingId: 'block-c',
        roomNumber: 'C-Studio',
        department: 'Library',
        capacity: 80,
        currentLecture: 'Study Hall',
        nextLecture: 'Research Clinic',
        occupancy: 77,
        availability: 'Occupied',
        projectorStatus: 'Off',
        acStatus: 'On',
      },
    ],
  },
  {
    id: 'block-d',
    name: 'Engineering Lab Complex',
    block: 'Block D',
    department: 'Electrical Engineering',
    purpose: 'Laboratories and prototyping',
    floors: 4,
    x: -10,
    z: 6,
    size: [5.4, 4.9, 4.1],
    color: '#f97316',
    occupancy: 74,
    capacity: 200,
    wifiHealth: 'Online',
    energyScore: 88,
    metadata: {
      currentLecture: 'Power Electronics',
      nextLecture: 'Robotics Lab',
      acStatus: 'On',
      projectorStatus: 'On',
      availability: 'Occupied',
    },
    classrooms: [
      {
        id: 'd-lab-2',
        buildingId: 'block-d',
        roomNumber: 'D-Lab-2',
        department: 'Electrical Engineering',
        capacity: 32,
        currentLecture: 'Power Electronics',
        nextLecture: 'Robotics Lab',
        occupancy: 30,
        availability: 'Occupied',
        projectorStatus: 'On',
        acStatus: 'On',
      },
    ],
  },
  {
    id: 'block-e',
    name: 'Student Center',
    block: 'Block E',
    department: 'Student Affairs',
    purpose: 'Canteen, events, support',
    floors: 2,
    x: 0,
    z: 6,
    size: [5.6, 2.8, 4.8],
    color: '#7c3aed',
    occupancy: 91,
    capacity: 260,
    wifiHealth: 'Online',
    energyScore: 67,
    metadata: {
      currentLecture: 'Canteen Peak Hour',
      nextLecture: 'Student Meetup',
      acStatus: 'On',
      projectorStatus: 'Off',
      availability: 'Reserved',
    },
    classrooms: [
      {
        id: 'e-hall',
        buildingId: 'block-e',
        roomNumber: 'E-Hall',
        department: 'Student Affairs',
        capacity: 180,
        currentLecture: 'Canteen Peak Hour',
        nextLecture: 'Student Meetup',
        occupancy: 162,
        availability: 'Reserved',
        projectorStatus: 'Off',
        acStatus: 'On',
      },
    ],
  },
  {
    id: 'block-f',
    name: 'Hostel & Wellness',
    block: 'Block F',
    department: 'Student Housing',
    purpose: 'Residential and wellness spaces',
    floors: 6,
    x: 18,
    z: 6,
    size: [4.8, 6.1, 4.8],
    color: '#14b8a6',
    occupancy: 83,
    capacity: 320,
    wifiHealth: 'Weak Signal',
    energyScore: 93,
    metadata: {
      currentLecture: 'Quiet Hours',
      nextLecture: 'Wellness Check',
      acStatus: 'On',
      projectorStatus: 'Off',
      availability: 'Occupied',
    },
    classrooms: [
      {
        id: 'f-101',
        buildingId: 'block-f',
        roomNumber: 'F-101',
        department: 'Hostel',
        capacity: 4,
        currentLecture: 'Quiet Hours',
        nextLecture: 'Wellness Check',
        occupancy: 4,
        availability: 'Occupied',
        projectorStatus: 'Off',
        acStatus: 'On',
      },
    ],
  },
];

export const complaints: Complaint[] = [
  {
    id: 'cmp-1001',
    title: 'Flickering lights in A-101',
    description: 'Lights dim intermittently during afternoon sessions.',
    category: 'Electrical',
    priority: 'High',
    buildingId: 'block-a',
    roomNumber: 'A-101',
    gps: [28.545, 77.173],
    status: 'Assigned',
    assignedDepartment: 'Electrical Maintenance',
    technician: 'Ravi Kumar',
    estimatedCompletion: 'Today 16:30',
    images: ['panel-light.jpg', 'ceiling-wiring.jpg'],
    createdAt: '2026-07-26T08:20:00+05:30',
    timeline: [
      { at: '08:20', label: 'Complaint registered' },
      { at: '08:35', label: 'Assigned to maintenance' },
      { at: '09:10', label: 'Technician en route' },
    ],
  },
  {
    id: 'cmp-1002',
    title: 'Water leak near hostel wash area',
    description: 'Persistent water leak creating a slippery floor.',
    category: 'Water',
    priority: 'Critical',
    buildingId: 'block-f',
    roomNumber: 'F-012',
    gps: [28.546, 77.175],
    status: 'In Progress',
    assignedDepartment: 'Civil Services',
    technician: 'Asha Devi',
    estimatedCompletion: 'Today 18:00',
    images: ['leak-floor.jpg'],
    createdAt: '2026-07-26T07:50:00+05:30',
    timeline: [
      { at: '07:50', label: 'Complaint registered' },
      { at: '08:05', label: 'Temporary barricade placed' },
      { at: '09:25', label: 'Repair started' },
    ],
  },
  {
    id: 'cmp-1003',
    title: 'Wi-Fi drops in library east wing',
    description: 'Students report weak and unstable signal in reading zones.',
    category: 'Internet',
    priority: 'Medium',
    buildingId: 'block-c',
    roomNumber: 'C-Study-02',
    gps: [28.5457, 77.1775],
    status: 'Open',
    assignedDepartment: 'IT Services',
    technician: 'Pending assignment',
    estimatedCompletion: 'Within 8 hours',
    images: ['wifi-signal.png'],
    createdAt: '2026-07-26T09:05:00+05:30',
    timeline: [{ at: '09:05', label: 'Complaint registered' }],
  },
];

export const wifiAccessPoints: WifiAccessPoint[] = [
  {
    id: 'ap-a1',
    buildingId: 'block-a',
    name: 'AP-A1',
    status: 'Online',
    connectedUsers: 118,
    bandwidthMbps: 620,
    latencyMs: 18,
    packetLossPercent: 0.2,
  },
  {
    id: 'ap-c1',
    buildingId: 'block-c',
    name: 'AP-C1',
    status: 'Weak Signal',
    connectedUsers: 162,
    bandwidthMbps: 240,
    latencyMs: 44,
    packetLossPercent: 1.7,
  },
  {
    id: 'ap-f1',
    buildingId: 'block-f',
    name: 'AP-F1',
    status: 'Weak Signal',
    connectedUsers: 202,
    bandwidthMbps: 180,
    latencyMs: 58,
    packetLossPercent: 2.4,
  },
];

export const energySnapshots: EnergySnapshot[] = campusBuildings.map((building) => ({
  buildingId: building.id,
  electricityKwh: building.energyScore * 18,
  waterLiters: building.occupancy * 30,
  solarKwh: building.id === 'block-d' ? 110 : building.id === 'block-e' ? 72 : 54,
  carbonKg: Math.round(building.energyScore * 4.1),
}));

export const analyticsSeries: AnalyticsPoint[] = [
  { label: 'Mon', complaints: 8, occupancy: 56, energy: 43 },
  { label: 'Tue', complaints: 11, occupancy: 63, energy: 49 },
  { label: 'Wed', complaints: 9, occupancy: 71, energy: 54 },
  { label: 'Thu', complaints: 13, occupancy: 77, energy: 61 },
  { label: 'Fri', complaints: 10, occupancy: 82, energy: 69 },
  { label: 'Sat', complaints: 6, occupancy: 48, energy: 38 },
  { label: 'Sun', complaints: 4, occupancy: 35, energy: 29 },
];

export const notifications: NotificationItem[] = [
  {
    id: 'note-1',
    title: 'Complaint resolved',
    message: 'Electrical issue in A-101 has been fixed.',
    level: 'success',
    createdAt: '2026-07-26T09:20:00+05:30',
  },
  {
    id: 'note-2',
    title: 'Room available',
    message: 'C-Study-02 is now free for booking.',
    level: 'info',
    createdAt: '2026-07-26T09:26:00+05:30',
  },
  {
    id: 'note-3',
    title: 'Wi-Fi outage',
    message: 'Weak signal detected around hostel east wing.',
    level: 'warning',
    createdAt: '2026-07-26T09:31:00+05:30',
  },
];

export const searchCampus = (query: string, complaintList: Complaint[] = complaints): SearchResult[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const buildingMatches = campusBuildings
    .filter((building) =>
      [building.name, building.block, building.department, building.purpose].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    )
    .map((building) => ({
      kind: 'building' as const,
      id: building.id,
      label: `${building.name} · ${building.block}`,
    }));

  const classroomMatches = campusBuildings.flatMap((building) =>
    building.classrooms
      .filter((room) => [room.roomNumber, room.department, room.currentLecture].some((value) => value.toLowerCase().includes(normalized)))
      .map((room) => ({
        kind: 'classroom' as const,
        id: room.id,
        label: `${room.roomNumber} · ${building.block}`,
      })),
  );

  const complaintMatches = complaintList
    .filter((complaint) =>
      [complaint.title, complaint.category, complaint.status, complaint.roomNumber].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    )
    .map((complaint) => ({
      kind: 'complaint' as const,
      id: complaint.id,
      label: `${complaint.title} · ${complaint.category}`,
    }));

  return [...buildingMatches, ...classroomMatches, ...complaintMatches].slice(0, 8);
};

export const findBuilding = (id: string) => campusBuildings.find((item) => item.id === id);
export const findComplaint = (id: string) => complaints.find((item) => item.id === id);
export const findClassroom = (id: string) => campusBuildings.flatMap((b) => b.classrooms).find((item) => item.id === id);
