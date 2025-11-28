# Codebase Analysis: OSB Watchtower

## Tech Stack

### Frontend Framework
- **Next.js 16.0.0** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5.x** - Type-safe JavaScript

### Styling & UI
- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives (26+ components)
  - Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu, etc.
- **Lucide React 0.454.0** - Icon library
- **class-variance-authority 0.7.1** - Component variant management
- **tailwind-merge 2.5.5** - Tailwind class merging utility
- **next-themes 0.4.6** - Theme management

### Data Visualization
- **D3.js (latest)** - Force-directed graph visualization
- **Recharts 2.15.4** - Chart components
- **Vanta.js** - Animated background effects

### Form Management
- **React Hook Form 7.60.0** - Form state management
- **Zod 3.25.76** - Schema validation
- **@hookform/resolvers 3.10.0** - Form validation integration

### Real-Time Communication
- **WebSocket** - Native WebSocket API for real-time updates
- Custom `useWebSocket` hook with auto-reconnection

### Testing
- **Vitest 4.0.8** - Unit testing framework
- **@testing-library/react 16.3.0** - React component testing
- **@testing-library/jest-dom 6.9.1** - DOM matchers
- **@testing-library/user-event 14.6.1** - User interaction simulation
- **MSW 2.12.1** - API mocking
- **jsdom 27.1.0** - DOM implementation

### Development Tools
- **ESLint 9.39.1** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **Autoprefixer 10.4.20** - CSS vendor prefixing
- **@vercel/analytics 1.3.1** - Analytics integration

## Dependencies Summary

**Total Dependencies:** 50+ production dependencies
**Total Dev Dependencies:** 20+ development dependencies

### Key Libraries
- **date-fns 4.1.0** - Date formatting
- **cmdk 1.0.4** - Command menu
- **sonner 1.7.4** - Toast notifications
- **vaul 0.9.9** - Drawer component
- **embla-carousel-react 8.5.1** - Carousel component
- **react-resizable-panels 2.1.7** - Resizable panel layouts
- **input-otp 1.4.1** - OTP input component

## API Endpoints

### Base Configuration
- **REST API Base URL:** `http://localhost:8000` (configurable via `NEXT_PUBLIC_API_URL`)
- **WebSocket URL:** `ws://localhost:8000/ws` (configurable via `NEXT_PUBLIC_WS_URL`)

### Alert Management Endpoints

#### GET `/api/alerts`
**Query Parameters:**
- `severity` - Filter by severity (critical, high, medium, low)
- `facility` - Filter by facility ID
- `status_filter` - Filter by status (new, acknowledged, resolved, false-positive)
- `search` - Full-text search query
- `time_range` - Time range filter
- `page` - Page number for pagination
- `limit` - Items per page

**Response:**
```typescript
{
  alerts: Alert[],
  total: number,
  page: number,
  pages: number,
  limit: number
}
```

#### GET `/api/alerts/stats`
**Response:**
```typescript
{
  total: number,
  critical: number,
  unresolved: number,
  false_positives: number
}
```

#### PUT `/api/alerts/{alertId}/status`
**Body:**
```typescript
{
  status: string
}
```
**Response:** Updated Alert object

### Federated Learning Endpoints

#### GET `/api/fl/rounds/current`
**Response:** Current FL round object or null

#### GET `/api/fl/clients`
**Response:** Array of FL client objects

#### GET `/api/fl/privacy-metrics`
**Response:**
```typescript
{
  epsilon: number,
  delta: string,
  data_size: string,
  encryption: string,
  privacy_budget_remaining: number
}
```

#### POST `/api/fl/rounds/trigger`
**Response:** New FL round object

### Prediction Endpoints

#### GET `/api/predictions`
**Query Parameters:**
- `limit` - Number of predictions to return
- `offset` - Pagination offset

#### GET `/api/predictions/latest`
**Response:** Latest prediction object

### MITRE ATT&CK Endpoints

