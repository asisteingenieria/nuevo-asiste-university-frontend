import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activitiesAPI, workshopsAPI, quizzesAPI, uploadAPI, contentBlocksAPI, workshopQuestionsAPI, gradesAPI } from '../services/api';
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
  BookOpen,
  CheckCircle,
  Settings,
  HelpCircle,
  MoveUp,
  MoveDown,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

const ActivityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isFormador } = useAuth();
  const [activity, setActivity] = useState(null);
  const [contentBlocks, setContentBlocks] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('content'); // 'content', 'workshop', 'quiz'
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Content block form data
  const [contentBlockData, setContentBlockData] = useState({
    block_type: 'text',
    content_text: '',
    content_url: '',
    order_index: 0
  });

  // Workshop form data
  const [workshopData, setWorkshopData] = useState({
    title: '',
    description: '',
    order_index: 0
  });

  // Workshop question data
  const [workshopQuestion, setWorkshopQuestion] = useState({
    question: '',
    option_a_image: '',
    option_b_image: '',
    option_c_image: '',
    option_d_image: '',
    correct_answer: 'A',
    points: 1
  });

  // Quiz form data
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    passing_score: 70,
    max_attempts: 1,
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    points: 1
  });

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
      setWorkshops(workshopsRes.data.workshops);
      setQuizzes(quizzesRes.data.quizzes);
    } catch (error) {
      toast.error('Error al cargar detalles de la actividad');
      console.error('Error fetching activity details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file, type) => {
    try {
      setUploading(true);
      let response;
      
      if (type === 'video') {
        response = await uploadAPI.uploadVideo(file);
      } else if (type === 'image') {
        response = await uploadAPI.uploadImage(file);
      }
      
      return response.data.fileUrl;
    } catch (error) {
      toast.error('Error al subir archivo');
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Content Block Functions
  const handleContentBlockSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...contentBlockData,
        activity_id: parseInt(id),
        order_index: parseInt(contentBlockData.order_index)
      };

      if (editingItem && modalType === 'content') {
        await contentBlocksAPI.update(editingItem.id, data);
        toast.success('Bloque de contenido actualizado exitosamente');
      } else {
        await contentBlocksAPI.create(data);
        toast.success('Bloque de contenido creado exitosamente');
      }
      
      closeModal();
      fetchActivityDetails();
    } catch (error) {
      const message = error.response?.data?.message || 'Error al guardar bloque de contenido';
      toast.error(message);
    }
  };

  const handleWorkshopSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...workshopData,
        activity_id: parseInt(id),
        order_index: parseInt(workshopData.order_index)
      };

      if (editingItem && modalType === 'workshop') {
        await workshopsAPI.update(editingItem.id, data);
        toast.success('Taller actualizado exitosamente');
      } else {
        await workshopsAPI.create(data);
        toast.success('Taller creado exitosamente');
      }
      
      closeModal();
      fetchActivityDetails();
    } catch (error) {
      const message = error.response?.data?.message || 'Error al guardar taller';
      toast.error(message);
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...quizData,
        activity_id: parseInt(id),
        questions: quizData.questions
      };

      if (editingItem && modalType === 'quiz') {
        await quizzesAPI.update(editingItem.id, data);
        toast.success('Quiz actualizado exitosamente');
      } else {
        await quizzesAPI.create(data);
        toast.success('Quiz creado exitosamente');
      }
      
      closeModal();
      fetchActivityDetails();
    } catch (error) {
      const message = error.response?.data?.message || 'Error al guardar quiz';
      toast.error(message);
    }
  };

  // Algoritmo para distribuir puntos automáticamente
  const calculateAutoPoints = (totalQuestions) => {
    if (totalQuestions === 0) return [];
    
    const basePoints = Math.floor(100 / totalQuestions);
    const remainder = 100 - (basePoints * totalQuestions);
    
    const pointsArray = new Array(totalQuestions).fill(basePoints);
    
    // Distribuir el resto empezando desde las primeras preguntas
    for (let i = 0; i < remainder; i++) {
      pointsArray[i] += 1;
    }
    
    return pointsArray;
  };

  const redistributePoints = (questions) => {
    const autoPoints = calculateAutoPoints(questions.length);
    return questions.map((question, index) => ({
      ...question,
      points: autoPoints[index]
    }));
  };

  const addQuestion = () => {
    if (currentQuestion.question.trim() && currentQuestion.options.some(opt => opt.trim())) {
      const newQuestions = [...quizData.questions, { ...currentQuestion }];
      const questionsWithAutoPoints = redistributePoints(newQuestions);
      
      setQuizData({
        ...quizData,
        questions: questionsWithAutoPoints
      });
      setCurrentQuestion({
        question: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        points: 1
      });
    }
  };

  const removeQuestion = (index) => {
    const filteredQuestions = quizData.questions.filter((_, i) => i !== index);
    const questionsWithAutoPoints = redistributePoints(filteredQuestions);
    
    setQuizData({
      ...quizData,
      questions: questionsWithAutoPoints
    });
  };

  const openContentModal = (block = null) => {
    setModalType('content');
    setEditingItem(block);
    if (block) {
      setContentBlockData({
        block_type: block.block_type,
        content_text: block.content_text || '',
        content_url: block.content_url || '',
        order_index: block.order_index
      });
    } else {
      setContentBlockData({
        block_type: 'text',
        content_text: '',
        content_url: '',
        order_index: contentBlocks.length
      });
    }
    setShowModal(true);
  };

  const openWorkshopModal = (workshop = null) => {
    setModalType('workshop');
    setEditingItem(workshop);
    if (workshop) {
      setWorkshopData({
        title: workshop.title,
        description: workshop.description || '',
        order_index: workshop.order_index
      });
    } else {
      setWorkshopData({
        title: '',
        description: '',
        order_index: workshops.length
      });
    }
    setShowModal(true);
  };

  const openQuizModal = (quiz = null) => {
    setModalType('quiz');
    setEditingItem(quiz);
    if (quiz) {
      setQuizData({
        title: quiz.title,
        description: quiz.description || '',
        passing_score: quiz.passing_score,
        max_attempts: quiz.max_attempts || 1,
        questions: quiz.questions || []
      });
    } else {
      setQuizData({
        title: '',
        description: '',
        passing_score: 70,
        max_attempts: 1,
        questions: []
      });
    }
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      points: 1
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('content');
    setEditingItem(null);
    setContentBlockData({
      block_type: 'text',
      content_text: '',
      content_url: '',
      order_index: 0
    });
    setWorkshopData({
      title: '',
      description: '',
      order_index: 0
    });
    setQuizData({
      title: '',
      description: '',
      passing_score: 70,
      max_attempts: 1,
      questions: []
    });
  };

  const handleResetQuizGrades = async (quizId, quizTitle) => {
    if (!window.confirm(`¿Resetear los intentos de TODOS los estudiantes en "${quizTitle}"?\n\nEsto eliminará todas las calificaciones actuales y permitirá que los estudiantes presenten el quiz nuevamente con la corrección aplicada.`)) return;
    try {
      const res = await gradesAPI.resetAllQuizGrades(quizId);
      toast.success(`Intentos reseteados: ${res.data.deletedAttempts} calificación(es) eliminadas. Los estudiantes ya pueden presentar el quiz.`);
    } catch (error) {
      toast.error('Error al resetear calificaciones');
      console.error(error);
    }
  };

  const handleDelete = async (type, itemId) => {
    const itemName = type === 'workshop' ? 'taller' : type === 'quiz' ? 'quiz' : 'bloque de contenido';
    if (window.confirm(`¿Estás seguro de que quieres eliminar este ${itemName}?`)) {
      try {
        if (type === 'workshop') {
          await workshopsAPI.delete(itemId);
        } else if (type === 'quiz') {
          await quizzesAPI.delete(itemId);
        } else if (type === 'content') {
          await contentBlocksAPI.delete(itemId);
        }
        toast.success(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} eliminado exitosamente`);
        fetchActivityDetails();
      } catch (error) {
        toast.error(`Error al eliminar ${itemName}`);
      }
    }
  };

  const getContentIcon = (blockType) => {
    switch (blockType) {
      case 'video':
        return <Video className="h-5 w-5 text-red-500" />;
      case 'image':
        return <Image className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
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

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('content')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contenido ({contentBlocks.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('workshops')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'workshops'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Talleres ({workshops.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'quizzes'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Quizzes ({quizzes.length})
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Contenido de la Actividad</h3>
                {(isAdmin() || isFormador()) && (
                  <button
                    onClick={() => openContentModal()}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Contenido
                  </button>
                )}
              </div>

              {contentBlocks.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No hay contenido en esta actividad</p>
                  {(isAdmin() || isFormador()) && (
                    <button
                      onClick={() => openContentModal()}
                      className="btn-primary"
                    >
                      Agregar Primer Bloque
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {contentBlocks.map((block, index) => (
                    <div key={block.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center justify-center font-medium">
                              {index + 1}
                            </span>
                            {getContentIcon(block.block_type)}
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {block.block_type === 'text' ? 'Texto' : block.block_type === 'image' ? 'Imagen' : 'Video'}
                            </span>
                          </div>
                          
                          {block.block_type === 'text' && block.content_text && (
                            <div className="prose max-w-none">
                              <p className="text-gray-700">{block.content_text}</p>
                            </div>
                          )}

                          {block.block_type === 'image' && block.content_url && (
                            <img
                              src={`${block.content_url}`}
                              alt="Contenido"
                              className="max-w-md rounded-lg"
                            />
                          )}

                          {block.block_type === 'video' && block.content_url && (
                            <video controls className="max-w-md rounded-lg">
                              <source src={`${block.content_url}`} type="video/mp4" />
                              Tu navegador no soporta el elemento de video.
                            </video>
                          )}
                        </div>

                        {(isAdmin() || isFormador()) && (
                          <div className="flex gap-1 ml-4">
                            <button
                              onClick={() => openContentModal(block)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('content', block.id)}
                              className="text-red-600 hover:text-red-900 p-1"
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
          )}

          {/* Workshops Tab */}
          {activeTab === 'workshops' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Talleres Prácticos</h3>
                {(isAdmin() || isFormador()) && (
                  <button
                    onClick={() => openWorkshopModal()}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nuevo Taller
                  </button>
                )}
              </div>

              {workshops.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No hay talleres en esta actividad</p>
                  {(isAdmin() || isFormador()) && (
                    <button
                      onClick={() => openWorkshopModal()}
                      className="btn-primary"
                    >
                      Crear Primer Taller
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {workshops.map((workshop, index) => (
                    <div key={workshop.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center font-medium">
                              {index + 1}
                            </span>
                            <BookOpen className="h-5 w-5 text-blue-500" />
                            <h4 className="font-medium text-gray-900">{workshop.title}</h4>
                          </div>
                          
                          {workshop.description && (
                            <p className="text-gray-600 text-sm ml-8 mb-2">{workshop.description}</p>
                          )}

                          <div className="flex items-center gap-4 ml-8 text-sm text-gray-500">
                            <span>{workshop.question_count || 0} preguntas</span>
                            <button
                              onClick={() => navigate(`/workshops/${workshop.id}`)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Gestionar preguntas →
                            </button>
                          </div>
                        </div>

                        {(isAdmin() || isFormador()) && (
                          <div className="flex gap-1 ml-4">
                            <button
                              onClick={() => openWorkshopModal(workshop)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('workshop', workshop.id)}
                              className="text-red-600 hover:text-red-900 p-1"
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
          )}

          {/* Quizzes Tab */}
          {activeTab === 'quizzes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Evaluaciones</h3>
                {(isAdmin() || isFormador()) && (
                  <button
                    onClick={() => openQuizModal()}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nuevo Quiz
                  </button>
                )}
              </div>

              {quizzes.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No hay quizzes en esta actividad</p>
                  {(isAdmin() || isFormador()) && (
                    <button
                      onClick={() => openQuizModal()}
                      className="btn-primary"
                    >
                      Crear Primer Quiz
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {quizzes.map((quiz, index) => (
                    <div key={quiz.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs flex items-center justify-center font-medium">
                              {index + 1}
                            </span>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <h4 className="font-medium text-gray-900">{quiz.title}</h4>
                          </div>
                          
                          {quiz.description && (
                            <p className="text-gray-600 text-sm ml-8 mb-2">{quiz.description}</p>
                          )}

                          <div className="flex items-center gap-4 ml-8 text-sm text-gray-500">
                            <span>{quiz.total_questions || 0} preguntas</span>
                            <span>Nota mínima: {quiz.passing_score}%</span>
                            <span className={`font-medium ${quiz.max_attempts > 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                              {quiz.max_attempts > 1 ? `✓ ${quiz.max_attempts} intentos` : '1 intento'}
                            </span>
                          </div>
                        </div>

                        {(isAdmin() || isFormador()) && (
                          <div className="flex gap-1 ml-4 items-center">
                            <button
                              onClick={() => handleResetQuizGrades(quiz.id, quiz.title)}
                              className="text-orange-500 hover:text-orange-700 p-1"
                              title="Resetear intentos de todos los estudiantes"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openQuizModal(quiz)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('quiz', quiz.id)}
                              className="text-red-600 hover:text-red-900 p-1"
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
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {modalType === 'content' 
                ? (editingItem ? 'Editar Contenido' : 'Nuevo Contenido')
                : modalType === 'workshop'
                ? (editingItem ? 'Editar Taller' : 'Nuevo Taller')
                : (editingItem ? 'Editar Quiz' : 'Nuevo Quiz')
              }
            </h3>
            
            {modalType === 'content' ? (
              <form onSubmit={handleContentBlockSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Tipo de Contenido</label>
                  <select
                    value={contentBlockData.block_type}
                    onChange={(e) => setContentBlockData({...contentBlockData, block_type: e.target.value})}
                    className="form-input"
                  >
                    <option value="text">Texto</option>
                    <option value="image">Imagen</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                {contentBlockData.block_type === 'text' ? (
                  <div>
                    <label className="form-label">Contenido de Texto</label>
                    <textarea
                      value={contentBlockData.content_text}
                      onChange={(e) => setContentBlockData({...contentBlockData, content_text: e.target.value})}
                      className="form-input h-32 resize-none"
                      placeholder="Escribe el contenido aquí..."
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="form-label">Subir {contentBlockData.block_type === 'video' ? 'Video' : 'Imagen'}</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        accept={contentBlockData.block_type === 'video' ? 'video/*' : 'image/*'}
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            try {
                              const fileUrl = await handleFileUpload(file, contentBlockData.block_type);
                              setContentBlockData({...contentBlockData, content_url: fileUrl});
                              toast.success('Archivo subido exitosamente');
                            } catch (error) {
                              // Error handling is done in handleFileUpload
                            }
                          }
                        }}
                        className="hidden"
                        id="content-file-upload"
                      />
                      <label 
                        htmlFor="content-file-upload" 
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          {uploading ? 'Subiendo...' : `Subir ${contentBlockData.block_type === 'video' ? 'video' : 'imagen'}`}
                        </span>
                      </label>
                      
                      {contentBlockData.content_url && (
                        <div className="mt-2 text-sm text-green-600">
                          ✓ Archivo subido exitosamente
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || (contentBlockData.block_type === 'text' ? !contentBlockData.content_text : !contentBlockData.content_url)}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {uploading ? 'Subiendo...' : editingItem ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            ) : modalType === 'workshop' ? (
              <form onSubmit={handleWorkshopSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Título del Taller</label>
                  <input
                    type="text"
                    required
                    value={workshopData.title}
                    onChange={(e) => setWorkshopData({...workshopData, title: e.target.value})}
                    className="form-input"
                    placeholder="Nombre del taller"
                  />
                </div>

                <div>
                  <label className="form-label">Descripción</label>
                  <textarea
                    value={workshopData.description}
                    onChange={(e) => setWorkshopData({...workshopData, description: e.target.value})}
                    className="form-input h-20 resize-none"
                    placeholder="Descripción del taller..."
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Después de crear el taller, podrás agregar preguntas con respuestas de imagen (A, B, C, D) haciendo clic en "Gestionar preguntas" en el taller.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    {editingItem ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleQuizSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Título del Quiz</label>
                  <input
                    type="text"
                    required
                    value={quizData.title}
                    onChange={(e) => setQuizData({...quizData, title: e.target.value})}
                    className="form-input"
                    placeholder="Nombre del quiz"
                  />
                </div>

                <div>
                  <label className="form-label">Descripción</label>
                  <textarea
                    value={quizData.description}
                    onChange={(e) => setQuizData({...quizData, description: e.target.value})}
                    className="form-input h-20 resize-none"
                    placeholder="Descripción del quiz..."
                  />
                </div>

                <div>
                  <label className="form-label">Nota Mínima para Aprobar (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quizData.passing_score}
                    onChange={(e) => setQuizData({...quizData, passing_score: parseInt(e.target.value)})}
                    className="form-input"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <label className="font-medium text-gray-900 text-sm">Permitir 2 intentos</label>
                    <p className="text-xs text-gray-500 mt-0.5">Los estudiantes podrán realizar el quiz hasta 2 veces</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuizData({...quizData, max_attempts: quizData.max_attempts === 2 ? 1 : 2})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      quizData.max_attempts === 2 ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        quizData.max_attempts === 2 ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Questions Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Preguntas</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Los puntos se distribuyen automáticamente para totalizar 100 puntos
                      </p>
                    </div>
                  </div>
                  
                  {/* Add Question Form */}
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg mb-4">
                    <div>
                      <input
                        type="text"
                        value={currentQuestion.question}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                        className="form-input"
                        placeholder="Escribe la pregunta..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correct"
                            checked={currentQuestion.correct_answer === index}
                            onChange={() => setCurrentQuestion({...currentQuestion, correct_answer: index})}
                            className="text-primary-600"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...currentQuestion.options];
                              newOptions[index] = e.target.value;
                              setCurrentQuestion({...currentQuestion, options: newOptions});
                            }}
                            className="form-input flex-1"
                            placeholder={`Opción ${index + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-blue-600 font-medium">
                        ✨ Puntos calculados automáticamente
                      </div>
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="btn-primary text-sm"
                      >
                        Agregar Pregunta
                      </button>
                    </div>
                  </div>

                  {/* Questions List */}
                  {quizData.questions.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium text-gray-900">Preguntas Agregadas ({quizData.questions.length})</h5>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-600">
                            Total: <span className="font-medium text-green-600">
                              {quizData.questions.reduce((sum, q) => sum + q.points, 0)}/100 puntos
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setQuizData({...quizData, questions: redistributePoints(quizData.questions)})}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            title="Redistribuir automáticamente 100 puntos entre todas las preguntas"
                          >
                            🎯 Auto-distribuir puntos
                          </button>
                        </div>
                      </div>
                      {quizData.questions.map((question, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 mb-2">{index + 1}. {question.question}</p>
                              <div className="space-y-1">
                                {question.options.map((option, optIndex) => (
                                  <div key={optIndex} className={`text-sm ${
                                    optIndex === question.correct_answer ? 'text-green-600 font-medium' : 'text-gray-600'
                                  }`}>
                                    {optIndex === question.correct_answer ? '✓' : '○'} {option}
                                  </div>
                                ))}
                              </div>
                              <div className="text-xs text-gray-500 mt-2">Puntos: {question.points}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeQuestion(index)}
                              className="text-red-600 hover:text-red-900 ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={quizData.questions.length === 0}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {editingItem ? 'Actualizar' : 'Crear'} Quiz
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityDetail;