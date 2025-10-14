// src/utils/ResponsiveHelper.js
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 / Pixel 4)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

class ResponsiveHelper {
  /**
   * Scale size based on screen width
   */
  static scale(size) {
    return (SCREEN_WIDTH / BASE_WIDTH) * size;
  }

  /**
   * Scale size based on screen height
   */
  static verticalScale(size) {
    return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
  }

  /**
   * Moderate scale - scales less aggressively
   */
  static moderateScale(size, factor = 0.5) {
    return size + (this.scale(size) - size) * factor;
  }

  /**
   * Responsive font size
   */
  static fontSize(size) {
    const newSize = this.scale(size);
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }

  /**
   * Get screen dimensions
   */
  static getScreenDimensions() {
    return {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      isSmallDevice: SCREEN_WIDTH < 375,
      isMediumDevice: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768,
      isLargeDevice: SCREEN_WIDTH >= 768,
      isTablet: SCREEN_WIDTH >= 768,
    };
  }

  /**
   * Check device type
   */
  static isSmallDevice() {
    return SCREEN_WIDTH < 375;
  }

  static isMediumDevice() {
    return SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768;
  }

  static isLargeDevice() {
    return SCREEN_WIDTH >= 768;
  }

  static isTablet() {
    return SCREEN_WIDTH >= 768;
  }

  /**
   * Get responsive padding
   */
  static getPadding(base = 20) {
    if (this.isSmallDevice()) return base * 0.7;
    if (this.isTablet()) return base * 1.5;
    return base;
  }

  /**
   * Get responsive margin
   */
  static getMargin(base = 10) {
    if (this.isSmallDevice()) return base * 0.7;
    if (this.isTablet()) return base * 1.5;
    return base;
  }

  /**
   * Get responsive width percentage
   */
  static wp(percentage) {
    return (percentage / 100) * SCREEN_WIDTH;
  }

  /**
   * Get responsive height percentage
   */
  static hp(percentage) {
    return (percentage / 100) * SCREEN_HEIGHT;
  }

  /**
   * Safe area insets for notched devices
   */
  static getSafeAreaInsets() {
    const hasNotch = SCREEN_HEIGHT >= 812 && Platform.OS === 'ios';
    return {
      top: hasNotch ? 44 : 20,
      bottom: hasNotch ? 34 : 0,
    };
  }
}

// Export shorthand functions
export const scale = ResponsiveHelper.scale.bind(ResponsiveHelper);
export const verticalScale = ResponsiveHelper.verticalScale.bind(ResponsiveHelper);
export const moderateScale = ResponsiveHelper.moderateScale.bind(ResponsiveHelper);
export const fontSize = ResponsiveHelper.fontSize.bind(ResponsiveHelper);
export const wp = ResponsiveHelper.wp.bind(ResponsiveHelper);
export const hp = ResponsiveHelper.hp.bind(ResponsiveHelper);

export default ResponsiveHelper;