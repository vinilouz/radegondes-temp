const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  color: {
    type: String,
    required: true,
    enum: ['blue', 'green', 'red', 'yellow', 'purple', 'orange', 'pink', 'gray'],
    default: 'blue'
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: false
  },
  notice: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Subject', SubjectSchema);
