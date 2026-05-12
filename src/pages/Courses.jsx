import { useState, useEffect } from 'react';
import { coursesAPI, activitiesAPI, usersAPI, assignmentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Users,
  Play,
  FileText,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';

const Courses = () => {
  const { user, isAdmin, isFormador, isEstudiante } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchCourses();
    if (isAdmin() || isFormador()) {
      fetchStudents();
    }
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getAll();
      setCourses(response.data.courses);
    } catch (error) {
      toast.error('Error al cargar cursos');
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await usersAPI.getStudents();
      setStudents(response.data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await coursesAPI.update(editingCourse.id, formData);
        toast.success('Curso actualizado exitosamente');
      } else {
        await coursesAPI.create(formData);
        toast.success('Curso creado exitosamente');
      }
      
      setShowModal(false);
      setEditingCourse(null);
      setFormData({ title: '', description: '' });
      fetchCourses();
    } catch (error) {
      const message = error.response?.data?.message || 'Error al guardar curso';
      toast.error(message);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este curso? Se eliminarán todas sus actividades.')) {
      try {
        await coursesAPI.delete(courseId);
        toast.success('Curso eliminado exitosamente');
        fetchCourses();
      } catch (error) {
        toast.error('Error al eliminar curso');
      }
    }
  };

  const handleAssignStudents = async () => {
    try {
      const promises = selectedStudents.map(studentId => 
        assignmentsAPI.create({
          course_id: selectedCourse.id,
          student_id: studentId
        })
      );
      
      await Promise.all(promises);
      toast.success(`Curso asignado a ${selectedStudents.length} estudiante(s)`);
      setShowAssignModal(false);
      setSelectedStudents([]);
      setSelectedCourse(null);
    } catch (error) {
      toast.error('Error al asignar curso');
    }
  };

  const handleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
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
            {(isAdmin() || isFormador()) ? 'Gestión de Cursos' : 'Mis Cursos'}
          </h1>
          <p className="text-gray-600 mt-2">
            {(isAdmin() || isFormador()) ? 'Administra cursos del sistema' : 'Cursos asignados'}
          </p>
        </div>
        {(isAdmin() || isFormador()) && (
          <button
            onClick={() => {
              setEditingCourse(null);
              setFormData({ title: '', description: '' });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nuevo Curso
          </button>
        )}
      </div>

      {/* Imagen de portada - Solo para estudiantes */}
      {isEstudiante() && (
        <div className="w-full mt-6 flex justify-center">
          <img
            src="/images/portadacursos.webp"
            alt="Portada de cursos"
            className="w-3/4 h-auto rounded-lg shadow-md"
          />
        </div>
      )}

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 form-input"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cursos</p>
              <p className="text-2xl font-semibold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Estudiantes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courses.reduce((sum, course) => sum + (course.student_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Play className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Actividades</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courses.reduce((sum, course) => sum + (course.activity_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {course.title}
              </h3>
              {(isAdmin() || isFormador()) && (
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleEdit(course)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {course.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {course.description}
              </p>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.student_count || 0} estudiantes
                </span>
                <span className="flex items-center gap-1">
                  <Play className="h-4 w-4" />
                  {course.activity_count || 0} actividades
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.location.href = `/courses/${course.id}`}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <span>Ver Detalles</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              
              {(isAdmin() || isFormador()) && (
                <button
                  onClick={() => {
                    setSelectedCourse(course);
                    setShowAssignModal(true);
                    setSelectedStudents([]);
                  }}
                  className="btn-secondary flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Asignar
                </button>
              )}
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Creado por: {course.created_by_name || 'Sistema'}
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'No se encontraron cursos' : 'No hay cursos disponibles'}
          </p>
          {(isAdmin() || isFormador()) && !searchTerm && (
            <button
              onClick={() => {
                setEditingCourse(null);
                setFormData({ title: '', description: '' });
                setShowModal(true);
              }}
              className="btn-primary mt-4"
            >
              Crear Primer Curso
            </button>
          )}
        </div>
      )}

      {/* Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingCourse ? 'Editar Curso' : 'Nuevo Curso'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Título del Curso</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="form-input"
                  placeholder="Nombre del curso"
                />
              </div>

              <div>
                <label className="form-label">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-input h-24 resize-none"
                  placeholder="Descripción del curso..."
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
                  {editingCourse ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-hidden">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Asignar "{selectedCourse?.title}" a Estudiantes
            </h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {students.map((student) => (
                <label key={student.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleStudentSelection(student.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-4 mt-4 border-t">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignStudents}
                disabled={selectedStudents.length === 0}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Asignar ({selectedStudents.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;