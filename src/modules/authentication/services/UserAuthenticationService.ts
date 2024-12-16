import { generateTokens } from "../utils/generateJwtTokens";

export default class UserAuthenticationService {
  jwtCreate = async (id: string) => {
    return await generateTokens(id);
  };
}
