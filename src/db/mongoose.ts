import { connect } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("No se ha definido la variable de entorno MONGODB_URI");
  process.exit(1);
}

try {
  await connect(MONGODB_URI);
  console.log("Conectado al servidor de MongoDB");
} catch (error) {
  console.log(error);
}
