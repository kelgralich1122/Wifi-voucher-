# Global Digital Clock Application

A beautiful, real-time digital clock displaying current time across multiple time zones with an interactive interface.

## Features

✨ **Real-Time Clock Updates** - Displays current time updating every second
🌍 **Multi-Timezone Support** - View time in 15+ different time zones
🎨 **Beautiful UI** - Modern gradient design with smooth animations
📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
⚡ **Fast Performance** - Built with React, TypeScript, and Vite
🎯 **Interactive Controls** - Toggle time zones on/off with button controls

## Supported Time Zones

- UTC (Coordinated Universal Time)
- EST (Eastern Standard Time)
- CST (Central Standard Time)
- MST (Mountain Standard Time)
- PST (Pacific Standard Time)
- GMT (Greenwich Mean Time)
- CET (Central European Time)
- IST (Indian Standard Time)
- JST (Japan Standard Time)
- AEST (Australian Eastern Standard Time)
- NZST (New Zealand Standard Time)
- SGT (Singapore Standard Time)
- HKT (Hong Kong Time)
- UAE (United Arab Emirates Time)
- BRT (Brasília Time)

## Tech Stack

- **Frontend Framework**: React 19.2.6
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.3.2
- **Styling**: CSS3 + Tailwind CSS
- **Package Manager**: npm

## Installation

```bash
# Clone the repository
git clone https://github.com/kelgralich1122/Wifi-voucher-.git
cd Wifi-voucher-

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Clock.tsx          # Individual clock component
│   └── Clock.css          # Clock styling
├── utils/
│   ├── timezoneData.ts    # Timezone definitions
│   └── clockHelpers.ts    # Time formatting utilities
├── App.tsx                # Main application component
├── App.css                # Application styling
├── main.tsx               # React entry point
└── index.css              # Global styles
```

## How to Use

1. **Select Timezones**: Click on the timezone buttons at the top to toggle different time zones
2. **View Time**: All selected clocks will display real-time updates
3. **See Details**: Each clock shows:
   - Time in 24-hour format (HH:MM:SS)
   - Full date with day name
   - UTC offset for quick reference

## Development

- **Dev Server**: `npm run dev` - Start development server on http://localhost:5173
- **Build**: `npm run build` - Create optimized production build
- **Preview**: `npm run preview` - Preview production build locally

## Browser Support

- Chrome/Edge 120+
- Firefox 119+
- Safari 17+
- Mobile browsers (iOS Safari 17+, Chrome Android 120+)

## License

This project is open source and available under the MIT License.

## Author

Created by [kelgralich1122](https://github.com/kelgralich1122)

---

**Enjoy viewing time across the globe! 🌎🌍🌏**
