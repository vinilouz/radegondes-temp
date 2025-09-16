const mongoose = require('mongoose');

const ActiveTimerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  studyPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyPlan',
    required: true,
    index: true
  },
  topicProgress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TopicProgress',
    required: true,
    index: true
  },
  index: { // In case there are multiple timers for the same topic (e.g., different sessions)
    type: Number,
    default: 0
  },
  elapsedTime: { // in seconds
    type: Number,
    required: true,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: false,
    index: true
  },
  lastSaved: {
    type: Date,
    default: Date.now
  },
  sessionId: {
    type: String,
    required: false,
    index: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient lookups
ActiveTimerSchema.index({ user: 1, studyPlan: 1, topicProgress: 1, index: 1 }, { unique: true });
ActiveTimerSchema.index({ user: 1, isActive: 1 });


// --- METHODS ---

// Method to update time
ActiveTimerSchema.methods.updateTime = function(newTime) {
  this.elapsedTime = newTime;
  this.lastUpdatedAt = new Date();
  this.lastSaved = new Date();
  return this.save();
};

// Method to pause/resume timer
ActiveTimerSchema.methods.toggleActive = function() {
  this.isActive = !this.isActive;
  this.lastUpdatedAt = new Date();
  return this.save();
};

// --- STATICS ---

// Static method to find all active timers for a user
ActiveTimerSchema.statics.findActiveTimers = function(userId) {
  return this.find({ user: userId, isActive: true });
};

// Static method to find a specific timer
ActiveTimerSchema.statics.findTimer = function(userId, studyPlanId, topicProgressId, index = 0) {
  return this.findOne({
    user: userId,
    studyPlan: studyPlanId,
    topicProgress: topicProgressId,
    index: index
  });
};

module.exports = mongoose.model('ActiveTimer', ActiveTimerSchema);
