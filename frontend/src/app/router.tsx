import { createBrowserRouter } from 'react-router-dom'
import { FriendsLobbyPage } from '../pages/friends-lobby-page'
import { GameBoardMockPage } from '../pages/game-board-mock-page'
import { GameBoardPage } from '../pages/game-board-page'
import { HomePage } from '../pages/home-page'
import { LobbyPage } from '../pages/lobby-page'
import { NotFoundPage } from '../pages/not-found-page'
import { AppShell } from '../layout/app-shell'

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'lobby',
        element: <LobbyPage />,
      },
      {
        path: 'lobby-friends',
        element: <FriendsLobbyPage />,
      },
      {
        path: 'board',
        element: <GameBoardPage />,
      },
      {
        path: 'board-mock',
        element: <GameBoardMockPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
