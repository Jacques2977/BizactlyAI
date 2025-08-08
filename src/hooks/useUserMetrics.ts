import { useState, useEffect } from 'react';
import { UserMetrics, MetricsHistory, UserProgress, Milestone } from '../types/metrics';
import { useAuth } from '../contexts/AuthContext';

export const useUserMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [history, setHistory] = useState<MetricsHistory[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserMetrics();
    }
  }, [user]);

  const loadUserMetrics = () => {
    setIsLoading(true);
    
    // Simulate loading user-specific metrics from localStorage or API
    const savedMetrics = localStorage.getItem(`metrics_${user?.id}`);
    const savedHistory = localStorage.getItem(`history_${user?.id}`);
    
    if (savedMetrics) {
      const userMetrics = JSON.parse(savedMetrics);
      setMetrics(userMetrics);
      
      // Calculate progress
      const progressData = calculateProgress(userMetrics);
      setProgress(progressData);
    } else {
      // Initialize new user with default metrics
      const defaultMetrics: UserMetrics = {
        userId: user?.id || '',
        mrr: 0,
        customers: 0,
        churnRate: 0,
        ltv: 0,
        cac: 0,
        conversionRate: 0,
        lastUpdated: new Date().toISOString(),
        monthlyGrowth: 0,
        revenueGoal: 10000, // Default $10K MRR goal
        daysToGoal: 365
      };
      
      setMetrics(defaultMetrics);
      saveMetrics(defaultMetrics);
      
      const progressData = calculateProgress(defaultMetrics);
      setProgress(progressData);
    }
    
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    
    setIsLoading(false);
  };

  const calculateProgress = (userMetrics: UserMetrics): UserProgress => {
    const milestones: Milestone[] = [
      {
        id: '1',
        title: 'First Customer',
        targetMRR: 100,
        completed: userMetrics.mrr >= 100,
        completedDate: userMetrics.mrr >= 100 ? new Date().toISOString() : undefined,
        description: 'Get your first paying customer'
      },
      {
        id: '2',
        title: '$1K MRR',
        targetMRR: 1000,
        completed: userMetrics.mrr >= 1000,
        completedDate: userMetrics.mrr >= 1000 ? new Date().toISOString() : undefined,
        description: 'Reach $1,000 in monthly recurring revenue'
      },
      {
        id: '3',
        title: '$5K MRR',
        targetMRR: 5000,
        completed: userMetrics.mrr >= 5000,
        completedDate: userMetrics.mrr >= 5000 ? new Date().toISOString() : undefined,
        description: 'Scale to $5,000 MRR milestone'
      },
      {
        id: '4',
        title: '$10K MRR',
        targetMRR: 10000,
        completed: userMetrics.mrr >= 10000,
        completedDate: userMetrics.mrr >= 10000 ? new Date().toISOString() : undefined,
        description: 'Achieve the coveted $10K MRR goal'
      }
    ];

    const progressPercentage = Math.min((userMetrics.mrr / userMetrics.revenueGoal) * 100, 100);
    const nextMilestone = milestones.find(m => !m.completed)?.title || 'All milestones completed!';

    return {
      currentMRR: userMetrics.mrr,
      targetMRR: userMetrics.revenueGoal,
      progressPercentage,
      milestones,
      nextMilestone
    };
  };

  const updateMetrics = (newMetrics: Partial<UserMetrics>) => {
    if (!metrics || !user) return;

    const updatedMetrics: UserMetrics = {
      ...metrics,
      ...newMetrics,
      lastUpdated: new Date().toISOString()
    };

    setMetrics(updatedMetrics);
    saveMetrics(updatedMetrics);
    
    // Update progress
    const progressData = calculateProgress(updatedMetrics);
    setProgress(progressData);

    // Add to history
    const newHistoryEntry: MetricsHistory = {
      date: new Date().toISOString(),
      mrr: updatedMetrics.mrr,
      customers: updatedMetrics.customers,
      churnRate: updatedMetrics.churnRate
    };

    const updatedHistory = [...history, newHistoryEntry].slice(-30); // Keep last 30 entries
    setHistory(updatedHistory);
    localStorage.setItem(`history_${user.id}`, JSON.stringify(updatedHistory));
  };

  const saveMetrics = (metricsToSave: UserMetrics) => {
    if (user) {
      localStorage.setItem(`metrics_${user.id}`, JSON.stringify(metricsToSave));
    }
  };

  return {
    metrics,
    history,
    progress,
    isLoading,
    updateMetrics,
    loadUserMetrics
  };
};