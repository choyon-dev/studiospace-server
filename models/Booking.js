const mongoose = require('mongoose');

const bookingStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

const bookingSchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Studio',
      required: [true, 'Studio ID is required'],
      index: true,
    },
    studioTitle: {
      type: String,
      required: [true, 'Studio title is required'],
      trim: true,
    },
    studioImage: {
      type: String,
      default: '',
    },
    bookerEmail: {
      type: String,
      required: [true, 'Booker email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    bookerName: {
      type: String,
      required: [true, 'Booker name is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Booking date is required (YYYY-MM-DD)'],
      trim: true,
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (HH:MM)'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (HH:MM)'],
      trim: true,
    },
    totalHours: {
      type: Number,
      required: [true, 'Total hours is required'],
      min: [1, 'Minimum booking duration is 1 hour'],
    },
    totalCost: {
      type: Number,
      required: [true, 'Total cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: bookingStatuses,
        message: '{VALUE} is not a valid booking status',
      },
      default: 'Confirmed',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ studioId: 1, date: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
