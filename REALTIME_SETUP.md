# ⭐ Real-Time Updates with Socket.io

## Overview

This project now includes real-time updates for:
- **Appointment Status Changes** - Instant notifications when appointment status updates (scheduled, completed, cancelled)
- **Doctor Availability** - Real-time tracking of doctor availability across the platform

## Backend Setup

### Socket.io Server (`server/index.js`)

The backend is configured with:
- ✅ CORS enabled for development ports (3001, 3002, 5173, 5174)
- ✅ Connection/Disconnection handling
- ✅ User registration with roles and rooms
- ✅ Real-time broadcast events

### Real-Time Service (`server/services/realtimeService.js`)

Provides helper functions:
- `broadcastAppointmentStatusChange()` - Broadcast appointment status updates
- `broadcastDoctorAvailabilityChange()` - Broadcast doctor availability changes
- `notifyDoctorNewAppointment()` - Notify doctor of new appointments
- `notifyPatientAppointmentUpdate()` - Notify patient of appointment changes

### Controller Integration

**Appointment Controller** - Emits events when:
- ✅ New appointment created (notifies doctor)
- ✅ Appointment status updated (broadcasts to all relevant users)
- ✅ Patient receives notification

**Doctor Controller** - Emits events when:
- ✅ Doctor availability changes
- ✅ All users notified of availability status

---

## Frontend Implementation

### 1. Using the Socket Hook

**Doctor Frontend & Admin Frontend** both have `useSocket()` hook at:
- `client/doctor-frontend/src/lib/useSocket.js`
- `client/doctor-admin/src/lib/useSocket.js`

#### Basic Usage

```jsx
import { useSocket } from '../lib/useSocket';

function MyComponent() {
  const { on, emit, isConnected } = useSocket();

  useEffect(() => {
    // Listen for real-time events
    const unsubscribe = on('appointment:statusChanged', (data) => {
      console.log('Appointment updated:', data);
    });

    return unsubscribe;
  }, [on]);

  return (
    <div>
      Connected: {isConnected ? '✅' : '❌'}
    </div>
  );
}
```

### 2. Pre-built Real-Time Components

#### RealtimeNotification Component

Shows notifications when appointments are updated:

```jsx
import { RealtimeNotification } from '../components/RealtimeNotification';

function Dashboard() {
  const handleStatusChange = (data) => {
    console.log('Status changed:', data.status);
    // Refetch data or update UI
  };

  return (
    <>
      <RealtimeNotification 
        appointmentId={appointment._id} 
        onStatusChange={handleStatusChange}
      />
      {/* Your component */}
    </>
  );
}
```

#### DoctorAvailabilityBadge Component

Shows real-time doctor availability status:

```jsx
import { DoctorAvailabilityBadge } from '../components/DoctorAvailabilityBadge';

function DoctorCard({ doctor }) {
  return (
    <div>
      <h3>{doctor.name}</h3>
      <DoctorAvailabilityBadge 
        doctorId={doctor._id}
        initialAvailable={doctor.available}
      />
    </div>
  );
}
```

---

## Real-Time Events

### Server → Client Events

#### Appointment Events

```javascript
// Appointment status changed
'appointment:statusChanged' → {
  appointmentId: string,
  status: 'scheduled' | 'completed' | 'cancelled',
  patientId: string,
  doctorId: string,
  hospitalId: string,
  appointmentDate: string,
  updatedAt: string (ISO)
}

// New appointment request (doctor receives)
'appointment:newRequest' → {
  appointmentId: string,
  patientName: string,
  patientEmail: string,
  appointmentDate: string,
  appointmentTime: string,
  status: string,
  createdAt: string (ISO)
}

// Appointment update for patient
'appointment:statusUpdate' → {
  appointmentId: string,
  doctorName: string,
  hospitalName: string,
  status: string,
  diagnosis: string | null,
  prescription: string | null,
  appointmentDate: string,
  updatedAt: string (ISO)
}

// Admin notification (admin receives)
'appointment:statusChangedAdmin' → {
  appointmentId: string,
  status: string,
  patientName: string,
  doctorName: string,
  hospitalName: string,
  updatedAt: string (ISO)
}
```

#### Doctor Availability Events

```javascript
// Doctor availability changed
'doctor:availabilityChanged' → {
  doctorId: string,
  available: boolean,
  reason: string,
  name: string,
  specialization: string,
  hospitalId: string,
  hospitalName: string,
  updatedAt: string (ISO)
}

// Doctor availability updated (global)
'doctor:availabilityUpdated' → {
  doctorId: string,
  available: boolean,
  name: string,
  specialization: string,
  hospitalId: string
}
```

### Client → Server Events

```javascript
// Register user for real-time updates
emit('user:register', {
  userId: string,
  role: 'patient' | 'doctor' | 'hospital' | 'admin',
  appointmentId?: string,
  doctorId?: string
})

// Update appointment status
emit('appointment:updateStatus', {
  appointmentId: string,
  status: string
})

// Update doctor availability
emit('doctor:updateAvailability', {
  doctorId: string,
  available: boolean,
  reason?: string
})
```

---

## Integration Examples

### Example 1: Patient Dashboard with Real-Time Updates

