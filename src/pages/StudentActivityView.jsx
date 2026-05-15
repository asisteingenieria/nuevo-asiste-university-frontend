import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activitiesAPI, contentBlocksAPI, workshopsAPI, quizzesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Play,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Video,
  Award,
  Clock,
  Target,
  Users,
  ChevronRight,
  Eye,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const StudentActivityView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState(null);
  const [contentBlocks, setContentBlocks] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('content');
  const [progress, setProgress] = useState({
    contentViewed: false,
    workshopsCompleted: 0,
    quizzesCompleted: 0
  });
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    fetchActivityDetails();
  }, [id]);

  const fetchActivityDetails = async () => {
    try {
      setLoading(true);
      const [activityRes, contentRes, workshopsRes, quizzesRes] = await Promise.all([
        activitiesAPI.getById(id),
        contentBlocksAPI.getByActivity(id),
        workshopsAPI.getByActivity(id),
        quizzesAPI.getByActivity(id)
      ]);
      
      setActivity(activityRes.data.activity);
      setContentBlocks(contentRes.data.blocks || []);
      setWorkshops(workshopsRes.data.workshops || []);
      setQuizzes(quizzesRes.data.quizzes || []);
      setIsCompleted(activityRes.data.activity.is_completed || false);
      
      // Set default section based on content availability
      if (contentRes.data.blocks && contentRes.data.blocks.length > 0) {
        setCurrentSection('content');
      } else if (workshopsRes.data.workshops && workshopsRes.data.workshops.length > 0) {
        setCurrentSection('workshops');
      } else if (quizzesRes.data.quizzes && quizzesRes.data.quizzes.length > 0) {
        setCurrentSection('quizzes');
      }
      
    } catch (error) {
      toast.error('Error al cargar detalles de la actividad');
      console.error('Error fetching activity details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = (blockType) => {
    switch (blockType) {
      case 'video':
        return <Video className="h-5 w-5 text-red-500" />;
      case 'image':
        return <ImageIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleNavigateToQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  const handleNavigateToWorkshop = (workshopId) => {
    navigate(`/workshop/${workshopId}`);
  };

  const getSectionProgress = () => {
    const total = contentBlocks.length + workshops.length + quizzes.length;
    const completed = (progress.contentViewed ? 1 : 0) + 
                     progress.workshopsCompleted + 
                     progress.quizzesCompleted;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleMarkAsCompleted = async () => {
    try {
      await activitiesAPI.markComplete(id);
      setIsCompleted(true);
      toast.success('¡Actividad marcada como completada!');
      // Optionally navigate back or refresh the activity data
      // navigate(-1);
    } catch (error) {
      toast.error('Error al marcar la actividad como completada');
      console.error('Error marking activity complete:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Actividad no encontrada</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{activity.title}</h1>
            {activity.description && (
              <p className="text-gray-600 mt-2">{activity.description}</p>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{getSectionProgress()}%</div>
            <div className="text-sm text-gray-600">Progreso Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{contentBlocks.length}</div>
            <div className="text-sm text-gray-600">Contenidos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{workshops.length}</div>
            <div className="text-sm text-gray-600">Talleres</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{quizzes.length}</div>
            <div className="text-sm text-gray-600">Evaluaciones</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {contentBlocks.length > 0 && (
              <button
                onClick={() => setCurrentSection('content')}
                className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                  currentSection === 'content'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Contenido ({contentBlocks.length})
                </div>
              </button>
            )}
            
            {workshops.length > 0 && (
              <button
                onClick={() => setCurrentSection('workshops')}
                className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                  currentSection === 'workshops'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Talleres ({workshops.length})
                </div>
              </button>
            )}
            
            {quizzes.length > 0 && (
              <button
                onClick={() => setCurrentSection('quizzes')}
                className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                  currentSection === 'quizzes'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Evaluaciones ({quizzes.length})
                </div>
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {/* Content Section */}
          {currentSection === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Material de Estudio</h3>
                <span className="text-sm text-gray-500">
                  {contentBlocks.length} elemento{contentBlocks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {contentBlocks.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay contenido disponible en esta actividad</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {contentBlocks.map((block, index) => (
                    <div key={block.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Content Header */}
                      <div className="bg-gray-50 px-6 py-4 border-b">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full text-sm flex items-center justify-center font-medium">
                            {index + 1}
                          </div>
                          {getContentIcon(block.block_type)}
                          <span className="font-medium text-gray-700 capitalize">
                            {block.block_type === 'text' ? 'Lectura' : 
                             block.block_type === 'image' ? 'Imagen' : 'Video'}
                          </span>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-6">
                        {block.block_type === 'text' && block.content_text && (
                          <div className="prose max-w-none">
                            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {block.content_text}
                            </div>
                          </div>
                        )}

                        {block.block_type === 'image' && block.content_url && (
                          <div className="text-center">
                            <img
                              src={`${block.content_url}`}
                              alt="Contenido educativo"
                              className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                              style={{ maxHeight: '500px' }}
                            />
                            <div className="mt-3 flex justify-center">
                              <button
                                onClick={() => window.open(`${block.content_url}`, '_blank')}
                                className="btn-secondary text-sm flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Ver en tamaño completo
                              </button>
                            </div>
                          </div>
                        )}

                        {block.block_type === 'video' && block.content_url && (
                          <div className="text-center">
                            <video
                              controls
                              className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                              style={{ maxHeight: '400px' }}
                              preload="metadata"
                            >
                              <source src={`${block.content_url}`} type="video/mp4" />
                              Tu navegador no soporta el elemento de video.
                            </video>
                            <div className="mt-3 text-sm text-gray-500">
                              💡 Asegúrate de ver todo el video para mejor comprensión
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Workshops Section */}
          {currentSection === 'workshops' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Talleres Prácticos</h3>
                <span className="text-sm text-gray-500">
                  {workshops.length} taller{workshops.length !== 1 ? 'es' : ''}
                </span>
              </div>

              {workshops.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay talleres disponibles en esta actividad</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {workshops.map((workshop, index) => (
                    <div key={workshop.id} className="card hover:shadow-lg transition-all duration-200 border-l-4 border-purple-500">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-purple-600" />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{workshop.title}</h4>
                          
                          {workshop.description && (
                            <p className="text-gray-600 text-sm mb-3">{workshop.description}</p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <span>{workshop.question_count || 0} preguntas</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Sin límite de tiempo
                            </span>
                          </div>

                          {workshop.completed_score && (
                            <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-700">Puntuación obtenida:</span>
                                <span className={`font-medium ${
                                  workshop.completed_score >= 70 ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                  {workshop.completed_score}%
                                </span>
                              </div>
                            </div>
                          )}

                          {workshop.is_completed ? (
                            <div className="w-full flex items-center justify-center gap-2 py-3 bg-green-100 text-green-800 rounded-lg font-medium">
                              <CheckCircle className="h-4 w-4" />
                              Taller Completado
                            </div>
                          ) : (
                            <button
                              onClick={() => handleNavigateToWorkshop(workshop.id)}
                              className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                              <Play className="h-4 w-4" />
                              {workshop.attempt_count > 0 ? 'Segundo Intento' : 'Comenzar Taller'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quizzes Section */}
          {currentSection === 'quizzes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Evaluaciones</h3>
                <span className="text-sm text-gray-500">
                  {quizzes.length} evaluaci{quizzes.length !== 1 ? 'ones' : 'ón'}
                </span>
              </div>

              {quizzes.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay evaluaciones disponibles en esta actividad</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quizzes.map((quiz, index) => (
                    <div key={quiz.id} className="card hover:shadow-lg transition-all duration-200 border-l-4 border-green-500">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Target className="h-6 w-6 text-green-600" />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{quiz.title}</h4>
                          
                          {quiz.description && (
                            <p className="text-gray-600 text-sm mb-3">{quiz.description}</p>
                          )}

                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {quiz.total_questions || 0} preguntas
                            </div>
                            <div className="flex items-center gap-1">
                              <Award className="h-4 w-4" />
                              Mínimo {quiz.passing_score}%
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              30 minutos
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              {quiz.attempts || 0} intentos
                            </div>
                          </div>

                          {quiz.best_score && (
                            <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-700">Mejor puntuación:</span>
                                <span className={`font-medium ${
                                  quiz.best_score >= quiz.passing_score ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                  {quiz.best_score}%
                                </span>
                              </div>
                            </div>
                          )}

                          {quiz.is_completed ? (
                            <div className="w-full flex items-center justify-center gap-2 py-3 bg-green-100 text-green-800 rounded-lg font-medium">
                              <CheckCircle className="h-4 w-4" />
                              Evaluación Completada
                            </div>
                          ) : (
                            <button
                              onClick={() => handleNavigateToQuiz(quiz.id)}
                              className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                              <Target className="h-4 w-4" />
                              {quiz.attempts > 0 ? 'Segundo Intento' : 'Comenzar Evaluación'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">¿Completaste esta actividad?</h4>
            <p className="text-sm text-gray-600">
              Revisa todo el contenido, completa los talleres y toma las evaluaciones
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Curso
            </button>
            
            <button 
              onClick={handleMarkAsCompleted}
              disabled={isCompleted}
              className={`flex items-center gap-2 ${
                isCompleted 
                  ? 'bg-green-600 text-white cursor-not-allowed' 
                  : 'btn-primary'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Completada
                </>
              ) : (
                <>
                  Marcar como Completada
                  <CheckCircle className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentActivityView;