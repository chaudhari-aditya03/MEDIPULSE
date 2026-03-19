//create patient service functions here
import Patient from "../models/patientModel.js";
import bcrypt from "bcrypt";

const getAllPatientsService = async (actorRole, actorId) => {
    try {
        const query = actorRole === "hospital" ? { hospitalId: actorId } : {};
        const patients = await Patient.find(query)
            .select("-password")
            .populate("hospitalId", "name email");
        return patients;
    } catch (error) {
        throw error;
    }
};

const getPatientByIdService = async (id, actorRole, actorId) => {
    try {
        if (actorRole === "patient" && String(id) !== String(actorId)) {
            throw new Error("Patient not found");
        }

        const query = actorRole === "hospital" ? { _id: id, hospitalId: actorId } : { _id: id };
        const patient = await Patient.findOne(query).select("-password");
        if (!patient) {
            throw new Error(actorRole === "hospital" ? "Patient not found or not under your hospital" : "Patient not found");
        }
        return patient;
    } catch (error) {
        throw error;
    }
};

const createPatientService = async (patientData, actorRole, actorId) => {
    try {
        const payload = { ...patientData };

        if (payload.email) {
            payload.email = String(payload.email).trim().toLowerCase();
        }

        if (patientData.password) {
            payload.password = await bcrypt.hash(patientData.password, 10);
        }

        if (actorRole === "hospital") {
            payload.hospitalId = actorId;
        }

        const newPatient = new Patient(payload);
        await newPatient.save();
        return { message: "Patient created successfully", patient: await Patient.findById(newPatient._id).select("-password") };
    } catch (error) {
        throw error;
    }
};

const updatePatientService = async (id, patientData, actorRole, actorId) => {
    try {
        const payload = { ...patientData };

        if (payload.email) {
            payload.email = String(payload.email).trim().toLowerCase();
        }

        if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, 10);
        }

        if (actorRole === "hospital") {
            delete payload.hospitalId;
        }

        if (actorRole === "patient" && String(id) !== String(actorId)) {
            throw new Error("Patient not found");
        }

        const query = actorRole === "hospital" ? { _id: id, hospitalId: actorId } : { _id: id };

        const updatedPatient = await Patient.findOneAndUpdate(query, payload, { new: true }).select("-password");
        if (!updatedPatient) {
            throw new Error(actorRole === "hospital" ? "Patient not found or not under your hospital" : "Patient not found");
        }
        return { message: "Patient updated successfully", patient: updatedPatient };
    } catch (error) {
        throw error;
    }
};

const deletePatientService = async (id, actorRole, actorId) => {
    try {
        const query = actorRole === "hospital" ? { _id: id, hospitalId: actorId } : { _id: id };
        const deletedPatient = await Patient.findOneAndDelete(query);
        if (!deletedPatient) {
            throw new Error(actorRole === "hospital" ? "Patient not found or not under your hospital" : "Patient not found");
        }
        return { message: "Patient deleted successfully" };
    } catch (error) {
        throw error;
    }
};

export {
    getAllPatientsService,
    getPatientByIdService,
    createPatientService,
    updatePatientService,
    deletePatientService,
};