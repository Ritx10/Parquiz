import { createBrowserRouter } from 'react-router-dom'
import { NotFoundPage } from '../pages/not-found-page'
import { AppShell } from '../layout/app-shell'

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        lazy: async () => {
          const module = await import('../pages/home-page')
          return { Component: module.HomePage }
        },
      },
      {
        path: 'skin-selection',
        lazy: async () => {
          const module = await import('../pages/skin-selection-page')
          return { Component: module.SkinSelectionPage }
        },
      },
      {
        path: 'lobby',
        lazy: async () => {
          const module = await import('../pages/lobby-page')
          return { Component: module.LobbyPage }
        },
      },
      {
        path: 'lobby-friends',
        lazy: async () => {
          const module = await import('../pages/friends-lobby-page')
          return { Component: module.FriendsLobbyPage }
        },
      },
      {
        path: 'board',
        lazy: async () => {
          const module = await import('../pages/game-board-page')
          return { Component: module.GameBoardPage }
        },
      },
      {
        path: 'board-mock',
        lazy: async () => {
          const module = await import('../pages/game-board-mock-page')
          return { Component: module.GameBoardMockPage }
        },
      },
      {
        path: 'dev/bootstrap',
        lazy: async () => {
          const module = await import('../pages/dev-bootstrap-page')
          return { Component: module.DevBootstrapPage }
        },
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
