# 🚀 Real-Time Socket.io Integration - Quick Start

## ✅ What's Been Added

Your Doctor Appointment System now has **real-time updates** for:

### 📍 Appointment Status Updates
- Patient books appointment → Doctor instantly receives notification
- Doctor marks appointment as completed → Patient instantly sees update
- Appointment cancelled → Both parties notified in real-time
- Admin sees all appointment status changes

### 🏥 Doctor Availability Updates  
- Doctor toggles availability status
- All patients see instant availability updates when browsing/booking
- Search lists show real-time doctor availability
- Admin dashboard shows live doctor status

---

## 📦 Installation Summary

### Backend
- ✅ Socket.io server initialized in `server/index.js`
- ✅ Real-time service created at `server/services/realtimeService.js`
- ✅ Doctor model updated with `available` & `unavailableReason` fields
- ✅ Controllers emit events on appointment/doctor updates

### Frontend (Both apps)
- ✅ Socket.io client installed
- ✅ `useSocket()` hook created for easy Socket.io integration
- ✅ Pre-built components: `RealtimeNotification`, `DoctorAvailabilityBadge`
- ✅ Ready to use in any component

### Packages Installed
```bash
# Backend
npm install socket.io

# Frontend (both apps)
npm install socket.io-client
```

---

## 🎯 How to Use

### 1. Display Real-Time Appointment Status Notifications

Add to any component showing appointments:

```jsx
import { RealtimeNotification } from '../components/RealtimeNotification';

function MyComponent() {
  const [appointment, setAppointment] = useState(null);

  const handleStatusChange = (data) => {
    // Refetch or update appointment data
    setAppointment(prev => ({ ...prev, status: data.status }));
  };

  return (
    <>
      <RealtimeNotification 
        appointmentId={appointment._id}
        onStatusChange={handleStatusChange}
      />
      {/* Your appointment details */}
    </>
  );
}
```

### 2. Show Real-Time Doctor Availability

Add to doctor lists or booking components:

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

### 3. Use Socket Hook Directly

For custom real-time features:

```jsx
import { useSocket } from '../lib/useSocket';

function CustomComponent() {
  const { on, emit, isConnected } = useSocket();

  useEffect(() => {
    // Listen for appointment updates
    const unsubscribe = on('appointment:statusChanged', (data) => {
      console.log('Appointment updated:', data);
    });

    return unsubscribe;
  }, [on]);

  const updateDoctorStatus = () => {
    emit('doctor:updateAvailability', {
      doctorId: 'doctor123',
      available: false,
      reason: 'In consultation'
    });
  };

  return (
    <div>
      <p>Connected: {isConnected ? '✅' : '❌'}</p>
      <button onClick={updateDoctorStatus}>Set Unavailable</button>
    </div>
  );
}
```

---

## 📋 Key Files Created/Modified

### Backend
- **`server/index.js`** - Socket.io server setup with CORS
- **`server/services/realtimeService.js`** - Real-time broadcast helpers
- **`server/controllers/appointmentController.js`** - Emits appointment updates
- **`server/controllers/doctorController.js`** - Emits doctor availability updates
- **`server/models/doctorModel.js`** - Added `available` field

### Frontend (doctor-frontend)
- **`src/lib/useSocket.js`** - Socket.io connection hook
- **`src/components/RealtimeNotification.jsx`** - Notification component
- **`src/components/DoctorAvailabilityBadge.jsx`** - Availability badge component
- **`.env.local`** - API base URL configuration

### Frontend (doctor-admin)  
- **`src/lib/useSocket.js`** - Socket.io connection hook
- **`src/components/RealtimeNotification.jsx`** - Admin notification component
- **`src/components/DoctorAvailabilityBadge.jsx`** - Availability badge component
- **`.env.local`** - API base URL configuration

---

## 🧪 Testing Real-Time Features

### Test 1: Appointment Status Update  
1. Open two browser windows
2. Login as **patient** in window 1
3. Login as **doctor** in window 2
4. Patient books appointment with doctor
5. Doctor marks appointment as **"Completed"**
6. **Window 1 instantly shows status update** ✅
7. Both see notification popup

### Test 2: Doctor Availability Change
1. Open two browser windows
2. Login as **doctor** in window 1
3. Login as **patient** in window 2  
4. Patient navigates to "Book Appointment"
5. Doctor sets status to **"Unavailable"** in window 1
6. **Window 2 shows doctor status changes instantly** ✅
7. Availability badge updates in real-time

