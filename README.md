# CyberSentry Watchtower 🛡️

A modern cybersecurity monitoring and threat intelligence dashboard built with Next.js, featuring real-time alert management, federated learning status tracking, and interactive MITRE ATT&CK technique visualization.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=flat-square&logo=tailwind-css)

## ✨ Features

### 🎯 Dashboard
- **System Status Overview**: Real-time monitoring of active alerts, FL progress, and prediction accuracy
- **Recent Alerts Feed**: Quick view of the latest security incidents
- **Attack Prediction**: ML-powered predictions of potential attack techniques
- **Quick Actions**: Fast access to common security operations

### 🚨 Alert Management
- **Advanced Filtering**: Filter by severity (critical, high, medium, low), facility, and time range
- **Search Functionality**: Full-text search across alert titles and descriptions
- **Alert Statistics**: Track total alerts, critical incidents, unresolved cases, and false positives
- **Multiple Detection Sources**: LSTM Model, Isolation Forest, Physics Model, and System Monitor
- **Pagination**: Efficient browsing through large alert datasets

### 🤝 Federated Learning Status
- **Round Progress Tracking**: Monitor current FL training rounds in real-time
- **Client Status**: Track 6 facility clients with individual progress, loss, and accuracy metrics
- **Privacy Metrics**: Display epsilon, delta, data size, and encryption standards
- **Round History**: Historical view of completed training rounds with accuracy trends

### 🕸️ Attack Graph Visualization
- **Interactive D3.js Graph**: Force-directed graph showing attack technique relationships
- **MITRE ATT&CK Integration**: Visualize current and predicted attack techniques
- **Technique Details**: Comprehensive information including:
  - Description and tactics
  - Detection strategies
  - Mitigation recommendations
  - Affected platforms
- **Attack Timeline**: Temporal view of attack progression
- **Zoom & Pan**: Interactive navigation of complex attack chains

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **pnpm** (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cybersentry-watchtower.git
   cd cybersentry-watchtower
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
pnpm build
pnpm start
```

## 📁 Project Structure

```
cybersentry-watchtower/
├── app/                      # Next.js App Router
│   ├── alerts/              # Alert management page
│   ├── attack-graph/        # Attack visualization page
│   ├── fl-status/           # Federated learning page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Dashboard home
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # Reusable UI components (Radix UI)
│   ├── header.tsx           # Navigation header
│   ├── footer.tsx           # Footer
│   ├── alert-table.tsx      # Alert table component
│   ├── force-directed-graph.tsx  # D3.js graph
│   └── ...                  # Other feature components
├── utils/                   # Utility functions
│   ├── mock-data.ts         # Mock alert and FL data
│   ├── attack-graph-data.ts # MITRE ATT&CK data
│   └── format-time.ts       # Time formatting utilities
├── lib/                     # Shared libraries
│   └── utils.ts             # Helper functions
├── hooks/                   # Custom React hooks
├── public/                  # Static assets
└── styles/                  # Additional styles
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Data Visualization**: [D3.js](https://d3js.org/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Background Effects**: [Vanta.js](https://www.vantajs.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

## 📊 Data Sources

Currently, the application uses **mock data** for demonstration purposes. The data includes:

- **Alerts**: 20 sample security alerts with various severities and statuses
- **FL Clients**: 6 facility clients with training metrics
- **Attack Techniques**: 6 MITRE ATT&CK techniques with relationships
- **Privacy Metrics**: Differential privacy parameters (epsilon, delta)

### Integrating Real Data

To connect to a real backend:

1. Create API routes in `app/api/`
2. Replace mock data imports with API calls
3. Update environment variables in `.env.local`

Example:
```typescript
// app/api/alerts/route.ts
export async function GET() {
  const alerts = await fetch('https://your-backend-api.com/alerts');
  return Response.json(alerts);
}
```

## 🎨 Customization

### Theme

The application uses a dark cybersecurity theme. Customize colors in:
- `app/globals.css` - CSS variables
- `tailwind.config.js` - Tailwind configuration (if created)

### Components

All components are modular and can be customized independently. Key components:
- `components/header.tsx` - Navigation and branding
- `components/card.tsx` - Card wrapper with glow effects
- `components/ui/*` - Base UI components from Radix UI

## 🔒 Security Considerations

- **Environment Variables**: Never commit `.env` files with secrets
- **API Keys**: Store sensitive keys in environment variables
- **CORS**: Configure CORS properly when connecting to backend APIs
- **Authentication**: Implement authentication before deploying to production
- **Input Validation**: Validate all user inputs on both client and server

## 📝 Available Scripts

- `pnpm dev` - Start development server (port 3000)
- `pnpm build` - Build for production
- `pnpm start` - Run production build
- `pnpm lint` - Run ESLint for code quality

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- MITRE ATT&CK® framework for attack technique taxonomy
- Radix UI for accessible component primitives
- D3.js community for visualization examples
- Vanta.js for animated backgrounds

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for cybersecurity professionals**
