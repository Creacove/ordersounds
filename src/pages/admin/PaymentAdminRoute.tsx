
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import PaymentAdmin from './PaymentAdmin';

export function PaymentAdminRoute() {
  return (
    <Routes>
      <Route path="/admin/payment" element={<PaymentAdmin />} />
    </Routes>
  );
}
