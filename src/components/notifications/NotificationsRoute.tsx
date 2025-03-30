
import React from 'react';
import { Route } from 'react-router-dom';
import NotificationsPage from '@/pages/NotificationsPage';

// This component exports the notifications route that can be included in the App.tsx routes
export const NotificationsRoute = (
  <Route path="/notifications" element={<NotificationsPage />} />
);