#### GET `/api/mitre/graph`
**Response:**
```typescript
{
  nodes: TechniqueNode[],
  links: TechniqueLink[]
}
```

#### GET `/api/mitre/techniques`
**Response:** Array of all technique details

#### GET `/api/mitre/technique/{techniqueId}`
**Response:** Detailed technique information

### WebSocket Events

#### Subscription
**Action:** `subscribe`
**Payload:**
```typescript
{
  action: "subscribe",
  room: string  // e.g., "alerts", "fl_status", "predictions"
}
```

#### Unsubscription
**Action:** `unsubscribe`
**Payload:**
```typescript
{
  action: "unsubscribe",
  room: string
}
```

#### Real-Time Events
- `alert_created` - New alert created
- `alert_updated` - Alert status/data updated
- `dashboard_update` - Dashboard statistics updated
- `fl_round_update` - FL round progress updated
- `prediction_update` - New prediction available

## Core Algorithms & Implementations

### 1. Force-Directed Graph Algorithm (D3.js)

**File:** `components/force-directed-graph.tsx`

**Algorithm:** D3.js Force Simulation
- **Force Link:** Connects nodes with configurable distance (150px)
- **Force Charge:** Repulsion between nodes (strength: -300)
- **Force Center:** Centers graph in viewport
- **Force Collide:** Prevents node overlap (radius: 40px)

**Features:**
- Interactive drag-and-drop node positioning
- Zoom and pan capabilities
- Real-time physics simulation
- Click handlers for node selection
- Dynamic styling based on node type (current vs predicted)

**Implementation Details:**
```typescript
const simulation = d3
  .forceSimulation<Node>(nodes)
  .force("link", d3.forceLink<Node, Link>(links).id((d) => d.id).distance(150))
  .force("charge", d3.forceManyBody().strength(-300))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("collide", d3.forceCollide(40))
```

### 2. WebSocket Connection Management

**File:** `lib/useWebSocket.ts`

**Algorithm:** Auto-reconnection with exponential backoff
- **Max Reconnection Attempts:** 5 (configurable)
- **Reconnection Interval:** 3000ms (configurable)
- **Connection States:** connecting, connected, disconnected, error

**Features:**
- Automatic reconnection on disconnect
- Message parsing and error handling
- Room-based subscription system
- Graceful degradation to REST API on failure

**Implementation:**
```typescript
// Reconnection logic
if (reconnectAttemptsRef.current < maxReconnectAttempts) {
  reconnectAttemptsRef.current++
  reconnectTimeoutRef.current = setTimeout(() => {
    connect()
  }, reconnectInterval)
}
```

### 3. Alert Filtering & Search

**File:** `app/alerts/page.tsx`

**Algorithm:** Multi-dimensional filtering with pagination
- **Severity Filter:** critical, high, medium, low, all
- **Facility Filter:** Filter by specific facility or all
- **Time Range Filter:** Configurable time windows
- **Full-Text Search:** Search across alert titles and descriptions
- **Pagination:** 10 items per page (configurable)

**Features:**
- Real-time filter updates
- Debounced search queries
- State synchronization with URL params (potential)
- Automatic page reset on filter change

### 4. Real-Time Data Synchronization

**Files:** `app/alerts/page.tsx`, `contexts/WebSocketContext.tsx`

**Algorithm:** Event-driven state updates
- **WebSocket Events:** Subscribe to specific data rooms
- **State Merging:** Merge real-time updates with existing data
- **Duplicate Prevention:** Check for existing items before adding
- **Optimistic Updates:** Update UI immediately on actions

**Implementation:**
```typescript
switch (lastMessage.type) {
  case 'alert_created':
    setAlerts((prev) => {
      if (prev.some((a) => a.id === lastMessage.data.id)) return prev
      return [lastMessage.data, ...prev]
    })
    break
  case 'alert_updated':
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === lastMessage.data.id ? lastMessage.data : alert
      )
    )
    break
}
```

### 5. MITRE ATT&CK Technique Visualization

**File:** `utils/attack-graph-data.ts`

