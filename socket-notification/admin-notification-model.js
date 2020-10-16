const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const adminNotificationSchema = new mongoose.Schema({
    // notificationUserID: { type: mongoose.Schema.ObjectId, ref: 'User' },
    // driverID: { type: mongoose.Schema.ObjectId, ref: 'User' },
    // serviceProviderID: { type: mongoose.Schema.ObjectId, ref: 'User' },
    // customerID: { type:mongoose.Schema.ObjectId, ref: 'User' },
    // bookingID: { type:mongoose.Schema.ObjectId, ref: 'Booking' },
    // customBookingID: { type: String },
    eventID: { type: String },
    eventType: { type: String },
    message: { type: String },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  }, { timestamps: true });

  return mongoose.model('AdminNotification', adminNotificationSchema);
};
