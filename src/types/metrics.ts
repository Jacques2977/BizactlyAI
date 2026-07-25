export interface UserMetrics {
  userId: string;
  mrr: number;
  customers: number;
  churnRate: number;
  ltv: number;
  cac: number;
  conversionRate: number;
  lastUpdated: string;
  monthlyGrowth: number;
  revenueGoal: number;
  daysToGoal: number;
}

export interface MetricsHistory {
  date: string;
  mrr: number;
  customers: number;
  churnRate: number;
}

export interface UserProgress {
  currentMRR: number;
  targetMRR: number;
  progressPercentage: number;
  milestones: Milestone[];
  nextMilestone: string;
}

export interface Milestone {
  id: string;
  title: string;
  targetMRR: number;
  completed: boolean;
  completedDate?: string;
  description: string;
}