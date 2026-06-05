import axios from 'axios';

export const SERVER_URL = '';
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getStudents: () => api.get('/users/students'),
  getStudentDetails: (id) => api.get(`/users/students/${id}/details`),
  getFormadores: () => api.get('/users/formadores'),
  getMyFormadores: () => api.get('/users/my-formadores'),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  assignCourseToFormador: (formadorId, courseId) => api.post(`/users/formador/${formadorId}/assign-course`, { course_id: courseId }),
  getFormadorCourses: (formadorId) => api.get(`/users/formador/${formadorId}/courses`),
  unassignCourseFromFormador: (formadorId, courseId) => api.delete(`/users/formador/${formadorId}/unassign-course/${courseId}`),
};

// Courses API
export const coursesAPI = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (courseData) => api.post('/courses', courseData),
  update: (id, courseData) => api.put(`/courses/${id}`, courseData),
  delete: (id) => api.delete(`/courses/${id}`),
};

// Activities API
export const activitiesAPI = {
  getByCourse: (courseId) => api.get(`/activities/course/${courseId}`),
  getById: (id) => api.get(`/activities/${id}`),
  create: (activityData) => api.post('/activities', activityData),
  update: (id, activityData) => api.put(`/activities/${id}`, activityData),
  delete: (id) => api.delete(`/activities/${id}`),
  markComplete: (id) => api.post(`/activities/${id}/complete`),
};

// Workshops API
export const workshopsAPI = {
  getByActivity: (activityId) => api.get(`/workshops/activity/${activityId}`),
  getById: (id) => api.get(`/workshops/${id}`),
  create: (workshopData) => api.post('/workshops', workshopData),
  update: (id, workshopData) => api.put(`/workshops/${id}`, workshopData),
  delete: (id) => api.delete(`/workshops/${id}`),
};

// Quizzes API
export const quizzesAPI = {
  getByActivity: (activityId) => api.get(`/quizzes/activity/${activityId}`),
  getById: (id) => api.get(`/quizzes/${id}`),
  create: (quizData) => api.post('/quizzes', quizData),
  update: (id, quizData) => api.put(`/quizzes/${id}`, quizData),
  delete: (id) => api.delete(`/quizzes/${id}`),
  submit: (id, answers) => api.post(`/quizzes/${id}/submit`, { answers }),
};

// Assignments API
export const assignmentsAPI = {
  getAll: () => api.get('/assignments'),
  getByStudent: (studentId) => api.get(`/assignments/student/${studentId}`),
  getStudentCourses: (studentId) => api.get(`/assignments/student/${studentId}/courses`),
  create: (assignmentData) => api.post('/assignments', assignmentData),
  delete: (id) => api.delete(`/assignments/${id}`),
  removeCourse: (studentId, courseId) => api.delete(`/assignments/student/${studentId}/course/${courseId}`),
  assignFormador: (data) => api.post('/assignments/formador-students', data),
};

// Grades API
export const gradesAPI = {
  getAll: () => api.get('/grades/all'),
  getByStudent: (studentId) => api.get(`/grades/student/${studentId}`),
  getByCourse: (courseId) => api.get(`/grades/course/${courseId}`),
  getByQuiz: (quizId) => api.get(`/grades/quiz/${quizId}`),
  getSummary: (studentId) => api.get(`/grades/summary/${studentId}`),
  getMyGrades: () => api.get('/grades/my-grades'),
  getMyCoursesProgress: () => api.get('/grades/my-courses-progress'),
  getCourseDetails: (courseId) => api.get(`/grades/course/${courseId}/details`),
  getStudentProgress: (studentId, courseId) => api.get(`/grades/student/${studentId}/course/${courseId}/progress`),
  submitQuizGrade: (gradeData) => api.post('/grades/quiz', gradeData),
  submitWorkshopGrade: (gradeData) => api.post('/grades/workshop', gradeData),
  getOverallStats: () => api.get('/grades/overall-stats'),
  resetQuizGrade: (studentId, quizId) => api.delete(`/grades/quiz/student/${studentId}/quiz/${quizId}`),
  resetAllQuizGrades: (quizId) => api.delete(`/grades/quiz/${quizId}/all`),
  getQuizDetail: (gradeId) => api.get(`/grades/quiz-detail/${gradeId}`),
  getWorkshopDetail: (gradeId) => api.get(`/grades/workshop-detail/${gradeId}`),
};

