// src/styles/SharedScenarioStyles.js
// REUSABLE RESPONSIVE STYLES FOR ALL SCENARIOS

import { StyleSheet } from 'react-native';
import { scale, verticalScale, fontSize, wp, hp } from './ResponsiveHelper';
import ResponsiveHelper from './ResponsiveHelper';

export const getSharedScenarioStyles = () => {
  const isSmall = ResponsiveHelper.isSmallDevice();
  const isTablet = ResponsiveHelper.isTablet();

  return StyleSheet.create({
    // Main container
    container: {
      flex: 1,
      backgroundColor: '#87CEEB',
      paddingTop: ResponsiveHelper.getSafeAreaInsets().top,
    },

    // Scenario content area
    contentContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      paddingBottom: hp(10), // Space for bottom buttons
    },

    // Question text
    questionText: {
      fontSize: isSmall ? fontSize(14) : fontSize(16),
      color: '#000',
      textAlign: 'center',
      marginBottom: verticalScale(20),
      paddingHorizontal: wp(5),
      fontFamily: 'pixel',
      maxWidth: isTablet ? 600 : '100%',
    },

    // Scenario image/animation container
    imageContainer: {
      width: isSmall ? wp(85) : wp(75),
      maxWidth: isTablet ? 500 : 400,
      height: isSmall ? hp(35) : hp(40),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: verticalScale(20),
    },

    // Road/scenario illustration
    roadContainer: {
      width: '100%',
      height: '100%',
      position: 'relative',
    },

    // Vehicle/object in scenario
    vehicle: {
      width: isSmall ? scale(40) : scale(50),
      height: isSmall ? scale(60) : scale(75),
      position: 'absolute',
    },

    // Choice buttons container
    choicesContainer: {
      width: wp(90),
      maxWidth: isTablet ? 600 : 500,
      alignItems: 'center',
    },

    // Individual choice button
    choiceButton: {
      width: '100%',
      minHeight: isSmall ? verticalScale(50) : verticalScale(60),
      backgroundColor: '#f5e6d3',
      borderWidth: scale(3),
      borderColor: '#000',
      borderRadius: scale(10),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: verticalScale(10),
      paddingHorizontal: scale(15),
      paddingVertical: verticalScale(12),
    },

    // Choice button text
    choiceText: {
      fontSize: isSmall ? fontSize(12) : fontSize(14),
      color: '#000',
      textAlign: 'center',
      fontFamily: 'spaceMono',
    },

    // Selected choice (green)
    selectedChoice: {
      backgroundColor: '#4ef5a2',
      borderColor: '#2d8a5f',
    },

    // Wrong choice (red)
    wrongChoice: {
      backgroundColor: '#ff6b6b',
      borderColor: '#c92a2a',
    },

    // Correct choice (green)
    correctChoice: {
      backgroundColor: '#4ef5a2',
      borderColor: '#2d8a5f',
    },

    // Next button
    nextButton: {
      position: 'absolute',
      bottom: isSmall ? verticalScale(20) : verticalScale(30),
      right: isSmall ? scale(20) : scale(30),
      width: isSmall ? scale(100) : scale(120),
      height: isSmall ? verticalScale(45) : verticalScale(50),
      backgroundColor: '#4ef5a2',
      borderRadius: scale(25),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: scale(3),
      borderColor: '#000',
    },

    nextButtonText: {
      fontSize: isSmall ? fontSize(14) : fontSize(16),
      color: '#000',
      fontFamily: 'pixel',
      fontWeight: 'bold',
    },

    // Feedback container (explanation)
    feedbackContainer: {
      width: wp(90),
      maxWidth: isTablet ? 600 : 500,
      backgroundColor: '#fff',
      borderRadius: scale(10),
      borderWidth: scale(3),
      borderColor: '#000',
      padding: scale(15),
      marginTop: verticalScale(15),
    },

    feedbackText: {
      fontSize: isSmall ? fontSize(12) : fontSize(14),
      color: '#000',
      textAlign: 'center',
      fontFamily: 'spaceMono',
      lineHeight: isSmall ? 18 : 20,
    },

    // Progress indicator
    progressText: {
      fontSize: fontSize(12),
      color: '#000',
      fontFamily: 'pixel',
      marginBottom: verticalScale(10),
    },

    // Back button
    backButton: {
      position: 'absolute',
      top: ResponsiveHelper.getSafeAreaInsets().top + scale(10),
      left: scale(20),
      width: scale(40),
      height: scale(40),
      backgroundColor: '#ff6b6b',
      borderRadius: scale(20),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: scale(2),
      borderColor: '#000',
      zIndex: 10,
    },

    backButtonText: {
      fontSize: fontSize(20),
      color: '#fff',
      fontWeight: 'bold',
    },

    // Loading indicator
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#87CEEB',
    },

    loadingText: {
      marginTop: verticalScale(10),
      fontSize: fontSize(14),
      color: '#000',
      fontFamily: 'pixel',
    },
  });
};

// Export default styles
export default getSharedScenarioStyles();