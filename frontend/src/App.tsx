import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Navbar from "./components/Navbar";
import "./styles/global.css";

import Search from "./features/passenger/Search";
import SearchResults from "./features/passenger/SearchResults";
import ScheduleDetail from "./features/passenger/ScheduleDetail";
import BookingsList from "./features/passenger/BookingList";
import BookingView from "./features/passenger/BookingView";

import Login from "./features/auth/Login";
import Register from "./features/auth/Register";
import Profile from "./features/auth/Profile";

import AdminShell from "./features/admin/AdminShell";
import FlightsList from "./features/admin/FlightsList";
import RoutesList from "./features/admin/RoutesList";
import SchedulesList from "./features/admin/SchedulesList";
import TiersList from "./features/admin/TiersList";
import PricesList from "./features/admin/PricesList";
import Reports from "./features/admin/Reports";

import ProtectedRoute from "./routes/ProtectedRoute";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 } },
});

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-container" style={{ paddingTop: "20px" }}>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />

          <Route path="/search" element={<PageWrapper><Search /></PageWrapper>} />
          <Route path="/search/results" element={<PageWrapper><SearchResults /></PageWrapper>} />
          <Route path="/schedule/:id" element={<PageWrapper><ScheduleDetail /></PageWrapper>} />

          <Route path="/bookings" element={<ProtectedRoute><PageWrapper><BookingsList /></PageWrapper></ProtectedRoute>} />
          <Route path="/bookings/:id" element={<ProtectedRoute><PageWrapper><BookingView /></PageWrapper></ProtectedRoute>} />

          <Route path="/auth/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/auth/register" element={<PageWrapper><Register /></PageWrapper>} />
          <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />

          <Route path="/admin" element={<ProtectedRoute requireAdmin><PageWrapper><AdminShell /></PageWrapper></ProtectedRoute>} />
          <Route path="/admin/flights" element={<ProtectedRoute requireAdmin><PageWrapper><FlightsList /></PageWrapper></ProtectedRoute>} />
          <Route path="/admin/routes" element={<ProtectedRoute requireAdmin><PageWrapper><RoutesList /></PageWrapper></ProtectedRoute>} />
          <Route path="/admin/schedules" element={<ProtectedRoute requireAdmin><PageWrapper><SchedulesList /></PageWrapper></ProtectedRoute>} />
          <Route path="/admin/tiers" element={<ProtectedRoute requireAdmin><PageWrapper><TiersList /></PageWrapper></ProtectedRoute>} />
          <Route path="/admin/prices" element={<ProtectedRoute requireAdmin><PageWrapper><PricesList /></PageWrapper></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><PageWrapper><Reports /></PageWrapper></ProtectedRoute>} />

          <Route path="/404" element={<PageWrapper><NotFound /></PageWrapper>} />
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
