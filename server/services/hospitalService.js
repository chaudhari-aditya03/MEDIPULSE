import Hospital from '../models/hospitalModel.js';
import Doctor from '../models/doctorModel.js';
import Appointment from '../models/appointmentModel.js';
import Patient from '../models/patientModel.js';
import Payment from '../models/paymentModel.js';
import bcrypt from 'bcrypt';

const normalizeString = (value) => String(value ?? '').trim();

const normalizeDepartments = (rawDepartments) => {
  if (!Array.isArray(rawDepartments)) return [];
  return Array.from(new Set(rawDepartments.map((item) => normalizeString(item)).filter(Boolean)));
};

const normalizeAddress = (rawAddress = {}) => ({
  building: normalizeString(rawAddress?.building),
  lane: normalizeString(rawAddress?.lane),
  street: normalizeString(rawAddress?.street),
  city: normalizeString(rawAddress?.city),
  state: normalizeString(rawAddress?.state),
  zipCode: normalizeString(rawAddress?.zipCode),
  country: normalizeString(rawAddress?.country),
});

const toPoint = (lng, lat, label = 'Hospital') => {
  const parsedLng = Number(lng);
  const parsedLat = Number(lat);

  if (!Number.isFinite(parsedLng) || !Number.isFinite(parsedLat)) {
    throw new Error(`${label} coordinates are required in [lng, lat] format`);
  }

  return {
    type: 'Point',
    coordinates: [parsedLng, parsedLat],
  };
};

export const createHospitalService = async (hospitalData) => {
  const payload = { ...hospitalData };

  payload.email = normalizeString(payload.email).toLowerCase();
  payload.name = normalizeString(payload.name);
  payload.phone = normalizeString(payload.phone);
  payload.website = normalizeString(payload.website);
  payload.description = normalizeString(payload.description);
  payload.licenseNumber = normalizeString(payload.licenseNumber).toUpperCase();
  payload.beds = Number(payload.beds || 0);
  payload.address = normalizeAddress(payload.address || {});
  payload.departments = normalizeDepartments(payload.departments);

  const duplicateEmail = await Hospital.findOne({ email: payload.email }).lean();
  if (duplicateEmail) {
    throw new Error('Email already in use');
  }

  const duplicateLicense = await Hospital.findOne({ licenseNumber: payload.licenseNumber }).lean();
  if (duplicateLicense) {
    throw new Error('License number already exists');
  }

  payload.password = await bcrypt.hash(payload.password, 10);
  payload.location = toPoint(payload.lng, payload.lat, 'Hospital');
  delete payload.lng;
  delete payload.lat;

  const hospital = new Hospital(payload);
  await hospital.save();
  const hospitalObject = hospital.toObject();
  delete hospitalObject.password;
  return hospitalObject;
};

export const getAllHospitalsService = async (filters = {}) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.isVerified !== undefined) query.isVerified = filters.isVerified;

  return await Hospital.find(query).select('-password').sort({ createdAt: -1 });
};

export const getHospitalByIdService = async (id) => {
  return await Hospital.findById(id).select('-password');
};

export const getHospitalProfileByUserIdService = async (hospitalId) => {
  return await Hospital.findById(hospitalId).select('-password');
};

export const updateHospitalProfileByUserIdService = async (hospitalId, updateData) => {
  const payload = { ...updateData };

  if (Object.prototype.hasOwnProperty.call(payload, 'email')) {
    payload.email = normalizeString(payload.email).toLowerCase();
    const duplicateEmail = await Hospital.findOne({ email: payload.email, _id: { $ne: hospitalId } }).lean();
    if (duplicateEmail) {
      throw new Error('Email already in use');
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'name')) payload.name = normalizeString(payload.name);
  if (Object.prototype.hasOwnProperty.call(payload, 'phone')) payload.phone = normalizeString(payload.phone);
  if (Object.prototype.hasOwnProperty.call(payload, 'website')) payload.website = normalizeString(payload.website);
  if (Object.prototype.hasOwnProperty.call(payload, 'description')) payload.description = normalizeString(payload.description);

  if (Object.prototype.hasOwnProperty.call(payload, 'licenseNumber')) {
    payload.licenseNumber = normalizeString(payload.licenseNumber).toUpperCase();
    const duplicateLicense = await Hospital.findOne({ licenseNumber: payload.licenseNumber, _id: { $ne: hospitalId } }).lean();
    if (duplicateLicense) {
      throw new Error('License number already exists');
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'beds')) payload.beds = Number(payload.beds || 0);
  if (Object.prototype.hasOwnProperty.call(payload, 'address')) payload.address = normalizeAddress(payload.address || {});
  if (Object.prototype.hasOwnProperty.call(payload, 'departments')) payload.departments = normalizeDepartments(payload.departments);

  if (Object.prototype.hasOwnProperty.call(payload, 'lng') || Object.prototype.hasOwnProperty.call(payload, 'lat')) {
    payload.location = toPoint(payload.lng, payload.lat, 'Hospital');
    delete payload.lng;
    delete payload.lat;
  }

  await Hospital.findByIdAndUpdate(hospitalId, payload, { new: true, runValidators: true });
  return await Hospital.findById(hospitalId).select('-password');
};

export const updateHospitalService = async (id, updateData) => {
  const payload = { ...updateData };

  if (Object.prototype.hasOwnProperty.call(payload, 'lng') || Object.prototype.hasOwnProperty.call(payload, 'lat')) {
    payload.location = toPoint(payload.lng, payload.lat, 'Hospital');
    delete payload.lng;
    delete payload.lat;
  }

  await Hospital.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  return await Hospital.findById(id).select('-password');
};

export const deleteHospitalService = async (id) => {
  return await Hospital.findByIdAndDelete(id);
};

