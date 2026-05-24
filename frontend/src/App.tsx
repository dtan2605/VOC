import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthPage from './pages/auth/AuthPage'
import HomePage from './pages/dashboard/HomePage'
import BandsPage from './pages/vocabulary/BandsPage'
import TopicsPage from './pages/vocabulary/TopicsPage'
import VocabularyDetailPage from './pages/vocabulary/VocabularyDetailPage'
import VocabularyPage from './pages/vocabulary/VocabularyPage'

function App() {
  const { isAuthenticated, user, fetchProfile } = useAuth()

  useEffect(() => {
    if (isAuthenticated && !user) {
      void fetchProfile()
    }
  }, [fetchProfile, isAuthenticated, user])

  return (
    <Routes>
      <Route
        path="/auth"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <AuthPage />}
      />
      <Route
        path="/home"
        element={isAuthenticated ? <HomePage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/vocabulary"
        element={isAuthenticated ? <VocabularyPage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/bands"
        element={isAuthenticated ? <BandsPage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/topics"
        element={isAuthenticated ? <TopicsPage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/vocabulary/:id"
        element={isAuthenticated ? <VocabularyDetailPage /> : <Navigate to="/auth" replace />}
      />
      <Route path="/profile" element={<Navigate to={isAuthenticated ? '/home' : '/auth'} replace />} />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/home' : '/auth'} replace />}
      />
    </Routes>
  )
}

export default App
