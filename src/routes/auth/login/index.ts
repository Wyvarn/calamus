import express, { Request, Response } from 'express';
import { SuccessResponse } from '@core/ApiResponse';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import pick from 'lodash/pick';
import userRepository from '@repository/user';
import keystoreRepository from '@repository/keystore';
import { BadRequestError, AuthFailureError, InternalError } from '@core/ApiError';
import { createTokens } from '@security/authUtils';
import validator from '@utils/validators';
import schema from './schema';
import asyncHandler from '@utils/asyncHandler';
import logger from '@logger';

const router = express.Router();

export default router.post(
  '',
  validator(schema),
  asyncHandler(async (request: Request, response: Response) => {
    try {
      const user = await userRepository.findByEmail(request.body.email);

      if (!user) {
        throw new BadRequestError('User not registered');
      }

      if (!user.password) {
        throw new BadRequestError('Credential not set');
      }

      // compare stored password and request password
      const match = await bcrypt.compare(request.body.password, user.password);

      if (!match) {
        throw new AuthFailureError('Authentication failed');
      }

      const accessTokenKey = crypto.randomBytes(64).toString('hex');
      const refreshTokenKey = crypto.randomBytes(64).toString('hex');

      const tokens = await createTokens(user, accessTokenKey, refreshTokenKey);

      // update the primary and secondary keys using the new refresh and access tokens
      // generated
      const keystore = await keystoreRepository.findForUser(user);

      if (!keystore) {
        logger.debug(`Keystore for user ${user._id} not found `);
        throw new InternalError('keystore not found');
      }

      logger.debug(`Keystore ${keystore._id} for user ${user._id} found, updating...`);
      keystoreRepository.updateKeys(keystore, accessTokenKey, refreshTokenKey);

      new SuccessResponse('Login Success', {
        user: pick(user, ['_id', 'name', 'roles', 'profilePicUrl']),
        tokens,
      }).send(response);
    } catch (error) {
      logger.error(`Failed to login user with err ${error}`);
      response.status(401).send({
        message: error.message,
      });
    }
  }),
);
