import api from "./client";

export const authApi = {
  me: () => api.get("/auth/me"),
  login: (payload: { email: string; password: string }) => api.post("/auth/login", payload),
  register: (payload: { name: string; email: string; password: string }) => api.post("/auth/register", payload),
};

export const flightsApi = {
  search: ({ origin, destination, date }: { origin: string; destination: string; date: string }) =>
    api.get("/schedules", { params: { origin, destination, date } }),

  getSchedule: (scheduleId: number) => api.get(`/schedules/${scheduleId}`),
  getScheduleSeats: (scheduleId: number) => api.get(`/schedule-seats/schedule/${scheduleId}`),

  createBooking: (payload: any) => api.post("/bookings", payload),

  getBookingsForUser: (userId: number) => api.get(`/bookings?passenger_id=${userId}`),
};
