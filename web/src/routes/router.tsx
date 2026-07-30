import { createBrowserRouter } from 'react-router'
import { AppLayout } from '../layouts/AppLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { ClientFormPage } from '../pages/clients/ClientFormPage'
import { ClientsPage } from '../pages/clients/ClientsPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProjectFormPage } from '../pages/projects/ProjectFormPage'
import { ProjectsPage } from '../pages/projects/ProjectsPage'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'
import { RootRedirect } from './RootRedirect'

import TasksPage from '../pages/tasks/TasksPage'
import { AIBreakdownPage } from '../pages/ai/AIBreakdownPage'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootRedirect,
  },
  {
    Component: PublicOnlyRoute,
    children: [
      {
        path: '/login',
        Component: LoginPage,
      },
    ],
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        Component: AppLayout,
        children: [
          {
            path: '/dashboard',
            Component: DashboardPage,
          },
          {
            path: '/clients',
            Component: ClientsPage,
          },
          {
            path: '/clients/create',
            Component: ClientFormPage,
          },
          {
            path: '/clients/:id/edit',
            Component: ClientFormPage,
          },
          {
            path: '/projects',
            Component: ProjectsPage,
          },
          {
            path: '/projects/create',
            Component: ProjectFormPage,
          },
          {
            path: '/projects/:id/edit',
            Component: ProjectFormPage,
          },
          {
            path: '/tasks',
            Component: TasksPage,
          },
          {
            path: '/ai/breakdown',
            Component: AIBreakdownPage,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    Component: NotFoundPage,
  },
])
