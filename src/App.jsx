import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// Import actual components
import Users from './pages/Users';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import ActivityDetail from './pages/ActivityDetail';
import WorkshopDetail from './pages/WorkshopDetail';
import Grades from './pages/Grades';
import Satisfaction from './pages/Satisfaction';
import AdminSatisfactionDetails from './pages/AdminSatisfactionDetails';

// Import remaining components
import Students from './pages/Students';
import Forum from './pages/Forum';
import Analytics from './pages/Analytics';

// Import new student components
import TakeQuiz from './pages/TakeQuiz';
import TakeWorkshop from './pages/TakeWorkshop';
import StudentFormadores from './pages/StudentFormadores';
import StudentGrades from './pages/StudentGrades';
import SatisfactionSurvey from './pages/SatisfactionSurvey';
import GeneralSatisfactionSurvey from './pages/GeneralSatisfactionSurvey';
import StudentActivityView from './pages/StudentActivityView';
const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">No autorizado</h1>
      <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página.</p>
      <a href="/" className="btn-primary">Volver al inicio</a>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Admin routes */}
            <Route path="/users" element={
              <ProtectedRoute roles={['admin']}>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/analytics" element={
              <ProtectedRoute roles={['admin']}>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/satisfaction-admin" element={
              <ProtectedRoute roles={['admin']}>
                <Layout>
                  <Satisfaction />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/satisfaction-details" element={
              <ProtectedRoute roles={['admin']}>
                <Layout>
                  <AdminSatisfactionDetails />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Admin and Formador routes */}
            <Route path="/courses" element={
              <ProtectedRoute>
                <Layout>
                  <Courses />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/courses/:id" element={
              <ProtectedRoute>
                <Layout>
                  <CourseDetail />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/activities/:id" element={
              <ProtectedRoute roles={['admin', 'formador']}>
                <Layout>
                  <ActivityDetail />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/workshops/:id" element={
              <ProtectedRoute roles={['admin', 'formador']}>
                <Layout>
                  <WorkshopDetail />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/students" element={
              <ProtectedRoute roles={['admin', 'formador']}>
                <Layout>
                  <Students />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/grades" element={
              <ProtectedRoute>
                <Layout>
                  {/* Use different grade components based on role */}
                  <Grades />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/forum" element={
              <ProtectedRoute>
                <Layout>
                  <Forum />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Student routes */}
            <Route path="/formadores" element={
              <ProtectedRoute roles={['estudiante']}>
                <Layout>
                  <StudentFormadores />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/quiz/:id" element={
              <ProtectedRoute roles={['estudiante']}>
                <Layout>
                  <TakeQuiz />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/workshop/:id" element={
              <ProtectedRoute roles={['estudiante']}>
                <Layout>
                  <TakeWorkshop />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/activity/:id" element={
              <ProtectedRoute roles={['estudiante']}>
                <Layout>
                  <StudentActivityView />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/satisfaction" element={
              <ProtectedRoute roles={['estudiante']}>
                <Layout>
                  <GeneralSatisfactionSurvey />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/course-satisfaction/:courseId" element={
              <ProtectedRoute roles={['estudiante']}>
                <Layout>
                  <SatisfactionSurvey />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;