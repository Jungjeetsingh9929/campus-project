import { create } from 'zustand';
import { analyticsSeries, campusBuildings, complaints, notifications, wifiAccessPoints } from '../data/campus';
import { AuditLog, CampusBuilding, Complaint, ComplaintAttachment, ComplaintStatus, EmergencyEvent, NotificationItem, SearchResult, WifiAccessPoint } from '../types';
import {
  AnalyticsSnapshotDto,
  CampusBuildingDto,
  ComplaintDto,
  EnergySnapshotDto,
  WifiAccessPointDto,
} from '../api/contracts';

type CampusState = {
  buildings: CampusBuilding[];
  complaints: Complaint[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  emergencyEvents: EmergencyEvent[];
  wifiAccessPoints: typeof wifiAccessPoints;
  analytics: typeof analyticsSeries;
  apiStatus: 'online' | 'offline';
  apiError: string | null;
  selectedBuildingId: string;
  selectedComplaintId: string | null;
  selectedSearchResult: SearchResult | null;
  setApiStatus: (status: 'online' | 'offline', error?: string | null) => void;
  setSelectedBuildingId: (id: string) => void;
  setSelectedComplaintId: (id: string | null) => void;
  setSelectedSearchResult: (result: SearchResult | null) => void;
  createLocalComplaint: (payload: {
    title: string;
    description: string;
    category: Complaint['category'];
    priority: Complaint['priority'];
    buildingId: string;
    roomNumber: string;
    gps: [number, number];
    studentId: string;
    studentName: string;
    rollNumber?: string;
    contact: string;
    attachments: ComplaintAttachment[];
  }) => Complaint;
  updateComplaintWorkflow: (id: string, changes: {
    status: ComplaintStatus;
    assignedDepartment: string;
    technician: string;
    estimatedCompletion: string;
    adminRemarks: string;
    resolutionEvidence?: ComplaintAttachment[];
  }, actor: string) => void;
  addEmergencyEvent: (event: Omit<EmergencyEvent, 'id' | 'createdAt'>, actor: string) => void;
  recordAuditLog: (actor: string, action: string, target: string) => void;
  addComplaintFromApi: (complaint: ComplaintDto) => void;
  upsertComplaintFromApi: (complaint: ComplaintDto) => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'level'> & { level?: NotificationItem['level'] }) => void;
  hydrateFromApi: (payload: {
    buildings?: CampusBuildingDto[];
    complaints?: ComplaintDto[];
    wifiAccessPoints?: WifiAccessPointDto[];
    analytics?: AnalyticsSnapshotDto;
    energy?: EnergySnapshotDto[];
  }) => void;
};

const COMPLAINTS_KEY = 'campus-unified.complaints';
const NOTIFICATIONS_KEY = 'campus-unified.notifications';
const AUDIT_KEY = 'campus-unified.audit';
const EMERGENCY_KEY = 'campus-unified.emergencies';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

function nowLabel() {
  return new Date().toLocaleString();
}

function normalizeComplaint(complaint: Complaint): Complaint {
  return {
    ...complaint,
    ticketNo: complaint.ticketNo ?? complaint.id.toUpperCase(),
    studentId: complaint.studentId ?? 'user-student',
    studentName: complaint.studentName ?? 'Student User',
    contact: complaint.contact ?? '+91 90000 10001',
    attachments: complaint.attachments ?? complaint.images.map((name, index) => ({ id: `${complaint.id}-image-${index}`, name, type: 'image', size: 0 })),
    adminRemarks: complaint.adminRemarks ?? '',
    resolutionEvidence: complaint.resolutionEvidence ?? [],
    updatedAt: complaint.updatedAt ?? complaint.createdAt,
  };
}

