import { connect } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("No MONGODB_URI environment variable has been defined in .env");
  process.exit(1);
}

try {
  await connect(MONGODB_URI);
  console.log("Conectado al servidor MongoDB");
} catch (error) {
  console.log(error);
}
