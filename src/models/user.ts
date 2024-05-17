import { Document, Schema, model } from "mongoose";

export interface UserDocumentInterface extends Document {
  email: string;
  name: string;
  phone_number: string;
  password: string;
}

const UserSchema = new Schema<UserDocumentInterface>({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    validate: (value: string) => {
      if (
        !value.match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
      ) {
        throw new Error("Formato incorrecto en el email del usuario");
      }
    },
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone_number: {
    type: String,
    trim: true,
    validate: (value: string) => {
      if (!value.replace(/[\s()+\-\.]|ext/gi, "").match(/^\d{5,}$/)) {
        throw new Error(
          "Formato incorrecto en el número de teléfono del usuario"
        );
      }
    },
  },
  // The password isn't validated because it's a hash
  password: {
    type: String,
    required: true,
    trim: true,
  },
});

export const User = model<UserDocumentInterface>("User", UserSchema);
