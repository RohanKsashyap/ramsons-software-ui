const { FollowUpSequence } = require('../database/models');
const { Op } = require('sequelize');

class FollowUpService {
  async getAllSequences() {
    try {
      return await FollowUpSequence.findAll({
        order: [['name', 'ASC']],
      });
    } catch (error) {
      throw new Error(`Error fetching follow-up sequences: ${error.message}`);
    }
  }

  async createSequence(sequenceData) {
    try {
      return await FollowUpSequence.create(sequenceData);
    } catch (error) {
      throw new Error(`Error creating follow-up sequence: ${error.message}`);
    }
  }

  async updateSequence(id, sequenceData) {
    try {
      const [updatedCount] = await FollowUpSequence.update(sequenceData, {
        where: { id },
      });
      
      if (updatedCount === 0) {
        throw new Error('Follow-up sequence not found');
      }
      
      return await FollowUpSequence.findByPk(id);
    } catch (error) {
      throw new Error(`Error updating follow-up sequence: ${error.message}`);
    }
  }

  async deleteSequence(id) {
    try {
      const deletedCount = await FollowUpSequence.destroy({
        where: { id },
      });
      
      if (deletedCount === 0) {
        throw new Error('Follow-up sequence not found');
      }
      
      return { success: true };
    } catch (error) {
      throw new Error(`Error deleting follow-up sequence: ${error.message}`);
    }
  }

  async triggerSequence(customerId, sequenceId) {
    try {
      const sequence = await FollowUpSequence.findByPk(sequenceId);
      
      if (!sequence) {
        throw new Error('Follow-up sequence not found');
      }

      if (!sequence.enabled) {
        throw new Error('Follow-up sequence is disabled');
      }

      // Here you would typically create follow-up tasks/jobs
      // For now, we'll just simulate the trigger
      console.log(`Triggered follow-up sequence "${sequence.name}" for customer ${customerId}`);
      
      return { success: true };
    } catch (error) {
      throw new Error(`Error triggering follow-up sequence: ${error.message}`);
    }
  }

  async getActiveSequences() {
    try {
      return await FollowUpSequence.findAll({
        where: { enabled: true },
        order: [['name', 'ASC']],
      });
    } catch (error) {
      throw new Error(`Error fetching active follow-up sequences: ${error.message}`);
    }
  }

  async executeSequenceStep(customerId, sequenceId, stepNumber) {
    try {
      const sequence = await FollowUpSequence.findByPk(sequenceId);
      
      if (!sequence || !sequence.enabled) {
        throw new Error('Follow-up sequence not found or disabled');
      }

      const step = sequence.steps.find(s => s.stepNumber === stepNumber);
      
      if (!step) {
        throw new Error('Follow-up step not found');
      }

      // Execute the step action
      if (step.action === 'notification') {
        const { Notification } = require('electron');
        
        if (Notification.isSupported()) {
          const notification = new Notification({
            title: step.message.title,
            body: step.message.body,
          });
          
          notification.show();
        }
      }

      // Mark step as completed
      const updatedSteps = sequence.steps.map(s => 
        s.stepNumber === stepNumber 
          ? { ...s, completed: true, completedAt: new Date().toISOString() }
          : s
      );

      await sequence.update({ steps: updatedSteps });

      return { success: true };
    } catch (error) {
      throw new Error(`Error executing follow-up step: ${error.message}`);
    }
  }
}

module.exports = new FollowUpService();