// Satisfaction API
export const satisfactionAPI = {
  create: (surveyData) => api.post('/satisfaction', surveyData),
  submit: (surveyData) => api.post('/satisfaction', surveyData),
  update: (id, surveyData) => api.put(`/satisfaction/${id}`, surveyData),
  getMySurveys: () => api.get('/satisfaction/my-surveys'),
  getByCourse: (courseId) => api.get(`/satisfaction/course/${courseId}`),
  getByCourseAndStudent: (courseId, studentId) => api.get(`/satisfaction/course/${courseId}/student/${studentId}`),
  getCourseSummary: (courseId) => api.get(`/satisfaction/course/${courseId}/summary`),
  getOverallSummary: () => api.get('/satisfaction/overall-summary'),
  getAllSurveysWithDetails: () => api.get('/satisfaction/all-surveys'),
  checkSubmitted: (courseId) => api.get(`/satisfaction/course/${courseId}/check`),
  createGeneral: (surveyData) => api.post('/satisfaction/general', surveyData),
  checkGeneralSubmitted: () => api.get('/satisfaction/general/check'),
  getMyGeneralSurvey: () => api.get('/satisfaction/general/my-survey'),
  getStudentSurveys: (studentId) => api.get(`/satisfaction/student/${studentId}/surveys`),
};

// Upload API
export const uploadAPI = {
  uploadVideo: (file) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getFiles: (type) => api.get(`/upload/files?type=${type || ''}`),
  deleteFile: (filename, type) => api.delete(`/upload/files/${filename}?type=${type}`),
};

// Content Blocks API
export const contentBlocksAPI = {
  getByActivity: (activityId) => api.get(`/content-blocks/activity/${activityId}`),
  create: (blockData) => api.post('/content-blocks', blockData),
  update: (id, blockData) => api.put(`/content-blocks/${id}`, blockData),
  delete: (id) => api.delete(`/content-blocks/${id}`),
};

// Workshop Questions API
export const workshopQuestionsAPI = {
  getByWorkshop: (workshopId) => api.get(`/workshop-questions/workshop/${workshopId}`),
  create: (questionData) => api.post('/workshop-questions', questionData),
  update: (id, questionData) => api.put(`/workshop-questions/${id}`, questionData),
  delete: (id) => api.delete(`/workshop-questions/${id}`),
  submit: (workshopId, answers) => api.post(`/workshop-questions/${workshopId}/submit`, { answers }),
};

// Retake Grants API
export const retakeGrantsAPI = {
  getQuizStudents: (quizId) => api.get(`/quiz-retake-grants/quiz/${quizId}/students`),
  grantRetake: (quizId, studentId) => api.post(`/quiz-retake-grants/quiz/${quizId}/grant`, { student_id: studentId }),
  revokeRetake: (quizId, studentId) => api.delete(`/quiz-retake-grants/quiz/${quizId}/grant/${studentId}`),
  getWorkshopStudents: (workshopId) => api.get(`/workshop-retake-grants/workshop/${workshopId}/students`),
  grantWorkshopRetake: (workshopId, studentId) => api.post(`/workshop-retake-grants/workshop/${workshopId}/grant`, { student_id: studentId }),
  revokeWorkshopRetake: (workshopId, studentId) => api.delete(`/workshop-retake-grants/workshop/${workshopId}/grant/${studentId}`),
};

// Forum API
export const forumAPI = {
  getPosts: () => api.get('/forum/posts'),
  getPost: (id) => api.get(`/forum/posts/${id}`),
  createPost: (postData) => api.post('/forum/posts', postData),
  deletePost: (id) => api.delete(`/forum/posts/${id}`),
  addComment: (postId, commentData) => api.post(`/forum/posts/${postId}/comments`, commentData),
  getNotifications: () => api.get('/forum/notifications'),
  getUnreadCount: () => api.get('/forum/notifications/unread-count'),
  markNotificationRead: (id) => api.put(`/forum/notifications/${id}/mark-read`),
  markAllNotificationsRead: () => api.put('/forum/notifications/mark-all-read'),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

export default api;