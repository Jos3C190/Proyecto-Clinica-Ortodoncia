const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  type: { type: String, required: true }, // appointment, payment, etc.
  action: { type: String, required: true }, // created, updated, etc.
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userRole' },
  userRole: { type: String, enum: ['Paciente', 'Odontologo', 'Admin'], required: true },
  userName: { type: String, required: true }
});

module.exports = mongoose.model('Activity', ActivitySchema); 