// all dependent mock should be on the top
import { USER_ID, ACCESS_TOKEN } from '../authentication/mock';

import { Types } from 'mongoose';
import User from '@repository/user/UserModel';
import Role, { RoleCode } from '@repository/role/RoleModel';
import { BadTokenError } from '@core/ApiError';
import JWT, { JwtPayload } from '@jwt';
import { tokenInfo } from '@config';

export const WRITER_ROLE_ID = new Types.ObjectId(); // random id
export const EDITOR_ROLE_ID = new Types.ObjectId(); // random id

export const USER_ID_WRITER = new Types.ObjectId(); // random id
export const USER_ID_EDITOR = new Types.ObjectId(); // random id

export const WRITER_ACCESS_TOKEN = 'def';
export const EDITOR_ACCESS_TOKEN = 'ghi';

export const mockUserFindById = jest.fn(async (id: Types.ObjectId) => {
  if (USER_ID_WRITER.equals(id))
    return {
      _id: USER_ID_WRITER,
      roles: [{ _id: WRITER_ROLE_ID, code: RoleCode.WRITER } as Role],
    } as User;
  if (USER_ID_EDITOR.equals(id))
    return {
      _id: USER_ID_EDITOR,
      roles: [{ _id: WRITER_ROLE_ID, code: RoleCode.EDITOR } as Role],
    } as User;
  else return null;
});

export const mockRoleRepoFindByCode = jest.fn(
  async (code: string): Promise<Role> => {
    switch (code) {
      case RoleCode.WRITER:
        return {
          _id: WRITER_ROLE_ID,
          code: RoleCode.WRITER,
          status: true,
        } as Role;
      case RoleCode.EDITOR:
        return {
          _id: EDITOR_ROLE_ID,
          code: RoleCode.EDITOR,
          status: true,
        } as Role;
    }
    return null;
  },
);

export const mockJwtValidate = jest.fn(
  async (token: string): Promise<JwtPayload> => {
    let subject = null;
    switch (token) {
      case ACCESS_TOKEN:
        subject = USER_ID.toHexString();
        break;
      case WRITER_ACCESS_TOKEN:
        subject = USER_ID_WRITER.toHexString();
        break;
      case EDITOR_ACCESS_TOKEN:
        subject = USER_ID_EDITOR.toHexString();
        break;
    }
    if (subject)
      return {
        jti: 'random-id',
        iss: tokenInfo.issuer,
        aud: tokenInfo.audience,
        sub: subject,
        iat: 1,
        exp: 2,
        typ: 'Bearer',
        name: 'john',
        roles: [],
      } as JwtPayload;
    throw new BadTokenError();
  },
);

jest.mock('@repository/user', () => ({
  get findById() {
    return mockUserFindById;
  },
}));

jest.mock('@repository/role', () => ({
  get findByCode() {
    return mockRoleRepoFindByCode;
  },
}));

JWT.validate = mockJwtValidate;
