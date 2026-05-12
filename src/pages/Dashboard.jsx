import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  CheckCircle, 
  Clock,
  Star,
  TrendingUp 
} from 'lucide-react';
import { coursesAPI, gradesAPI, usersAPI, satisfactionAPI } from '../services/api';

const Dashboard = () => {
  const { user, isAdmin, isFormador, isEstudiante } = useAuth();
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      if (isAdmin()) {
        const [coursesRes, usersRes, gradesRes, satisfactionRes] = await Promise.all([
          coursesAPI.getAll(),
          usersAPI.getAll(),
          gradesAPI.getOverallStats(),
          satisfactionAPI.getOverallSummary()
        ]);

        setStats({
          totalCourses: coursesRes.data.courses.length,
          totalUsers: usersRes.data.users.length,
          totalStudents: usersRes.data.users.filter(u => u.role === 'estudiante').length,
          totalFormadores: usersRes.data.users.filter(u => u.role === 'formador').length,
          averageScore: gradesRes.data.general.overall_average_score || 0,
          satisfactionRate: satisfactionRes.data.summary.satisfaction_percentage || 0
        });

      } else if (isFormador()) {
        const studentsRes = await usersAPI.getStudents();

        setStats({
          totalStudents: studentsRes.data.students.length
        });

      } else if (isEstudiante()) {
        const [coursesRes, gradesRes, formadoresRes] = await Promise.all([
          coursesAPI.getAll(),
          gradesAPI.getSummary(user.id),
          usersAPI.getMyFormadores()
        ]);

        setStats({
          assignedCourses: coursesRes.data.courses.length,
          completedQuizzes: gradesRes.data.summary.total_quizzes_taken || 0,
          averageScore: gradesRes.data.summary.average_percentage || 0,
          formadores: formadoresRes.data.formadores.length
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const AdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cursos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCourses || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promedio General</p>
              <p className="text-2xl font-semibold text-gray-900">{Math.round(stats.averageScore || 0)}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Satisfacción</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.satisfactionRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estudiantes por Curso</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Total Estudiantes</span>
              <span className="text-lg font-semibold text-blue-600">{stats.totalStudents || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Total Formadores</span>
              <span className="text-lg font-semibold text-green-600">{stats.totalFormadores || 0}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <a href="/users" className="block p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3" />
                <span className="font-medium">Gestionar Usuarios</span>
              </div>
            </a>
            <a href="/courses" className="block p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-3" />
                <span className="font-medium">Gestionar Cursos</span>
              </div>
            </a>
            <a href="/reports" className="block p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-3" />
                <span className="font-medium">Ver Reportes</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  const FormadorDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mis Estudiantes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promedio Grupo</p>
              <p className="text-2xl font-semibold text-gray-900">{Math.round(stats.averageScore || 0)}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Progreso</p>
              <p className="text-2xl font-semibold text-gray-900">En desarrollo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/students" className="p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-3" />
              <span className="font-medium">Ver Estudiantes</span>
            </div>
          </a>
          <a href="/courses" className="p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 mr-3" />
              <span className="font-medium">Asignar Cursos</span>
            </div>
          </a>
          <a href="/grades" className="p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-3" />
              <span className="font-medium">Ver Calificaciones</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );

  const EstudianteDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cursos Asignados</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.assignedCourses || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quizzes Completados</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedQuizzes || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mi Promedio</p>
              <p className="text-2xl font-semibold text-gray-900">{Math.round(stats.averageScore || 0)}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Formadores</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.formadores || 0}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* IMAGEN DE BIENVENIDA ANTES DE LAS ACCIONES RÁPIDAS */}
      <div className="card p-0 overflow-hidden text-center">
  <img 
    src="/images/bienvenido.jpg" 
    alt="Imagen de bienvenida para estudiantes" 
    className="w-4/4 rounded-lg shadow-md mx-auto"
  />
</div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/courses" className="p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 mr-3" />
              <span className="font-medium">Ver Mis Cursos</span>
            </div>
          </a>
          <a href="/grades" className="p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-3" />
              <span className="font-medium">Ver Mis Notas</span>
            </div>
          </a>
          <a href="/formadores" className="p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-3" />
              <span className="font-medium">Mis Formadores</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="-mt-18"> {/* Ajustado a -mt-12 para subir más */}
      <div className="mb-0"> {/* Eliminado el mb-8 ya que el título se fue */}
        {/* El h1 y p que contenían el saludo se han eliminado */}
      </div>

      {isAdmin() && <AdminDashboard />}
      {isFormador() && <FormadorDashboard />}
      {isEstudiante() && <EstudianteDashboard />}
    </div>
  );
};

export default Dashboard;