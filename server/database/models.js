// Import models from the models directory
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define empty model objects that will be populated
const Customer = {};
const Transaction = {};
const NotificationRule = {};
const FollowUpSequence = {};
const Product = {};

// Export the models
export {
  Customer,
  Transaction,
  NotificationRule,
  FollowUpSequence,
  Product
};