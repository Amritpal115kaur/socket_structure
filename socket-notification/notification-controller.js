const mongoose = require('mongoose');
const _ = require('underscore')

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;


  /**
     * @function <b>createNotification</b> CREATE NOTIFICATION OF USER
     * @param {object} userData USER CREDENTIALS
     * @param {function} callback
     */

  async function createNotificationForCustomer(notificationData) {
    try {
      const dataToSet = notificationData;
      return await services.MongoService.createData('customerNotification', dataToSet);
    } catch (error) {
      return error;
    }
  }

  /**
     * @function <b>createNotification</b> CREATE NOTIFICATION OF ADMIN
     */

  async function createNotification(notificationData) {
    try {
      const dataToSet = notificationData;
      return await services.MongoService.createData('AdminNotification', dataToSet);
    } catch (error) {
      return error;
    }
  }

  async function getUnreadNotificationCount() {
    try {
      const criteria = { isDeleted: false, isRead: false };
      return await services.MongoService.countData('AdminNotification', criteria);
    } catch (error) {
      return error;
    }
  }

  async function getUnreadNotificationCountForCustomer(socketData) {
    try {
      const criteria = { isDeleted: false, isRead: false, notificationUserID: mongoose.Types.ObjectId(socketData.id) };
      return await services.MongoService.countData('customerNotification', criteria);
    } catch (error) {
      return error;
    }
  }

  async function getAllNotificationForCustomer(headers, queryData, userData) {
    try {
      const criteria = { isDeleted: false, notificationUserID: userData._id };
      console.log('criteria 1--', criteria);
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: { createdAt: -1 },
      };
      const readCriteria = {
        isDeleted: false,
        isRead: false,
        notificationUserID: userData._id,
      };
      const promise = Promise.all([
        services.MongoService.countData('customerNotification', criteria),
        services.MongoService.getDataAsync('customerNotification', criteria, { __v: 0 }, options),
        services.MongoService.countData('customerNotification', readCriteria),
      ]);
      const notificationData = await promise;

      // //marking as read for notification 
      // await services.MongoService.updateMultiple('customerNotification',{
      //   _id:{
      //     $in: _.pluck(notificationData[1],'_id')
      //   }
      // },{
      //   $set: {
      //     isRead: true
      //   }
      // },{
      //   multi: true
      // })

      const data = {
        notificationCount: notificationData[0],
        notifications: notificationData[1],
        unreadNotificationCount: notificationData[2],
      };
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      return error;
    }
  }

  async function getAllNotification(headers, queryData) {
    try {
      const criteria = { isDeleted: false };
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: { createdAt: -1 },
      };
      const readCriteria = {
        isDeleted: false,
        isRead: false,
      };
      const promise = Promise.all([
        services.MongoService.countData('AdminNotification', criteria),
        services.MongoService.getDataAsync('AdminNotification', criteria, { __v: 0 }, options),
        services.MongoService.countData('AdminNotification', readCriteria),
      ]);
      const notificationData = await promise;
      const data = {
        notificationCount: notificationData[0],
        notifications: notificationData[1],
        unreadNotificationCount: notificationData[2],
      };
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      return error;
    }
  }
  async function readNotification(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = {};
      if (payloadData && !payloadData.markAllAsRead) {
        criteria._id = {
          $in: payloadData.notificationID,
        };
      }
      const dataToSet = { isRead: true };
      const options = { multi: true, new: true };
      const data = await services.MongoService.updateMultiple('AdminNotification', criteria, dataToSet, options);
      const customResponse = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'RECORDS_MODIFIED_COUNT' }) + data.nModified;
      return universalFunctions.sendSuccess(headers, customResponse);
    } catch (error) {
      return error;
    }
  }

  async function readNotificationForCustomer(headers, payloadData, userData) {
    try {
      const lang = headers['content-language'];
      const criteria = { notificationUserID: userData._id };
      if (payloadData && !payloadData.markAllAsRead) {
        criteria._id = {
          $in: payloadData.notificationID,
        };
      }
      const dataToSet = { isRead: true };
      const options = { multi: true, new: true };
      const data = await services.MongoService.updateMultiple('customerNotification', criteria, dataToSet, options);
      const customResponse = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'RECORDS_MODIFIED_COUNT' }) + data.nModified;
      return universalFunctions.sendSuccess(headers, customResponse);
    } catch (error) {
      return error;
    }
  }

  async function clearNotificationForCustomer(headers, userData) {
    try {
      const lang = headers['content-language'];
      const criteria = { isDeleted: false, notificationUserID: userData._id };
      const dataToSet = { isDeleted: true };
      const options = { multi: true, new: true };
      const data = await services.MongoService.updateMultiple('customerNotification', criteria, dataToSet, options);
      const customResponse = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'RECORDS_MODIFIED_COUNT' }) + data.nModified;
      return universalFunctions.sendSuccess(headers, customResponse);
    } catch (error) {
      return error;
    }
  }

  async function clearNotification(headers) {
    try {
      const lang = headers['content-language'];
      const criteria = { isDeleted: false };
      const dataToSet = { isDeleted: true };
      const options = { multi: true, new: true };
      const data = await services.MongoService.updateMultiple('AdminNotification', criteria, dataToSet, options);
      const customResponse = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'RECORDS_MODIFIED_COUNT' }) + data.nModified;
      return universalFunctions.sendSuccess(headers, customResponse);
    } catch (error) {
      return error;
    }
  }

  return {
    controllerName: 'NotificationController',
    createNotificationForCustomer,
    getUnreadNotificationCountForCustomer,
    getAllNotificationForCustomer,
    createNotification,
    getUnreadNotificationCount,
    getAllNotification,
    readNotification,
    clearNotification,
    clearNotificationForCustomer,
    readNotificationForCustomer
  };
};
