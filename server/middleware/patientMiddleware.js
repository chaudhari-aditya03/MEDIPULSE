const validatePatientPayload = (req, res, next) => {
	const { name, email, age, contactNumber, password, address } = req.body;

	if (!name || !email || !age || !contactNumber || !password || !address) {
		return res.status(400).json({ error: "Missing required patient fields" });
	}

	return next();
};

const validatePatientUpdatePayload = (req, res, next) => {
	if (!req.body || Object.keys(req.body).length === 0) {
		return res.status(400).json({ error: "Update payload is required" });
	}

	return next();
};

export { validatePatientPayload, validatePatientUpdatePayload };