### Monitor Console Logs
When Socket.io connects:
```
✅ Connected to real-time server: [socketId]
👤 User registered: [userId] ([role])
📢 Appointment [id] status updated to completed
🏥 Doctor [id] availability: Available
```

---

## 🔌 Socket.io Events Reference

### Listen For (Client receives)

**Appointment Events:**
- `appointment:statusChanged` - Any appointment status update
- `appointment:statusUpdate` - Patient receives update
- `appointment:newRequest` - Doctor receives new booking
- `appointment:statusChangedAdmin` - Admin receives update

**Doctor Events:**
- `doctor:availabilityChanged` - Individual doctor availability
- `doctor:availabilityUpdated` - Global doctor availability

### Emit (Client sends)

**User Events:**
- `user:register` - Register user for real-time (auto-emitted)

**Update Events:**
- `appointment:updateStatus` - Update appointment status
- `doctor:updateAvailability` - Change doctor availability

---

## 🛠️ Common Integration Points

### Patient Dashboard
```jsx
// Add to PatientDashboardPage.jsx near appointments list
<RealtimeNotification 
  appointmentId={selectedAppointment?._id}
  onStatusChange={() => refetchAppointments()}
/>
```

### Doctor Dashboard  
```jsx
// Listen for new appointment requests
const { on } = useSocket();

useEffect(() => {
  const unsubscribe = on('appointment:newRequest', (data) => {
    // Show notification or update list
  });
  return unsubscribe;
}, [on]);
```

### Booking Page
```jsx
// Show real-time doctor availability
{doctors.map(doctor => (
  <div key={doctor._id}>
    <h4>{doctor.name}</h4>
    <DoctorAvailabilityBadge 
      doctorId={doctor._id}
      initialAvailable={doctor.available}
    />
  </div>
))}
```

### Admin Dashboard
```jsx
// Monitor all appointment changes
<RealtimeNotification onStatusChange={refetchData} />

// Monitor doctor availability across hospital
{doctors.map(doc => (
  <tr key={doc._id}>
    <td>{doc.name}</td>
    <td>
      <DoctorAvailabilityBadge doctorId={doc._id} />
    </td>
  </tr>
))}
```

---

## ⚙️ Configuration

### Backend CORS (server/index.js)
Currently allows connections from:
- `http://localhost:3001` (doctor-frontend dev)
- `http://localhost:3002` (doctor-admin dev)
- `http://localhost:5173` (Vite default)
- `http://localhost:5174` (Vite alt port)
- Environment variable `FRONTEND_URL`

### Production Deployment
Update CORS origins in `server/index.js`:
```javascript
cors: {
  origin: [
    'https://yourdomain.com',
    'https://admin.yourdomain.com',
  ]
}
```

---

## 🐛 Troubleshooting

### "Unable to reach backend" in console
- ✅ Ensure `.env.local` has `VITE_API_BASE_URL=http://localhost:3000`
- ✅ Backend running on port 3000
- ✅ Check network in DevTools

### Socket connection not working
- ✅ Start backend: `npm run dev` in `/server`
- ✅ Check browser console for connection errors
- ✅ Verify JWT token is valid
- ✅ Check firewall / port access

### Notifications not appearing
- ✅ Verify listening to correct event name
- ✅ Check appointmentId is correct
- ✅ Look at server logs for broadcasts
- ✅ Ensure component is mounted with `useSocket()`

---

## 🚀 Next Steps

1. **Integrate into your pages:**
   - Add `RealtimeNotification` to dashboard components
   - Add `DoctorAvailabilityBadge` to booking/search pages

2. **Test thoroughly:**
   - Multi-window testing (patient ↔ doctor)
   - Connection reconnection handling
   - Notification behavior

3. **Optional enhancements:**
   - Sound notifications for appointments
   - Desktop notifications using Notification API  
   - Typing indicators for form updates
   - Message delivery receipts

---

## 📚 Documentation

See **[REALTIME_SETUP.md](REALTIME_SETUP.md)** for:
- Detailed event payload documentation
- Advanced integration examples
- Room-based targeting
- Performance notes
- Architecture overview

---

## ✅ Status

**All builds passing:**
- ✅ Backend compiles with Socket.io
- ✅ Doctor-frontend builds successfully  
- ✅ Doctor-admin builds successfully
- ✅ All dependencies installed
- ✅ Ready for production use

Start your servers and test the real-time features! 🎉
