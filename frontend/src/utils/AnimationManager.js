// Temporary AnimationManager.js
// Place this at: src/utils/AnimationManager.js (to match your current import)

class AnimationManager {
  // Determine animation type based on choice text
  static determineAnimationType(choiceText) {
    const text = choiceText.toLowerCase();
    
    if (text.includes('proceed') || text.includes('continue') || text.includes('go ahead')) {
      return 'proceed';
    } else if (text.includes('stop') || text.includes('brake') || text.includes('halt')) {
      return 'stop';
    } else if (text.includes('overtake') || text.includes('pass') || text.includes('change lane')) {
      return 'overtake';
    }
    
    // Default animation
    return 'stop';
  }

  // Execute animation based on type
  static async executeAnimation(animationType, animationRefs, params = {}) {
    const {
      scrollAnimationRef,
      npcCarAnimationsRef,
      setPlayerCarFrame,
      setJeepneyFrame,
      setPlayerCarDirection,
      playerCarXAnim,
      scrollY,
      tileSize,
      jeepneyYAnim,
      height,
      jeepHeight,
      width,
      playerCarWidth,
      setIsJeepneyVisible
    } = animationRefs;

    switch (animationType) {
      case 'proceed':
        return this.animateProceed(animationRefs);
      case 'stop':
        return this.animateStop(animationRefs);
      case 'overtake':
        return this.animateOvertake(animationRefs, params);
      default:
        return this.animateStop(animationRefs);
    }
  }

  // Proceed animation
  static async animateProceed(refs) {
    const { scrollAnimationRef, npcCarAnimationsRef, setPlayerCarFrame, setJeepneyFrame, 
            setPlayerCarDirection, scrollY, tileSize } = refs;

    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    npcCarAnimationsRef.current.forEach(anim => anim.stop());

    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    // Move car forward quickly
    await new Promise(resolve => {
      setPlayerCarDirection("NORTH");
      const { Animated, Easing } = require('react-native');
      Animated.timing(scrollY, {
        toValue: scrollY._value - (tileSize * 2),
        duration: 1000,
        easing: Easing.easeOut,
        useNativeDriver: true,
      }).start(resolve);
    });

    // Restart animations would go here (implement in full version)
  }

  // Stop animation
  static async animateStop(refs) {
    const { scrollAnimationRef, npcCarAnimationsRef, setPlayerCarFrame, setJeepneyFrame, scrollY } = refs;

    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    npcCarAnimationsRef.current.forEach(anim => anim.stop());

    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    // Simulate sudden stop (car bounces slightly)
    await new Promise(resolve => {
      const { Animated, Easing } = require('react-native');
      Animated.sequence([
        Animated.timing(scrollY, {
          toValue: scrollY._value + 10,
          duration: 200,
          easing: Easing.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: scrollY._value,
          duration: 300,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ]).start(resolve);
    });
  }

  // Overtake animation
  static async animateOvertake(refs, params) {
    const { scrollAnimationRef, npcCarAnimationsRef, setPlayerCarFrame, setJeepneyFrame,
            setPlayerCarDirection, playerCarXAnim, scrollY, tileSize, jeepneyYAnim, height,
            jeepHeight, width, playerCarWidth, setIsJeepneyVisible } = refs;
    
    const { targetX = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2) } = params;

    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    npcCarAnimationsRef.current.forEach(anim => anim.stop());

    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    const { Animated, Easing } = require('react-native');

    // 1. Lane change left
    await new Promise(resolve => {
      setPlayerCarDirection("NORTHWEST");
      Animated.parallel([
        Animated.timing(playerCarXAnim, {
          toValue: targetX,
          duration: 300,
          easing: Easing.easeOut,
          useNativeDriver: false,
        }),
        Animated.timing(scrollY, {
          toValue: scrollY._value - (tileSize * 0.5),
          duration: 300,
          easing: Easing.easeOut,
          useNativeDriver: true,
        })
      ]).start(resolve);
    });

    // 2. Overtake
    await new Promise(resolve => {
      setPlayerCarDirection("NORTH");
      Animated.parallel([
        Animated.timing(jeepneyYAnim, {
          toValue: height + jeepHeight,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: scrollY._value - (tileSize * 3),
          duration: 1000,
          easing: Easing.easeOut,
          useNativeDriver: true,
        }),
      ]).start(resolve);
    });

    setIsJeepneyVisible(false);

    // 3. Return to lane
    await new Promise(resolve => {
      setPlayerCarDirection("NORTHEAST");
      Animated.parallel([
        Animated.timing(playerCarXAnim, {
          toValue: width / 2 - playerCarWidth / 2,
          duration: 400,
          easing: Easing.easeOut,
          useNativeDriver: false,
        }),
        Animated.timing(scrollY, {
          toValue: scrollY._value - (tileSize * 0.5),
          duration: 400,
          easing: Easing.easeOut,
          useNativeDriver: true,
        })
      ]).start(resolve);
    });

    setPlayerCarDirection("NORTH");
  }
}

export default AnimationManager;