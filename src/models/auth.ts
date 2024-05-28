import { Document, Schema, model } from "mongoose";
import { UserDocumentInterface } from "./user.js";

export interface AuthDocumentInterface extends Document {
  user: UserDocumentInterface;
  access_token: string;
  refresh_token: string;
}

const AuthSchema = new Schema<AuthDocumentInterface>({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  access_token: {
    type: String,
    required: true,
    trim: true,
  },
  refresh_token: {
    type: String,
    required: true,
    trim: true,
  },
});

export const Auth = model<AuthDocumentInterface>("Auth", AuthSchema);
