# Meluribook - Global Accounting App

Meluribook is an accounting and tax application designed for SMEs and freelancers.

## Project Structure

- `apps/mobile`: React Native (Expo) application.
- `apps/api`: NestJS Backend.

## Features

- **Auth**: Sign Up / Login screens.
- **Dashboard**: Real-time financial overview and tax reserve alerts.
- **Transactions**: Track Income and Expenses. manual entry.
- **Invoicing**: Create and track invoices.
- **Tax Engine**: Estimated tax liability and "Safeto Spend" calculation.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Running the Mobile App

1. Navigate to the mobile app directory:
   ```bash
   cd apps/mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Press `i` to run in iOS Simulator, `a` for Android Emulator, or scan the QR code with Expo Go on your physical device.

## Design System

The app key colors are:
- Primary Teal: `#0F766E`
- Secondary Blue: `#0369A1`
- Accent Green: `#22C55E`
