import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Dashboard } from '../features/dashboard/components/Dashboard';
import { Login } from '../features/auth/components/Login';
import { Register } from '../features/auth/components/Register';
import { Settings } from '../features/auth/components/Settings';
import { Accounts } from '../features/accounts/components/Accounts';
import { Transactions } from '../features/transactions/components/Transactions';
import { Budget } from '../features/budget/components/Budget';
import { CashFlow } from '../features/cashflow/components/CashFlow';

import { AcceptInvite } from '../features/couple/components/AcceptInvite';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/couple/accept',
    element: <AcceptInvite />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/profile',
        element: <Navigate to="/settings" replace />,
      },
      {
        path: '/settings',
        element: <Settings />,
      },
      {
        path: '/accounts',
        element: <Accounts />,
      },
      {
        path: '/transactions',
        element: <Transactions />,
      },
      {
        path: '/budget',
        element: <Budget />,
      },
      {
        path: '/cash-flow',
        element: <CashFlow />,
      },
      {
        path: '/cashflow',
        element: <Navigate to="/cash-flow" replace />,
      },
    ],
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}

