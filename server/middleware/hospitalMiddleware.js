import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const uploadRoot = path.join(currentDirPath, '..', 'uploads', 'hospital-license-proof');

fs.mkdirSync(uploadRoot, { recursive: true });

const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadRoot);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const safeBase = path
      .basename(file.originalname || 'license-proof', extension)
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 60);
    cb(null, `${Date.now()}-${safeBase || 'license-proof'}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Only PDF, JPG, PNG, and WEBP files are allowed for license proof'));
    }
    return cb(null, true);
  },
});

const normalizeString = (value) => String(value ?? '').trim();

const parseAddress = (rawAddress = {}) => {
  const address = typeof rawAddress === 'string' ? JSON.parse(rawAddress || '{}') : rawAddress;

  return {
    building: normalizeString(address.building),
    lane: normalizeString(address.lane),
    street: normalizeString(address.street),
    city: normalizeString(address.city),
    state: normalizeString(address.state),
    zipCode: normalizeString(address.zipCode),
    country: normalizeString(address.country),
  };
};

const parseDepartments = (rawDepartments) => {
  if (Array.isArray(rawDepartments)) {
    return rawDepartments.map((item) => normalizeString(item)).filter(Boolean);
  }

  if (typeof rawDepartments === 'string') {
    const trimmed = rawDepartments.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => normalizeString(item)).filter(Boolean);
        }
      } catch (_error) {
        // Fallback to comma split below.
      }
    }

    return trimmed
      .split(',')
      .map((item) => normalizeString(item))
      .filter(Boolean);
  }

  return [];
};

const parseOptionalDate = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = normalizeString(value);
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date value');
  }

  return parsed;
};

const buildLicenseProofPayload = (req) => {
  const clientProofFileName = normalizeString(req.body.licenseProofFileName);

  if (req.file) {
    return {
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath: path.relative(path.join(currentDirPath, '..'), req.file.path).replace(/\\/g, '/'),
      uploadedAt: new Date(),
      source: 'upload',
    };
  }

  if (clientProofFileName) {
    return {
      fileName: clientProofFileName,
      originalName: clientProofFileName,
      mimeType: '',
      size: 0,
      storagePath: '',
      uploadedAt: new Date(),
      source: 'metadata',
    };
  }

  return null;
};

const uploadHospitalLicenseProof = (req, res, next) => {
  upload.single('licenseProof')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'License proof must be 5MB or less' });
      }
      return res.status(400).json({ error: error.message });
    }

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return next();
  });
};

const validateHospitalRegistrationPayload = (req, res, next) => {
  try {
    const name = normalizeString(req.body.name);
    const email = normalizeString(req.body.email).toLowerCase();
    const password = normalizeString(req.body.password);
    const phone = normalizeString(req.body.phone);
    const website = normalizeString(req.body.website);
    const licenseNumber = normalizeString(req.body.licenseNumber).toUpperCase();
    const description = normalizeString(req.body.description);
    const beds = Number(req.body.beds || 0);
    const lng = Number(req.body.lng);
    const lat = Number(req.body.lat);
    const departments = Array.from(new Set(parseDepartments(req.body.departments)));
    const address = parseAddress(req.body.address || req.body);

    if (!name || !email || !password || !phone || !licenseNumber) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password, phone, licenseNumber' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }

    if (website && !/^https?:\/\//i.test(website)) {
      return res.status(400).json({ error: 'Website must start with http:// or https://' });
    }

    if (!Number.isFinite(beds) || beds < 0) {
      return res.status(400).json({ error: 'Beds must be a valid non-negative number' });
    }

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return res.status(400).json({ error: 'Hospital location must include valid lng and lat' });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Hospital location coordinates are out of valid range' });
    }

    if (!address.building || !address.lane) {
      return res.status(400).json({ error: 'Address must include building and lane' });
    }

    if (!departments.length) {
      return res.status(400).json({ error: 'At least one department is required' });
    }

    const licenseProof = buildLicenseProofPayload(req);

    if (!licenseProof) {
      return res.status(400).json({ error: 'License proof document is required' });
    }

    req.hospitalPayload = {
      name,
      email,
      password,
      phone,
      website,
      licenseNumber,
      description,
      beds,
      departments,
      lng,
      lat,
      address,
      licenseProof,
    };

    return next();
  } catch (error) {
    return res.status(400).json({ error: 'Invalid hospital registration payload' });
  }
};

const validateHospitalProfileUpdatePayload = (req, res, next) => {
  try {
    const payload = {};

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      const name = normalizeString(req.body.name);
      if (!name) return res.status(400).json({ error: 'Hospital name cannot be empty' });
      payload.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'email')) {
      const email = normalizeString(req.body.email).toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
      payload.email = email;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'phone')) {
      const phone = normalizeString(req.body.phone);
      if (!phone) return res.status(400).json({ error: 'Phone number cannot be empty' });
      payload.phone = phone;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'website')) {
      const website = normalizeString(req.body.website);
      if (website && !/^https?:\/\//i.test(website)) {
        return res.status(400).json({ error: 'Website must start with http:// or https://' });
      }
      payload.website = website;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      payload.description = normalizeString(req.body.description);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'licenseNumber')) {
      const licenseNumber = normalizeString(req.body.licenseNumber).toUpperCase();
      if (!licenseNumber) return res.status(400).json({ error: 'License number cannot be empty' });
      payload.licenseNumber = licenseNumber;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'licenseExpiry')) {
      payload.licenseExpiry = parseOptionalDate(req.body.licenseExpiry);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'beds')) {
      const beds = Number(req.body.beds);
      if (!Number.isFinite(beds) || beds < 0) {
        return res.status(400).json({ error: 'Beds must be a valid non-negative number' });
      }
      payload.beds = beds;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'departments')) {
      payload.departments = Array.from(new Set(parseDepartments(req.body.departments)));
    }

    const hasAddressInput =
      Object.prototype.hasOwnProperty.call(req.body, 'address') ||
      Object.prototype.hasOwnProperty.call(req.body, 'building') ||
      Object.prototype.hasOwnProperty.call(req.body, 'lane') ||
      Object.prototype.hasOwnProperty.call(req.body, 'street') ||
      Object.prototype.hasOwnProperty.call(req.body, 'city') ||
      Object.prototype.hasOwnProperty.call(req.body, 'state') ||
      Object.prototype.hasOwnProperty.call(req.body, 'zipCode') ||
      Object.prototype.hasOwnProperty.call(req.body, 'country');

    if (hasAddressInput) {
      payload.address = parseAddress(req.body.address || req.body);
      if (!payload.address.building || !payload.address.lane) {
        return res.status(400).json({ error: 'Address must include building and lane' });
      }
    }

    const hasLng = Object.prototype.hasOwnProperty.call(req.body, 'lng');
    const hasLat = Object.prototype.hasOwnProperty.call(req.body, 'lat');
    if (hasLng || hasLat) {
      const lng = Number(req.body.lng);
      const lat = Number(req.body.lat);

      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        return res.status(400).json({ error: 'Hospital location must include valid lng and lat' });
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ error: 'Hospital location coordinates are out of valid range' });
      }

      payload.lng = lng;
      payload.lat = lat;
    }

    const licenseProof = buildLicenseProofPayload(req);
    if (licenseProof) {
      payload.licenseProof = licenseProof;
    }

    req.hospitalProfilePayload = payload;
    return next();
  } catch {
    return res.status(400).json({ error: 'Invalid hospital profile update payload' });
  }
};

export { uploadHospitalLicenseProof, validateHospitalRegistrationPayload, validateHospitalProfileUpdatePayload };
