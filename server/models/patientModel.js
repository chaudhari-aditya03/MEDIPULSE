import mongoose from "mongoose";

const { Schema, model } = mongoose;

const patientSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		age: {
			type: Number,
			required: true,
		},
		contactNumber: {
			type: String,
			required: true,
			trim: true,
		},
		password: {
			type: String,
			required: true,
		},
		role: {
			type: String,
			enum: ["patient"],
			default: "patient",
		},
		hospitalId: {
			type: Schema.Types.ObjectId,
			ref: "Hospital",
			default: null,
		},
		address: {
			type: String,
			required: true,
			trim: true,
		},
	},
	{
		timestamps: true,
	}
);

const Patient = model("Patient", patientSchema);

export default Patient;