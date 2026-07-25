import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Lightbulb, PartyPopper, CheckCircle, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { feedbackProcessorService, AIFeedback } from '../../services/feedbackProcessorService';

interface FeedbackInsightsSectionProps {
  projectId?: string;
}

export const FeedbackInsightsSection: React.FC<FeedbackInsightsSectionProps> = ({ projectId }) => {
  const [feedbackHistory, setFeedbackHistory] = useState<AIFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<AIFeedback | null>(null);

  useEffect(() => {
    loadFeedbackHistory();
  }, [projectId]);

  const loadFeedbackHistory = async () => {
    setIsLoading(true);
    const history = await feedbackProcessorService.getFeedbackHistory(projectId, 50);
    setFeedbackHistory(history);
    setIsLoading(false);
  };

  const handleMarkAction = async (feedbackId: string, actionTaken: boolean) => {
    await feedbackProcessorService.updateFeedbackOutcome(feedbackId, { action_taken: actionTaken });
    loadFeedbackHistory();
  };

  const handleRateFeedback = async (feedbackId: string, rating: number, helpful: boolean) => {
    await feedbackProcessorService.updateFeedbackOutcome(feedbackId, {
      effectiveness_rating: rating,
      was_helpful: helpful,
    });
    loadFeedbackHistory();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'insight':
        return <TrendingUp className="w-5 h-5" />;
      case 'recommendation':
        return <Lightbulb className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'celebration':
        return <PartyPopper className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'insight':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'recommendation':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'celebration':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const stats = {
    total: feedbackHistory.length,
    actionable: feedbackHistory.filter(f => f.is_actionable).length,
    completed: feedbackHistory.filter(f => f.action_taken).length,
    pending: feedbackHistory.filter(f => f.is_actionable && !f.action_taken).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading feedback insights...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">AI Feedback Insights</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Insights</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Actionable</p>
              <p className="text-2xl font-bold text-white">{stats.actionable}</p>
            </div>
            <Lightbulb className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Recent Insights</h3>

        {feedbackHistory.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <Lightbulb className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No feedback insights yet. Start chatting with the AI to get personalized recommendations!</p>
          </div>
        ) : (
          feedbackHistory.map((feedback) => (
            <div
              key={feedback.id}
              className={`border rounded-lg p-4 ${getColorClasses(feedback.feedback_type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">
                    {getIcon(feedback.feedback_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold">{feedback.title}</h4>
                      {feedback.action_taken && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-90 mb-2">{feedback.content}</p>

                    {feedback.recommendations && feedback.recommendations.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-semibold opacity-75">Recommendations:</p>
                        {feedback.recommendations.map((rec, idx) => (
                          <div key={idx} className="text-xs opacity-75 ml-4">
                            • {rec.action} {rec.priority && (
                              <span className="font-semibold">({rec.priority} priority)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {feedback.is_actionable && !feedback.action_taken && (
                      <div className="mt-3 flex items-center space-x-2">
                        <button
                          onClick={() => handleMarkAction(feedback.id!, true)}
                          className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors"
                        >
                          Mark as Done
                        </button>
                      </div>
                    )}

                    {feedback.action_taken && !feedback.effectiveness_rating && (
                      <div className="mt-3 flex items-center space-x-2">
                        <p className="text-xs opacity-75">Was this helpful?</p>
                        <button
                          onClick={() => handleRateFeedback(feedback.id!, 5, true)}
                          className="p-1 hover:bg-white/20 rounded transition-colors"
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRateFeedback(feedback.id!, 1, false)}
                          className="p-1 hover:bg-white/20 rounded transition-colors"
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {feedback.effectiveness_rating && (
                      <div className="mt-2 text-xs opacity-75">
                        Rating: {'⭐'.repeat(feedback.effectiveness_rating)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs opacity-50">
                  {new Date(feedback.created_at!).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
