import { io, connectedUsers } from '../index.js';

/**
 * Broadcast appointment status change to relevant users
 * @param {string} appointmentId - The appointment ID
 * @param {string} newStatus - The new status (scheduled, completed, cancelled)
 * @param {Object} appointmentData - Additional appointment details
 */
export const broadcastAppointmentStatusChange = (appointmentId, newStatus, appointmentData = {}) => {
  try {
    io.to(`appointment:${appointmentId}`).emit('appointment:statusChanged', {
      appointmentId,
      status: newStatus,
      patientId: appointmentData.patientId,
      doctorId: appointmentData.doctorId,
      hospitalId: appointmentData.hospitalId,
      appointmentDate: appointmentData.appointmentDate,
      updatedAt: new Date().toISOString(),
    });

    // Also notify admin
    io.to('admin:notifications').emit('appointment:statusChangedAdmin', {
      appointmentId,
      status: newStatus,
      patientName: appointmentData.patientName,
      doctorName: appointmentData.doctorName,
      hospitalName: appointmentData.hospitalName,
      updatedAt: new Date().toISOString(),
    });

    console.log(`📢 Appointment ${appointmentId} status updated to ${newStatus}`);
  } catch (error) {
    console.error('Error broadcasting appointment status:', error.message);
  }
};

/**
 * Broadcast doctor availability change
 * @param {string} doctorId - The doctor ID
 * @param {boolean} available - Is doctor available
 * @param {string} reason - Reason for unavailability
 * @param {Object} doctorData - Additional doctor details
 */
export const broadcastDoctorAvailabilityChange = (doctorId, available, reason = '', doctorData = {}) => {
  try {
    io.to(`doctor:${doctorId}`).emit('doctor:availabilityChanged', {
      doctorId,
      available,
      reason,
      name: doctorData.name,
      specialization: doctorData.specialization,
      hospitalId: doctorData.hospitalId,
      hospitalName: doctorData.hospitalName,
      updatedAt: new Date().toISOString(),
    });

    // Notify all users about doctor availability
    io.to('doctors:availability').emit('doctor:availabilityUpdated', {
      doctorId,
      available,
      name: doctorData.name,
      specialization: doctorData.specialization,
      hospitalId: doctorData.hospitalId,
    });

    console.log(`🏥 Doctor ${doctorId} availability: ${available ? 'Available' : 'Unavailable'}`);
  } catch (error) {
    console.error('Error broadcasting doctor availability:', error.message);
  }
};

/**
 * Notify appointment changes to doctor
 * @param {string} doctorId - The doctor ID
 * @param {Object} appointmentData - Appointment details
 */
export const notifyDoctorNewAppointment = (doctorId, appointmentData) => {
  try {
    io.to(`doctor:${doctorId}`).emit('appointment:newRequest', {
      appointmentId: appointmentData._id,
      patientName: appointmentData.patientId?.name || 'Unknown Patient',
      patientEmail: appointmentData.patientId?.email,
      appointmentDate: appointmentData.appointmentDate,
      appointmentTime: appointmentData.appointmentTime,
      status: appointmentData.status,
      createdAt: new Date().toISOString(),
    });

    console.log(`📋 New appointment notification sent to Doctor ${doctorId}`);
  } catch (error) {
    console.error('Error notifying doctor:', error.message);
  }
};

/**
 * Notify patient about appointment status change
 * @param {string} patientId - The patient ID
 * @param {Object} appointmentData - Appointment details
 */
export const notifyPatientAppointmentUpdate = (patientId, appointmentData) => {
  try {
    io.to(`appointment:${appointmentData._id}`).emit('appointment:statusUpdate', {
      appointmentId: appointmentData._id,
      doctorName: appointmentData.doctorId?.name || 'Unknown Doctor',
      hospitalName: appointmentData.doctorId?.hospitalId?.name || 'Unknown Hospital',
      status: appointmentData.status,
      diagnosis: appointmentData.diagnosis || null,
      prescription: appointmentData.medicalPrescription || null,
      appointmentDate: appointmentData.appointmentDate,
      updatedAt: new Date().toISOString(),
    });

    console.log(`🔔 Appointment update notification sent to Patient ${patientId}`);
  } catch (error) {
    console.error('Error notifying patient:', error.message);
  }
};

/**
 * Get connected users count
 */
export const getConnectedUsersCount = () => {
  return connectedUsers.size;
};

/**
 * Check if user is connected
 */
export const isUserConnected = (userId) => {
  return connectedUsers.has(userId);
};
