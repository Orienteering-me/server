import { Document, Schema, model } from "mongoose";
import { UserDocumentInterface } from "./user.js";
import { Checkpoint, CheckpointDocumentInterface } from "./checkpoint.js";
import { CheckpointTime } from "./time.js";

export interface CourseDocumentInterface extends Document {
  name: string;
  admin: UserDocumentInterface;
  checkpoints: CheckpointDocumentInterface[];
}

const CourseSchema = new Schema<CourseDocumentInterface>({
  name: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    validate: (value: string) => {
      if (value.includes("&")) {
        throw new Error(
          "El nombre de una carrera no puede contener el caracter &"
        );
      }
    },
  },
  admin: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  // Checkpoints are added in this model for simplicity
  checkpoints: {
    type: [Schema.Types.ObjectId],
    required: true,
    ref: "Checkpoint",
  },
});

CourseSchema.post("findOneAndDelete", async function (course) {
  await Checkpoint.deleteMany({ course: course._id }).exec();
  await CheckpointTime.deleteMany({ course: course._id }).exec();
});

export const Course = model<CourseDocumentInterface>("Course", CourseSchema);