function mapBuilding(dto: CampusBuildingDto): CampusBuilding {
  return {
    id: dto.Id,
    name: dto.Name,
    block: dto.Block,
    department: dto.Department,
    purpose: dto.Purpose,
    floors: dto.Floors,
    x: dto.X,
    z: dto.Z,
    size: [5, Math.max(2.5, dto.Floors * 1.1), 4.5],
    color: dto.Block === 'Block C' ? '#0b8f8f' : dto.Block === 'Block D' ? '#f97316' : '#2b7de9',
    occupancy: dto.Occupancy,
    capacity: dto.Capacity,
    wifiHealth: dto.WifiHealth as CampusBuilding['wifiHealth'],
    energyScore: dto.EnergyScore,
    metadata: {
      currentLecture: dto.CurrentLecture,
      nextLecture: dto.NextLecture,
      acStatus: dto.AcStatus,
      projectorStatus: dto.ProjectorStatus,
      availability: dto.Availability as CampusBuilding['metadata']['availability'],
    },
    classrooms: dto.Classrooms.map((room) => ({
      id: room.Id,
      buildingId: dto.Id,
      roomNumber: room.RoomNumber,
      department: room.Department,
      capacity: room.Capacity,
      currentLecture: room.CurrentLecture,
      nextLecture: room.NextLecture,
      occupancy: room.Occupancy,
      availability: room.Availability as CampusBuilding['classrooms'][number]['availability'],
      projectorStatus: room.ProjectorStatus as CampusBuilding['classrooms'][number]['projectorStatus'],
      acStatus: room.AcStatus as CampusBuilding['classrooms'][number]['acStatus'],
    })),
  };
}

function mapComplaint(dto: ComplaintDto): Complaint {
  return {
    id: dto.Id,
    ticketNo: dto.TicketNo,
    studentId: dto.StudentId,
    studentName: dto.StudentName,
    rollNumber: dto.RollNumber,
    contact: dto.Contact,
    title: dto.Title,
    description: dto.Description,
    category: dto.Category as Complaint['category'],
    priority: dto.Priority as Complaint['priority'],
    buildingId: campusBuildings.find((building) => building.id === dto.CampusBuildingId || building.block.endsWith(dto.CampusBuildingId.slice(-1)))?.id ?? campusBuildings[0].id,
    roomNumber: dto.RoomNumber,
    gps: [dto.Latitude, dto.Longitude],
    status: dto.Status as Complaint['status'],
    assignedDepartment: dto.AssignedDepartment,
    technician: dto.Technician,
    estimatedCompletion: dto.EstimatedCompletion,
    images: dto.Images,
    attachments: dto.Images.map((name, index) => ({ id: `${dto.Id}-${index}`, name, type: 'image', size: 0 })),
    adminRemarks: dto.AdminRemarks,
    resolutionEvidence: dto.ResolutionEvidence.map((name, index) => ({ id: `${dto.Id}-evidence-${index}`, name, type: 'file', size: 0 })),
    createdAt: dto.CreatedAt,
    updatedAt: dto.UpdatedAt,
    resolvedAt: dto.ResolvedAt,
    timeline: dto.Updates.map((update) => ({ at: new Date(update.At).toLocaleString(), label: `${update.UpdatedBy}: ${update.Note}` })),
  };
}

function mapWifi(dto: WifiAccessPointDto): WifiAccessPoint {
  return {
    id: dto.Id,
    buildingId: dto.CampusBuildingId,
    name: dto.Name,
    status: dto.Status as WifiAccessPoint['status'],
    connectedUsers: dto.ConnectedUsers,
    bandwidthMbps: dto.BandwidthMbps,
    latencyMs: dto.LatencyMs,
    packetLossPercent: dto.PacketLossPercent,
  };
}

