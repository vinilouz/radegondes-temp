const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Notice', NoticeSchema);
