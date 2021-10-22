// Schema Models
const Service = require('../models/modelService');
const mongoose = require('mongoose');
const ServiceVerificationRequest =
require('../models/modelServiceVerificationRequest');

module.exports = {

  createServiceAndVerificationRequest: async (serviceInfo, userId) => {
    const service = new Service(
        {
          user_id: userId,
          service_name: serviceInfo.service_name,
          service_description: serviceInfo.service_description,
          service_price: serviceInfo.service_price,
          contact_number: serviceInfo.contact_number,
          country: serviceInfo.country,
          city: serviceInfo.city,
          postal_code: serviceInfo.postal_code,
          address: serviceInfo.address,
        },
    );
    const serviceId = service._id;
    await service.save();
    const serviceVerificationRequest = new ServiceVerificationRequest(
        {service_id: serviceId},
    );
    return await serviceVerificationRequest.save();
  },

  getPageableVerificationRequests: async (limit, skip) =>{
    return await ServiceVerificationRequest
        .find().skip(limit * skip).limit(limit).sort('createdAt');
  },

  getService: async (serviceId) => {
    return await Service.findOne({_id: serviceId});
  },

  getVerificationRequest: async (serviceId) => {
    return await ServiceVerificationRequest.findOne({service_id: serviceId});
  },

  verifyService: async (serviceId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // verify service
      await Service.findOneAndUpdate(
          {_id: serviceId},
          {verified: true},
      );

      // remove verification request
      await ServiceVerificationRequest.findOneAndRemove(
          {service_id: serviceId},
      );

      // send changes
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  },

  removeVerificationRequestAndService: async (serviceId) => {
    await ServiceVerificationRequest.findOneAndRemove({service_id: serviceId});
    return await Service.findOneAndRemove({_id: serviceId});
  },

  retrieveVerifiedServicesList: async (limit, skip) => {
    return await Service.find({verified: true}).
        skip(limit * skip).limit(limit).sort('_id');
  },

};
