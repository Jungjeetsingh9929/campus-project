import { api, safeGet, safePost } from './client';
import {
  AnalyticsSnapshotDto,
  AuditRecordDto,
  CampusBuildingDto,
  ComplaintDto,
  EnergySnapshotDto,
  EmergencyEventDto,
  UploadResponse,
  WifiAccessPointDto,
} from './contracts';

export const fetchBuildings = (fallback: CampusBuildingDto[]) => safeGet('/campus/buildings', fallback);
export const fetchComplaints = (fallback: ComplaintDto[]) => safeGet('/campus/complaints', fallback);
export const fetchWifi = (fallback: WifiAccessPointDto[]) => safeGet('/campus/wifi', fallback);
export const fetchEnergy = (fallback: EnergySnapshotDto[]) => safeGet('/campus/energy', fallback);
export const fetchAnalytics = (fallback: AnalyticsSnapshotDto) => safeGet('/campus/analytics', fallback);

export const queryAi = (query: string) => safePost('/ai/query', { query }, { answer: '' });

export type CreateComplaintPayload = {
  title: string;
  description: string;
  category: string;
  priority: string;
  buildingId: string;
  roomNumber: string;
  latitude: number;
  longitude: number;
  contact: string;
  images: string[];
};

export const createComplaint = (payload: CreateComplaintPayload) =>
  api.post<ComplaintDto>('/complaints', {
    Title: payload.title,
    Description: payload.description,
    Category: payload.category,
    Priority: payload.priority,
    BuildingId: payload.buildingId,
    RoomNumber: payload.roomNumber,
    Latitude: payload.latitude,
    Longitude: payload.longitude,
    Contact: payload.contact,
    Images: payload.images,
  }).then((response) => response.data);

export const updateComplaint = (id: string, payload: {
  status: string;
  assignedDepartment: string;
  technician: string;
  estimatedCompletion: string;
  adminRemarks: string;
  resolutionEvidence: string[];
}) =>
  api.put<ComplaintDto>(`/complaints/${id}`, {
    Status: payload.status,
    AssignedDepartment: payload.assignedDepartment,
    Technician: payload.technician,
    EstimatedCompletion: payload.estimatedCompletion,
    AdminRemarks: payload.adminRemarks,
    ResolutionEvidence: payload.resolutionEvidence,
  }).then((response) => response.data);

export const uploadFile = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post<UploadResponse>('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((response) => response.data);
};

export const createEmergency = (payload: { kind: string; location: string; notes: string; severity: string; assignedTeam: string }) =>
  api.post('/emergency/sos', {
    Kind: payload.kind,
    Location: payload.location,
    Notes: payload.notes,
    Severity: payload.severity,
    AssignedTeam: payload.assignedTeam,
  });

export const fetchEmergencyEvents = () => api.get<EmergencyEventDto[]>('/emergency/events').then((response) => response.data);
export const fetchAuditRecords = () => api.get<AuditRecordDto[]>('/audit').then((response) => response.data);
