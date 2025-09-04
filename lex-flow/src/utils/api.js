// /opt/lex-flow/src/utils/api.js (VERSÃO CORRIGIDA E FINAL)

const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('lex_flow_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const fullUrl = `${baseUrl}${endpoint}`;

  const config = { ...options, headers };
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(fullUrl, config);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('lex_flow_token');
      window.location.href = '/login';
    }
    const errorData = await response.json().catch(() => ({ error: 'Erro de rede ou resposta não-JSON' }));
    throw new Error(errorData.error || `Erro na API: ${response.statusText}`);
  }

  if (response.status === 204) {
    return {};
  }
  
  return response.json();
};

// --- AUTENTICAÇÃO E DASHBOARD ---
export const loginUser = (credentials) => fetchApi('/api/auth/login', { method: 'POST', body: credentials });
export const registerUser = (userData) => fetchApi('/api/auth/register', { method: 'POST', body: userData });
// CORRIGIDO: A rota do dashboard está sob o prefixo /auth
export const getDashboardData = () => fetchApi('/api/auth/dashboard');

// --- PROJETOS E COLABORAÇÃO ---
export const getProjects = () => fetchApi('/api/collaboration/projects');
export const createProject = (projectData) => fetchApi('/api/collaboration/projects', { method: 'POST', body: projectData });
export const getProjectDetails = (projectId) => fetchApi(`/api/collaboration/projects/${projectId}`);
export const inviteCollaborator = (projectId, email) => fetchApi(`/api/collaboration/projects/${projectId}/invite`, { method: 'POST', body: { email, role: 'member' } });
export const addCommentToTask = (projectId, taskId, commentData) => fetchApi(`/api/collaboration/projects/${projectId}/tasks/${taskId}/comments`, { method: 'POST', body: commentData });

// --- GERENCIADOR DE TAREFAS ---
export const getTasksForProject = (projectId) => fetchApi(`/api/collaboration/projects/${projectId}`);
export const createTask = (projectId, taskData) => fetchApi(`/api/collaboration/projects/${projectId}/tasks`, { method: 'POST', body: taskData });
export const updateTask = (projectId, taskId, taskData) => fetchApi(`/api/collaboration/projects/${projectId}/tasks/${taskId}`, { method: 'PUT', body: taskData });
export const deleteTask = (projectId, taskId) => fetchApi(`/api/collaboration/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });

// --- TELOS FRAMEWORK E REVIEW ---
// CORRIGIDO: Removido o prefixo /users/ para corresponder ao main.py
export const getTelosFramework = () => fetchApi('/api/telos/framework');
export const saveTelosFramework = (frameworkData) => fetchApi('/api/telos/framework', { method: 'POST', body: frameworkData });
export const getTelosReviews = () => fetchApi('/api/telos/reviews');
export const getTelosReview = (date) => fetchApi(`/api/telos/review?date=${date}`);
export const saveTelosReview = (reviewData) => fetchApi('/api/telos/review', { method: 'POST', body: reviewData });

// --- VIDEO STUDY ---
export const getStudyVideos = () => fetchApi('/api/videostudy/videos');
export const addStudyVideo = (videoData) => fetchApi('/api/videostudy/videos', { method: 'POST', body: videoData });
export const updateStudyVideo = (videoId, videoData) => fetchApi(`/api/videostudy/videos/${videoId}`, { method: 'PUT', body: videoData });
export const deleteStudyVideo = (videoId) => fetchApi(`/api/videostudy/videos/${videoId}`, { method: 'DELETE' });

// --- QUICK NOTES ---
export const getQuickNotes = () => fetchApi('/api/quicknotes');
export const addQuickNote = (noteData) => fetchApi('/api/quicknotes', { method: 'POST', body: noteData });
export const deleteQuickNote = (noteId) => fetchApi(`/api/quicknotes/${noteId}`, { method: 'DELETE' });
export const convertNoteToTask = (noteId) => fetchApi(`/api/quicknotes/${noteId}/convert-to-task`, { method: 'POST' });

// --- POMODORO TIMER ---
export const getPomodoroData = () => fetchApi('/api/pomodoro');
export const savePomodoroSettings = (settingsData) => fetchApi('/api/pomodoro/settings', { method: 'POST', body: settingsData });
export const savePomodoroSession = () => fetchApi('/api/pomodoro/log-session', { method: 'POST' });

// --- INTEGRAÇÕES ---
export const getIntegrations = () => fetchApi('/api/integrations');
export const saveIntegrationsConfig = (data) => fetchApi('/api/integrations/config', { method: 'POST', body: data });
export const testConnections = () => fetchApi('/api/integrations/test-connections');
export const syncTasks = (targets) => fetchApi('/api/integrations/sync/tasks', { method: 'POST', body: { targets } });
export const exportToObsidian = (vaultPath) => fetchApi('/api/integrations/obsidian/export', { method: 'POST', body: { vault_path: vaultPath } });

// --- GAMIFICAÇÃO ---
export const getGamificationData = () => fetchApi('/api/gamification');
export const resetGamificationProgress = () => fetchApi('/api/gamification/reset', { method: 'POST' });
export const exportGamificationData = () => fetchApi('/api/gamification/export');

// --- ANÁLISES E RELATÓRIOS ---
export const getAnalyticsData = (timeRange) => fetchApi(`/api/analytics?timeRange=${timeRange}`);
export const exportAnalyticsReport = (timeRange) => fetchApi(`/api/analytics/export?timeRange=${timeRange}`);

// --- CLOUD SYNC ---
export const getCloudProviders = () => fetchApi('/api/cloud-sync/providers');
export const getCloudConnections = () => fetchApi('/api/cloud-sync/connections');
export const getCloudSyncStatus = () => fetchApi('/api/cloud-sync/status');
export const connectCloudProvider = (providerId) => fetchApi(`/api/cloud-sync/connect/${providerId}`, { method: 'POST' });
export const disconnectCloudProvider = (providerId) => fetchApi(`/api/cloud-sync/disconnect/${providerId}`, { method: 'POST' });
export const syncWithProvider = (providerId) => fetchApi(`/api/cloud-sync/sync/${providerId}`, { method: 'POST' });

// --- AI ASSISTANT ---
export const getAiProviders = () => fetchApi('/api/ai/providers');
export const getTaskSuggestions = (context) => fetchApi('/api/ai/task-suggestions', { method: 'POST', body: context });
export const getProductivityInsights = (context) => fetchApi('/api/ai/productivity-insights', { method: 'POST', body: context });
export const getStudyRecommendations = (context) => fetchApi('/api/ai/study-recommendations', { method: 'POST', body: context });
export const getScheduleOptimization = (context) => fetchApi('/api/ai/schedule-optimization', { method: 'POST', body: context });
export const analyzeTelos = (analysisData) => fetchApi('/api/ai/telos/analyze', { method: 'POST', body: analysisData });
export const chatWithTelos = (chatData) => fetchApi('/api/ai/telos/chat', { method: 'POST', body: chatData });