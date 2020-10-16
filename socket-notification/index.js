const Joi = require('joi');
const socketIO = require('socket.io');

global.socketStatus = false;
const internals = {};

internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;
  const userService = services.UserService;

  const socket = socketIO.listen(server.listener);

  // console.log('<<<<<<<<<socket>>>>>>>>>>', socket.on);

  /** ************************************************
    * Authentication Middleware for socket Connections
    ************************************************* */
  // eslint-disable-next-line no-shadow
  socket.use(async (socket, next) => {
    const tempToken = socket.handshake.query.token || null;
    console.log('token------', tempToken);
    if (tempToken) {
      const decodedData = await userService.decodeSessionToken(tempToken);
      console.log('decodedData--------', decodedData);
      if (decodedData.userID && decodedData.role !== configs.UserConfiguration.get('/roles', { role: 'admin' })) {
        console.log('decodedData-----1111---');
        socket.join(decodedData.userID);
        socket.emit('messageFromServer', { message: 'Added To Socket Connections', performAction: 'INFO' });
      } else if (decodedData.userID && decodedData.role === configs.UserConfiguration.get('/roles', { role: 'admin' })) {
        console.log('decodedData-----222---');
        socket.join(decodedData.role);
        socket.emit('messageFromServer', { message: 'Added To Socket Connections', performAction: 'INFO' });
      } else {
        console.log('decodedData-----3333---');
        socket.emit('messageFromServer', { message: 'Invalid Token', performAction: 'INFO' });
      }
      next();
    } else {
      console.log('decodedData-----444---');
      socket.emit('messageFromServer', { message: 'Invalid Token', performAction: 'INFO' });
    }
  });

  process.on('sendNotificationToAdmin', async (socketData) => {
    const socketToSend = socketData.id;
    const createNotification = await controllers.NotificationController.createNotification(socketData);
    const unreadNotificationCount = await controllers.NotificationController.getUnreadNotificationCount();
    socket.to(socketToSend).emit('notification', { unreadNotificationCount, notification: createNotification });
  });

  // FIRE SOCKET TO PARTICULAR ROOM [ALL ACTIVE SESSIONS OF A USER]
  process.on('sendNotificationToCustomer', async (socketData) => {
    const socketToSend = socketData.id;
    console.log('socket to ssend,', socketToSend);
    const createNotificationForCustomer = await controllers.NotificationController.createNotificationForCustomer(socketData);
    const unreadNotificationCount = await controllers.NotificationController.getUnreadNotificationCountForCustomer(socketData);
    socket.to(socketToSend).emit('notification', { unreadNotificationCount, notification: createNotificationForCustomer });
  });

  // FOR LISTENING CLIENT SIDE EVENTS
  // eslint-disable-next-line no-shadow
  socket.on('connection', (socket) => {
    // frontend will allow the person to join the room based on bookingid
    // send booking id to track to create room
    socket.on('room', (bookingID) => {
      socket.join(bookingID);
    });
  });

  server.route({
    method: 'GET',
    path: '/admin/getAllNotification',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.NotificationController.getAllNotification(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'Get All Notification Of admin',
      tags: ['api', 'admin'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
          limit: Joi.number().integer().optional(),
          skip: Joi.number().integer().optional(),
        },
        failAction: universalFunctions.failActionFunction,
      },
      auth: {
        strategy: 'JwtAuth',
        // scope: ['serviceProvider'],
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });
  
  server.route({
    method: 'PUT',
    path: '/admin/readNotification',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.NotificationController.readNotification(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'Read Admin Notification',
      tags: ['api', 'admin'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          notificationID: Joi.array().items(Joi.string().required()).description('Array of notification IDs'),
          markAllAsRead: Joi.boolean().required().default(false),
        },
        failAction: universalFunctions.failActionFunction,
      },
      auth: {
        strategy: 'JwtAuth',
        // scope: ['admin'],
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });
  
  server.route({
    method: 'PUT',
    path: '/admin/clearNotification',
    async handler(request, reply) {
      const headers = request.headers;
      const data = await controllers.NotificationController.clearNotification(headers);
      return reply(data);
    },
    config: {
      description: 'Clear Admin Notification',
      tags: ['api', 'admin'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        failAction: universalFunctions.failActionFunction,
      },
      auth: {
        strategy: 'JwtAuth',
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/customer/getAllNotification',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      console.log('>>>>>>>>>>>>>>>>', request.auth.credentials.UserSession.user);
      // const userData = {
      //   userID: request.auth.credentials.UserSession.user._id,
      //   user: request.auth.credentials.UserSession.user,
      // };
      const userData = request.auth.credentials.UserSession.user;
      const data = await controllers.NotificationController.getAllNotificationForCustomer(headers, queryData, userData);
      return reply(data);
    },
    config: {
      description: 'Get All Notification Of Customer',
      tags: ['api', 'customer'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
          limit: Joi.number().integer().optional(),
          skip: Joi.number().integer().optional(),
        },
        failAction: universalFunctions.failActionFunction,
      },
      auth: {
        strategy: 'JwtAuth',
        // scope: ['serviceProvider'],
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'PUT',
    path: '/customer/clearNotification',
    async handler(request, reply) {
      const headers = request.headers;
      // const userData = {
      //   userID: request.auth.credentials.UserSession.user._id,
      //   user: request.auth.credentials.UserSession.user,
      // };
      const userData = request.auth.credentials.UserSession.user;
      const data = await controllers.NotificationController.clearNotificationForCustomer(headers, userData);
      return reply(data);
    },
    config: {
      description: 'Clear Customer Notification',
      tags: ['api', 'customer'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        failAction: universalFunctions.failActionFunction,
      },
      auth: {
        strategy: 'JwtAuth',
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'PUT',
    path: '/customer/readNotification',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const userData = request.auth.credentials.UserSession.user;
      const data = await controllers.NotificationController.readNotificationForCustomer(headers, payloadData, userData);
      return reply(data);
    },
    config: {
      description: 'Read customer Notification',
      tags: ['api', 'customer'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          notificationID: Joi.array().items(Joi.string().required()).description('Array of notification IDs'),
          markAllAsRead: Joi.boolean().required().default(false),
        },
        failAction: universalFunctions.failActionFunction,
      },
      auth: {
        strategy: 'JwtAuth',
 
        // scope: ['admin'],
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  next();
};

exports.register = function (server, options, next) {
  server.dependency(['auth', 'core-controller', 'core-models', 'core-config', 'core-services'], internals.applyRoutes);

  next();
};

exports.register.attributes = {
  name: 'notification',
};
