import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workshopsAPI, workshopQuestionsAPI, uploadAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Image,
  Settings,
  HelpCircle,
  CheckCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_QUESTION = {
  question: '',
  question_image: '',
  option_a_text: '',
  option_b_text: '',
  option_c_text: '',
  option_d_text: '',
  option_a_image: '',
  option_b_image: '',
  option_c_image: '',
  option_d_image: '',
  correct_answer: 'A',
  points: 1
};

const WorkshopDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [workshop, setWorkshop] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [uploading, setUploading] = useState({});
  const [questionData, setQuestionData] = useState(INITIAL_QUESTION);

  useEffect(() => {
    fetchWorkshopDetails();
  }, [id]);

  const fetchWorkshopDetails = async () => {
    try {
      setLoading(true);
      const [workshopRes, questionsRes] = await Promise.all([
        workshopsAPI.getById(id),
        workshopQuestionsAPI.getByWorkshop(id)
      ]);
      setWorkshop(workshopRes.data.workshop);
      setQuestions(questionsRes.data.questions || []);
    } catch (error) {
      toast.error('Error al cargar detalles del taller');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file, imageKey) => {
    try {
      setUploading(prev => ({ ...prev, [imageKey]: true }));
      const response = await uploadAPI.uploadImage(file);
      setQuestionData(prev => ({ ...prev, [imageKey]: response.data.fileUrl }));
      toast.success('Imagen subida exitosamente');
    } catch (error) {
      toast.error('Error al subir imagen');
    } finally {
      setUploading(prev => ({ ...prev, [imageKey]: false }));
    }
  };

  const calculateAutoPointsWorkshop = (totalQuestions) => {
    if (totalQuestions === 0) return [];
    const basePoints = Math.floor(100 / totalQuestions);
    const remainder = 100 - basePoints * totalQuestions;
    const pointsArray = new Array(totalQuestions).fill(basePoints);
    for (let i = 0; i < remainder; i++) pointsArray[i] += 1;
    return pointsArray;
  };

  const redistributePointsWorkshop = async () => {
    const autoPoints = calculateAutoPointsWorkshop(questions.length);
    try {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await workshopQuestionsAPI.update(q.id, {
          question: q.question,
          question_image: q.question_image,
          option_a_text: q.option_a_text,
          option_b_text: q.option_b_text,
          option_c_text: q.option_c_text,
          option_d_text: q.option_d_text,
          option_a_image: q.option_a_image,
          option_b_image: q.option_b_image,
          option_c_image: q.option_c_image,
          option_d_image: q.option_d_image,
          correct_answer: q.correct_answer,
          points: autoPoints[i]
        });
      }
      toast.success('Puntos redistribuidos automáticamente');
      fetchWorkshopDetails();
    } catch (error) {
      toast.error('Error al redistribuir puntos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const autoPoints = calculateAutoPointsWorkshop(questions.length + 1);
      const data = {
        ...questionData,
        workshop_id: parseInt(id),
        points: editingQuestion ? parseInt(questionData.points) : autoPoints[questions.length]
      };

      if (editingQuestion) {
        await workshopQuestionsAPI.update(editingQuestion.id, data);
        toast.success('Pregunta actualizada exitosamente');
      } else {
        await workshopQuestionsAPI.create(data);
        toast.success('Pregunta creada exitosamente');
        setTimeout(() => redistributePointsWorkshop(), 500);
      }

      closeModal();
      fetchWorkshopDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar pregunta');
    }
  };

  const openModal = (question = null) => {
    setEditingQuestion(question);
    if (question) {
      setQuestionData({
        question: question.question,
        question_image: question.question_image || '',
        option_a_text: question.option_a_text || '',
        option_b_text: question.option_b_text || '',
        option_c_text: question.option_c_text || '',
        option_d_text: question.option_d_text || '',
        option_a_image: question.option_a_image || '',
        option_b_image: question.option_b_image || '',
        option_c_image: question.option_c_image || '',
        option_d_image: question.option_d_image || '',
        correct_answer: question.correct_answer,
        points: question.points
      });
    } else {
      setQuestionData(INITIAL_QUESTION);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingQuestion(null);
    setQuestionData(INITIAL_QUESTION);
    setUploading({});
  };

  const handleDelete = async (questionId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      try {
        await workshopQuestionsAPI.delete(questionId);
        toast.success('Pregunta eliminada exitosamente');
        fetchWorkshopDetails();
      } catch (error) {
        toast.error('Error al eliminar pregunta');
      }
    }
  };

  const optionHasValue = (letter) => {
    const textKey = `option_${letter.toLowerCase()}_text`;
    const imageKey = `option_${letter.toLowerCase()}_image`;
    return !!(questionData[textKey] || questionData[imageKey]);
  };

  const isAnyUploading = Object.values(uploading).some(Boolean);

  // Each option has a text field + image upload, both optional, but at least one required
  const renderOptionInput = (textKey, imageKey, letter) => (
    <div className="space-y-3 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700">Opción {letter}</span>
        <div className="flex items-center gap-2">
          <input
            type="radio"
            name="correct_answer"
            value={letter}
            checked={questionData.correct_answer === letter}
            onChange={(e) => setQuestionData(prev => ({ ...prev, correct_answer: e.target.value }))}
            id={`correct-${letter}`}
            className="text-green-600"
          />
          <label htmlFor={`correct-${letter}`} className="text-sm text-gray-600 cursor-pointer">
            Respuesta correcta
          </label>
        </div>
      </div>

      {/* Text field */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Texto (opcional)</label>
        <input
          type="text"
          value={questionData[textKey]}
          onChange={(e) => setQuestionData(prev => ({ ...prev, [textKey]: e.target.value }))}
          className="form-input text-sm"
          placeholder={`Ej: Aseguradora MOLINA`}
        />
      </div>

      {/* Image upload */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Imagen (opcional)</label>
        {questionData[imageKey] ? (
          <div className="relative">
            <img
              src={questionData[imageKey]}
              alt={`Opción ${letter}`}
              className="w-full h-32 object-contain rounded border border-gray-200 bg-gray-50"
            />
            <button
              type="button"
              onClick={() => setQuestionData(prev => ({ ...prev, [imageKey]: '' }))}
              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) await handleFileUpload(file, imageKey);
              }}
              className="hidden"
              id={`${imageKey}-upload`}
            />
            <label
              htmlFor={`${imageKey}-upload`}
              className="cursor-pointer flex flex-col items-center py-4"
            >
              <Image className="h-6 w-6 text-gray-400 mb-1" />
              <span className="text-xs text-gray-500">
                {uploading[imageKey] ? 'Subiendo...' : 'Subir imagen'}
              </span>
            </label>
          </div>
        )}
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

  if (!workshop) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Taller no encontrado</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4">Volver</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{workshop.title}</h1>
          {workshop.description && <p className="text-gray-600 mt-2">{workshop.description}</p>}
        </div>
        {isAdmin() && (
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nueva Pregunta
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HelpCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Preguntas</p>
              <p className="text-2xl font-semibold text-gray-900">{questions.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Image className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Opciones con Imagen</p>
              <p className="text-2xl font-semibold text-gray-900">
                {questions.reduce((sum, q) =>
                  sum + [q.option_a_image, q.option_b_image, q.option_c_image, q.option_d_image].filter(Boolean).length, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Puntos Totales</p>
              <p className="text-2xl font-semibold text-gray-900">
                {questions.reduce((sum, q) => sum + q.points, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="card">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Preguntas del Taller</h3>
            <p className="text-sm text-gray-500 mt-1">Los puntos se distribuyen automáticamente para totalizar 100 puntos</p>
          </div>
          {questions.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{questions.length} pregunta(s)</span> - Total:{' '}
                <span className="font-medium text-green-600">
                  {questions.reduce((sum, q) => sum + q.points, 0)}/100 puntos
                </span>
              </div>
              <button onClick={redistributePointsWorkshop} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                🎯 Auto-distribuir puntos
              </button>
            </div>
          )}
        </div>

        <div className="p-6">
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No hay preguntas en este taller</p>
              {isAdmin() && (
                <button onClick={() => openModal()} className="btn-primary">Crear Primera Pregunta</button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <h4 className="font-medium text-gray-900">{question.question}</h4>
                      </div>

                      {question.question_image && (
                        <div className="ml-8 mb-3">
                          <img
                            src={question.question_image}
                            alt="Imagen de la pregunta"
                            className="max-h-40 object-contain rounded border border-gray-200"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 ml-8">
                        {['A', 'B', 'C', 'D'].map((letter) => {
                          const imageKey = `option_${letter.toLowerCase()}_image`;
                          const textKey = `option_${letter.toLowerCase()}_text`;
                          const isCorrect = question.correct_answer === letter;
                          return (
                            <div key={letter} className={`border rounded-lg p-3 ${isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium ${
                                  isCorrect ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {letter}
                                </span>
                                {isCorrect && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {question[textKey] && (
                                  <span className="text-xs text-gray-700 font-medium truncate">{question[textKey]}</span>
                                )}
                              </div>
                              {question[imageKey] ? (
                                <img src={question[imageKey]} alt={`Opción ${letter}`} className="w-full h-24 object-contain rounded" />
                              ) : !question[textKey] ? (
                                <div className="w-full h-12 bg-gray-100 rounded flex items-center justify-center">
                                  <Image className="h-5 w-5 text-gray-300" />
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-4 ml-8 mt-3 text-sm text-gray-500">
                        <span>Puntos: {question.points}</span>
                        <span>Respuesta correcta: {question.correct_answer}</span>
                      </div>
                    </div>

                    {isAdmin() && (
                      <div className="flex gap-1 ml-4">
                        <button onClick={() => openModal(question)} className="text-blue-600 hover:text-blue-900 p-2" title="Editar pregunta">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(question.id)} className="text-red-600 hover:text-red-900 p-2" title="Eliminar pregunta">
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="form-label">Pregunta</label>
                <textarea
                  value={questionData.question}
                  onChange={(e) => setQuestionData(prev => ({ ...prev, question: e.target.value }))}
                  className="form-input h-20 resize-none"
                  placeholder="Escribe la pregunta aquí..."
                  required
                />
              </div>

              {/* Question image (optional) */}
              <div>
                <label className="form-label">Imagen de la pregunta <span className="text-gray-400 font-normal">(opcional)</span></label>
                {questionData.question_image ? (
                  <div className="relative inline-block">
                    <img
                      src={questionData.question_image}
                      alt="Imagen de la pregunta"
                      className="max-w-full max-h-48 object-contain rounded border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setQuestionData(prev => ({ ...prev, question_image: '' }))}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) await handleFileUpload(file, 'question_image');
                      }}
                      className="hidden"
                      id="question_image-upload"
                    />
                    <label htmlFor="question_image-upload" className="cursor-pointer flex items-center gap-3 p-4">
                      <Image className="h-6 w-6 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {uploading['question_image'] ? 'Subiendo...' : 'Subir imagen de referencia para la pregunta'}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-3">
                  Cada opción puede tener <strong>texto</strong>, <strong>imagen</strong>, o <strong>ambos</strong>. Al menos uno es requerido.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderOptionInput('option_a_text', 'option_a_image', 'A')}
                  {renderOptionInput('option_b_text', 'option_b_image', 'B')}
                  {renderOptionInput('option_c_text', 'option_c_image', 'C')}
                  {renderOptionInput('option_d_text', 'option_d_image', 'D')}
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                <strong>✨ Puntos automáticos:</strong> Los puntos se calculan automáticamente para totalizar 100 puntos entre todas las preguntas del taller.
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    isAnyUploading ||
                    !questionData.question ||
                    !optionHasValue('A') ||
                    !optionHasValue('B') ||
                    !optionHasValue('C') ||
                    !optionHasValue('D')
                  }
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {isAnyUploading ? 'Subiendo...' : editingQuestion ? 'Actualizar' : 'Crear'} Pregunta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkshopDetail;
