import app from "./app";
import Configs from "./configs/configs";
import { connectDb } from "./configs/db";
import { PassportAuthentication } from "./passport/PassportAuthentication";
const port = Number(Configs.port || 3000);

PassportAuthentication.initialise(app);
connectDb()
  .then(() => {
    console.log("Mongo connected");
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  })
  .catch((e) => console.log("unable to connect mongo", e));
