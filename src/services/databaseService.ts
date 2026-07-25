import { supabase } from '../lib/supabase';
import { Project, AIMemory } from '../types/project';

export class DatabaseService {
  async getProject(projectId: string, userId: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching project:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  async getUserProjects(userId?: string): Promise<Project[]> {
    try {
      const resolvedId = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!resolvedId) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', resolvedId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  }

  async createProject(project: Partial<Project>): Promise<Project | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const newProject = {
        ...project,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ai_memory: project.ai_memory || {},
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting project:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Database error:', error);
      return false;
    }
  }

  async updateProjectMemory(
    projectId: string,
    memoryUpdates: Partial<AIMemory>
  ): Promise<AIMemory | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const project = await this.getProject(projectId, user.id);
      if (!project) {
        return null;
      }

      const currentMemory = project.ai_memory || {};
      const updatedMemory: AIMemory = {
        ...currentMemory,
        ...memoryUpdates,
        conversationContext: {
          ...currentMemory.conversationContext,
          ...memoryUpdates.conversationContext,
          lastUpdated: new Date().toISOString(),
        },
      };

      const { data, error } = await supabase
        .from('projects')
        .update({
          ai_memory: updatedMemory,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .eq('user_id', user.id)
        .select('ai_memory')
        .single();

      if (error) {
        console.error('Error updating memory:', error);
        return null;
      }

      return data.ai_memory;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  async getProjectMemory(projectId: string): Promise<AIMemory | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('projects')
        .select('ai_memory')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching memory:', error);
        return null;
      }

      return data?.ai_memory || null;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }
}

export const databaseService = new DatabaseService();
