import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Feed from './pages/Feed';
import SubmitTip from './pages/SubmitTip';
import FileDispute from './pages/FileDispute';
import Profile from './pages/Profile';
import Archive from './pages/Archive';
import ArchiveSubmit from './pages/ArchiveSubmit';
import TipDetail from './pages/TipDetail';
import ModeratorQueue from './pages/ModeratorQueue';
import { useAuth } from './context/AuthContext';

function AppShell() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/feed" replace /> : <Landing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/tips/:id" element={<ProtectedRoute><TipDetail /></ProtectedRoute>} />
          <Route path="/submit" element={<ProtectedRoute role="SENIOR"><SubmitTip /></ProtectedRoute>} />
          <Route path="/dispute/:tipId" element={<ProtectedRoute><FileDispute /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
          <Route path="/archive/submit" element={<ProtectedRoute><ArchiveSubmit /></ProtectedRoute>} />
          <Route path="/moderator/queue" element={<ProtectedRoute><ModeratorQueue /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