export const useCampusStore = create<CampusState>((set) => ({
  buildings: campusBuildings,
  complaints: readJson<Complaint[]>(COMPLAINTS_KEY, complaints.map(normalizeComplaint)),
  notifications: readJson<NotificationItem[]>(NOTIFICATIONS_KEY, notifications),
  auditLogs: readJson<AuditLog[]>(AUDIT_KEY, [
    { id: 'audit-1', actor: 'System', action: 'Portal initialized', target: 'Unified campus workspace', createdAt: nowLabel() },
  ]),
  emergencyEvents: readJson<EmergencyEvent[]>(EMERGENCY_KEY, [
    {
      id: 'emg-1',
      kind: 'Medical support',
      location: 'Hostel & Wellness',
      status: 'Contained',
      severity: 'High',
      assignedTeam: 'Clinic Response Team',
      createdAt: nowLabel(),
      notes: 'Student escorted to clinic and guardian notified.',
    },
  ]),
  wifiAccessPoints,
  analytics: analyticsSeries,
  apiStatus: 'online',
  apiError: null,
  selectedBuildingId: campusBuildings[0].id,
  selectedComplaintId: complaints[0]?.id ?? null,
  selectedSearchResult: null,
  setApiStatus: (status, error = null) => set({ apiStatus: status, apiError: error }),
  setSelectedBuildingId: (id) => set({ selectedBuildingId: id }),
  setSelectedComplaintId: (id) => set({ selectedComplaintId: id }),
  setSelectedSearchResult: (result) => set({ selectedSearchResult: result }),
  createLocalComplaint: (payload) => {
    const ticketNo = `CMP-${new Date().getFullYear()}-${String(Math.floor(Date.now() / 1000)).slice(-5)}`;
    const complaint: Complaint = {
      id: `cmp-${crypto.randomUUID()}`,
      ticketNo,
      ...payload,
      status: 'Open',
      assignedDepartment: routeDepartment(payload.category),
      technician: 'Unassigned',
      estimatedCompletion: estimateSla(payload.priority),
      images: payload.attachments.map((item) => item.name),
      adminRemarks: '',
      resolutionEvidence: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [{ at: nowLabel(), label: `Complaint registered and routed to ${routeDepartment(payload.category)}.` }],
    };

    set((state) => {
      const nextComplaints = [complaint, ...state.complaints];
      const nextNotifications = [
        {
          id: `notice-${crypto.randomUUID()}`,
          title: 'New complaint registered',
          message: `${complaint.ticketNo}: ${complaint.title}`,
          level: payload.priority === 'Critical' ? 'critical' : 'success',
          createdAt: nowLabel(),
        } satisfies NotificationItem,
        ...state.notifications,
      ];
      writeJson(COMPLAINTS_KEY, nextComplaints);
      writeJson(NOTIFICATIONS_KEY, nextNotifications);
      return {
        complaints: nextComplaints,
        notifications: nextNotifications,
        selectedComplaintId: complaint.id,
        selectedBuildingId: complaint.buildingId,
      };
    });

    return complaint;
  },
  updateComplaintWorkflow: (id, changes, actor) =>
    set((state) => {
      const nextComplaints = state.complaints.map((complaint) => {
        if (complaint.id !== id) {
          return complaint;
        }

        const updated: Complaint = {
          ...complaint,
          ...changes,
          resolutionEvidence: changes.resolutionEvidence ?? complaint.resolutionEvidence,
          resolvedAt: changes.status === 'Resolved' ? new Date().toISOString() : complaint.resolvedAt,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...complaint.timeline,
            {
              at: nowLabel(),
              label: `${actor} changed status to ${changes.status}. ${changes.adminRemarks || 'No note added.'}`,
            },
          ],
        };
        return updated;
      });
      const nextAudit = [
        { id: `audit-${crypto.randomUUID()}`, actor, action: `Updated complaint to ${changes.status}`, target: id, createdAt: nowLabel() },
        ...state.auditLogs,
      ];
      writeJson(COMPLAINTS_KEY, nextComplaints);
      writeJson(AUDIT_KEY, nextAudit);
      return { complaints: nextComplaints, auditLogs: nextAudit };
    }),
  addEmergencyEvent: (event, actor) =>
    set((state) => {
      const created: EmergencyEvent = { ...event, id: `emg-${crypto.randomUUID()}`, createdAt: nowLabel() };
      const nextEvents = [created, ...state.emergencyEvents];
      const nextAudit = [
        { id: `audit-${crypto.randomUUID()}`, actor, action: event.kind, target: event.location, createdAt: nowLabel() },
        ...state.auditLogs,
      ];
      const nextNotifications = [
        {
          id: `notice-${crypto.randomUUID()}`,
          title: event.kind,
          message: `${event.severity} alert at ${event.location}: ${event.notes}`,
          level: event.severity === 'Critical' ? 'critical' : 'warning',
          createdAt: nowLabel(),
        } satisfies NotificationItem,
        ...state.notifications,
      ];
      writeJson(EMERGENCY_KEY, nextEvents);
      writeJson(AUDIT_KEY, nextAudit);
      writeJson(NOTIFICATIONS_KEY, nextNotifications);
      return { emergencyEvents: nextEvents, auditLogs: nextAudit, notifications: nextNotifications };
    }),
  recordAuditLog: (actor, action, target) =>
    set((state) => {
      const nextAudit = [{ id: `audit-${crypto.randomUUID()}`, actor, action, target, createdAt: nowLabel() }, ...state.auditLogs];
      writeJson(AUDIT_KEY, nextAudit);
      return { auditLogs: nextAudit };
    }),
  addComplaintFromApi: (complaint) =>
    set((state) => ({
      complaints: [mapComplaint(complaint), ...state.complaints],
      selectedComplaintId: complaint.Id,
      selectedBuildingId: complaint.CampusBuildingId,
    })),
  upsertComplaintFromApi: (complaint) =>
    set((state) => {
      const mapped = mapComplaint(complaint);
      const exists = state.complaints.some((item) => item.id === mapped.id);
      return {
        complaints: exists
          ? state.complaints.map((item) => (item.id === mapped.id ? mapped : item))
          : [mapped, ...state.complaints],
      };
    }),
  addNotification: (notification) =>
    set((state) => {
      const nextNotifications = [
        {
          id: `notice-${crypto.randomUUID()}`,
          title: notification.title,
          message: notification.message,
          level: notification.level ?? 'info',
          createdAt: nowLabel(),
        },
        ...state.notifications,
      ];
      writeJson(NOTIFICATIONS_KEY, nextNotifications);
      return { notifications: nextNotifications };
    }),
  hydrateFromApi: ({ buildings, complaints: complaintDtos, wifiAccessPoints, analytics, energy }) =>
    set((state) => ({
      apiStatus: 'online',
      apiError: null,
      buildings: buildings?.map(mapBuilding) ?? state.buildings,
      complaints: complaintDtos?.map(mapComplaint) ?? state.complaints,
      wifiAccessPoints: wifiAccessPoints?.map(mapWifi) ?? state.wifiAccessPoints,
      analytics:
        analytics && energy
          ? state.analytics.map((item, index) => ({
              ...item,
              complaints: analytics.Complaints + index,
              occupancy: Math.min(100, Math.round((analytics.CampusBuildings * 14 + index * 3) / 2)),
              energy: Math.round(
                energy.reduce((sum, snapshot) => sum + snapshot.ElectricityKwh, 0) / Math.max(1, energy.length) / 20,
              ),
            }))
          : state.analytics,
    })),
}));

function routeDepartment(category: Complaint['category']) {
  const routes: Record<Complaint['category'], string> = {
    Electrical: 'Electrical Maintenance',
    Water: 'Facilities',
    Internet: 'IT Cell',
    Furniture: 'Facilities',
    Cleaning: 'Housekeeping',
    Hostel: 'Hostel Office',
    Library: 'Library Desk',
    Laboratory: 'Lab Operations',
  };
  return routes[category];
}

function estimateSla(priority: Complaint['priority']) {
  const hours: Record<Complaint['priority'], number> = {
    Low: 72,
    Medium: 48,
    High: 24,
    Critical: 4,
  };
  return new Date(Date.now() + hours[priority] * 60 * 60 * 1000).toLocaleString();
}
