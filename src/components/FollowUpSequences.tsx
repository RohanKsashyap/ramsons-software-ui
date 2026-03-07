import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, Edit2, Trash2, Play, Clock, MessageSquare } from 'lucide-react';
import { apiService } from '../services/api';
import type { FollowUpSequence, FollowUpStep } from '../types';

export const FollowUpSequences: React.FC = () => {
  const [sequences, setSequences] = useState<FollowUpSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSequence, setEditingSequence] = useState<FollowUpSequence | null>(null);

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      const data = await apiService.followups.getSequences();
      setSequences(data);
    } catch (error) {
      console.error('Error fetching follow-up sequences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSequence = async (sequenceId: string, enabled: boolean) => {
    try {
      await apiService.followups.updateSequence(sequenceId, { enabled });
      await fetchSequences();
    } catch (error) {
      alert('Failed to update sequence');
    }
  };

  const handleDeleteSequence = async (sequenceId: string, sequenceName: string) => {
    if (window.confirm(`Are you sure you want to delete the sequence "${sequenceName}"?`)) {
      try {
        await apiService.followups.deleteSequence(sequenceId);
        await fetchSequences();
      } catch (error) {
        alert('Failed to delete sequence');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Follow-up Sequences</h2>
          <p className="text-gray-600 mt-1">Automated multi-step customer follow-up workflows</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Sequence
        </button>
      </div>

      {/* Sequences List */}
      <div className="grid gap-6">
        {sequences.map((sequence) => (
          <div key={sequence.id} className="bg-white p-6 rounded-lg shadow-md border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{sequence.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    sequence.trigger.type === 'overdue' 
                      ? 'bg-red-100 text-red-800'
                      : sequence.trigger.type === 'payment_missed'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {sequence.trigger.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    sequence.enabled 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {sequence.enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Triggers {sequence.trigger.daysAfter} days after {sequence.trigger.type.replace('_', ' ')}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    setEditingSequence(sequence);
                    setShowForm(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Sequence"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteSequence(sequence.id, sequence.name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Sequence"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sequence.enabled}
                    onChange={(e) => handleToggleSequence(sequence.id, e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    sequence.enabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      sequence.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                </label>
              </div>
            </div>

            {/* Steps Timeline */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Follow-up Steps ({sequence.steps.length})
              </h4>
              <div className="space-y-2">
                {sequence.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Day {step.delayDays} - {step.action.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{step.message.title}</p>
                      <p className="text-xs text-gray-600">{step.message.body}</p>
                    </div>
                    {step.completed && (
                      <div className="text-green-600 text-xs font-medium">
                        ✓ Completed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sequences.length === 0 && (
        <div className="text-center py-12">
          <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No follow-up sequences</h3>
          <p className="text-gray-600">Create your first automated follow-up sequence</p>
        </div>
      )}

      {/* Sequence Form Modal */}
      {showForm && (
        <FollowUpSequenceForm
          sequence={editingSequence}
          onClose={() => {
            setShowForm(false);
            setEditingSequence(null);
          }}
          onSave={fetchSequences}
        />
      )}
    </div>
  );
};

interface FollowUpSequenceFormProps {
  sequence?: FollowUpSequence | null;
  onClose: () => void;
  onSave: () => void;
}

const FollowUpSequenceForm: React.FC<FollowUpSequenceFormProps> = ({ sequence, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: sequence?.name || '',
    enabled: sequence?.enabled ?? true,
    triggerType: sequence?.trigger.type || 'overdue' as const,
    triggerDays: sequence?.trigger.daysAfter?.toString() || '1',
    steps: sequence?.steps || [
      {
        id: '',
        sequenceId: '',
        stepNumber: 1,
        delayDays: 1,
        action: 'notification' as const,
        message: { title: '', body: '' },
        completed: false,
      }
    ] as FollowUpStep[],
  });

  const addStep = () => {
    const newStep: FollowUpStep = {
      id: '',
      sequenceId: '',
      stepNumber: formData.steps.length + 1,
      delayDays: formData.steps.length + 1,
      action: 'notification',
      message: { title: '', body: '' },
      completed: false,
    };
    setFormData({ ...formData, steps: [...formData.steps, newStep] });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...formData.steps];
    if (field.startsWith('message.')) {
      const messageField = field.split('.')[1];
      newSteps[index] = {
        ...newSteps[index],
        message: { ...newSteps[index].message, [messageField]: value }
      };
    } else {
      newSteps[index] = { ...newSteps[index], [field]: value };
    }
    setFormData({ ...formData, steps: newSteps });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sequenceData = {
      name: formData.name,
      enabled: formData.enabled,
      trigger: {
        type: formData.triggerType,
        daysAfter: parseInt(formData.triggerDays),
      },
      steps: formData.steps.map((step, index) => ({
        ...step,
        stepNumber: index + 1,
      })),
    };

    try {
      if (sequence) {
        await apiService.followups.updateSequence(sequence.id, sequenceData);
      } else {
        await apiService.followups.createSequence(sequenceData);
      }
      onSave();
      onClose();
    } catch (error) {
      alert('Failed to save follow-up sequence');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {sequence ? 'Edit Follow-up Sequence' : 'Create Follow-up Sequence'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sequence Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Overdue Payment Follow-up"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigger Type *
              </label>
              <select
                value={formData.triggerType}
                onChange={(e) => setFormData({ ...formData, triggerType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="overdue">Payment Overdue</option>
                <option value="payment_missed">Payment Missed</option>
                <option value="manual">Manual Trigger</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trigger After (Days) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.triggerDays}
              onChange={(e) => setFormData({ ...formData, triggerDays: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 1"
            />
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Follow-up Steps</h3>
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Step
              </button>
            </div>

            <div className="space-y-4">
              {formData.steps.map((step, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Step {index + 1}</h4>
                    {formData.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delay (Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={step.delayDays}
                        onChange={(e) => updateStep(index, 'delayDays', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Action Type
                      </label>
                      <select
                        value={step.action}
                        onChange={(e) => updateStep(index, 'action', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="notification">Desktop Notification</option>
                        <option value="email">Email (Coming Soon)</option>
                        <option value="sms">SMS (Coming Soon)</option>
                        <option value="call_reminder">Call Reminder</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message Title
                      </label>
                      <input
                        type="text"
                        value={step.message.title}
                        onChange={(e) => updateStep(index, 'message.title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Payment Reminder"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message Body
                      </label>
                      <textarea
                        rows={2}
                        value={step.message.body}
                        onChange={(e) => updateStep(index, 'message.body', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Please contact customer regarding overdue payment."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {sequence ? 'Update Sequence' : 'Create Sequence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};