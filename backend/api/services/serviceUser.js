/* eslint-disable new-cap */
const ApiError = require('../../error/ApiError');
const userDal = require('../repositories/dalUser');
const crypto = require('crypto');
const mongoose = require('mongoose');

module.exports = {
  /**
   *
   * @param {String} email
   * @return {Boolean} whether the email is unique inside database
   */
  isEmailUnique: async (email) => {
    return userDal.isEmailUnique(email);
  },
  /**
  *
  * @param {String} username
  * @return {Boolean} whether the username is unique inside database
  */
  isUsernameUnique: async (username) => {
    return userDal.isUsernameUnique(username);
  },
  /**
     * Registers a new user
     * @param {Object} body - user credentials
  */
  registerUser: async (body) => {
    return userDal.createUser(body);
  },
  /**
     * Registers a new user
     * @param {Object} body - user login credentials
  */
  getUserByCredentials: async (body) => {
    const cred = await userDal.getCredential(body.email);
    if (!cred) {
      throw ApiError.badRequestError('Invalid credentials');
    }
    const hash = crypto.createHmac('sha512', cred.salt);
    hash.update(body.password);
    const saltedHash = hash.digest('base64');
    if (saltedHash != cred.password) {
      throw ApiError.badRequestError('Invalid credentials');
    } else return await userDal.getUser(cred.user_id);
  },

  resetPassword: async (email, body) => {
    const currentDate = new Date();
    const {encryptedEmail, encryptedOTPId, otp, password} = body;

    if (!email) {
      throw ApiError.badRequestError('Email is not provided');
    }
    if (!encryptedEmail) {
      throw ApiError.badRequestError('Encrypted email is not provided');
    }
    if (!encryptedOTPId) {
      throw ApiError.badRequestError('Encrypted OTP ID is not provided');
    }
    if (!otp) {
      throw ApiError.badRequestError('OTP is not provided');
    }
    if (!password) {
      throw ApiError.badRequestError('New password is not provided');
    }

    const algorithm = 'aes-256-cbc';

    let decipher = crypto.createDecipheriv(
        algorithm, process.env.SECURITY_KEY, process.env.INITVECTOR);
    let decryptedEmail = decipher.update(
        String(encryptedEmail), 'hex', 'utf-8');
    decryptedEmail += decipher.final('utf8');

    decipher = crypto.createDecipheriv(
        algorithm, process.env.SECURITY_KEY, process.env.INITVECTOR);
    let decryptedOTPId = decipher.update(
        String(encryptedOTPId), 'hex', 'utf-8');
    decryptedOTPId += decipher.final('utf8');

    if (decryptedEmail != email) {
      throw ApiError.badRequestError(
          `The OTP was not sent to the email ${email}`);
    }

    let otpInstance;
    try {
      otpInstance = await userDal.getOTP(
          mongoose.Types.ObjectId(decryptedOTPId));
    } catch (error) {
      throw ApiError.requestNotFoundError(
          'Failed to find the OTP in the database', error);
    }

    if (currentDate > otpInstance.expiration_time) {
      throw ApiError.badRequestError('The OTP is already expired');
    }
    if (otp != otpInstance.otp) {
      throw ApiError.badRequestError('The entered OTP is incorrect');
    }

    try {
      await userDal.deleteOTP(mongoose.Types.ObjectId(otp.id));
    } catch (error) {
      throw ApiError.badRequestError('Failed to delete the OTP', error);
    }
    console.log('SUCCESS!');
    return 'Success!';
  },
};