```jsx
// In PatientDashboardPage.jsx
import { useSocket } from '../lib/useSocket';
import { RealtimeNotification } from '../components/RealtimeNotification';

function PatientDashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const { on } = useSocket();

  // Listen for appointment updates
  useEffect(() => {
    const unsubscribe = on('appointment:statusUpdate', (data) => {
      // Update local appointment state
      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === data.appointmentId
            ? { ...apt, status: data.status, diagnosis: data.diagnosis }
            : apt
        )
      );
    });

    return unsubscribe;
  }, [on]);

  return (
    <>
      <RealtimeNotification appointmentId={selectedAppointmentId} />
      {/* Render appointments */}
    </>
  );
}
```

### Example 2: Doctor Availability Toggle

```jsx
// In DoctorProfilePage.jsx
import { useSocket } from '../lib/useSocket';

function DoctorProfilePage() {
  const [available, setAvailable] = useState(true);
  const [reason, setReason] = useState('');
  const { emit } = useSocket();

  const toggleAvailability = async () => {
    try {
      // Update doctor in database
      await apiFetch(`/doctors/${doctorId}`, {
        method: 'PUT',
        token: session.token,
        body: { available: !available, unavailableReason: reason },
      });

      // Emit real-time update to all users
      emit('doctor:updateAvailability', {
        doctorId: doctor._id,
        available: !available,
        reason: reason,
      });

      setAvailable(!available);
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  return (
    <button onClick={toggleAvailability}>
      {available ? '🟢 Available' : '🔴 Unavailable'}
    </button>
  );
}
```

### Example 3: Doctor Appointment Notifications

```jsx
// In DoctorDashboardPage.jsx
import { useSocket } from '../lib/useSocket';

function DoctorDashboardPage() {
  const { on } = useSocket();
  const [notifications, setNotifications] = useState([]);

  // Listen for new appointment requests
  useEffect(() => {
    const unsubscribe = on('appointment:newRequest', (data) => {
      setNotifications((prev) => [data, ...prev]);
      
      // Show browser notification
      if ('Notification' in window) {
        new Notification('New Appointment Request', {
          body: `${data.patientName} requested an appointment on ${new Date(data.appointmentDate).toLocaleDateString()}`,
          icon: '/doctor-icon.png',
        });
      }
    });

    return unsubscribe;
  }, [on]);

  return (
    <>
      {notifications.map((notif) => (
        <div key={notif.appointmentId}>
          New request from {notif.patientName}
        </div>
      ))}
    </>
  );
}
```

### Example 4: Real-Time Doctor Availability in Book Appointment

```jsx
// In PatientDashboardPage.jsx (Doctor Selection)
import { DoctorAvailabilityBadge } from '../components/DoctorAvailabilityBadge';

function DoctorSelect() {
  const [doctors, setDoctors] = useState([]);

  return (
    <select>
      {doctors.map((doctor) => (
        <option key={doctor._id} value={doctor._id}>
          {doctor.name} - {doctor.specialization}
          {doctor.available ? ' ✅' : ' ❌'}
        </option>
      ))}
    </select>
  );
}
```

---

## Socket.io Rooms (Behind the Scenes)

The application uses rooms for targeted real-time updates:

- `appointment:{appointmentId}` - Users involved in this appointment
- `doctor:{doctorId}` - Users tracking this doctor's availability
- `doctors:availability` - All users interested in doctor availability
- `admin:notifications` - Admin users for notifications

When an update occurs, the backend emits to the appropriate room(s).

---

## Testing Real-Time Features

### 1. Test Appointment Status Update

1. Login as patient and book appointment
2. Login as doctor in another window
3. Doctor marks appointment as "completed"
4. Patient window shows instant notification ✅

### 2. Test Doctor Availability

1. Login as doctor
2. Toggle availability to "Unavailable"
3. Open another window and navigate to booking
4. Doctor's badge instantly shows unavailable ✅
5. Toggle back to available
6. Badge updates instantly ✅

### 3. Monitor Connection

Open browser console and check logs:
```
✅ Connected to real-time server: {socketId}
👤 User registered: {userId} ({role})
🔄 Reconnected to real-time server
❌ Disconnected from real-time server
```

---

## Performance Notes

- **Connections**: Each user maintains one persistent Socket.io connection
- **Bandwidth**: Only targeted data is sent (no unnecessary broadcasts)
- **Scalability**: Uses rooms pattern for efficient message delivery
- **Fallback**: Works without Socket.io (graceful degradation)

---

## Troubleshooting

### "Unable to reach backend server" errors

- Ensure `.env.local` files have `VITE_API_BASE_URL=http://localhost:3000`
- Backend must be running on port 3000
- Check CORS settings in `server/index.js`

### Socket connection not working

1. Verify backend is running
2. Check browser console for connection errors
3. Ensure auth token is valid
4. Check network tab in DevTools for Socket.io handshake

### Notifications not appearing

1. Verify you're listening to correct event name
2. Check if correct room is being joined
3. Monitor console logs in browser
4. Check server logs for broadcast messages

---

## Future Enhancements

- [ ] Typing indicators (real-time form updates)
- [ ] Appointment queue updates with position tracking
- [ ] Doctor-to-patient messaging
- [ ] Prescription delivery notifications
- [ ] Bulk appointment status updates
- [ ] Analytics dashboard with real-time metrics
