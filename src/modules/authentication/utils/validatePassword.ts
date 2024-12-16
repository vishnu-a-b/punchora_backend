const passwordValidator = require("password-validator");
class PasswordValidatorClass {
  schema = new passwordValidator();
  constructor() {
    this.schema.is().min(8).is().max(100).has().digits(1).has().not().spaces();
  }
  validate(password: string) {
    if (!this.schema.validate(password)) {
      throw new Error(
        "password should contain letters, digits and be at least eight characters long"
      );
    }
    return;
  }
}

export default new PasswordValidatorClass();
