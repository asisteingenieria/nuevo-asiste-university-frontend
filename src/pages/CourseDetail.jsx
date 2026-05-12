import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesAPI, activitiesAPI, workshopsAPI, quizzesAPI, uploadAPI, gradesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft,
  Plus, 
  Edit2, 
  Trash2, 
  Upload,
  FileText,
  Image,
  Video,
  Play,
  BookOpen,
  Users,
  CheckCircle,
  Clock,
  Star,
  Award,
  ChevronRight,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isFormador, isEstudiante, user } = useAuth();
  const [course, setCourse] = useState(null);
  const [activities, setActivities] = useState([]);
  const [studentProgress, setStudentProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order_index: 0
  });

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const [courseRes, activitiesRes] = await Promise.all([
        coursesAPI.getById(id),
        activitiesAPI.getByCourse(id)
      ]);
      
      setCourse(courseRes.data.course);
      setActivities(activitiesRes.data.activities);
      
      // Si es estudiante, obtener progreso
      if (isEstudiante()) {
        try {
          const progressRes = await gradesAPI.getStudentProgress(user.id, id);
          setStudentProgress(progressRes.data.progress || {});
        } catch (error) {
          console.log('No progress data available');
        }
      }
    } catch (error) {
      toast.error('Error al cargar detalles del curso');
      console.error('Error fetching course details:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const activityData = {
        ...formData,
        course_id: parseInt(id),
        order_index: parseInt(formData.order_index)
      };

      if (editingActivity) {
        await activitiesAPI.update(editingActivity.id, activityData);
        toast.success('Actividad actualizada exitosamente');
      } else {
        await activitiesAPI.create(activityData);
        toast.success('Actividad creada exitosamente');
      }
      
      setShowModal(false);
      setEditingActivity(null);
      setFormData({
        title: '',
        description: '',
        order_index: 0
      });
      fetchCourseDetails();
    } catch (error) {
      const message = error.response?.data?.message || 'Error al guardar actividad';
      toast.error(message);
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description || '',
      order_index: activity.order_index
    });
    setShowModal(true);
  };

  const handleDelete = async (activityId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta actividad? Se eliminarán todos sus talleres y quizzes.')) {
      try {
        await activitiesAPI.delete(activityId);
        toast.success('Actividad eliminada exitosamente');
        fetchCourseDetails();
      } catch (error) {
        toast.error('Error al eliminar actividad');
      }
    }
  };

  const getActivityIcon = () => {
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Curso no encontrado</p>
        <button onClick={() => navigate('/courses')} className="btn-primary mt-4">
          Volver a Cursos
        </button>
      </div>
    );
  }

  // If user is student, show student-specific course view
  if (isEstudiante()) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/courses')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
              {course.description && (
                <p className="text-gray-600 mt-2">{course.description}</p>
              )}
            </div>
          </div>

          {/* Course Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{activities.length}</div>
              <div className="text-sm text-gray-600">Actividades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {activities.reduce((sum, activity) => sum + (activity.workshop_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Talleres</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {activities.reduce((sum, activity) => sum + (activity.quiz_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Evaluaciones</div>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Programa de Estudio
          </h2>

          {activities.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Este curso aún no tiene actividades</p>
              <p className="text-sm text-gray-400">Las actividades aparecerán aquí cuando estén disponibles</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.id} className="card hover:shadow-lg transition-all duration-200 border-l-4 border-blue-500">
                  <div className="flex items-center gap-4">
                    {/* Activity Number */}
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">{index + 1}</span>
                    </div>

                    {/* Activity Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{activity.title}</h3>
                      
                      {activity.description && (
                        <p className="text-gray-600 mb-3">{activity.description}</p>
                      )}

                      {/* Activity Components */}
                      <div className="flex flex-wrap gap-4 mb-4">
                        {activity.workshop_count > 0 && (
                          <div className="flex items-center gap-1 text-sm text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                            <BookOpen className="h-4 w-4" />
                            {activity.workshop_count} Taller{activity.workshop_count !== 1 ? 'es' : ''}
                          </div>
                        )}
                        
                        {activity.quiz_count > 0 && (
                          <div className="flex items-center gap-1 text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                            <CheckCircle className="h-4 w-4" />
                            {activity.quiz_count} Evaluaci{activity.quiz_count !== 1 ? 'ones' : 'ón'}
                          </div>
                        )}
                        
                        {activity.is_completed && (
                          <div className="flex items-center gap-1 text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                            <Award className="h-4 w-4" />
                            Completada
                          </div>
                        )}
                      </div>

                      {/* Progress bar if applicable */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: activity.is_completed ? '100%' : '0%' }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => navigate(`/activity/${activity.id}`)}
                        className="btn-primary flex items-center gap-2"
                      >
                        {activity.is_completed ? (
                          <>
                            <Eye className="h-4 w-4" />
                            Revisar
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Comenzar
                          </>
                        )}
                      </button>
                      
                      <div className="text-xs text-gray-500 text-center">
                        {activity.is_completed ? 'Completada' : 'Pendiente'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Learning Tips */}
        <div className="card bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                💡 Consejos para tu aprendizaje
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Revisa todo el contenido antes de tomar las evaluaciones</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500 mt-0.5" />
                  <span>Practica con los talleres para reforzar conocimientos</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <span>Tómate tu tiempo para comprender cada tema</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-purple-500 mt-0.5" />
                  <span>Contacta a tus formadores si tienes dudas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin/Formador view (existing functionality)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/courses')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
          {course.description && (
            <p className="text-gray-600 mt-2">{course.description}</p>
          )}
        </div>
        {(isAdmin() || isFormador()) && (
          <button
            onClick={() => {
              setEditingActivity(null);
              setFormData({
                title: '',
                description: '',
                order_index: activities.length
              });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nueva Actividad
          </button>
        )}
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Play className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Actividades</p>
              <p className="text-2xl font-semibold text-gray-900">{activities.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Talleres</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activities.reduce((sum, activity) => sum + (activity.workshop_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quizzes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activities.reduce((sum, activity) => sum + (activity.quiz_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Estudiantes</p>
              <p className="text-2xl font-semibold text-gray-900">{course.student_count || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Actividades del Curso</h2>
        
        {activities.length === 0 ? (
          <div className="card text-center py-12">
            <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No hay actividades en este curso</p>
            {(isAdmin() || isFormador()) && (
              <button
                onClick={() => {
                  setEditingActivity(null);
                  setFormData({
                    title: '',
                    description: '',
                    order_index: 0
                  });
                  setShowModal(true);
                }}
                className="btn-primary"
              >
                Crear Primera Actividad
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      {getActivityIcon()}
                      <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        Actividad
                      </span>
                    </div>
                    
                    {activity.description && (
                      <p className="text-gray-600 mb-3 ml-11">{activity.description}</p>
                    )}

                    <div className="flex items-center gap-6 ml-11 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {activity.workshop_count || 0} talleres
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        {activity.quiz_count || 0} quizzes
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Contenido mixto
                      </span>
                    </div>
                  </div>

                  {(isAdmin() || isFormador()) && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => navigate(`/activities/${activity.id}`)}
                        className="text-green-600 hover:text-green-900 p-2"
                        title="Gestionar talleres y quizzes"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(activity)}
                        className="text-blue-600 hover:text-blue-900 p-2"
                        title="Editar actividad"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="text-red-600 hover:text-red-900 p-2"
                        title="Eliminar actividad"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Título de la Actividad</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="form-input"
                  placeholder="Nombre de la actividad"
                />
              </div>

              <div>
                <label className="form-label">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-input h-20 resize-none"
                  placeholder="Descripción de la actividad..."
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Después de crear la actividad, podrás agregar contenido mixto (texto, imágenes, videos) en bloques alternados desde la página de detalles de la actividad.
                </p>
              </div>

              <div>
                <label className="form-label">Orden</label>
                <input
                  type="number"
                  min="0"
                  value={formData.order_index}
                  onChange={(e) => setFormData({...formData, order_index: e.target.value})}
                  className="form-input"
                  placeholder="Orden de la actividad"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  {editingActivity ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;