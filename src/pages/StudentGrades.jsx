import { useState, useEffect } from 'react';
import { gradesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Award,
  CheckCircle,
  XCircle,
  X,
  Clock,
  TrendingUp,
  Target,
  BookOpen,
  Calendar,
  Star,
  ChevronRight,
  BarChart3,
  Users,
  Play,
  Trophy,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const StudentGrades = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [view, setView] = useState('overview');
  const [previewModal, setPreviewModal] = useState(null);

  useEffect(() => {
    fetchCoursesProgress();
  }, []);

  const fetchCoursesProgress = async () => {
    try {
      setLoading(true);
      const coursesRes = await gradesAPI.getMyCoursesProgress();
      setCourses(coursesRes.data.courses || []);
    } catch (error) {
      toast.error('Error al cargar progreso de cursos');
      console.error('Error fetching courses progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async (courseId) => {
    try {
      setDetailsLoading(true);
      const detailsRes = await gradesAPI.getCourseDetails(courseId);
      setCourseDetails(detailsRes.data);
      setView('details');
    } catch (error) {
      toast.error('Error al cargar detalles del curso');
      console.error('Error fetching course details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const CircularProgress = ({ percentage, size = 140, strokeWidth = 10, color = 'text-blue-600', showIcon = true }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    const getGradientId = () => `gradient-${percentage}-${Math.random().toString(36).substr(2, 9)}`;
    const gradientId = getGradientId();

    const getProgressIcon = () => {
      if (percentage >= 90) return <Trophy className="h-6 w-6 text-yellow-500" />;
      if (percentage >= 70) return <Award className="h-6 w-6 text-blue-500" />;
      if (percentage >= 50) return <Target className="h-6 w-6 text-green-500" />;
      return <Clock className="h-6 w-6 text-orange-500" />;
    };

    return (
      <div className="relative inline-flex items-center justify-center p-4">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-gray-50 shadow-lg"></div>
        <svg className="transform -rotate-90 relative z-10" width={size} height={size}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {percentage >= 90 ? (
                <>
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" />
                </>
              ) : percentage >= 70 ? (
                <>
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </>
              ) : percentage >= 50 ? (
                <>
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#DC2626" />
                </>
              )}
            </linearGradient>
          </defs>
          
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
          />
        </svg>
        
        <div className="absolute flex flex-col items-center justify-center z-20">
          <div className="text-3xl font-bold text-gray-900 mb-1">{percentage}%</div>
          {showIcon && (
            <div className="transition-all duration-300 transform hover:scale-110">
              {getProgressIcon()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 70) return 'text-blue-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    fetchCourseDetails(course.id);
  };

  const openPreview = async (type, gradeId, title) => {
    setPreviewModal({ type, gradeId, title, data: null, loading: true });
    try {
      const res = type === 'quiz'
        ? await gradesAPI.getQuizDetail(gradeId)
        : await gradesAPI.getWorkshopDetail(gradeId);
      setPreviewModal(prev => prev?.gradeId === gradeId ? { ...prev, data: res.data, loading: false } : prev);
    } catch {
      toast.error('Error al cargar detalles de las preguntas');
      setPreviewModal(null);
    }
  };

  const closePreview = () => setPreviewModal(null);

  const handleBackToOverview = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setView('overview');
    setSelectedCourse(null);
    setCourseDetails(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Render course details view
  if (view === 'details' && selectedCourse) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBackToOverview}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver a Mis Notas"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{selectedCourse.title}</h1>
            <p className="text-gray-600 mt-2">Detalle de calificaciones y progreso</p>
          </div>
        </div>

        {detailsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : courseDetails ? (
          <>
            {/* Course Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Actividades</p>
                    <p className="text-2xl font-semibold text-gray-900">{courseDetails.activities.length}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Evaluaciones</p>
                    <p className="text-2xl font-semibold text-gray-900">{courseDetails.summary.total_quiz_grades}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Talleres</p>
                    <p className="text-2xl font-semibold text-gray-900">{courseDetails.summary.total_workshop_grades}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Promedio</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {courseDetails.summary.overall_score || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quizzes Section */}
            {(() => {
              const allQuizGrades = courseDetails.activities.flatMap(a =>
                a.quiz_grades.map(g => ({ ...g, activity_title: a.title }))
              );
              return allQuizGrades.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="h-6 w-6 text-green-600" />
                    Evaluaciones (Quizzes)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allQuizGrades.map((grade) => (
                      <div key={grade.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{grade.activity_title}</p>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-800 flex-1 mr-2">{grade.quiz_title}</h3>
                          <span className={`text-sm px-3 py-1 rounded-full font-semibold flex-shrink-0 ${getScoreColor(grade.percentage)}`}>
                            {grade.percentage}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          {new Date(grade.completed_at).toLocaleDateString('es-ES')} • Intento #{grade.attempt_number} • {grade.score}/{grade.max_score} pts • Mínimo: {grade.passing_score}%
                        </div>
                        <button
                          onClick={() => openPreview('quiz', grade.id, grade.quiz_title)}
                          className="w-full text-xs font-medium text-green-600 hover:text-green-800 border border-green-200 hover:border-green-400 hover:bg-green-50 rounded-lg py-2 transition-colors"
                        >
                          Ver respuestas por pregunta
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Talleres Section */}
            {(() => {
              const allWorkshopGrades = courseDetails.activities.flatMap(a =>
                a.workshop_grades.map(g => ({ ...g, activity_title: a.title }))
              );
              return allWorkshopGrades.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-purple-600" />
                    Talleres
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allWorkshopGrades.map((grade) => (
                      <div key={grade.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{grade.activity_title}</p>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-800 flex-1 mr-2">{grade.workshop_title}</h3>
                          <span className={`text-sm px-3 py-1 rounded-full font-semibold flex-shrink-0 ${getScoreColor(grade.percentage)}`}>
                            {grade.percentage}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          {new Date(grade.completed_at).toLocaleDateString('es-ES')} • Intento #{grade.attempt_number} • {grade.score}/{grade.max_score} pts
                        </div>
                        <button
                          onClick={() => openPreview('workshop', grade.id, grade.workshop_title)}
                          className="w-full text-xs font-medium text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-lg py-2 transition-colors"
                        >
                          Ver respuestas por pregunta
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {courseDetails.activities.every(a => !a.has_grades) && (
              <div className="card text-center py-8">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No hay calificaciones registradas en este curso</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No se pudieron cargar los detalles del curso</p>
          </div>
        )}

      {/* Per-question preview modal */}
      {previewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
          onClick={closePreview}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {previewModal.type === 'quiz' ? 'Evaluación' : 'Taller'}
                </p>
                <h2 className="text-lg font-bold text-gray-900">{previewModal.title}</h2>
              </div>
              <button onClick={closePreview} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {previewModal.loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : previewModal.data ? (
              <div className="p-6 space-y-4">
                {/* Score summary */}
                <div className={`rounded-xl p-4 text-center ${getScoreColor(previewModal.data.grade.percentage)}`}>
                  <div className="text-4xl font-bold mb-1">{previewModal.data.grade.percentage}%</div>
                  <div className="text-sm">
                    {previewModal.data.grade.score}/{previewModal.data.grade.max_score} puntos
                    {previewModal.data.grade.passing_score ? ` • Aprobación: ${previewModal.data.grade.passing_score}%` : ''}
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    Intento #{previewModal.data.grade.attempt_number} • {new Date(previewModal.data.grade.completed_at).toLocaleDateString('es-ES')}
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {previewModal.data.questions.map((q, idx) => {
                    const isQuiz = previewModal.type === 'quiz';
                    const optionLabels = ['A', 'B', 'C', 'D'];
                    const options = isQuiz
                      ? (q.options || []).map((text, i) => ({ label: optionLabels[i], text, index: i }))
                      : optionLabels.map(l => {
                          const opt = q.options[l];
                          const text = opt && typeof opt === 'object' ? opt.text : opt;
                          const image = opt && typeof opt === 'object' ? opt.image : null;
                          return { label: l, text, image };
                        }).filter(o => o.text || o.image);

                    return (
                      <div key={q.id} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            q.is_correct ? 'bg-green-100 text-green-700' : q.student_answer === null ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800 font-medium">{q.question}</p>
                            {q.question_image && (
                              <img src={q.question_image} alt="Imagen de la pregunta" className="mt-2 max-h-32 rounded border border-gray-200 object-cover" />
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {q.is_correct
                              ? <CheckCircle className="h-5 w-5 text-green-500" />
                              : q.student_answer === null
                                ? <Clock className="h-5 w-5 text-gray-400" />
                                : <XCircle className="h-5 w-5 text-red-500" />
                            }
                          </div>
                        </div>

                        <div className="space-y-2 ml-10">
                          {options.map((opt) => {
                            const isCorrect = isQuiz ? opt.index === q.correct_answer : opt.label === q.correct_answer;
                            const isSelected = isQuiz ? opt.index === q.student_answer : opt.label === q.student_answer;
                            return (
                              <div key={opt.label} className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm border ${
                                isCorrect && isSelected ? 'bg-green-50 border-green-400 text-green-800' :
                                isCorrect ? 'bg-green-50 border-green-300 text-green-700' :
                                isSelected ? 'bg-red-50 border-red-300 text-red-700' :
                                'bg-gray-50 border-gray-200 text-gray-500'
                              }`}>
                                <span className="font-bold w-4 flex-shrink-0 mt-0.5">{opt.label}.</span>
                                <span className="flex-1">
                                  {opt.text || null}
                                  {opt.image && (
                                    <img src={opt.image} alt={`Opción ${opt.label}`} className="max-h-20 rounded object-cover mt-1" />
                                  )}
                                </span>
                                <div className="flex flex-col gap-1 flex-shrink-0 items-end">
                                  {isSelected && isCorrect && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                      <CheckCircle className="h-3 w-3" /> Tu respuesta ✓
                                    </span>
                                  )}
                                  {isSelected && !isCorrect && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                      <XCircle className="h-3 w-3" /> Tu respuesta
                                    </span>
                                  )}
                                  {isCorrect && !isSelected && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                      <CheckCircle className="h-3 w-3" /> Correcta
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {q.student_answer === null && (
                          <p className="text-xs text-orange-500 ml-10 mt-2">Sin respuesta registrada</p>
                        )}
                        <p className="text-xs text-gray-400 ml-10 mt-2">
                          {q.points} {q.points === 1 ? 'punto' : 'puntos'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">No se pudieron cargar los detalles</div>
            )}
          </div>
        </div>
      )}
      </div>
    );
  }

  // Render courses overview
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Notas</h1>
          <p className="text-gray-600 mt-2">Progreso y calificaciones por curso</p>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cursos Asignados</p>
              <p className="text-2xl font-semibold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Evaluaciones Totales</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courses.reduce((sum, course) => sum + (course.total_evaluations || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promedio General</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courses.length > 0 ? Math.round(courses.reduce((sum, course) => sum + (course.overall_score || 0), 0) / courses.length) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Progreso Promedio</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courses.length > 0 ? Math.round(courses.reduce((sum, course) => sum + (course.progress_percentage || 0), 0) / courses.length) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Progreso por Curso</h2>
        
        {courses.length === 0 ? (
          <div className="card text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No tienes cursos asignados</p>
            <p className="text-sm text-gray-400">Los cursos aparecerán aquí cuando estén disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div 
                key={course.id} 
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] border border-gray-100 overflow-hidden"
                onClick={() => handleCourseClick(course)}
              >
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-60"></div>
                
                {/* Content */}
                <div className="relative z-10 p-6">
                  {/* Header with Progress */}
                  <div className="text-center mb-6">
                    <CircularProgress 
                      percentage={course.progress_percentage || 0} 
                      size={120}
                      showIcon={true}
                    />
                  </div>
                  
                  {/* Course Info */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                        {course.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white bg-opacity-70 rounded-xl p-3 text-center border border-gray-100">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{course.total_activities || 0}</div>
                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Actividades</div>
                    </div>
                    <div className="bg-white bg-opacity-70 rounded-xl p-3 text-center border border-gray-100">
                      <div className="text-2xl font-bold text-green-600 mb-1">{course.total_evaluations || 0}</div>
                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Evaluaciones</div>
                    </div>
                  </div>
                  
                  {/* Score Badge */}
                  {course.overall_score > 0 ? (
                    <div className="mb-4 flex justify-center">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-md ${getScoreColor(course.overall_score)}`}>
                        <Trophy className="h-4 w-4" />
                        Promedio: {course.overall_score}%
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 flex justify-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                        <Clock className="h-4 w-4" />
                        Sin calificaciones
                      </div>
                    </div>
                  )}
                  
                  {/* Action Button */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl py-3 px-4 group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                    <div className="flex items-center justify-center gap-2 font-semibold">
                      <span>Ver detalles</span>
                      <ChevronRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Zap className="h-6 w-6 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              💡 Consejos para mejorar tus calificaciones
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Haz clic en cada curso para ver detalles de tus calificaciones</span>
              </div>
              
              <div className="flex items-start gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500 mt-0.5" />
                <span>Los círculos muestran tu progreso general en cada curso</span>
              </div>
              
              <div className="flex items-start gap-2">
                <Trophy className="h-4 w-4 text-yellow-500 mt-0.5" />
                <span>Mantén un promedio de 80% o más para un excelente desempeño</span>
              </div>
              
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5" />
                <span>Revisa las actividades donde tuviste menor puntuación</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;