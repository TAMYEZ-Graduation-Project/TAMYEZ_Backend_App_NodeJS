import type { IUser } from "../../db/interfaces/user.interface.ts";

export interface ILogInResponse {
  accessToken: string;
  user: IUser;
}
