const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const serviceProviderNotificationSchema = new mongoose.Schema({
    customerUserID: { type: mongoose.Schema.ObjectId, ref: 'User' },
    // driverID: { type: mongoose.Schema.ObjectId, ref: 'User' },
    serviceProviderID: { type: mongoose.Schema.ObjectId, ref: 'User' },
    // customerID: { type:mongoose.Schema.ObjectId, ref: 'User' },
    appointmentID: { type: mongoose.Schema.ObjectId, ref: 'ServiceAppointment' },
    eventID: { type: String },
    eventType: { type: String },
    message: { type: String },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  }, { timestamps: true });

  return mongoose.model('serviceProviderNotification', serviceProviderNotificationSchema);
};

