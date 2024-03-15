import { Document, Schema, model } from "mongoose";

export interface UserDocumentInterface extends Document {
  email: string;
  username: string;
  name: string;
  password: string;
  image_url: string;
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
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
    validate: (value: string) => {
      if (!value.match(/^(?=.*[0-9])[a-zA-Z0-9!@#$%^&*]{6,16}$/)) {
        throw new Error(
          "La contraseña debe tener entre 6 y 16 caracteres y contener un número"
        );
      }
    },
  },
  image_url: {
    type: String,
    trim: true,
  },
});

export const User = model<UserDocumentInterface>("User", UserSchema);
