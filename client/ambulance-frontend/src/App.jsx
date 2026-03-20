
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./lib/api";
import { SectionCard } from "./components/SectionCard";
import { StatCard } from "./components/StatCard";

const initialRegisterForm = {
	vehicleNumber: "",
	driverName: "",
	driverPhone: "",
	hospitalId: "",
	lng: "73.8567",
	lat: "18.5204",
};

const initialEmergencyForm = {
	patientId: "",
	lng: "73.8567",
	lat: "18.5204",
};

function App() {
	const [token, setToken] = useState("");
	const [message, setMessage] = useState("Connect your backend and token to start operations.");
	const [loading, setLoading] = useState(false);

	const [hospitals, setHospitals] = useState([]);
	const [ambulances, setAmbulances] = useState([]);
	const [hospitalFilter, setHospitalFilter] = useState("all");

	const [registerForm, setRegisterForm] = useState(initialRegisterForm);
	const [emergencyForm, setEmergencyForm] = useState(initialEmergencyForm);
	const [targetEmergencyId, setTargetEmergencyId] = useState("");

	const [statusEdits, setStatusEdits] = useState({});
	const [locationEdits, setLocationEdits] = useState({});

	const filteredAmbulances = useMemo(() => {
		if (hospitalFilter === "all") return ambulances;
		return ambulances.filter((item) => String(item.hospitalId) === String(hospitalFilter));
	}, [ambulances, hospitalFilter]);

	const stats = useMemo(() => {
		const total = filteredAmbulances.length;
		const available = filteredAmbulances.filter((item) => item.status === "AVAILABLE").length;
		const busy = filteredAmbulances.filter((item) => item.status === "BUSY").length;
		const offline = filteredAmbulances.filter((item) => item.status === "OFFLINE").length;
		return { total, available, busy, offline };
	}, [filteredAmbulances]);

	const callApi = async (path, options = {}, fallbackError = "Request failed") => {
		try {
			const result = await apiRequest(path, token, options);
			return result;
		} catch (error) {
			setMessage(error.message || fallbackError);
			throw error;
		}
	};

	const refreshData = async () => {
		setLoading(true);
		try {
			const [hospitalsResponse, ambulancesResponse] = await Promise.all([
				callApi("/hospitals", {}, "Unable to load hospitals"),
				token ? callApi("/api/ambulances", {}, "Unable to load ambulances") : Promise.resolve([]),
			]);

			setHospitals(Array.isArray(hospitalsResponse) ? hospitalsResponse : []);
			setAmbulances(Array.isArray(ambulancesResponse) ? ambulancesResponse : []);
			setMessage("Data synced.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		refreshData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token]);

	const handleRegister = async (event) => {
		event.preventDefault();
		await callApi(
			"/api/ambulances",
			{
				method: "POST",
				body: JSON.stringify({
					vehicleNumber: registerForm.vehicleNumber,
					driverName: registerForm.driverName,
					driverPhone: registerForm.driverPhone,
					hospitalId: registerForm.hospitalId,
					lng: Number(registerForm.lng),
					lat: Number(registerForm.lat),
				}),
			},
			"Ambulance registration failed"
		);

		setMessage("Ambulance registered successfully.");
		setRegisterForm(initialRegisterForm);
		await refreshData();
	};

	const handleCreateEmergency = async (event) => {
		event.preventDefault();
		const response = await callApi(
			"/api/emergency",
			{
				method: "POST",
				body: JSON.stringify({
					patientId: emergencyForm.patientId,
					lng: Number(emergencyForm.lng),
					lat: Number(emergencyForm.lat),
				}),
			},
			"Emergency creation failed"
		);

		setTargetEmergencyId(response?.emergency?._id || "");
		setMessage("Emergency created. You can now assign nearest ambulance.");
	};

	const handleEmergencyAction = async (actionPath, successMessage) => {
		if (!targetEmergencyId) {
			setMessage("Enter emergency ID first.");
			return;
		}

		await callApi(actionPath, { method: "POST" }, "Emergency action failed");
		setMessage(successMessage);
		await refreshData();
	};

	const handleStatusUpdate = async (ambulanceId) => {
		const nextStatus = statusEdits[ambulanceId] || "AVAILABLE";
		await callApi(
			`/api/ambulances/${ambulanceId}/status`,
			{
				method: "PUT",
				body: JSON.stringify({ status: nextStatus }),
			},
			"Status update failed"
		);
		setMessage("Ambulance status updated.");
		await refreshData();
	};

	const handleLocationUpdate = async (ambulanceId) => {
		const draft = locationEdits[ambulanceId] || {};
		await callApi(
			`/api/ambulances/${ambulanceId}/location`,
			{
				method: "PUT",
				body: JSON.stringify({ lng: Number(draft.lng), lat: Number(draft.lat) }),
			},
			"Location update failed"
		);
		setMessage("Ambulance location updated.");
		await refreshData();
	};

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#4ecdc433,transparent_45%),radial-gradient(circle_at_bottom_right,#ff6b6b22,transparent_35%),linear-gradient(160deg,#071021,#0d1b2a,#102a43)] text-slate-100">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
				<header className="rounded-3xl border border-white/10 bg-black/20 p-6 backdrop-blur-xl">
					<p className="font-mono text-xs uppercase tracking-[0.32em] text-cyan-300">Ambulance Control Grid</p>
					<h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-5xl">Rapid Response Console</h1>
					<p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
						Register ambulances, map hospitals, dispatch emergencies, and monitor fleet availability from one operations panel.
					</p>
				</header>

				<SectionCard title="Access + Sync" subtitle="Paste admin/hospital token to activate protected endpoints.">
					<div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
						<input
							className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-300"
							value={token}
							onChange={(event) => setToken(event.target.value)}
							placeholder="JWT token (required for /api/ambulances and /api/emergency)"
						/>
						<button
							type="button"
							onClick={refreshData}
							className="h-11 rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
						>
							{loading ? "Syncing..." : "Refresh Data"}
						</button>
						<button
							type="button"
							onClick={() => {
								setToken("");
								setMessage("Token cleared.");
							}}
							className="h-11 rounded-xl border border-white/20 px-4 text-sm text-slate-200 transition hover:bg-white/10"
						>
							Clear Token
						</button>
					</div>
					<p className="mt-3 text-sm text-emerald-300">{message}</p>
				</SectionCard>

				<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<StatCard title="Total Fleet" value={stats.total} tone="cyan" />
					<StatCard title="Available" value={stats.available} tone="emerald" />
					<StatCard title="Busy" value={stats.busy} tone="amber" />
					<StatCard title="Offline" value={stats.offline} tone="rose" />
				</section>

				<div className="grid gap-6 xl:grid-cols-2">
					<SectionCard title="Register Ambulance" subtitle="Add new unit and instantly include it in live fleet.">
						<form onSubmit={handleRegister} className="grid gap-3">
							<input
								className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300"
								value={registerForm.vehicleNumber}
								onChange={(event) => setRegisterForm((prev) => ({ ...prev, vehicleNumber: event.target.value }))}
								placeholder="Vehicle Number"
								required
							/>
							<input
								className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300"
								value={registerForm.driverName}
								onChange={(event) => setRegisterForm((prev) => ({ ...prev, driverName: event.target.value }))}
								placeholder="Driver Name"
								required
							/>
							<input
								className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300"
								value={registerForm.driverPhone}
								onChange={(event) => setRegisterForm((prev) => ({ ...prev, driverPhone: event.target.value }))}
								placeholder="Driver Phone"
								required
							/>
							<select
								className="h-11 rounded-xl border border-white/15 bg-slate-900 px-3 text-sm outline-none focus:border-cyan-300"
								value={registerForm.hospitalId}
								onChange={(event) => setRegisterForm((prev) => ({ ...prev, hospitalId: event.target.value }))}
								required
							>
								<option value="">Select Hospital</option>
								{hospitals.map((hospital) => (
									<option key={hospital._id} value={hospital._id}>
										{hospital.name}
									</option>
								))}
							</select>
							<div className="grid grid-cols-2 gap-3">
								<input
									className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300"
									value={registerForm.lng}
									onChange={(event) => setRegisterForm((prev) => ({ ...prev, lng: event.target.value }))}
									placeholder="Longitude"
									required
								/>
								<input
									className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300"
									value={registerForm.lat}
									onChange={(event) => setRegisterForm((prev) => ({ ...prev, lat: event.target.value }))}
									placeholder="Latitude"
									required
								/>
							</div>
							<button
								type="submit"
								className="mt-2 h-11 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 text-sm font-semibold text-slate-950 transition hover:opacity-90"
							>
								Register Ambulance
							</button>
						</form>
					</SectionCard>

					<SectionCard title="Emergency Dispatch" subtitle="Create emergency and execute dispatch lifecycle actions.">
						<form onSubmit={handleCreateEmergency} className="grid gap-3">
							<input
								className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-rose-300"
								value={emergencyForm.patientId}
								onChange={(event) => setEmergencyForm((prev) => ({ ...prev, patientId: event.target.value }))}
								placeholder="Patient ID"
								required
							/>
							<div className="grid grid-cols-2 gap-3">
								<input
									className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-rose-300"
									value={emergencyForm.lng}
									onChange={(event) => setEmergencyForm((prev) => ({ ...prev, lng: event.target.value }))}
									placeholder="Longitude"
									required
								/>
								<input
									className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-rose-300"
									value={emergencyForm.lat}
									onChange={(event) => setEmergencyForm((prev) => ({ ...prev, lat: event.target.value }))}
									placeholder="Latitude"
									required
								/>
							</div>
							<button
								type="submit"
								className="h-11 rounded-xl bg-gradient-to-r from-rose-400 to-amber-300 text-sm font-semibold text-slate-950 transition hover:opacity-90"
							>
								Create Emergency
							</button>
						</form>

						<div className="mt-5 space-y-3 border-t border-white/10 pt-5">
							<input
								className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-rose-300"
								value={targetEmergencyId}
								onChange={(event) => setTargetEmergencyId(event.target.value)}
								placeholder="Emergency ID"
							/>
							<div className="grid gap-2 md:grid-cols-2">
								<button
									type="button"
									onClick={() => handleEmergencyAction(`/api/emergency/${targetEmergencyId}/assign`, "Nearest ambulance assigned.")}
									className="h-10 rounded-lg bg-cyan-400/90 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
								>
									Assign Nearest
								</button>
								<button
									type="button"
									onClick={() => handleEmergencyAction(`/api/emergency/${targetEmergencyId}/accept`, "Emergency accepted.")}
									className="h-10 rounded-lg bg-emerald-400/90 text-xs font-semibold text-slate-950 hover:bg-emerald-300"
								>
									Accept
								</button>
								<button
									type="button"
									onClick={() => handleEmergencyAction(`/api/emergency/${targetEmergencyId}/complete`, "Emergency completed.")}
									className="h-10 rounded-lg bg-amber-400/90 text-xs font-semibold text-slate-950 hover:bg-amber-300"
								>
									Complete
								</button>
								<button
									type="button"
									onClick={() => handleEmergencyAction(`/api/emergency/${targetEmergencyId}/cancel`, "Emergency cancelled.")}
									className="h-10 rounded-lg bg-rose-400/90 text-xs font-semibold text-slate-950 hover:bg-rose-300"
								>
									Cancel
								</button>
							</div>
						</div>
					</SectionCard>
				</div>

				<SectionCard title="Hospital Connectivity" subtitle="Filter fleet by connected hospital and inspect mapping coverage.">
					<div className="mb-4 grid gap-4 md:grid-cols-[280px_1fr]">
						<select
							value={hospitalFilter}
							onChange={(event) => setHospitalFilter(event.target.value)}
							className="h-11 rounded-xl border border-white/15 bg-slate-900 px-3 text-sm outline-none focus:border-cyan-300"
						>
							<option value="all">All Hospitals</option>
							{hospitals.map((hospital) => (
								<option key={hospital._id} value={hospital._id}>
									{hospital.name}
								</option>
							))}
						</select>
						<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
							{hospitals.slice(0, 6).map((hospital) => (
								<article key={hospital._id} className="rounded-xl border border-white/10 bg-white/5 p-3">
									<p className="truncate text-sm font-semibold text-white">{hospital.name}</p>
									<p className="truncate pt-1 text-xs text-slate-300">{hospital.email || "No email"}</p>
									<p className="pt-2 text-[11px] uppercase tracking-[0.2em] text-cyan-200">{hospital.status || "APPROVED"}</p>
								</article>
							))}
						</div>
					</div>
				</SectionCard>

				<SectionCard title="Fleet Dashboard" subtitle="Live list with quick status and location controls.">
					<div className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead>
								<tr className="border-b border-white/10 text-xs uppercase tracking-[0.15em] text-slate-300">
									<th className="px-2 py-3">Vehicle</th>
									<th className="px-2 py-3">Driver</th>
									<th className="px-2 py-3">Status</th>
									<th className="px-2 py-3">Location</th>
									<th className="px-2 py-3">Actions</th>
								</tr>
							</thead>
							<tbody>
								{filteredAmbulances.map((item) => {
									const currentLng = item?.location?.coordinates?.[0] ?? "";
									const currentLat = item?.location?.coordinates?.[1] ?? "";
									const draft = locationEdits[item._id] || { lng: currentLng, lat: currentLat };

									return (
										<tr key={item._id} className="border-b border-white/5 align-top text-slate-100">
											<td className="px-2 py-3 font-semibold">{item.vehicleNumber}</td>
											<td className="px-2 py-3">
												<p>{item.driverName}</p>
												<p className="text-xs text-slate-400">{item.driverPhone}</p>
											</td>
											<td className="px-2 py-3">
												<div className="flex flex-col gap-2">
													<select
														value={statusEdits[item._id] || item.status}
														onChange={(event) =>
															setStatusEdits((prev) => ({
																...prev,
																[item._id]: event.target.value,
															}))
														}
														className="h-9 rounded-lg border border-white/15 bg-slate-900 px-2 text-xs"
													>
														<option value="AVAILABLE">AVAILABLE</option>
														<option value="BUSY">BUSY</option>
														<option value="OFFLINE">OFFLINE</option>
													</select>
													<button
														type="button"
														onClick={() => handleStatusUpdate(item._id)}
														className="h-8 rounded-lg bg-cyan-400/90 px-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
													>
														Save Status
													</button>
												</div>
											</td>
											<td className="px-2 py-3">
												<div className="grid grid-cols-2 gap-2">
													<input
														value={draft.lng}
														onChange={(event) =>
															setLocationEdits((prev) => ({
																...prev,
																[item._id]: {
																	...(prev[item._id] || {}),
																	lng: event.target.value,
																},
															}))
														}
														className="h-9 rounded-lg border border-white/15 bg-white/5 px-2 text-xs"
													/>
													<input
														value={draft.lat}
														onChange={(event) =>
															setLocationEdits((prev) => ({
																...prev,
																[item._id]: {
																	...(prev[item._id] || {}),
																	lat: event.target.value,
																},
															}))
														}
														className="h-9 rounded-lg border border-white/15 bg-white/5 px-2 text-xs"
													/>
													<button
														type="button"
														onClick={() => handleLocationUpdate(item._id)}
														className="col-span-2 h-8 rounded-lg bg-emerald-400/90 px-2 text-xs font-semibold text-slate-950 hover:bg-emerald-300"
													>
														Save Location
													</button>
												</div>
											</td>
											<td className="px-2 py-3 text-xs text-slate-300">
												<p>ID:</p>
												<p className="max-w-[180px] break-all">{item._id}</p>
												<p className="pt-2">Hospital:</p>
												<p className="max-w-[180px] break-all">{item.hospitalId}</p>
											</td>
										</tr>
									);
								})}
								{filteredAmbulances.length === 0 ? (
									<tr>
										<td colSpan={5} className="px-2 py-6 text-center text-sm text-slate-300">
											No ambulance records. Register one to begin.
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>
				</SectionCard>
			</div>
		</div>
	);
}

export default App;
