# Visitor Counter API Documentation

## Overview
A simple yet effective visitor counter API for tracking website visits. Perfect for portfolio websites, project tracking, or any application needing GitHub-style view counters.

**Base URL**: `https://medipulse-1sje.onrender.com`

---

## Endpoints

### 1. Get Visitor Count
Returns the current visitor count for a project.

**Endpoint**: `GET /visitor-counter/count/:projectId?`

**Parameters**:
- `projectId` (optional): Unique identifier for your project. Defaults to `"portfolio"`

**Example Requests**:
```bash
# Default (portfolio)
curl https://medipulse-1sje.onrender.com/visitor-counter/count

# Custom project
curl https://medipulse-1sje.onrender.com/visitor-counter/count/my-portfolio
```

**Response**:
```json
{
  "success": true,
  "projectId": "portfolio",
  "visitorCount": 42,
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Track a Visitor (Increment Count)
Records a new visitor and increments the counter. **Call this when a user visits your site.**

**Endpoint**: `POST /visitor-counter/track/:projectId?`

**Parameters**:
- `projectId` (optional): Unique identifier for your project. Defaults to `"portfolio"`

**Example Requests**:
```bash
# Default (portfolio)
curl -X POST https://medipulse-1sje.onrender.com/visitor-counter/track

# Custom project
curl -X POST https://medipulse-1sje.onrender.com/visitor-counter/track/my-portfolio
```

**Response**:
```json
{
  "success": true,
  "projectId": "portfolio",
  "visitorCount": 43,
  "message": "Visitor tracked successfully"
}
```

---

### 3. Get Total Count (Simple)
A simpler endpoint that returns just the count number.

**Endpoint**: `GET /visitor-counter/total/:projectId?`

**Parameters**:
- `projectId` (optional): Unique identifier for your project. Defaults to `"portfolio"`

**Response**:
```json
{
  "success": true,
  "count": 43
}
```

---

### 4. Reset Counter (Admin)
Resets the visitor count to 0. Use for testing or admin purposes.

**Endpoint**: `POST /visitor-counter/reset/:projectId?`

**Parameters**:
- `projectId` (optional): Unique identifier for your project. Defaults to `"portfolio"`

**Response**:
```json
{
  "success": true,
  "message": "Visitor count reset",
  "visitorCount": 0
}
```

---

## Integration Examples

### React Integration
Add this to your main React component or App.jsx:

```jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Track visitor on page load
    const trackVisitor = async () => {
      try {
        await fetch('https://medipulse-1sje.onrender.com/visitor-counter/track', {
          method: 'POST',
        });
      } catch (error) {
        console.log('Could not track visitor');
      }
    };

    trackVisitor();
  }, []);

  return (
    <div>
      {/* Your site content */}
    </div>
  );
}

export default App;
```

### Fetch Visitor Count for Display
```jsx
import { useState, useEffect } from 'react';

export function VisitorCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('https://medipulse-1sje.onrender.com/visitor-counter/total');
        const data = await response.json();
        setCount(data.count);
      } catch (error) {
        console.log('Could not fetch visitor count');
      }
    };

    fetchCount();
  }, []);

  return (
    <div className="visitor-badge">
      👁️ {count} visits
    </div>
  );
}
```

### Vanilla JavaScript
```html
<div id="visitor-count">Loading...</div>

<script>
  // Track visit
  fetch('https://medipulse-1sje.onrender.com/visitor-counter/track', {
    method: 'POST',
  });

  // Display count
  fetch('https://medipulse-1sje.onrender.com/visitor-counter/total')
    .then(res => res.json())
    .then(data => {
      document.getElementById('visitor-count').textContent = `👁️ ${data.count} visits`;
    });
</script>
```

---

## Multiple Projects
You can track different projects separately by using different `projectId` values:

```bash
# Track for portfolio
curl -X POST https://medipulse-1sje.onrender.com/visitor-counter/track/portfolio

# Track for blog
curl -X POST https://medipulse-1sje.onrender.com/visitor-counter/track/blog

# Get each count
curl https://medipulse-1sje.onrender.com/visitor-counter/total/portfolio
curl https://medipulse-1sje.onrender.com/visitor-counter/total/blog
```

---

## Data Persistence
- All visitor counts are stored in MongoDB
- Data persists across server restarts
- Each project's counter is independently tracked
- Last updated timestamp is recorded for each count

---

## Error Handling
All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common errors:
- **500 Error**: Server-side issue (check MongoDB connection)

---

## Best Practices

1. **Track on Page Load**: Call the track endpoint when your site loads to capture users
2. **Display Count**: Use the total endpoint to display visitor badge
3. **Prevent Double Counting**: Track only once per page load, not on every interaction
4. **Use Project IDs**: If tracking multiple sites, use different projectId values
5. **Error Handling**: Wrap fetch calls in try-catch to handle network failures gracefully

---

## API Rate Limits
Currently no rate limiting is applied. The API counts every request.

---

## Testing

### Test with cURL
```bash
# 1. Track a visit
curl -X POST https://medipulse-1sje.onrender.com/visitor-counter/track

# 2. Get the current count
curl https://medipulse-1sje.onrender.com/visitor-counter/count

# 3. Display just the number
curl https://medipulse-1sje.onrender.com/visitor-counter/total
```

### Test with Postman
1. Create POST request: `https://medipulse-1sje.onrender.com/visitor-counter/track`
2. Send request
3. Create GET request: `https://medipulse-1sje.onrender.com/visitor-counter/total`
4. Send request to see the count

---

## Summary

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/count/:projectId?` | GET | Get full counter info | `{success, projectId, visitorCount, lastUpdated}` |
| `/track/:projectId?` | POST | Increment counter | `{success, projectId, visitorCount, message}` |
| `/total/:projectId?` | GET | Get count only | `{success, count}` |
| `/reset/:projectId?` | POST | Reset counter | `{success, message, visitorCount}` |

Ready to use! Just integrate the endpoints into your portfolio website.
