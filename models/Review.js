const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Studio',
      required: [true, 'Studio ID is required'],
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      unique: true,
    },
    bookerEmail: {
      type: String,
      required: [true, 'Booker email is required'],
      trim: true,
      lowercase: true,
    },
    bookerName: {
      type: String,
      required: [true, 'Booker name is required'],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [10, 'Review comment must be at least 10 characters long'],
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
    },
    productionType: {
      type: String,
      trim: true,
      default: 'Commercial Production',
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ studioId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
