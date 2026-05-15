import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizzesAPI, gradesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  RotateCcw,
  Trophy
} from 'lucide-react';
import toast from 'react-hot-toast';

const TakeQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(1);

  useEffect(() => {
    fetchQuizDetails();
  }, [id]);

  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0 && !quizCompleted) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeLeft, quizCompleted]);

  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      const response = await quizzesAPI.getById(id);
      const quizData = response.data.quiz;
      setQuiz(quizData);
      
      // Check if already completed
      if (quizData.is_completed) {
        const attemptsUsed = quizData.attempt_number || 1;
        setAttemptNumber(attemptsUsed);
        setQuizCompleted(true);
        setResult({
          score: quizData.completed_score || 0,
          maxScore: quizData.completed_max_score || 100,
          percentage: quizData.completed_score || 0,
          passed: (quizData.completed_score || 0) >= (quizData.passing_score || 70),
          message: 'Ya has completado este quiz anteriormente.'
        });
        return;
      }
      
      // Set timer (30 minutes default)
      const timeLimit = quizData.time_limit || 30;
      setTimeLeft(timeLimit * 60);
    } catch (error) {
      toast.error('Error al cargar el quiz');
      console.error('Error fetching quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
  };

  const handleRetry = () => {
    setAttemptNumber(prev => prev + 1);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setQuizCompleted(false);
    setQuizStarted(false);
    setResult(null);
    const timeLimit = quiz.time_limit || 30;
    setTimeLeft(timeLimit * 60);
  };

  const handleAnswerChange = (questionId, selectedOption) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      setSubmitting(true);
      
      // Calculate score
      let correctAnswers = 0;
      let totalPoints = 0;
      
      quiz.questions.forEach(question => {
        totalPoints += question.points;
        if (Number(answers[question.id]) === Number(question.correct_answer)) {
          correctAnswers += question.points;
        }
      });

      const percentage = Math.round((correctAnswers / totalPoints) * 100);

      // Submit grade
      const gradeData = {
        student_id: user.id,
        quiz_id: parseInt(id),
        score: correctAnswers,
        max_score: totalPoints,
        percentage: percentage,
        answers: answers,
        attempt_number: attemptNumber
      };

      await gradesAPI.submitQuizGrade(gradeData);

      setResult({
        score: correctAnswers,
        maxScore: totalPoints,
        percentage: percentage,
        passed: percentage >= quiz.passing_score,
        totalQuestions: quiz.questions.length,
        correctCount: Object.keys(answers).filter(qId => {
          const question = quiz.questions.find(q => q.id == qId);
          return question && Number(answers[qId]) === Number(question.correct_answer);
        }).length
      });
      
      setQuizCompleted(true);
      toast.success('Quiz enviado exitosamente');
    } catch (error) {
      toast.error('Error al enviar el quiz');
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Quiz no encontrado</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4">
          Volver
        </button>
      </div>
    );
  }

  // Quiz completed view
  if (quizCompleted && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card text-center">
          <div className="mb-6">
            {result.passed ? (
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
            ) : (
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {result.passed ? '¡Felicitaciones!' : 'Quiz Completado'}
            </h2>
            
            <p className="text-gray-600 mb-2">
              {result.passed
                ? 'Has aprobado el quiz exitosamente'
                : `Necesitas ${quiz.passing_score}% para aprobar.`
              }
            </p>
            {quiz.max_attempts > 1 && (
              <p className="text-sm text-gray-500 mb-4">
                Intento {attemptNumber} de {quiz.max_attempts}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{result.percentage}%</div>
              <div className="text-sm text-gray-600">Puntuación</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{result.correctCount}</div>
              <div className="text-sm text-gray-600">Correctas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{result.totalQuestions}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{result.score}/{result.maxScore}</div>
              <div className="text-sm text-gray-600">Puntos</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Volver al Curso
            </button>
            {quiz.max_attempts > 1 && attemptNumber < quiz.max_attempts && (
              <button
                onClick={handleRetry}
                className="btn-primary flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reintentar Quiz (Intento {attemptNumber + 1} de {quiz.max_attempts})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz start screen
  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
        </div>

        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Instrucciones del Quiz</h2>
            
            {quiz.description && (
              <p className="text-gray-600 mb-4">{quiz.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">{quiz.questions.length}</div>
                <div className="text-sm text-gray-600">Preguntas</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">{formatTime(timeLeft)}</div>
                <div className="text-sm text-gray-600">Tiempo Límite</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">{quiz.passing_score}%</div>
                <div className="text-sm text-gray-600">Para Aprobar</div>
              </div>
            </div>

            <div className="space-y-2 mb-6 text-sm text-gray-600">
              <p>• Lee cada pregunta cuidadosamente</p>
              <p>• Puedes navegar entre preguntas antes de enviar</p>
              <p>• El quiz se enviará automáticamente cuando se agote el tiempo</p>
              <p>• Asegúrate de responder todas las preguntas</p>
              {quiz.max_attempts > 1 && (
                <p className="text-blue-600 font-medium">• Este quiz permite {quiz.max_attempts} intentos — actualmente en el intento {attemptNumber}</p>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={startQuiz}
              className="btn-primary flex items-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              Comenzar Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz taking interface
  const currentQuestion = quiz.questions[currentQuestionIndex];
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          <span className="text-gray-500">
            Pregunta {currentQuestionIndex + 1} de {quiz.questions.length}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
            timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}>
            <Clock className="h-4 w-4" />
            <span className="font-medium">{formatTime(timeLeft)}</span>
          </div>
          
          <div className="text-sm text-gray-600">
            Respondidas: {getAnsweredCount()}/{quiz.questions.length}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
        ></div>
      </div>

      {/* Question */}
      <div className="card">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex-1">
              {currentQuestion.question}
            </h3>
            <span className="text-sm text-gray-500 ml-4">
              {currentQuestion.points} puntos
            </span>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <label 
                key={index}
                className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  answers[currentQuestion.id] === index ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={index}
                  checked={answers[currentQuestion.id] === index}
                  onChange={() => handleAnswerChange(currentQuestion.id, index)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t">
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          <div className="flex gap-3">
            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting || getAnsweredCount() === 0}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar Quiz'}
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="btn-primary"
              >
                Siguiente
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question overview */}
      <div className="card">
        <h4 className="font-medium text-gray-900 mb-3">Progreso del Quiz</h4>
        <div className="grid grid-cols-10 gap-2">
          {quiz.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-8 h-8 rounded text-xs font-medium ${
                answers[quiz.questions[index].id] !== undefined
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : index === currentQuestionIndex
                  ? 'bg-primary-100 text-primary-700 border-primary-300'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              } border`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;