const { NotificationRule } = require('./database/models');

const defaultRules = [
  {
    name: 'Payment Overdue Alert',
    type: 'overdue',
    enabled: true,
    conditions: {
      daysOverdue: 1
    },
    actions: {
      notification: true,
      email: false,
      sms: false
    },
    sound: {
      enabled: true,
      type: 'urgent',
      volume: 0.8
    },
    schedule: {
      frequency: 'daily',
      time: '09:00'
    },
    message: {
      title: 'Payment Overdue Alert',
      body: 'You have customers with overdue payments that need immediate attention.'
    }
  },
  {
    name: 'Payment Due Today Reminder',
    type: 'reminder',
    enabled: true,
    conditions: {
      daysOverdue: 0
    },
    actions: {
      notification: true,
      email: false,
      sms: false
    },
    sound: {
      enabled: true,
      type: 'urgent',
      volume: 0.7
    },
    schedule: {
      frequency: 'daily',
      time: '10:00'
    },
    message: {
      title: 'Payment Due Today',
      body: 'You have payments due today that require your attention.'
    }
  },
  {
    name: 'Payment Due Soon Reminder',
    type: 'reminder',
    enabled: true,
    conditions: {
      daysOverdue: -3 // Due in 3 days
    },
    actions: {
      notification: true,
      email: false,
      sms: false
    },
    sound: {
      enabled: true,
      type: 'reminder',
      volume: 0.6
    },
    schedule: {
      frequency: 'daily',
      time: '11:00'
    },
    message: {
      title: 'Payment Due Soon',
      body: 'You have payments due in the next few days.'
    }
  },
  {
    name: 'Weekly Payment Summary',
    type: 'followup',
    enabled: true,
    conditions: {
      balanceThreshold: 100
    },
    actions: {
      notification: true,
      email: false,
      sms: false
    },
    sound: {
      enabled: true,
      type: 'notification',
      volume: 0.5
    },
    schedule: {
      frequency: 'weekly',
      time: '09:00'
    },
    message: {
      title: 'Weekly Payment Summary',
      body: 'Weekly summary of outstanding payments and customer balances.'
    }
  }
];

async function seedNotificationRules() {
  try {
    console.log('Seeding notification rules...');
    
    // Clear existing rules
    await NotificationRule.destroy({ where: {} });
    
    // Create default rules
    for (const ruleData of defaultRules) {
      await NotificationRule.create(ruleData);
      console.log(`Created rule: ${ruleData.name}`);
    }
    
    console.log('Notification rules seeded successfully!');
  } catch (error) {
    console.error('Error seeding notification rules:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedNotificationRules().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}

module.exports = { seedNotificationRules, defaultRules };
