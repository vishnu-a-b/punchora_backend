import express from "express";
import AccountDetailsController from "../controllers/AccountDetailsController";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { userDetailsDoc } from "../docs/accountDetailsDoc";

const router = express.Router();
const controller = new AccountDetailsController();

router.use(authenticateUser);

router.get("/details", userDetailsDoc, controller.details);

export default router;
