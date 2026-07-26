import { useEffect } from 'react';
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { useAuthStore } from '../store/authStore';
import { useCampusStore } from '../store/campusStore';
import { ComplaintDto } from '../api/contracts';

export function RealtimeNotifications() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const upsertComplaintFromApi = useCampusStore((state) => state.upsertComplaintFromApi);
  const addNotification = useCampusStore((state) => state.addNotification);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
    const hubBase = apiBase.replace(/\/api\/?$/, '');
    const connection = new HubConnectionBuilder()
      .withUrl(`${hubBase}/hubs/notifications`, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ComplaintCreated', (complaint: ComplaintDto) => {
      upsertComplaintFromApi(complaint);
      addNotification({ title: 'Complaint created', message: `${complaint.TicketNo} was created.`, level: 'success' });
    });

    connection.on('ComplaintUpdated', (complaint: ComplaintDto) => {
      upsertComplaintFromApi(complaint);
      addNotification({ title: 'Complaint updated', message: `${complaint.TicketNo} changed to ${complaint.Status}.`, level: 'info' });
    });

    connection.on('EmergencyCreated', () => {
      addNotification({ title: 'Emergency event', message: 'A new emergency event was recorded.', level: 'critical' });
    });

    connection.onclose(() => {
      addNotification({ title: 'Realtime disconnected', message: 'Live updates will resume when the connection is restored.', level: 'warning' });
    });

    void connection.start().catch(() => {
      addNotification({ title: 'Realtime unavailable', message: 'Could not connect to live updates.', level: 'warning' });
    });

    return () => {
      if (connection.state !== HubConnectionState.Disconnected) {
        void connection.stop();
      }
    };
  }, [addNotification, isAuthenticated, token, upsertComplaintFromApi]);

  return null;
}
