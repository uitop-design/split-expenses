import { createBrowserRouter } from 'react-router';
import { AppLayout } from '@/components/app-layout';
import { GroupPage } from '@/pages/group-page';
import { GroupsPage } from '@/pages/groups-page';
import { NotFoundPage } from '@/pages/not-found-page';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <GroupsPage /> },
      { path: 'groups/:groupId', element: <GroupPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
