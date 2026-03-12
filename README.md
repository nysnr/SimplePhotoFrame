# PhotoFrameNew

PhotoFrameNew is a digital photo frame application built with Expo and React Native. It allows users to view photos in a slideshow format, supports multiple languages, and integrates Google Mobile Ads.

## Features

- **Photo Slideshow**: Automatically cycles through selected photos.
- **Multi-language Support**: Supports Japanese (ja), English (en), and Chinese (zh).
- **Ad Integration**: Displays AdMob banner ads (configured to handle Expo Go limitations).
- **Customizable**: Settings for matte color and other display options.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/nysnr/PhotoFrameNew.git
    cd PhotoFrameNew
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the App

#### Development (Expo Go)

To start the development server:

```bash
npx expo start
```

- Scan the QR code with the Expo Go app on your Android or iOS device.
- **Note**: In Expo Go, the native Google Mobile Ads module is automatically suppressed to prevent crashes. A placeholder or empty view will be shown instead.

#### Native Build (iOS/Android)

To run on a simulator or physical device with full native capabilities (including Ads):

**iOS:**
```bash
npx expo run:ios
```

**Android:**
```bash
npx expo run:android
```

## Build Instructions (Release)

To install the app on a device without needing the development server (standalone mode):

1.  **iOS (Xcode)**:
    - Open `ios/PhotoFrameNew.xcworkspace` in Xcode.
    - Go to **Product** > **Scheme** > **Edit Scheme**.
    - Set **Run** > **Build Configuration** to **Release**.
    - Connect your device and run the build (`Cmd + R`).

2.  **EAS Build (Cloud)**:
    ```bash
    eas build --profile production --platform ios
    ```

## Project Structure

- `App.js`: Main application logic, UI, and navigation.
- `components/ads/`: AdMob integration components (`AdBanner.js`).
- `app.config.js`: Expo configuration including plugins and API keys.
- `ios/`: Native iOS project files (generated via `npx expo prebuild`).

## License

[License Information Here]
