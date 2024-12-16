import express from "express";
import IndexRouter from "./IndexRouter";

import AuthenticationRouter from "../modules/authentication/routes/AuthenticationRouter";
import UserRouter from "../modules/user/routes/UserRouter";
import RoleRouter from "../modules/role/routes/RoleRouter";
import AccountRouter from "../modules/account/routes/AccountRouter";

import AddressRouter from "../modules/address/routes/AddressRouter";

const router = express.Router();

router.use("/", IndexRouter);
router.use("/v1/auth/", AuthenticationRouter);
router.use("/v1/role/", RoleRouter);
router.use("/v1/user/", UserRouter);
router.use("/v1/account/", AccountRouter);
router.use("/v1/address/", AddressRouter);

export default router;
