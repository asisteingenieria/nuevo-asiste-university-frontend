import { useState, useEffect } from 'react';
import { gradesAPI, coursesAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StudentGrades from './StudentGrades';
import {
  BarChart3,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Award,
  X,
  Download,
  RotateCcw,
  Eye,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const Grades = () => {
  const { user, isAdmin, isFormador, isEstudiante } = useAuth();
  
  // If user is a student, show student-specific grades component
  if (isEstudiante()) {
    return <StudentGrades />;
  }
  const [grades, setGrades] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);

  const [showAnswersModal, setShowAnswersModal] = useState(false);
  const [answersData, setAnswersData] = useState(null);
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterGrades();
  }, [grades, selectedCourse, selectedStudent, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (isAdmin()) {
        const [coursesRes, studentsRes, gradesRes, summaryRes] = await Promise.all([
          coursesAPI.getAll(),
          usersAPI.getStudents(),
          gradesAPI.getAll(),
          gradesAPI.getOverallStats()
        ]);
        
        setCourses(coursesRes.data.courses);
        setStudents(studentsRes.data.students);
        setGrades(gradesRes.data.grades);
        setSummary(summaryRes.data);
        
        console.log('Loaded data for admin:', {
          courses: coursesRes.data.courses.length,
          students: studentsRes.data.students.length,
          grades: gradesRes.data.grades.length
        });
      } else if (isFormador()) {
        const [coursesRes, studentsRes, gradesRes] = await Promise.all([
          coursesAPI.getAll(),
          usersAPI.getStudents(),
          gradesAPI.getAll()
        ]);
        
        setCourses(coursesRes.data.courses);
        setStudents(studentsRes.data.students);
        setGrades(gradesRes.data.grades);
        
        console.log('Loaded data for formador:', {
          courses: coursesRes.data.courses.length,
          students: studentsRes.data.students.length,
          grades: gradesRes.data.grades.length
        });
      } else if (isEstudiante()) {
        const [gradesRes, summaryRes] = await Promise.all([
          gradesAPI.getByStudent(user.id),
          gradesAPI.getSummary(user.id)
        ]);
        
        setGrades(gradesRes.data.grades);
        setSummary(summaryRes.data);
      }
    } catch (error) {
      toast.error('Error al cargar calificaciones');
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };


  const filterGrades = () => {
    let filtered = grades;

    if (selectedCourse !== 'all') {
      filtered = filtered.filter(grade => grade.course_title === selectedCourse);
    }

    if (selectedStudent !== 'all') {
      filtered = filtered.filter(grade => grade.student_name === selectedStudent);
    }

    if (searchTerm) {
      filtered = filtered.filter(grade =>
        grade.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.quiz_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.course_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Group by student to show each student only once
    const studentGrades = filtered.reduce((acc, grade) => {
      const key = `${grade.student_name}_${grade.student_email}`;
      if (!acc[key]) {
        acc[key] = {
          ...grade,
          total_evaluations: 0,
          avg_percentage: 0,
          courses: new Set(),
          last_activity: grade.completed_at
        };
      }
      
      acc[key].courses.add(grade.course_title);
      acc[key].total_evaluations++;
      acc[key].avg_percentage = ((acc[key].avg_percentage * (acc[key].total_evaluations - 1)) + grade.percentage) / acc[key].total_evaluations;
      
      // Keep the most recent activity date
      if (new Date(grade.completed_at) > new Date(acc[key].last_activity)) {
        acc[key].last_activity = grade.completed_at;
      }
      
      return acc;
    }, {});

    // Convert back to array and add course count
    const uniqueStudents = Object.values(studentGrades).map(student => ({
      ...student,
      course_count: student.courses.size,
      avg_percentage: Math.round(student.avg_percentage)
    }));

    setFilteredGrades(uniqueStudents);
  };

  const getGradeColor = (percentage, passingScore) => {
    if (percentage >= passingScore) {
      return 'text-green-600 bg-green-100';
    } else if (percentage >= passingScore * 0.7) {
      return 'text-yellow-600 bg-yellow-100';
    } else {
      return 'text-red-600 bg-red-100';
    }
  };

  const getGradeIcon = (percentage, passingScore) => {
    if (percentage >= passingScore) {
      return <CheckCircle className="h-4 w-4" />;
    } else {
      return <XCircle className="h-4 w-4" />;
    }
  };

  const handleViewStudentDetails = async (studentName, studentId = null) => {
    try {
      // If we don't have studentId, find it from the student name
      const targetStudentId = studentId || students.find(s => s.name === studentName)?.id;
      
      if (!targetStudentId) {
        toast.error('No se pudo encontrar el estudiante');
        return;
      }

      // Get all grades for the student - both quiz and workshop grades will be included
      // by filtering from the main grades list that already has all data
      const studentGrades = grades.filter(grade => grade.student_name === studentName);

      const studentInfo = students.find(s => s.id == targetStudentId);
      
      // Also try to get summary data
      const summaryRes = await gradesAPI.getSummary(targetStudentId).catch(() => ({ data: null }));
      
      setSelectedStudentDetails({
        student: studentInfo,
        grades: studentGrades,
        summary: summaryRes.data
      });
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Error al cargar detalles del estudiante');
      console.error('Error fetching student details:', error);
    }
  };

  const handleResetStudentQuiz = async (studentId, quizId, studentName, quizTitle) => {
    if (!window.confirm(`¿Resetear el intento de ${studentName} en "${quizTitle}"?\n\nEl estudiante podrá presentar el quiz nuevamente.`)) return;
    try {
      await gradesAPI.resetQuizGrade(studentId, quizId);
      toast.success(`Intento reseteado. ${studentName} puede volver a presentar el quiz.`);
      // Refresh data
      fetchData();
      setShowDetailsModal(false);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al resetear calificación';
      toast.error(msg);
    }
  };

  const handleViewAnswers = async (gradeId, gradeType, title) => {
    try {
      setLoadingAnswers(true);
      setShowAnswersModal(true);
      const res = gradeType === 'quiz'
        ? await gradesAPI.getQuizDetail(gradeId)
        : await gradesAPI.getWorkshopDetail(gradeId);
      setAnswersData({ ...res.data, gradeType, title });
    } catch (error) {
      toast.error('Error al cargar respuestas');
      setShowAnswersModal(false);
    } finally {
      setLoadingAnswers(false);
    }
  };

  const formatStudentAnswers = (studentAnswers, gradeType) => {
    if (!studentAnswers) return 'Sin respuestas';
    const answers = typeof studentAnswers === 'string'
      ? (() => { try { return JSON.parse(studentAnswers); } catch { return null; } })()
      : studentAnswers;
    if (!answers || typeof answers !== 'object') return 'Sin respuestas';
    const optionLetters = ['A', 'B', 'C', 'D'];
    const sorted = Object.entries(answers).sort(([a], [b]) => Number(a) - Number(b));
    if (sorted.length === 0) return 'Sin respuestas';
    return sorted.map(([, value], idx) => {
      const letter = gradeType === 'quiz'
        ? (optionLetters[Number(value)] ?? String(value))
        : String(value);
      return `P${idx + 1}:${letter}`;
    }).join(' | ');
  };

  const formatStudentAnswersDetailed = (questions, gradeType) => {
    if (!questions || questions.length === 0) return 'Sin respuestas';
    const optionLetters = ['A', 'B', 'C', 'D'];
    return questions.map((q, idx) => {
      let studentLabel = 'Sin responder';
      if (gradeType === 'quiz') {
        const opts = Array.isArray(q.options) ? q.options : [];
        if (q.student_answer !== null) {
          const letter = optionLetters[q.student_answer] ?? String(q.student_answer);
          const text = opts[q.student_answer];
          studentLabel = text ? `${letter} - ${text}` : letter;
        }
      } else {
        const opts = q.options || {};
        if (q.student_answer !== null) {
          const text = opts[q.student_answer]?.text;
          studentLabel = text ? `${q.student_answer} - ${text}` : String(q.student_answer);
        }
      }
      const icon = q.is_correct ? '✓' : '✗';
      return `P${idx + 1} [${icon}]: ${studentLabel}`;
    }).join('\n');
  };

  const formatCorrectAnswers = (questions, gradeType) => {
    if (!questions || questions.length === 0) return 'Sin datos';
    const optionLetters = ['A', 'B', 'C', 'D'];
    return questions.map((q, idx) => {
      let correctLabel = '';
      if (gradeType === 'quiz') {
        const opts = Array.isArray(q.options) ? q.options : [];
        const cLetter = optionLetters[q.correct_answer] ?? String(q.correct_answer);
        const cText = opts[q.correct_answer];
        correctLabel = cText ? `${cLetter} - ${cText}` : cLetter;
      } else {
        const opts = q.options || {};
        const cText = opts[q.correct_answer]?.text;
        correctLabel = cText ? `${q.correct_answer} - ${cText}` : String(q.correct_answer);
      }
      return `P${idx + 1}: ${correctLabel}`;
    }).join('\n');
  };

  const exportToExcel = async () => {
    if (!isAdmin() && !isFormador()) {
      toast.error('No tienes permisos para exportar datos');
      return;
    }

    const loadingToast = toast.loading('Preparando reporte con respuestas detalladas...');

    // Fetch per-question detail for every grade in parallel
    const detailResults = await Promise.allSettled(
      grades.map(grade =>
        grade.grade_type === 'quiz'
          ? gradesAPI.getQuizDetail(grade.id)
          : gradesAPI.getWorkshopDetail(grade.id)
      )
    );
    const detailMap = {};
    grades.forEach((grade, idx) => {
      const result = detailResults[idx];
      if (result.status === 'fulfilled') {
        detailMap[grade.id] = result.value.data.questions || [];
      }
    });

    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();

    // Preparar datos en formato horizontal
    const worksheetData = [];

    // ENCABEZADOS EN LA PRIMERA FILA (CON COLORES DE FONDO)
    const headers = [
      'ESTUDIANTE',
      'EMAIL',
      'CURSO',
      'ACTIVIDAD',
      'TIPO EVALUACIÓN',
      'TÍTULO EVALUACIÓN',
      'PUNTUACIÓN',
      'PUNTAJE MÁXIMO',
      'PORCENTAJE',
      'ESTADO',
      'INTENTO #',
      'RESPONDIÓ',
      'RESPUESTA CORRECTA',
      'FECHA COMPLETADO',
      'NOTA MÍNIMA REQUERIDA',
      'PROMEDIO ESTUDIANTE',
      'TOTAL EVALUACIONES'
    ];

    worksheetData.push(headers);

    // PROCESAR CADA CALIFICACIÓN EN FILAS HORIZONTALES
    grades.forEach(grade => {
      // Calcular datos del estudiante
      const studentGrades = grades.filter(g => g.student_name === grade.student_name);
      const studentAverage = studentGrades.length > 0 ?
        Math.round(studentGrades.reduce((sum, g) => sum + parseFloat(g.percentage), 0) / studentGrades.length) : 0;

      const row = [
        grade.student_name || 'N/A',
        grade.student_email || 'N/A',
        grade.course_title || 'N/A',
        grade.activity_title || 'N/A',
        grade.grade_type === 'quiz' ? 'QUIZ' : 'TALLER',
        grade.quiz_title || 'N/A',
        grade.score || 0,
        grade.max_score || 0,
        `${grade.percentage || 0}%`,
        parseFloat(grade.percentage || 0) >= (grade.passing_score || 70) ? 'APROBADO' : 'REPROBADO',
        grade.attempt_number || 1,
        detailMap[grade.id]
          ? formatStudentAnswersDetailed(detailMap[grade.id], grade.grade_type)
          : formatStudentAnswers(grade.student_answers, grade.grade_type),
        detailMap[grade.id]
          ? formatCorrectAnswers(detailMap[grade.id], grade.grade_type)
          : 'Sin datos',
        grade.completed_at ? new Date(grade.completed_at).toLocaleDateString('es-ES') : 'N/A',
        `${grade.passing_score || 70}%`,
        `${studentAverage}%`,
        studentGrades.length
      ];

      worksheetData.push(row);
    });
    
    // Crear la hoja de trabajo
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // CONFIGURAR ANCHOS DE COLUMNA
    const colWidths = [
      { wch: 20 }, // ESTUDIANTE
      { wch: 25 }, // EMAIL
      { wch: 20 }, // CURSO
      { wch: 25 }, // ACTIVIDAD
      { wch: 15 }, // TIPO EVALUACIÓN
      { wch: 30 }, // TÍTULO EVALUACIÓN
      { wch: 12 }, // PUNTUACIÓN
      { wch: 15 }, // PUNTAJE MÁXIMO
      { wch: 12 }, // PORCENTAJE
      { wch: 12 }, // ESTADO
      { wch: 10 }, // INTENTO #
      { wch: 40 }, // RESPONDIÓ
      { wch: 40 }, // RESPUESTA CORRECTA
      { wch: 15 }, // FECHA COMPLETADO
      { wch: 18 }, // NOTA MÍNIMA
      { wch: 18 }, // PROMEDIO ESTUDIANTE
      { wch: 18 }  // TOTAL EVALUACIONES
    ];
    worksheet['!cols'] = colWidths;
    
    // APLICAR COLORES DE FONDO A LOS TÍTULOS (FILA 1) - MÉTODO MEJORADO
    headers.forEach((header, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIndex });
      
      // Definir colores según el tipo de columna
      let backgroundColor = 'FF1E3A8A'; // Azul por defecto con alpha
      
      if (header.includes('ESTUDIANTE') || header.includes('EMAIL')) {
        backgroundColor = 'FFDC2626'; // Rojo para datos del estudiante
      } else if (header.includes('CURSO')) {
        backgroundColor = 'FF7C3AED'; // Púrpura para curso
      } else if (header.includes('ACTIVIDAD')) {
        backgroundColor = 'FFEA580C'; // Naranja para actividad
      } else if (header.includes('EVALUACIÓN') || header.includes('TÍTULO') || header.includes('PUNTUACIÓN') || header.includes('PUNTAJE') || header.includes('PORCENTAJE') || header.includes('ESTADO') || header.includes('INTENTO') || header.includes('RESPONDIÓ') || header.includes('RESPUESTA') || header.includes('FECHA') || header.includes('NOTA')) {
        backgroundColor = 'FF0891B2'; // Cyan para detalles de evaluación
      } else if (header.includes('PROMEDIO') || header.includes('TOTAL')) {
        backgroundColor = 'FF059669'; // Verde para estadísticas
      }
      
      // Crear o modificar la celda para asegurar que existe
      if (!worksheet[cellRef]) {
        worksheet[cellRef] = { t: 's', v: header };
      }
      
      // Aplicar estilo con método más directo
      worksheet[cellRef].s = {
        font: { 
          bold: true, 
          sz: 12, 
          color: { rgb: "FFFFFF" },
          name: "Arial"
        },
        fill: { 
          type: "pattern",
          pattern: "solid",
          fgColor: { rgb: backgroundColor.substring(2) }, // Remover FF del inicio
          bgColor: { rgb: backgroundColor.substring(2) }
        },
        alignment: { 
          horizontal: "center", 
          vertical: "center",
          wrapText: true 
        },
        border: {
          top: { style: "medium", color: { rgb: "000000" } },
          bottom: { style: "medium", color: { rgb: "000000" } },
          left: { style: "medium", color: { rgb: "000000" } },
          right: { style: "medium", color: { rgb: "000000" } }
        }
      };
    });
    
    // APLICAR ESTILOS A LAS FILAS DE DATOS
    for (let rowIndex = 1; rowIndex < worksheetData.length; rowIndex++) {
      for (let colIndex = 0; colIndex < headers.length; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            font: { sz: 10 },
            alignment: {
              horizontal: colIndex === 0 || colIndex === 1 || colIndex === 11 || colIndex === 12 ? "left" : "center",
              vertical: colIndex === 11 || colIndex === 12 ? "top" : "center",
              wrapText: colIndex === 11 || colIndex === 12
            },
            border: {
              top: { style: "thin", color: { rgb: "E5E7EB" } },
              bottom: { style: "thin", color: { rgb: "E5E7EB" } },
              left: { style: "thin", color: { rgb: "E5E7EB" } },
              right: { style: "thin", color: { rgb: "E5E7EB" } }
            }
          };
          
          // Colorear filas alternas
          if (rowIndex % 2 === 0) {
            worksheet[cellRef].s.fill = { fgColor: { rgb: "F9FAFB" } };
          }
          
          // Colorear estado según aprobación
          if (colIndex === 9) { // Columna ESTADO
            const cellValue = worksheet[cellRef].v;
            if (cellValue === 'APROBADO') {
              worksheet[cellRef].s.font = { ...worksheet[cellRef].s.font, color: { rgb: "059669" }, bold: true };
            } else if (cellValue === 'REPROBADO') {
              worksheet[cellRef].s.font = { ...worksheet[cellRef].s.font, color: { rgb: "DC2626" }, bold: true };
            }
          }
        }
      }
    }
    
    // Establecer alturas de filas: encabezado más alto, filas de datos según número de preguntas
    const rowHeights = [{ hpt: 30 }];
    grades.forEach(grade => {
      const questions = detailMap[grade.id];
      const lineCount = questions ? questions.length : 1;
      rowHeights.push({ hpt: Math.max(20, lineCount * 32) });
    });
    worksheet['!rows'] = rowHeights;

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Calificaciones');

    // Generar y descargar el archivo
    const fileName = `Reporte_Calificaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.dismiss(loadingToast);
    toast.success('📊 Reporte de calificaciones exportado exitosamente');
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEstudiante() ? 'Mis Calificaciones' : 'Gestión de Calificaciones'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEstudiante() 
              ? 'Revisa tu progreso académico' 
              : 'Monitorea el desempeño de los estudiantes'
            }
          </p>
        </div>
        {/* Export Button - Only for Admin and Formador */}
        {(isAdmin() || isFormador()) && (
          <div>
            <button
              onClick={exportToExcel}
              className="btn-primary flex items-center gap-2"
              disabled={filteredGrades.length === 0}
            >
              <Download className="h-4 w-4" />
              Exportar a Excel
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {isEstudiante() ? 'Quizzes Realizados' : 'Total Intentos'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {summary.general?.total_quiz_attempts || summary.total_quizzes_taken || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promedio General</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(summary.general?.overall_average_score || summary.average_percentage || 0)}%
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {isEstudiante() ? 'Quizzes Aprobados' : 'Mejor Calificación'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isEstudiante() 
                    ? (summary.quizzes_passed || 0)
                    : Math.round(summary.general?.highest_percentage || summary.highest_percentage || 0) + '%'
                  }
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
                <p className="text-sm font-medium text-gray-600">
                  {isEstudiante() ? 'Cursos Asignados' : 'Total Estudiantes'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isEstudiante() 
                    ? (summary.course_progress?.length || 0)
                    : (summary.general?.total_students || students.length || 0)
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {!isEstudiante() && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 form-input"
                />
              </div>
            </div>
            
            <div>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="form-input"
              >
                <option value="all">Todos los cursos</option>
                {courses.map(course => (
                  <option key={course.id} value={course.title}>{course.title}</option>
                ))}
              </select>
            </div>

            {(isAdmin() || isFormador()) && (
              <div>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="form-input"
                >
                  <option value="all">Todos los estudiantes</option>
                  {students.map(student => (
                    <option key={student.id} value={student.name}>{student.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {filteredGrades.length} estudiante(s) con calificaciones
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grades Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {!isEstudiante() && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cursos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evaluaciones
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Actividad
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGrades.map((student, index) => (
                <tr key={`${student.student_name}_${student.student_email}_${index}`} className="hover:bg-gray-50">
                  {!isEstudiante() && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() => handleViewStudentDetails(student.student_name)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline cursor-pointer"
                        >
                          {student.student_name}
                        </button>
                        <div className="text-sm text-gray-500">{student.student_email || 'N/A'}</div>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.course_count} curso{student.course_count !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm text-gray-500">
                      {Array.from(student.courses).slice(0, 2).join(', ')}
                      {student.course_count > 2 && ` +${student.course_count - 2} más`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.total_evaluations} evaluaciones
                    </div>
                    <div className="text-sm text-gray-500">
                      Quizzes y Talleres
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.avg_percentage}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          student.avg_percentage >= 70 ? 'bg-green-500' : student.avg_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(student.avg_percentage, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.avg_percentage >= 70 ? 'text-green-600 bg-green-100' : 
                      student.avg_percentage >= 60 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'
                    }`}>
                      {student.avg_percentage >= 70 ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {student.avg_percentage >= 70 ? 'Satisfactorio' : student.avg_percentage >= 60 ? 'Regular' : 'Necesita Mejora'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(student.last_activity).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredGrades.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || selectedCourse !== 'all' || selectedStudent !== 'all' 
                  ? 'No se encontraron estudiantes con los filtros aplicados' 
                  : 'No hay estudiantes con calificaciones disponibles'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Course Progress (Only for students) */}
      {isEstudiante() && summary?.course_progress && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Progreso por Curso</h2>
          <div className="space-y-4">
            {summary.course_progress.map((course) => (
              <div key={course.course_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-gray-900">{course.course_title}</h3>
                  <span className="text-sm text-gray-500">
                    {course.completed_activities}/{course.total_activities} actividades
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Quizzes realizados:</span>
                    <span className="ml-2 font-medium">{course.quizzes_taken || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Promedio:</span>
                    <span className="ml-2 font-medium">
                      {course.average_quiz_score ? Math.round(course.average_quiz_score) + '%' : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progreso de actividades</span>
                    <span className="font-medium">
                      {Math.round((course.completed_activities / course.total_activities) * 100) || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(course.completed_activities / course.total_activities) * 100 || 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answers Detail Modal */}
      {showAnswersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60" style={{ zIndex: 60 }}>
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center gap-3 p-5 border-b">
              <button
                onClick={() => { setShowAnswersModal(false); setAnswersData(null); }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase font-medium">
                  {answersData?.gradeType === 'quiz' ? 'Quiz' : 'Taller'}
                </p>
                <h3 className="font-semibold text-gray-900 truncate">
                  {answersData?.title || (answersData?.gradeType === 'quiz' ? answersData?.grade?.quiz_title : answersData?.grade?.workshop_title)}
                </h3>
              </div>
              {answersData?.grade && (
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${answersData.grade.percentage >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {answersData.grade.percentage}%
                </span>
              )}
              <button onClick={() => { setShowAnswersModal(false); setAnswersData(null); }}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {loadingAnswers ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                </div>
              ) : answersData?.questions?.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay preguntas registradas.</p>
              ) : (
                <div className="space-y-3">
                  {answersData?.questions?.map((q, idx) => {
                    const isWorkshop = answersData.gradeType === 'workshop';
                    const isCorrect = q.is_correct;
                    const hasAnswer = isWorkshop
                      ? q.student_answer !== null
                      : q.student_answer !== null;

                    let studentAnswerLabel = 'Sin responder';
                    let correctAnswerLabel = '';

                    if (isWorkshop) {
                      if (q.student_answer !== null) studentAnswerLabel = `Opción ${q.student_answer}`;
                      correctAnswerLabel = `Opción ${q.correct_answer}`;
                    } else {
                      const opts = Array.isArray(q.options) ? q.options : [];
                      studentAnswerLabel = q.student_answer !== null && opts[q.student_answer]
                        ? opts[q.student_answer]
                        : q.student_answer !== null ? `Opción ${q.student_answer}` : 'Sin responder';
                      correctAnswerLabel = opts[q.correct_answer] || `Opción ${q.correct_answer}`;
                    }

                    return (
                      <div
                        key={q.id}
                        className={`border rounded-lg p-4 ${
                          isCorrect
                            ? 'border-green-200 bg-green-50'
                            : hasAnswer
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 mb-3">
                              <span className="text-gray-400 font-normal mr-1">P{idx + 1}.</span>
                              {q.question}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div className={`rounded-lg px-3 py-2 ${
                                isCorrect
                                  ? 'bg-green-200 text-green-800'
                                  : hasAnswer
                                  ? 'bg-red-200 text-red-800'
                                  : 'bg-gray-200 text-gray-600'
                              }`}>
                                <span className="font-medium block text-xs mb-0.5 opacity-70">Estudiante respondió:</span>
                                {studentAnswerLabel}
                              </div>
                              {!isCorrect && (
                                <div className="rounded-lg px-3 py-2 bg-green-200 text-green-800">
                                  <span className="font-medium block text-xs mb-0.5 opacity-70">Respuesta correcta:</span>
                                  {correctAnswerLabel}
                                </div>
                              )}
                            </div>
                            <div className="mt-2 text-xs text-gray-400">{q.points} punto(s)</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {answersData?.grade && (
              <div className="border-t p-4 bg-gray-50 flex items-center justify-between text-sm text-gray-600">
                <span>Puntos: <strong>{answersData.grade.score}/{answersData.grade.max_score}</strong></span>
                <span>Intento #{answersData.grade.attempt_number}</span>
                <span>{new Date(answersData.grade.completed_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {showDetailsModal && selectedStudentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Calificaciones de {selectedStudentDetails.student?.name}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Student Summary */}
            {selectedStudentDetails.grades && (() => {
              const grades = selectedStudentDetails.grades;
              const quizGrades = grades.filter(g => g.grade_type === 'quiz');
              const workshopGrades = grades.filter(g => g.grade_type === 'workshop');
              
              const totalQuizzes = quizGrades.length;
              const totalWorkshops = workshopGrades.length;
              const totalEvaluations = totalQuizzes + totalWorkshops;
              
              const averageQuiz = totalQuizzes > 0 ? quizGrades.reduce((sum, g) => sum + g.percentage, 0) / totalQuizzes : 0;
              const averageWorkshop = totalWorkshops > 0 ? workshopGrades.reduce((sum, g) => sum + g.percentage, 0) / totalWorkshops : 0;
              const overallAverage = totalEvaluations > 0 ? ((averageQuiz * totalQuizzes) + (averageWorkshop * totalWorkshops)) / totalEvaluations : 0;
              
              const highestGrade = Math.max(...grades.map(g => g.percentage), 0);
              const passedQuizzes = quizGrades.filter(g => g.percentage >= g.passing_score).length;
              const passedWorkshops = workshopGrades.filter(g => g.percentage >= g.passing_score).length;
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {totalQuizzes}
                    </div>
                    <div className="text-sm text-gray-600">Quizzes Realizados</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {totalWorkshops}
                    </div>
                    <div className="text-sm text-gray-600">Talleres Realizados</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(overallAverage)}%
                    </div>
                    <div className="text-sm text-gray-600">Promedio General</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {Math.round(highestGrade)}%
                    </div>
                    <div className="text-sm text-gray-600">Mejor Calificación</div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {passedQuizzes + passedWorkshops}
                    </div>
                    <div className="text-sm text-gray-600">Evaluaciones Aprobadas</div>
                  </div>
                </div>
              );
            })()}

            {/* Grades organized by Course and Activity */}
            <div className="space-y-6">
              {selectedStudentDetails.grades.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Este estudiante aún no tiene calificaciones registradas
                </div>
              ) : (() => {
                // Group grades by course, then by activity
                const gradesByCourse = selectedStudentDetails.grades.reduce((acc, grade) => {
                  if (!acc[grade.course_title]) {
                    acc[grade.course_title] = {};
                  }
                  if (!acc[grade.course_title][grade.activity_title]) {
                    acc[grade.course_title][grade.activity_title] = {
                      quizzes: [],
                      workshops: []
                    };
                  }
                  
                  if (grade.grade_type === 'quiz') {
                    acc[grade.course_title][grade.activity_title].quizzes.push(grade);
                  } else {
                    acc[grade.course_title][grade.activity_title].workshops.push(grade);
                  }
                  
                  return acc;
                }, {});

                return Object.entries(gradesByCourse).map(([courseName, activities]) => (
                  <div key={courseName} className="border rounded-lg overflow-hidden">
                    {/* Course Header */}
                    <div className="bg-gray-100 px-6 py-4 border-b">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        {courseName}
                      </h4>
                    </div>

                    {/* Activities */}
                    <div className="divide-y divide-gray-200">
                      {Object.entries(activities).map(([activityName, evaluations]) => (
                        <div key={activityName} className="p-6">
                          <h5 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {activityName}
                          </h5>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Quizzes */}
                            <div>
                              <h6 className="text-sm font-medium text-blue-600 mb-3 flex items-center gap-2">
                                <Award className="h-4 w-4" />
                                Quizzes ({evaluations.quizzes.length})
                              </h6>
                              {evaluations.quizzes.length === 0 ? (
                                <p className="text-gray-500 text-sm">No hay quizzes realizados</p>
                              ) : (
                                <div className="space-y-3">
                                  {evaluations.quizzes.map((quiz) => (
                                    <div key={quiz.id} className="bg-blue-50 rounded-lg p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="text-sm font-medium text-gray-900">{quiz.quiz_title}</div>
                                        <div className="flex items-center gap-2">
                                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(quiz.percentage, quiz.passing_score)}`}>
                                            {getGradeIcon(quiz.percentage, quiz.passing_score)}
                                            <span className="ml-1">
                                              {quiz.percentage >= quiz.passing_score ? 'Aprobado' : 'Reprobado'}
                                            </span>
                                          </span>
                                          <button
                                            onClick={() => handleViewAnswers(quiz.id, 'quiz', quiz.quiz_title)}
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                            title="Ver respuestas correctas e incorrectas"
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                          </button>
                                          {(isAdmin() || isFormador()) && (
                                            <button
                                              onClick={() => handleResetStudentQuiz(
                                                selectedStudentDetails.student?.id,
                                                quiz.quiz_id,
                                                selectedStudentDetails.student?.name,
                                                quiz.quiz_title
                                              )}
                                              className="text-orange-500 hover:text-orange-700 p-1 rounded"
                                              title="Resetear intento de este estudiante"
                                            >
                                              <RotateCcw className="h-3.5 w-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-sm text-gray-600 mb-2">
                                        {quiz.score}/{quiz.max_score} puntos ({quiz.percentage}%)
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                        <div
                                          className={`h-2 rounded-full transition-all duration-300 ${
                                            quiz.percentage >= quiz.passing_score ? 'bg-blue-500' : 'bg-red-500'
                                          }`}
                                          style={{ width: `${Math.min(quiz.percentage, 100)}%` }}
                                        ></div>
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {new Date(quiz.completed_at).toLocaleDateString('es-ES', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })} • Intento #{quiz.attempt_number}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Workshops */}
                            <div>
                              <h6 className="text-sm font-medium text-purple-600 mb-3 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Talleres ({evaluations.workshops.length})
                              </h6>
                              {evaluations.workshops.length === 0 ? (
                                <p className="text-gray-500 text-sm">No hay talleres realizados</p>
                              ) : (
                                <div className="space-y-3">
                                  {evaluations.workshops.map((workshop) => (
                                    <div key={workshop.id} className="bg-purple-50 rounded-lg p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="text-sm font-medium text-gray-900">{workshop.quiz_title}</div>
                                        <div className="flex items-center gap-2">
                                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(workshop.percentage, workshop.passing_score)}`}>
                                            {getGradeIcon(workshop.percentage, workshop.passing_score)}
                                            <span className="ml-1">
                                              {workshop.percentage >= workshop.passing_score ? 'Aprobado' : 'Reprobado'}
                                            </span>
                                          </span>
                                          <button
                                            onClick={() => handleViewAnswers(workshop.id, 'workshop', workshop.quiz_title)}
                                            className="text-purple-600 hover:text-purple-800 p-1 rounded"
                                            title="Ver respuestas correctas e incorrectas"
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                      <div className="text-sm text-gray-600 mb-2">
                                        {workshop.score}/{workshop.max_score} puntos ({workshop.percentage}%)
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                        <div 
                                          className={`h-2 rounded-full transition-all duration-300 ${
                                            workshop.percentage >= workshop.passing_score ? 'bg-purple-500' : 'bg-red-500'
                                          }`}
                                          style={{ width: `${Math.min(workshop.percentage, 100)}%` }}
                                        ></div>
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {new Date(workshop.completed_at).toLocaleDateString('es-ES', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })} • Intento #{workshop.attempt_number}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Close Button */}
            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grades;