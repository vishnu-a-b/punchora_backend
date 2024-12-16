const bcrypt = require("bcryptjs");

export const createPasswordHash = async (password: string) => {
  return await bcrypt.hash(password, 10);
};
