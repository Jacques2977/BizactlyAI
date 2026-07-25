import { Project, AIMemory } from '../types/project';

class ProjectService {
  private projects: Project[] = [];
  private readonly STORAGE_KEY = 'bizactly_projects';

  constructor() {
    this.loadProjects();
  }

  private loadProjects(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.projects = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      this.projects = [];
    }
  }

  private saveProjects(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.projects));
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  }

  getAllProjects(): Project[] {
    return [...this.projects];
  }

  getProjectById(id: string): Project | undefined {
    return this.projects.find(p => p.id === id);
  }

  createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const newProject: Project = {
      ...project,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.projects.push(newProject);
    this.saveProjects();

    return newProject;
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const index = this.projects.findIndex(p => p.id === id);

    if (index === -1) {
      return null;
    }

    this.projects[index] = {
      ...this.projects[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };

    this.saveProjects();
    return this.projects[index];
  }

  deleteProject(id: string): boolean {
    const index = this.projects.findIndex(p => p.id === id);

    if (index === -1) {
      return false;
    }

    this.projects.splice(index, 1);
    this.saveProjects();

    return true;
  }

  getProjectsByUserId(userId: string): Project[] {
    return this.projects.filter(p => p.userId === userId);
  }

  updateProjectMemory(projectId: string, memoryUpdates: Partial<AIMemory>): Project | null {
    const project = this.getProjectById(projectId);
    if (!project) return null;

    const currentMemory = project.ai_memory || {};
    const updatedMemory: AIMemory = {
      ...currentMemory,
      ...memoryUpdates,
      conversationContext: {
        ...currentMemory.conversationContext,
        ...memoryUpdates.conversationContext,
        lastUpdated: new Date().toISOString()
      }
    };

    return this.updateProject(projectId, { ai_memory: updatedMemory });
  }

  getProjectMemory(projectId: string): AIMemory | null {
    const project = this.getProjectById(projectId);
    return project?.ai_memory || null;
  }

  addMemoryTopic(projectId: string, topic: string): boolean {
    const memory = this.getProjectMemory(projectId);
    if (!memory) return false;

    const topics = memory.conversationContext?.topicsDiscussed || [];
    if (!topics.includes(topic)) {
      this.updateProjectMemory(projectId, {
        conversationContext: {
          ...memory.conversationContext,
          topicsDiscussed: [...topics, topic]
        }
      });
    }
    return true;
  }

  addMemoryQuestion(projectId: string, question: string): boolean {
    const memory = this.getProjectMemory(projectId);
    if (!memory) return false;

    const questions = memory.conversationContext?.questionsAsked || [];
    this.updateProjectMemory(projectId, {
      conversationContext: {
        ...memory.conversationContext,
        questionsAsked: [...questions, question]
      }
    });
    return true;
  }

  private generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const projectService = new ProjectService();
