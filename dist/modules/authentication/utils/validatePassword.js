"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passwordValidator = require("password-validator");
class PasswordValidatorClass {
    constructor() {
        this.schema = new passwordValidator();
        this.schema.is().min(8).is().max(100).has().digits(1).has().not().spaces();
    }
    validate(password) {
        if (!this.schema.validate(password)) {
            throw new Error("password should contain letters, digits and be at least eight characters long");
        }
        return;
    }
}
exports.default = new PasswordValidatorClass();
