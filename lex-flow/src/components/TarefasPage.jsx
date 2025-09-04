// src/components/TarefasPage.jsx

import React, { useState, useEffect } from 'react';
// Importa o TaskManager que está na mesma pasta
import TaskManager from './TaskManager'; 
// Importa as funções da API da pasta utils
import { getProjects, createProject } from '../utils/api';
import { Button } from '@/components/ui/button';

function TarefasPage() {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para controlar o modal de criação de projeto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await getProjects(); 
        const userProjects = response.projects || [];
        setProjects(userProjects);
        if (userProjects.length > 0) {
          setActiveProjectId(userProjects[0].id);
        }
      } catch (err) {
        setError("Não foi possível carregar seus projetos.");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const response = await createProject({ name: newProjectName.trim() });
      const newProject = response.project;
      
      setProjects([...projects, newProject]);
      setActiveProjectId(newProject.id);
      
      setNewProjectName('');
      setIsModalOpen(false);
    } catch (err) {
      console.error("Falha ao criar projeto:", err);
    }
  };

  if (loading) return <div className="p-6">Carregando projetos...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciador de Tarefas</h1>
        <div className="flex items-center gap-4">
          {projects.length > 0 && (
            <select
              value={activeProjectId}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          )}
          <Button onClick={() => setIsModalOpen(true)}>+ Novo Projeto</Button>
        </div>
      </div>

      {projects.length === 0 && !loading ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">Você ainda não tem projetos.</h2>
          <p className="text-muted-foreground mb-4">Crie seu primeiro projeto para começar a organizar suas tarefas.</p>
          <Button onClick={() => setIsModalOpen(true)}>Criar Primeiro Projeto</Button>
        </div>
      ) : (
        // A mágica acontece aqui: renderiza o TaskManager com o ID do projeto ativo
        <TaskManager key={activeProjectId} projectId={activeProjectId} />
      )}

      {/* Modal de criação de projeto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Criar Novo Projeto</h2>
            <form onSubmit={handleCreateProject}>
              <input
                type="text" autoFocus value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Ex: Estudos de React, Projeto Freelancer..."
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={!newProjectName.trim()}>Criar Projeto</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TarefasPage;