const mongoose = require('mongoose');

const studioCategories = [
  'Photo Studio',
  'Film Stage',
  'Podcast Lounge',
  'Music Suite',
  'Workshop',
];

const studioSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Studio title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: studioCategories,
        message: '{VALUE} is not a valid studio category',
      },
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Hourly rate cannot be negative'],
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, 'Security deposit cannot be negative'],
    },
    maxCapacity: {
      type: Number,
      required: [true, 'Maximum capacity is required'],
      min: [1, 'Capacity must be at least 1 person'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Studio image URL is required'],
      trim: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    overview: {
      type: String,
      required: [true, 'Studio overview is required'],
      trim: true,
    },
    ownerEmail: {
      type: String,
      required: [true, 'Owner email is required'],
      trim: true,
      lowercase: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewCount: {
      type: Number,
      default: 12,
      min: [0, 'Review count cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

studioSchema.index({ category: 1, hourlyRate: 1, rating: -1 });
studioSchema.index({ ownerEmail: 1 });

module.exports = mongoose.model('Studio', studioSchema);
