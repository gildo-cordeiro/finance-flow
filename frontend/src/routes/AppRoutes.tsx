import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Dashboard } from '../features/dashboard/components/Dashboard';
import { Login } from '../features/auth/components/Login';
import { Register } from '../features/auth/components/Register';
import { Profile } from '../features/auth/components/Profile';
import { Accounts } from '../features/accounts/components/Accounts';
import { Transactions } from '../features/transactions/components/Transactions';

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
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/profile',
        element: <Profile />,
      },
      {
        path: '/accounts',
        element: <Accounts />,
      },
      {
        path: '/transactions',
        element: <Transactions />,
      },
    ],
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
