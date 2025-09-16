const mongoose = require('mongoose');

const StudyLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studyPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyPlan',
    required: true
  },
  topicProgress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TopicProgress',
    required: true
  },
  sessionId: {
    type: String,
    required: false,
    trim: true,
    index: true // For fast lookups
  },
  index: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number, // in seconds
    required: true,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    required: false
  },
  links: [{
    title: String,
    url: String
  }],
  questionsPlanned: {
    type: Number,
    default: 0
  },
  questionsCompleted: {
    type: Number,
    default: 0
  },
  activityType: {
    type: String,
    enum: ['study', 'review', 'simulation'],
    default: 'study'
  },
  material: {
    type: String,
    trim: true,
    required: false
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  markedAsStudied: {
    type: Boolean,
    default: false
  },
  dateOption: {
    type: String,
    enum: ['today', 'studying', 'already_studied', 'schedule'],
    default: 'studying'
  },
  scheduledDate: {
    type: String,
    required: false
  },
  scheduledTime: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date,
    required: false
  },
  finishedAt: {
    type: Date,
    required: false
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('StudyLog', StudyLogSchema);
