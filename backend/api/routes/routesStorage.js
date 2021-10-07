const storageService = require('../services/serviceStorage');
const ApiError = require('../../error/ApiError');
const constants= require('../../constants');
const pathPrefix = constants.ApiPrefix+'/storage';


// start Get S3 Image from Key
const getMedia = (app) => {
  app.get(pathPrefix+'/media/:key',
      async (req, res, next) => {
        try {
          const key = req.params.key;
          if (!key) {
            throw ApiError.badRequestError('Key required');
          }
          image = await storageService.getGovID(key);
          res.json(
              {image: image});
        } catch (error) {
          next(error);
        }
      });
};
// End Get Govrnment ID

module.exports = (app) => {
  // Route for image from key
  getMedia(app);
};
