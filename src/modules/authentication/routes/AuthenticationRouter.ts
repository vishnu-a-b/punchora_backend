import express from "express";
import UserAuthenticationController from "../controllers/UserAuthenticationController";
import { loginMiddleware } from "../middlewares/loginMiddleware";
import { verifyRefreshTokenValidationChain } from "../validators/verifyRefreshTokenValidationChain";
import { jwtCreateDoc } from "../docs/jwtCreateDoc";
import { jwtVerifyDoc } from "../docs/jwtVerifyDoc";

const router = express.Router();
const controller = new UserAuthenticationController();

router.post("/jwt/create", loginMiddleware, jwtCreateDoc, controller.login);
router.post(
  "/jwt/verify",
  verifyRefreshTokenValidationChain,
  jwtVerifyDoc,
  controller.verifyRefreshToken
);

export default router;
