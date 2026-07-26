export type AuthResponse = {
  AccessToken: string;
  RefreshToken: string;
  AccessTokenExpiresAt: string;
  RefreshTokenExpiresAt: string;
  Role: 'Student' | 'Faculty' | 'Admin' | 'Security';
  Name: string;
};

export type UserDto = {
  Id: string;
  Name: string;
  Email: string;
  Role: 'Student' | 'Faculty' | 'Admin' | 'Security';
  Department: string;
  RollNumber?: string;
  Phone?: string;
  IsActive: boolean;
};

export type CampusBuildingDto = {
  Id: string;
  Name: string;
  Block: string;
  Department: string;
  Purpose: string;
  Floors: number;
  X: number;
  Z: number;
  Occupancy: number;
  Capacity: number;
  WifiHealth: string;
  EnergyScore: number;
  CurrentLecture: string;
  NextLecture: string;
  AcStatus: string;
  ProjectorStatus: string;
  Availability: string;
  Classrooms: ClassroomDto[];
};

export type ClassroomDto = {
  Id: string;
  RoomNumber: string;
  Department: string;
  Capacity: number;
  CurrentLecture: string;
  NextLecture: string;
  Occupancy: number;
  Availability: string;
  ProjectorStatus: string;
  AcStatus: string;
};

export type ComplaintDto = {
  Id: string;
  TicketNo: string;
  StudentId: string;
  StudentName: string;
  RollNumber?: string;
  Contact: string;
  CampusBuildingId: string;
  Title: string;
  Description: string;
  Category: string;
  Priority: string;
  RoomNumber: string;
  Status: string;
  AssignedDepartment: string;
  Technician: string;
  EstimatedCompletion: string;
  Latitude: number;
  Longitude: number;
  Images: string[];
  AdminRemarks: string;
  ResolutionEvidence: string[];
  CreatedAt: string;
  UpdatedAt: string;
  ResolvedAt?: string;
  Updates: ComplaintUpdateDto[];
};

export type ComplaintUpdateDto = {
  At: string;
  UpdatedBy: string;
  Status: string;
  Note: string;
};

export type WifiAccessPointDto = {
  Id: string;
  CampusBuildingId: string;
  Name: string;
  Status: string;
  ConnectedUsers: number;
  BandwidthMbps: number;
  LatencyMs: number;
  PacketLossPercent: number;
};

export type EnergySnapshotDto = {
  Id: string;
  CampusBuildingId: string;
  ElectricityKwh: number;
  WaterLiters: number;
  SolarKwh: number;
  CarbonKg: number;
};

export type AnalyticsSnapshotDto = {
  CampusBuildings: number;
  Complaints: number;
  WifiAccessPoints: number;
};

export type AiQueryResponse = {
  answer: string;
};

export type EmergencyEventDto = {
  Id: string;
  Kind: string;
  Location: string;
  Notes: string;
  Severity: 'Advisory' | 'High' | 'Critical';
  Status: 'Active' | 'Contained' | 'Resolved';
  AssignedTeam: string;
  CreatedBy: string;
  CreatedAt: string;
};

export type AuditRecordDto = {
  Id: string;
  ActorName: string;
  Action: string;
  Target: string;
  CreatedAt: string;
};

export type UploadResponse = {
  Url: string;
  FileName: string;
  ContentType: string;
  Size: number;
};
