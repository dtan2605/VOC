import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthPage from './pages/auth/AuthPage'
import HomePage from './pages/dashboard/HomePage'
import LearningPage from './pages/learning/LearningPage'
import ReviewPage from './pages/learning/ReviewPage'
import BandsPage from './pages/vocabulary/BandsPage'
import TopicsPage from './pages/vocabulary/TopicsPage'
import VocabularyDetailPage from './pages/vocabulary/VocabularyDetailPage'
import VocabularyPage from './pages/vocabulary/VocabularyPage'
import FilterPage from './pages/vocabulary/FilterPage'
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard'
import ProfilePage from './pages/profile/ProfilePage'
import RecommendPage from './pages/recommend/RecommendPage'
import WeakTopics from './pages/vocabulary/WeakTopics'
import SpeakingPage from './pages/speaking/SpeakingPage'

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
        path="/vocabulary/filter"
        element={isAuthenticated ? <FilterPage /> : <Navigate to="/auth" replace />}
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
        path="/learning"
        element={isAuthenticated ? <LearningPage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/learning/review/:sessionId"
        element={isAuthenticated ? <ReviewPage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/vocabulary/:id"
        element={isAuthenticated ? <VocabularyDetailPage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/analytics"
        element={isAuthenticated ? <AnalyticsDashboard /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/recommend"
        element={isAuthenticated ? <RecommendPage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/weak-topics"
        element={isAuthenticated ? <WeakTopics /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/speaking"
        element={isAuthenticated ? <SpeakingPage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/profile"
        element={isAuthenticated ? <ProfilePage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/home' : '/auth'} replace />}
      />
    </Routes>
  )
}

export default App
