# Trade-Pulse Frontend - Setup Commands

## Development Commands

### Start Development Server
```bash
cd /home/sinnan/Desktop/Trade-Pulse/frontend
npm run dev
```
The application will be available at http://localhost:3000

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Lint Code
```bash
npm run lint
```

### Type Check
```bash
npx tsc --noEmit
```

## Installed Dependencies

### Core Dependencies
- **next**: 14.0.4 - React framework
- **react**: ^18.2.0 - UI library
- **react-dom**: ^18.2.0 - React DOM renderer
- **typescript**: ^5 - TypeScript support

### Styling
- **tailwindcss**: ^3.3.0 - Utility-first CSS framework
- **autoprefixer**: ^10.0.1 - PostCSS plugin
- **postcss**: ^8 - CSS processor

### Data & Forms
- **axios**: ^1.6.2 - HTTP client
- **react-hook-form**: ^7.49.2 - Form handling
- **zod**: ^3.22.4 - Schema validation
- **@hookform/resolvers**: ^3.3.3 - Form validators

### Charts & Visualization
- **chart.js**: ^4.4.1 - Chart library  
- **react-chartjs-2**: ^5.2.0 - React wrapper for Chart.js
- **recharts**: ^2.10.3 - Composable chart library
- **lightweight-charts**: ^4.1.1 - Financial charts

### Utilities
- **date-fns**: ^3.0.6 - Date utilities
- **clsx**: ^2.0.0 - Class name utilities
- **lucide-react**: ^0.303.0 - Icon library

## Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── page.tsx           # Homepage
│   │   ├── dashboard/         # Dashboard page
│   │   ├── predictions/       # AI Predictions page
│   │   ├── sentiment/         # Sentiment Analysis page
│   │   ├── portfolio/         # Portfolio/Wallet page
│   │   ├── charts/            # Advanced Charts page
│   │   ├── profile/           # Profile Settings page
│   │   ├── login/             # Login page
│   │   ├── signup/            # Signup page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable components
│   │   ├── Navbar.tsx         # Navigation bar
│   │   ├── Card.tsx           # Card component
│   │   └── LoadingSpinner.tsx # Loading spinner
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx    # Authentication context
│   └── services/              # API services
│       └── api.service.ts     # API client
├── tailwind.config.ts         # Tailwind configuration
├── next.config.js             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies

```

## Color Palette - Emerald Seashell Noon

### Primary (Emerald)
- Main: #05B084
- Shades: #f0fdf7 to #01362b

### Secondary (Seashell)
- Main: #F1EDEA
- Shades: #FCFAF9 to #302f2b

### Accent (Noon Blue)
- Main: #015A84
- Shades: #f0f9ff to #001119

### Mint
- Main: #BADFCD
- Shades: #f5fdfb to #1a593a

## Key Features Implemented

### UI Enhancements
- ✅ Glassmorphism cards with backdrop blur
- ✅ Blur-on-scroll navigation
- ✅ Smooth entrance animations (fade-in, slide-in, scale-in)
- ✅ Floating animations for icons
- ✅ Custom scrollbar with emerald theme
- ✅ Gradient text and backgrounds
- ✅ Hover effects and micro-interactions

### Pages
1. **Homepage** - Landing page with feature showcase
2. **Dashboard** - Live forex rates and market summary
3. **Predictions** - ML-based predictions with confidence scores
4. **Sentiment** - News sentiment analysis
5. **Portfolio** - Virtual currency holdings and P/L tracking
6. **Charts** - Advanced charting (placeholder for lightweight-charts)
7. **Profile** - User profile and settings management
8. **Login/Signup** - Authentication pages

### Components
- **Navbar** - Responsive navigation with blur effect
- **Card** - Glassmorphism card with variants
- **LoadingSpinner** - Loading indicator

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
# Find the process
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Build Errors
Clear Next.js cache:
```bash
rm -rf .next
npm run build
```

### CSS Not Updating
Restart the dev server:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

## Notes

- The CSS `@apply` warnings from the IDE are expected - Tailwind's @apply directive works correctly at build time
- All animations and effects are CSS-based for optimal performance
- The app uses responsive design and works on mobile, tablet, and desktop
