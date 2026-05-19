import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Feed from './pages/Feed';
import SubmitTip from './pages/SubmitTip';
import FileDispute from './pages/FileDispute';
import Profile from './pages/Profile';
import Archive from './pages/Archive';
import { useAuth } from './context/AuthContext';

function AppShell() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/submit" element={<ProtectedRoute role="SENIOR"><SubmitTip /></ProtectedRoute>} />
          <Route path="/dispute/:tipId" element={<ProtectedRoute><FileDispute /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
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