**Data Structure:**
- **Nodes:** Technique ID, name, type (current/predicted), probability
- **Links:** Source-target relationships with probability scores

**Algorithm:** Graph traversal and probability propagation
- Current techniques marked with probability 1.0
- Predicted techniques have probability scores (0.0-1.0)
- Links represent attack progression paths
- Visual encoding: color (red=current, amber=predicted), opacity (probability)

**Techniques Tracked:**
- T1190: Exploit Public-Facing Application
- T1133: External Remote Services
- T1078: Valid Accounts
- T1059: Command and Scripting Interpreter
- T1486: Data Encrypted for Impact
- T1565: Data Manipulation

### 6. Federated Learning Progress Tracking

**Files:** `utils/mock-data.ts`, API client

**Metrics Tracked:**
- **Round Progress:** Percentage completion (0-100%)
- **Training Phase:** distributing, training, aggregating, complete
- **Client Status:** active, delayed, offline
- **Privacy Budget:** Epsilon (ε) and Delta (δ) values
- **Model Performance:** Loss and accuracy per client

**Algorithm:** Aggregated metrics calculation
- Track individual client progress
- Calculate overall round progress
- Monitor privacy budget consumption
- Track model accuracy improvements across rounds

### 7. Alert Detection Sources

**Multi-Layer Detection System:**
1. **LSTM Model** - Deep learning-based anomaly detection
2. **Isolation Forest** - Statistical outlier detection
3. **Physics Model** - Domain-specific rule-based detection
4. **System Monitor** - Infrastructure health monitoring

**Correlation Algorithm:**
- Multiple sources can detect the same alert
- Confidence scores aggregated across sources
- Evidence collection from each detection layer
- Attack type correlation and naming

## Project Structure

```
app/                    # Next.js App Router pages
├── alerts/            # Alert management page
├── attack-graph/      # Attack visualization page
├── fl-status/         # Federated learning status page
└── page.tsx           # Dashboard home

components/            # React components (40+ components)
├── ui/               # Radix UI base components
└── *.tsx             # Feature-specific components

lib/                   # Core libraries
├── api-client.ts     # REST API client
├── useWebSocket.ts   # WebSocket hook
└── utils.ts          # Helper utilities

utils/                 # Utility functions
├── attack-graph-data.ts  # MITRE ATT&CK data
├── mock-data.ts          # Development mock data
└── format-time.ts        # Time formatting

contexts/              # React contexts
└── WebSocketContext.tsx  # WebSocket provider

hooks/                 # Custom React hooks
├── use-mobile.ts     # Mobile detection
└── use-toast.ts      # Toast notifications
```

## Key Features

1. **Real-Time Monitoring** - WebSocket-based live updates
2. **Multi-Layer Security Detection** - 4 detection sources
3. **MITRE ATT&CK Integration** - Attack technique visualization
4. **Federated Learning** - Privacy-preserving ML training
5. **Advanced Filtering** - Multi-dimensional alert filtering
6. **Interactive Visualizations** - D3.js force-directed graphs
7. **Responsive Design** - Mobile-friendly UI
8. **Dark Theme** - Cybersecurity-focused design
9. **Accessibility** - ARIA labels and keyboard navigation
10. **Type Safety** - Full TypeScript coverage

## Performance Optimizations

- **Code Splitting** - Next.js automatic code splitting
- **Image Optimization** - Next.js image component (disabled in config)
- **Lazy Loading** - Dynamic imports for heavy components
- **Memoization** - useCallback and useMemo hooks
- **Pagination** - Efficient data loading (10 items/page)
- **WebSocket Fallback** - Graceful degradation to REST API

## Security Considerations

- **Environment Variables** - API URLs configurable via env vars
- **Type Validation** - Zod schema validation
- **CORS** - Backend CORS configuration required
- **Input Sanitization** - Form validation with React Hook Form
- **Error Handling** - Comprehensive error boundaries
- **Authentication** - Not yet implemented (TODO)
