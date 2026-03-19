import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../components/AdminShell';
import MetricCard from '../components/MetricCard';
import { apiFetch } from '../lib/api';
import { getSession } from '../lib/auth';

const hospitalInitial = {
  name: '',
  email: '',
  password: '',
  phone: '',
  licenseNumber: '',
  website: '',
  description: '',
};

const doctorInitial = {
  name: '',
  email: '',
  password: '',
  age: '',
  contactNumber: '',
  specialization: '',
  experience: '',
  licenseNumber: '',
  address: '',
  hospitalId: '',
};

function AdminDashboardPage() {
  const session = getSession();
  const token = session?.token;

  const [activeTab, setActiveTab] = useState('overview');
  const [hospitals, setHospitals] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [hospitalForm, setHospitalForm] = useState(hospitalInitial);
  const [doctorForm, setDoctorForm] = useState(doctorInitial);
  const [searchQuery, setSearchQuery] = useState('');

  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const includesSearch = (...values) => {
    if (!normalizedSearchQuery) return true;
    return values.some((value) => String(value ?? '').toLowerCase().includes(normalizedSearchQuery));
  };

  const loadDashboardData = async () => {
    if (!token) return;

    try {
      setError('');
      const [hospitalData, doctorData, pendingDoctorData, patientData, appointmentData] = await Promise.all([
        apiFetch('/hospitals/admin/all', { token }).catch(() => []),
        apiFetch('/doctors', { token }).catch(() => []),
        apiFetch('/doctors/admin/pending', { token }).catch(() => []),
        apiFetch('/patients', { token }).catch(() => []),
        apiFetch('/appointments', { token }).catch(() => []),
      ]);

      setHospitals(hospitalData);
      setAllDoctors(doctorData);
      setPendingDoctors(pendingDoctorData);
      setPatients(patientData);
      setAppointments(appointmentData);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  const hospitalWiseStats = useMemo(() => {
    const doctorCountByHospital = new Map();
    const patientCountByHospital = new Map();

    allDoctors.forEach((doctor) => {
      const key = doctor.hospitalId?._id || String(doctor.hospitalId || 'unassigned');
      doctorCountByHospital.set(key, (doctorCountByHospital.get(key) || 0) + 1);
    });

    appointments.forEach((appointment) => {
      const hospitalKey = appointment.doctorId?.hospitalId?._id;
      const patientKey = appointment.patientId?._id;
      if (!hospitalKey || !patientKey) return;

      if (!patientCountByHospital.has(hospitalKey)) {
        patientCountByHospital.set(hospitalKey, new Set());
      }

      if (appointment.status === 'completed') {
        patientCountByHospital.get(hospitalKey).add(String(patientKey));
      }
    });

    return { doctorCountByHospital, patientCountByHospital };
  }, [allDoctors, appointments]);

  const filteredHospitals = useMemo(
    () => hospitals.filter((hospital) => includesSearch(
      hospital.name,
      hospital.email,
      hospital.phone,
      hospital.licenseNumber,
      hospital.website,
      hospital.description,
      hospital.status,
    )),
    [hospitals, normalizedSearchQuery],
  );

  const filteredDoctors = useMemo(
    () => allDoctors.filter((doctor) => includesSearch(
      doctor.name,
      doctor.email,
      doctor.specialization,
      doctor.contactNumber,
      doctor.licenseNumber,
      doctor.approvalStatus,
      doctor.isApproved ? 'approved' : 'not approved',
      doctor.hospitalId?.name,
      doctor.hospitalId?.email,
    )),
    [allDoctors, normalizedSearchQuery],
  );

  const filteredPatients = useMemo(
    () => patients.filter((patient) => includesSearch(
      patient.name,
      patient.email,
      patient.contactNumber,
      patient.address,
    )),
    [patients, normalizedSearchQuery],
  );

  const filteredAppointments = useMemo(
    () => appointments.filter((appointment) => includesSearch(
      appointment.patientId?.name,
      appointment.patientId?.email,
      appointment.doctorId?.name,
      appointment.doctorId?.specialization,
      appointment.doctorId?.hospitalId?.name,
      appointment.status,
      new Date(appointment.appointmentDate).toLocaleDateString(),
    )),
    [appointments, normalizedSearchQuery],
  );

  const setSuccess = (message) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const createHospital = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await apiFetch('/hospitals/register', {
        method: 'POST',
        token,
        body: {
          ...hospitalForm,
          address: {},
        },
      });
      setHospitalForm(hospitalInitial);
      setSuccess('Hospital created successfully');
      await loadDashboardData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const approveHospital = async (id) => {
    try {
      await apiFetch(`/hospitals/${id}/approve`, { method: 'PATCH', token });
      setSuccess('Hospital approved successfully');
      await loadDashboardData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const rejectHospital = async (id) => {
    try {
      await apiFetch(`/hospitals/${id}/reject`, { method: 'PATCH', token });
      setSuccess('Hospital rejected');
      await loadDashboardData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const editHospital = async (hospital) => {
    const name = window.prompt('Hospital name', hospital.name);
    if (!name) return;

    const phone = window.prompt('Hospital phone', hospital.phone || '');
    if (!phone) return;

    try {
      await apiFetch(`/hospitals/${hospital._id}`, {
        method: 'PUT',
        token,
        body: { name, phone },
      });
      setSuccess('Hospital updated successfully');
      await loadDashboardData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const deleteHospital = async (id) => {
    if (!window.confirm('Delete this hospital?')) return;

    try {
      await apiFetch(`/hospitals/${id}`, { method: 'DELETE', token });
      setSuccess('Hospital deleted successfully');
      await loadDashboardData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const createDoctor = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await apiFetch('/doctors', {
        method: 'POST',
        token,
        body: {
          ...doctorForm,
          age: Number(doctorForm.age),
          experience: Number(doctorForm.experience),
        },
      });
      setDoctorForm(doctorInitial);
      setSuccess('Doctor created successfully');
      await loadDashboardData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const editDoctor = async (doctor) => {
    const name = window.prompt('Doctor name', doctor.name);
    if (!name) return;

    const specialization = window.prompt('Specialization', doctor.specialization || '');
    if (!specialization) return;

    const contactNumber = window.prompt('Contact number', doctor.contactNumber || '');
    if (!contactNumber) return;

    try {
      await apiFetch(`/doctors/${doctor._id}`, {
        method: 'PUT',
        token,
        body: { name, specialization, contactNumber, contact: contactNumber },
      });
      setSuccess('Doctor updated successfully');
      await loadDashboardData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const deleteDoctor = async (id) => {
    if (!window.confirm('Delete this doctor?')) return;

    try {
      await apiFetch(`/doctors/${id}`, { method: 'DELETE', token });
      setSuccess('Doctor deleted successfully');
      await loadDashboardData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const editPatient = async (patient) => {
    const name = window.prompt('Patient name', patient.name);
    if (!name) return;

    const contactNumber = window.prompt('Contact number', patient.contactNumber || '');
    if (!contactNumber) return;

    const address = window.prompt('Address', patient.address || '');
    if (!address) return;

    try {
      await apiFetch(`/patients/${patient._id}`, {
        method: 'PUT',
        token,
        body: { name, contactNumber, address },
      });
      setSuccess('Patient updated successfully');
      await loadDashboardData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const deletePatient = async (id) => {
    if (!window.confirm('Delete this patient?')) return;

    try {
      await apiFetch(`/patients/${id}`, { method: 'DELETE', token });
      setSuccess('Patient deleted successfully');
      await loadDashboardData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-5 sm:space-y-6">
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 sm:p-6 lg:p-8">
          <h1 className="text-xl font-black text-white sm:text-3xl lg:text-4xl">Multi-Hospital Admin Dashboard</h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">Perform CRUD on hospitals, doctors, and patients with hospital-wise tracking.</p>
        </div>

        {statusMessage && <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300">{statusMessage}</div>}
        {error && <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-300">{error}</div>}

        <div className="flex gap-1.5 overflow-x-auto border-b border-white/10 pb-1 sm:gap-2">
          {['overview', 'hospitals', 'doctors', 'patients', 'appointments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-t-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition sm:text-sm ${
                activeTab === tab
                  ? 'border-b-2 border-blue-400 text-blue-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search hospitals, doctors, patients, appointments..."
            className="w-full rounded-lg border border-white/15 bg-[#101a30] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-400"
          />
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total Hospitals" value={filteredHospitals.length} accent="blue" />
              <MetricCard label="Pending Hospitals" value={filteredHospitals.filter((item) => item.status === 'pending').length} accent="amber" />
              <MetricCard label="Total Doctors" value={filteredDoctors.length} accent="purple" />
              <MetricCard label="Pending Doctors" value={filteredDoctors.filter((item) => !item.isApproved && item.approvalStatus === 'pending').length} accent="amber" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total Patients" value={filteredPatients.length} accent="indigo" />
              <MetricCard label="Appointments" value={filteredAppointments.length} accent="rose" />
              <MetricCard label="Completed" value={filteredAppointments.filter((item) => item.status === 'completed').length} accent="emerald" />
              <MetricCard label="Cancelled" value={filteredAppointments.filter((item) => item.status === 'cancelled').length} accent="rose" />
            </div>
          </div>
        )}

        {activeTab === 'hospitals' && (
          <div className="space-y-5 lg:space-y-6">
            <form onSubmit={createHospital} className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <h3 className="text-lg font-black">Create Hospital</h3>
              <div className="mt-4 grid gap-3">
                {Object.entries(hospitalForm).map(([key, value]) => (
                  <input
                    key={key}
                    name={key}
                    value={value}
                    onChange={(event) => setHospitalForm((prev) => ({ ...prev, [key]: event.target.value }))}
                    placeholder={key}
                    type={key === 'password' ? 'password' : 'text'}
                    required={['name', 'email', 'password', 'phone', 'licenseNumber'].includes(key)}
                    className="rounded-lg border border-white/15 bg-[#101a30] px-3 py-2 text-sm"
                  />
                ))}
              </div>
              <button className="mt-4 w-full rounded-lg bg-mint px-4 py-2 text-sm font-black text-slatex sm:w-auto">Create Hospital</button>
            </form>

            <div className="space-y-3 lg:hidden">
              {filteredHospitals.map((hospital) => (
                <article key={hospital._id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-base font-bold text-slate-100">{hospital.name}</p>
                  <p className="text-sm text-slate-400">{hospital.email}</p>
                  <p className="mt-2 text-sm text-slate-300">Status: {hospital.status}</p>
                  <p className="text-sm text-slate-300">Doctors: {hospitalWiseStats.doctorCountByHospital.get(hospital._id) || 0}</p>
                  <p className="text-sm text-slate-300">Visited Patients: {hospitalWiseStats.patientCountByHospital.get(hospital._id)?.size || 0}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {hospital.status === 'pending' && (
                      <>
                        <button onClick={() => approveHospital(hospital._id)} className="rounded border border-emerald-300/50 px-3 py-1.5 text-sm text-emerald-200">Approve</button>
                        <button onClick={() => rejectHospital(hospital._id)} className="rounded border border-rose-300/50 px-3 py-1.5 text-sm text-rose-200">Reject</button>
                      </>
                    )}
                    <button onClick={() => editHospital(hospital)} className="rounded border border-blue-300/50 px-3 py-1.5 text-sm text-blue-200">Edit</button>
                    <button onClick={() => deleteHospital(hospital._id)} className="rounded border border-rose-300/50 px-3 py-1.5 text-sm text-rose-200">Delete</button>
                  </div>
                </article>
              ))}
            </div>

            <div className="-mx-1 hidden overflow-x-auto rounded-xl border border-white/10 bg-white/5 sm:mx-0 lg:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/10 text-xs uppercase tracking-wider text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Hospital</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Doctors</th>
                    <th className="px-4 py-3">Visited Patients</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredHospitals.map((hospital) => (
                    <tr key={hospital._id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-100">{hospital.name}</p>
                        <p className="text-xs text-slate-400">{hospital.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{hospital.status}</td>
                      <td className="px-4 py-3 text-slate-300">{hospitalWiseStats.doctorCountByHospital.get(hospital._id) || 0}</td>
                      <td className="px-4 py-3 text-slate-300">{hospitalWiseStats.patientCountByHospital.get(hospital._id)?.size || 0}</td>
                      <td className="px-4 py-3 space-x-2">
                        {hospital.status === 'pending' && (
                          <>
                            <button onClick={() => approveHospital(hospital._id)} className="rounded border border-emerald-300/50 px-2 py-1 text-xs text-emerald-200">Approve</button>
                            <button onClick={() => rejectHospital(hospital._id)} className="rounded border border-rose-300/50 px-2 py-1 text-xs text-rose-200">Reject</button>
                          </>
                        )}
                        <button onClick={() => editHospital(hospital)} className="rounded border border-blue-300/50 px-2 py-1 text-xs text-blue-200">Edit</button>
                        <button onClick={() => deleteHospital(hospital._id)} className="rounded border border-rose-300/50 px-2 py-1 text-xs text-rose-200">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="space-y-6">
            <form onSubmit={createDoctor} className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <h3 className="text-lg font-black">Create Doctor</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  name="name"
                  value={doctorForm.name}
                  onChange={(event) => setDoctorForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Doctor name"
                  required
                  className="rounded-lg border border-white/15 bg-[#101a30] px-3 py-2 text-sm"
                />
                <input
                  name="email"
                  value={doctorForm.email}
                  onChange={(event) => setDoctorForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Email"
                  type="email"
                  required
                  className="rounded-lg border border-white/15 bg-[#101a30] px-3 py-2 text-sm"
                />
                <input
                  name="password"
                  value={doctorForm.password}
                  onChange={(event) => setDoctorForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Password"
                  type="password"
                  required
                  className="rounded-lg border border-white/15 bg-[#101a30] px-3 py-2 text-sm"
                />
                <input
                  name="specialization"
                  value={doctorForm.specialization}
                  onChange={(event) => setDoctorForm((prev) => ({ ...prev, specialization: event.target.value }))}
                  placeholder="Specialization"
                  required
                  className="rounded-lg border border-white/15 bg-[#101a30] px-3 py-2 text-sm"
                />
                <input
                  name="age"
                  value={doctorForm.age}
                  onChange={(event) => setDoctorForm((prev) => ({ ...prev, age: event.target.value }))}
                  placeholder="Age"
                  type="number"
                  min="21"
                  required
                  className="rounded-lg border border-white/15 bg-[#101a30] px-3 py-2 text-sm"
                />
                <input
                  name="experience"
                  value={doctorForm.experience}
                  onChange={(event) => setDoctorForm((prev) => ({ ...prev, experience: event.target.value }))}
                  placeholder="Experience (years)"
                  type="number"
                  min="0"
                  required
                  className="rounded-lg border border-white/15 bg-[#101a30] px-3 py-2 text-sm"
                />
                <input
                  name="contactNumber"
                  value={doctorForm.contactNumber}
                  onChange={(event) => setDoctorForm((prev) => ({ ...prev, contactNumber: event.target.value }))}
                  placeholder="Contact number"
                  required
                  className="rounded-lg border border-white/15 bg-[#101a30] px-3 py-2 text-sm"
                />
                <input
                  name="licenseNumber"
                  value={doctorForm.licenseNumber}
                  onChange={(event) => setDoctorForm((prev) => ({ ...prev, licenseNumber: event.target.value }))}
                  placeholder="License number"
                  required
                  className="rounded-lg border border-white/15 bg-[#101a30] px-3 py-2 text-sm"
                />
                <input
                  name="address"
                  value={doctorForm.address}
                  onChange={(event) => setDoctorForm((prev) => ({ ...prev, address: event.target.value }))}
                  placeholder="Address"
                  required
                  className="rounded-lg border border-white/15 bg-[#101a30] px-3 py-2 text-sm sm:col-span-2"
                />
                <select
                  name="hospitalId"
                  value={doctorForm.hospitalId}
                  onChange={(event) => setDoctorForm((prev) => ({ ...prev, hospitalId: event.target.value }))}
                  required
                  className="rounded-lg border border-white/15 bg-[#101a30] px-3 py-2 text-sm sm:col-span-2"
                >
                  <option value="">Select Hospital</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital._id} value={hospital._id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
              </div>
              <button className="mt-4 w-full rounded-lg bg-mint px-4 py-2 text-sm font-black text-slatex sm:w-auto">Create Doctor</button>
            </form>

            <div className="space-y-3 lg:hidden">
              {filteredDoctors.map((doctor) => (
                <article key={doctor._id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-base font-bold text-slate-100">{doctor.name}</p>
                  <p className="text-sm text-slate-400">{doctor.specialization}</p>
                  <p className="mt-2 text-sm text-slate-300">Hospital: {doctor.hospitalId?.name || '-'}</p>
                  <p className="text-sm text-slate-300">Status: {doctor.isApproved ? 'approved' : doctor.approvalStatus}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => editDoctor(doctor)} className="rounded border border-blue-300/50 px-3 py-1.5 text-sm text-blue-200">Edit</button>
                    <button onClick={() => deleteDoctor(doctor._id)} className="rounded border border-rose-300/50 px-3 py-1.5 text-sm text-rose-200">Delete</button>
                  </div>
                </article>
              ))}
            </div>

            <div className="-mx-1 hidden overflow-x-auto rounded-xl border border-white/10 bg-white/5 sm:mx-0 lg:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/10 text-xs uppercase tracking-wider text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Doctor</th>
                    <th className="px-4 py-3">Hospital</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor._id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-100">{doctor.name}</p>
                        <p className="text-xs text-slate-400">{doctor.specialization}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{doctor.hospitalId?.name || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{doctor.isApproved ? 'approved' : doctor.approvalStatus}</td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => editDoctor(doctor)} className="rounded border border-blue-300/50 px-2 py-1 text-xs text-blue-200">Edit</button>
                        <button onClick={() => deleteDoctor(doctor._id)} className="rounded border border-rose-300/50 px-2 py-1 text-xs text-rose-200">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-5">
            <div className="space-y-3 lg:hidden">
              {filteredPatients.map((patient) => (
                <article key={patient._id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-base font-bold text-slate-100">{patient.name}</p>
                  <p className="text-sm text-slate-400">{patient.email}</p>
                  <p className="mt-2 text-sm text-slate-300">Contact: {patient.contactNumber}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => editPatient(patient)} className="rounded border border-blue-300/50 px-3 py-1.5 text-sm text-blue-200">Edit</button>
                    <button onClick={() => deletePatient(patient._id)} className="rounded border border-rose-300/50 px-3 py-1.5 text-sm text-rose-200">Delete</button>
                  </div>
                </article>
              ))}
            </div>

            <div className="-mx-1 hidden overflow-x-auto rounded-xl border border-white/10 bg-white/5 sm:mx-0 lg:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/10 text-xs uppercase tracking-wider text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredPatients.map((patient) => (
                    <tr key={patient._id} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-bold text-slate-100">{patient.name}</td>
                      <td className="px-4 py-3 text-slate-300">{patient.email}</td>
                      <td className="px-4 py-3 text-slate-300">{patient.contactNumber}</td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => editPatient(patient)} className="rounded border border-blue-300/50 px-2 py-1 text-xs text-blue-200">Edit</button>
                        <button onClick={() => deletePatient(patient._id)} className="rounded border border-rose-300/50 px-2 py-1 text-xs text-rose-200">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-5">
            <div className="space-y-3 lg:hidden">
              {filteredAppointments.map((appointment) => (
                <article key={appointment._id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-base font-bold text-slate-100">{appointment.patientId?.name || '-'}</p>
                  <p className="text-sm text-slate-400">Doctor: {appointment.doctorId?.name || '-'}</p>
                  <p className="text-sm text-slate-300">Hospital: {appointment.doctorId?.hospitalId?.name || '-'}</p>
                  <p className="text-sm text-slate-300">Date: {new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                  <p className="text-sm text-slate-300">Status: {appointment.status}</p>
                </article>
              ))}
            </div>

            <div className="-mx-1 hidden overflow-x-auto rounded-xl border border-white/10 bg-white/5 sm:mx-0 lg:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/10 text-xs uppercase tracking-wider text-slate-300">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Hospital</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-slate-300">{appointment.patientId?.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{appointment.doctorId?.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{appointment.doctorId?.hospitalId?.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{new Date(appointment.appointmentDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-300">{appointment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

export default AdminDashboardPage;
