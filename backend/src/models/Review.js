const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  topicProgress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TopicProgress',
    required: true
  },
  studyPlan: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'StudyPlan'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  color: {
    type: String,
    enum: ['blue', 'green', 'red', 'yellow', 'purple', 'orange', 'pink', 'gray'],
    default: 'blue'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  completionDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
ReviewSchema.index({ user: 1, isActive: 1 });
ReviewSchema.index({ studyPlan: 1, topicProgress: 1 });

module.exports = mongoose.model('Review', ReviewSchema);
