const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const customerNotificationSchema = new mongoose.Schema({
    notificationUserID: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    bookingID: { type: mongoose.Schema.ObjectId, ref: 'Booking', default: null },
    eventID: { type: String, default: null },
    eventType: { type: String },
    message: { type: String },
    driverName: { type: String },
    driverProfilePic: { type: String },
    driverContactNumber: { type: String },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  }, { timestamps: true });

  return mongoose.model('customerNotification', customerNotificationSchema);
};

