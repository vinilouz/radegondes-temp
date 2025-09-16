const mongoose = require('mongoose');

const TopicProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studyPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyPlan',
    required: true,
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
  },
  studyTime: {
    type: Number, // in seconds
    default: 0,
  },
  correctQuestions: {
    type: Number,
    default: 0,
  },
  incorrectQuestions: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started',
  },
}, {
  timestamps: true
});

// Create a compound index to ensure a user's progress on a topic is unique per study plan
TopicProgressSchema.index({ user: 1, studyPlan: 1, topic: 1 }, { unique: true });

module.exports = mongoose.model('TopicProgress', TopicProgressSchema);
