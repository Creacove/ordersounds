
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import PaymentAdmin from './PaymentAdmin';
import AdminDashboard from './AdminDashboard';

export function AdminRoute() {
  return (
    <Routes>
      <Route path="payment" element={<PaymentAdmin />} />
      <Route path="dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}
