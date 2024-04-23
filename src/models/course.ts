import { Document, Schema, model } from "mongoose";
import { UserDocumentInterface } from "./user.js";
import { CheckpointDocumentInterface } from "./checkpoint.js";

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
  },
  admin: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  checkpoints: {
    type: [Schema.Types.ObjectId],
    required: true,
    ref: "Checkpoint",
  },
});

export const Course = model<CourseDocumentInterface>("Course", CourseSchema);
