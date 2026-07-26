export type Role = 'Student' | 'Faculty' | 'Admin' | 'Security';

export type CampusBuilding = {
  id: string;
  name: string;
  block: string;
  department: string;
  purpose: string;
  floors: number;
  x: number;
  z: number;
  size: [number, number, number];
  color: string;
  occupancy: number;
  capacity: number;
  wifiHealth: 'Online' | 'Weak Signal' | 'Offline';
  energyScore: number;
  metadata: {
    currentLecture: string;
    nextLecture: string;
    acStatus: string;
    projectorStatus: string;
    availability: 'Available' | 'Occupied' | 'Reserved';
  };
  classrooms: CampusClassroom[];
};

export type CampusClassroom = {
  id: string;
  buildingId: string;
  roomNumber: string;
  department: string;
  capacity: number;
  currentLecture: string;
  nextLecture: string;
  occupancy: number;
  availability: 'Available' | 'Occupied' | 'Reserved';
  projectorStatus: 'On' | 'Off';
  acStatus: 'On' | 'Off';
};

export type ComplaintCategory =
  | 'Electrical'
  | 'Water'
  | 'Internet'
  | 'Furniture'
  | 'Cleaning'
  | 'Hostel'
  | 'Library'
  | 'Laboratory';

export type ComplaintStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved';

export type CampusUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  rollNumber?: string;
  phone?: string;
  active: boolean;
};

export type ComplaintAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
};

export type Complaint = {
  id: string;
  ticketNo?: string;
  studentId?: string;
  studentName?: string;
  rollNumber?: string;
  contact?: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  buildingId: string;
  roomNumber: string;
  gps: [number, number];
  status: ComplaintStatus;
  assignedDepartment: string;
  technician: string;
  estimatedCompletion: string;
  images: string[];
  attachments?: ComplaintAttachment[];
  adminRemarks?: string;
  resolutionEvidence?: ComplaintAttachment[];
  resolvedAt?: string;
  updatedAt?: string;
  createdAt: string;
  timeline: Array<{ at: string; label: string }>;
};

export type WifiAccessPoint = {
  id: string;
  buildingId: string;
  name: string;
  status: 'Online' | 'Offline' | 'Weak Signal';
  connectedUsers: number;
  bandwidthMbps: number;
  latencyMs: number;
  packetLossPercent: number;
};

export type EnergySnapshot = {
  buildingId: string;
  electricityKwh: number;
  waterLiters: number;
  solarKwh: number;
  carbonKg: number;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  level: 'info' | 'warning' | 'critical' | 'success';
  createdAt: string;
};

export type EmergencyEvent = {
  id: string;
  kind: string;
  location: string;
  status: 'Requested' | 'InProgress' | 'Succeeded' | 'Failed' | 'NotConfigured' | 'Active' | 'Contained' | 'Resolved';
  severity: 'Advisory' | 'High' | 'Critical';
  assignedTeam: string;
  createdAt: string;
  notes: string;
};

export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};

export type AnalyticsPoint = {
  label: string;
  complaints: number;
  occupancy: number;
  energy: number;
};

export type SearchResult =
  | { kind: 'building'; id: string; label: string }
  | { kind: 'classroom'; id: string; label: string }
  | { kind: 'complaint'; id: string; label: string };
