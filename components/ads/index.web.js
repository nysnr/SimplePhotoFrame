export { default as AdBanner } from './AdBanner.web';
export class InterstitialManager {
  static isEnabled() {
    return false;
  }

  static preload() {}

  static showIfReady() {}
}