export const approveHospitalService = async (id) => {
  await Hospital.findByIdAndUpdate(
    id,
    {
      status: 'approved',
      isVerified: true,
    },
    { new: true }
  );
  return await Hospital.findById(id).select('-password');
};

export const rejectHospitalService = async (id, reason) => {
  await Hospital.findByIdAndUpdate(
    id,
    {
      status: 'rejected',
    },
    { new: true }
  );
  return await Hospital.findById(id).select('-password');
};

export const getHospitalStatisticsService = async () => {
  const total = await Hospital.countDocuments();
  const approved = await Hospital.countDocuments({ status: 'approved' });
  const pending = await Hospital.countDocuments({ status: 'pending' });
  const rejected = await Hospital.countDocuments({ status: 'rejected' });

  return { total, approved, pending, rejected };
};

export const getPublicPlatformStatsService = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const [approvedHospitals, approvedDoctors, totalAppointments, todayAppointments, completedAppointments, recentAppointment] = await Promise.all([
    Hospital.countDocuments({ status: 'approved' }),
    Doctor.countDocuments({ isApproved: true }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ appointmentDate: { $gte: todayStart, $lt: tomorrowStart } }),
    Appointment.countDocuments({ status: 'completed' }),
    Appointment.findOne({ status: { $in: ['scheduled', 'completed'] } })
      .sort({ appointmentDate: -1, createdAt: -1 })
      .populate('patientId', 'name')
      .populate('doctorId', 'name specialization'),
  ]);

  return {
    approvedHospitals,
    approvedDoctors,
    totalAppointments,
    todayAppointments,
    completedAppointments,
    recentBooking: recentAppointment
      ? {
          patientName: recentAppointment.patientId?.name || 'Patient',
          doctorSpecialization: recentAppointment.doctorId?.specialization || 'General',
          appointmentTime: recentAppointment.appointmentTime || '-',
        }
      : null,
  };
};

export const getHospitalDashboardService = async (hospitalId) => {
  const hospital = await Hospital.findById(hospitalId).select('-password');
  if (!hospital) {
    throw new Error('Hospital not found');
  }

  const doctors = await Doctor.find({ hospitalId })
    .select('-password')
    .sort({ createdAt: -1 });

  const doctorIds = doctors.map((doctor) => doctor._id);

  const appointments = await Appointment.find({ doctorId: { $in: doctorIds } })
    .populate('doctorId', 'name specialization')
    .populate('patientId', 'name email contactNumber')
    .sort({ appointmentDate: -1 });

  const patientMap = new Map();

  const associatedPatients = await Patient.find({ hospitalId })
    .select('-password')
    .sort({ createdAt: -1 });

  associatedPatients.forEach((patient) => {
    patientMap.set(String(patient._id), patient);
  });

  appointments.forEach((appointment) => {
    const patient = appointment.patientId;
    if (patient?._id && !patientMap.has(String(patient._id))) {
      patientMap.set(String(patient._id), patient);
    }
  });

  const patients = Array.from(patientMap.values());

  const paymentTransactions = await Payment.find({ hospitalId, status: 'paid' })
    .populate('doctorId', 'name specialization')
    .populate('patientId', 'name email contactNumber')
    .populate('appointmentId', 'appointmentDate appointmentTime status')
    .sort({ paidAt: -1, createdAt: -1 });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
  const startOfNextMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 1, 1);

  const totalRevenue = paymentTransactions.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const dailyRevenue = paymentTransactions
    .filter((payment) => payment.paidAt && payment.paidAt >= startOfToday && payment.paidAt < startOfTomorrow)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const monthlyRevenue = paymentTransactions
    .filter((payment) => payment.paidAt && payment.paidAt >= startOfMonth && payment.paidAt < startOfNextMonth)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const cashRevenue = paymentTransactions
    .filter((payment) => payment.paymentMethod === 'cash')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const upiRevenue = paymentTransactions
    .filter((payment) => ['upi', 'online'].includes(payment.paymentMethod))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const doctorWiseRevenueMap = new Map();

  paymentTransactions.forEach((payment) => {
    const doctor = payment.doctorId;
    const key = String(doctor?._id || 'unknown');

    if (!doctorWiseRevenueMap.has(key)) {
      doctorWiseRevenueMap.set(key, {
        doctorId: doctor?._id || null,
        doctorName: doctor?.name || 'Unknown Doctor',
        specialization: doctor?.specialization || '-',
        totalRevenue: 0,
        todayRevenue: 0,
        monthRevenue: 0,
        paidAppointments: 0,
      });
    }

    const entry = doctorWiseRevenueMap.get(key);
    const amount = Number(payment.amount || 0);

    entry.totalRevenue += amount;
    entry.paidAppointments += 1;

    if (payment.paidAt && payment.paidAt >= startOfToday && payment.paidAt < startOfTomorrow) {
      entry.todayRevenue += amount;
    }

    if (payment.paidAt && payment.paidAt >= startOfMonth && payment.paidAt < startOfNextMonth) {
      entry.monthRevenue += amount;
    }
  });

  const doctorWiseRevenue = Array.from(doctorWiseRevenueMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    hospital,
    doctors,
    patients,
    appointments,
    paymentTransactions,
    stats: {
      totalDoctors: doctors.length,
      approvedDoctors: doctors.filter((doctor) => doctor.isApproved).length,
      totalPatientsVisited: patients.length,
      totalAppointments: appointments.length,
      totalVisits: appointments.filter((appointment) => appointment.status === 'completed').length,
    },
    revenue: {
      totalRevenue,
      dailyRevenue,
      monthlyRevenue,
      cashRevenue,
      upiRevenue,
      paidAppointmentsCount: paymentTransactions.length,
      doctorWiseRevenue,
    },
  };
};
