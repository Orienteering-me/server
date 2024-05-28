import { Document, Schema, model } from "mongoose";
import { Course } from "./course.js";
import { Auth } from "./auth.js";

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
        throw new Error("User email's format is wrong");
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
      if (
        !value.replace(/[\s()+\-\.]|ext/gi, "").match(/^\d{5,}$/) &&
        value.length != 0
      ) {
        throw new Error("User phone number's format is wrong");
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

UserSchema.post("findOneAndDelete", async function (user) {
  await Auth.findOneAndDelete({
    user: user._id,
  });
  const coursesToDelete = await Course.find({ admin: user._id });
  for (let index = 0; index < coursesToDelete.length; index++) {
    await Course.findByIdAndDelete(coursesToDelete[index]._id);
  }
});

export const User = model<UserDocumentInterface>("User", UserSchema);
