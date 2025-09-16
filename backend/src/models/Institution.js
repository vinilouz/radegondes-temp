const mongoose = require('mongoose');

const InstitutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  acronym: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  logo: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Public Contest', 'ENEM', 'Entrance Exam', 'Medical Residency', 'OAB', 'Military Contest', 'Others'],
    default: 'Public Contest'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  positions: [{
    type: String,
    trim: true
  }],
}, {
  timestamps: true
});

module.exports = mongoose.model('Institution', InstitutionSchema);
