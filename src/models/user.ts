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
    unique: true,
    required: true,
    trim: true,
  },
  phone_number: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
    validate: (value: string) => {
      if (
        !value.match(
          /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])[a-zA-Z0-9!@#$%^&*]{8,}$/
        )
      ) {
        throw new Error(
          "La contraseña debe tener más de 8 caracteres y contener un número, una minúscula y una mayúscula"
        );
      }
    },
  },
});

export const User = model<UserDocumentInterface>("User", UserSchema);
