import mongoose from "mongoose";

const { Schema, model } = mongoose;

const doctorSchema = new Schema(
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
		contact: {
			type: String,
			required: true,
			trim: true,
		},
		contactNumber: {
			type: String,
			required: true,
			trim: true,
		},
		password: {
			type: String,
			required: true,
			select: false,
		},
		role: {
			type: String,
			enum: ["doctor"],
			default: "doctor",
		},
		specialization: {
			type: String,
			required: true,
			trim: true,
		},
		experience: {
			type: Number,
			required: true,
		},
		timeSlots: {
			availableTimeSlots: {
				type: [String],
				default: [],
			},
			bookedTimeSlots: {
				type: [String],
				default: [],
			},
		},
		address: {
			type: String,
			required: true,
			trim: true,
		},
		hospitalId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Hospital',
			required: true,
		},
		licenseNumber: {
			type: String,
			required: true,
			unique: true,
		},
		approvalStatus: {
			type: String,
			enum: ['pending', 'approved', 'rejected'],
			default: 'pending',
		},
		isApproved: {
			type: Boolean,
			default: false,
		},
		available: {
			type: Boolean,
			default: true,
		},
		activeHours: {
			start: {
				type: String,
				default: "09:00",
				trim: true,
			},
			end: {
				type: String,
				default: "17:00",
				trim: true,
			},
		},
		unavailableReason: {
			type: String,
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

const Doctor = model("Doctor", doctorSchema);

export default Doctor;