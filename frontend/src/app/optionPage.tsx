import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const BACKGROUND_SPEED = 12000;

export default function OptionPage() {
  const [fontsLoaded] = useFonts({
    pixel: require('../../assets/fonts/pixel3.ttf'),
  });

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [libraryVisible, setLibraryVisible] = useState(false);

  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const carBounce = useRef(new Animated.Value(0)).current;
  const driverScale = useRef(new Animated.Value(1)).current;
  const pedestrianScale = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0)).current;
  const libraryModalScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (fontsLoaded) {
      startBackgroundAnimation();
      startCarAnimation();
    }

    return () => {
      backgroundAnimation.stopAnimation();
      carBounce.stopAnimation();
      driverScale.stopAnimation();
      pedestrianScale.stopAnimation();
      modalScale.stopAnimation();
      libraryModalScale.stopAnimation();
    };
  }, [fontsLoaded]);

  // Animate settings modal in/out
  useEffect(() => {
    Animated.spring(modalScale, {
      toValue: settingsVisible ? 1 : 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [settingsVisible]);

  // Animate library modal in/out
  useEffect(() => {
    Animated.spring(libraryModalScale, {
      toValue: libraryVisible ? 1 : 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [libraryVisible]);

  const startBackgroundAnimation = () => {
    backgroundAnimation.setValue(0);
    Animated.loop(
      Animated.timing(backgroundAnimation, {
        toValue: 1,
        duration: BACKGROUND_SPEED,
        useNativeDriver: true,
      }),
      { iterations: -1 }
    ).start();
  };

  const startCarAnimation = () => {
    carBounce.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(carBounce, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(carBounce, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    ).start();
  };

  const handleDriverPress = () => {
    Animated.sequence([
      Animated.timing(driverScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(driverScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/categorySelectionScreen');
    });
  };

  const handlePedestrianPress = () => {
    Animated.sequence([
      Animated.timing(pedestrianScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pedestrianScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/pedestrian-game');
    });
  };

  const handleSettingsOptionPress = async (action) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available
    }
    action();
  };

  const handleLibraryPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available
    }
    setLibraryVisible(true);
  };

  if (!fontsLoaded) return null;

  const backgroundTranslate = backgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width],
  });

  const carVerticalBounce = carBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <Animated.View
          style={[
            styles.backgroundWrapper,
            { transform: [{ translateX: backgroundTranslate }] },
          ]}
        >
          <ImageBackground
            source={require('../../assets/background/city-background.png')}
            style={styles.backgroundImage}
            resizeMode="stretch"
            imageStyle={styles.backgroundImageStyle}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.backgroundWrapper,
            {
              transform: [{ translateX: Animated.add(backgroundTranslate, width) }],
            },
          ]}
        >
          <ImageBackground
            source={require('../../assets/background/city-background.png')}
            style={styles.backgroundImage}
            resizeMode="stretch"
          />
        </Animated.View>
      </View>

      {/* Sky Overlay */}
      <View style={styles.skyOverlay} />

      {/* Animated Car */}
      <Animated.View
        style={[
          styles.carContainer,
          { transform: [{ translateY: carVerticalBounce }] }
        ]}
      >
        <Image
          source={require('../../assets/car/blue-car.png')}
          style={styles.carImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Top-right Icons */}
      <View style={styles.topRightIcons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setSettingsVisible(true)}
        >
          <Image
            source={require('../../assets/icon/Settings.png')}
            style={styles.topIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleLibraryPress}
        >
          <Image
            source={require('../../assets/icon/Library.png')}
            style={styles.topIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Image
          source={require('../../assets/background/choose.png')}
          style={styles.title}
          resizeMode="contain"
        />
      </View>

      {/* Driver & Pedestrian Selection */}
      <View style={styles.selectionContainer}>
        <Animated.View style={[{ transform: [{ scale: driverScale }] }]}>
          <TouchableOpacity
            style={styles.optionContainer}
            onPress={handleDriverPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/icon/steeringwheel.png')}
                style={styles.optionImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.optionLabel}>DRIVER</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[{ transform: [{ scale: pedestrianScale }] }]}>
          <TouchableOpacity
            style={styles.optionContainer}
            onPress={handlePedestrianPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/icon/commuter.png')}
                style={styles.optionImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.optionLabel}>PEDESTRIAN</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Settings Modal */}
      {settingsVisible && (
        <Animated.View
          style={[
            styles.settingsPanel,
            { transform: [{ scale: modalScale }] },
          ]}
        >
          <Image
            source={require('../../assets/background/settings-tab.png')}
            style={styles.settingsTab}
            resizeMode="stretch"
          />

          <Text style={styles.settingsTitle}>SETTINGS</Text>

          <View style={styles.settingsOptionsColumn}>
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => handleSettingsOptionPress(() => {
                setSettingsVisible(false);
                router.push('/profile');
              })}
            >
              <Image
                source={require('../../assets/background/profile.png')}
                style={styles.profileButton}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => handleSettingsOptionPress(() => {
                setSettingsVisible(false);
                router.push('/audio');
              })}
            >
              <Image
                source={require('../../assets/background/audio.png')}
                style={styles.audioButton}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => setSettingsVisible(false)}
            >
              <Image
                source={require('../../assets/background/back.png')}
                style={styles.backButtonImage}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Library Modal */}
      {libraryVisible && (
        <Animated.View
          style={[
            styles.libraryPanel,
            { transform: [{ scale: libraryModalScale }] },
          ]}
        >
          <Image
            source={require('../../assets/background/settings-tab.png')}
            style={styles.settingsTab}
            resizeMode="stretch"
          />

          <Text style={styles.libraryTitle}>REFERENCES</Text>

          <View style={styles.libraryContent}>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.referenceContainer}>
                <Text style={styles.referenceText}>
                  Land Transportation Office. (2023). Road and traffic rules, signs, signals, and markings (RO102). 
                  https://lto.gov.ph/wp-content/uploads/2023/09/RO102_CDE_Road_and_Traffic_Rules_Signs-Signals-Markings.pdf
                </Text>
              </View>

              <View style={styles.referenceContainer}>
                <Text style={styles.referenceText}>
                  DEPARTMENT OF TRANSPORTATION. (2023, OCTOBER 26). SEC. BAUTISTA TO LTO: REDUCE ROAD CRASH INCIDENTS, ENSURE PEDESTRIAN SAFETY. 
                  Republic of the Philippines: DEPARTMENT OF TRANSPORTATION. 
                  https://dotr.gov.ph/sec-bautista-to-lto-reduce-road-crash-incidents-ensure-pedestrian-safety/
                </Text>
              </View>
            </ScrollView>
          </View>

          <TouchableOpacity
            style={styles.libraryBackButton}
            onPress={() => setLibraryVisible(false)}
          >
            <Image
              source={require('../../assets/background/back.png')}
              style={styles.backButtonImage}
            />
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundWrapper: {
    position: 'absolute',
    width: width,
    height: height,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: { width: '100%', height: '100%', transform: [{ scale: 1.3 }] },
  skyOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height, backgroundColor: 'rgba(0,0,0,0)', zIndex: 0 },
  carContainer: {
    position: 'absolute',
    bottom: -25,
    left: width * 0.05,
    zIndex: 2,
  },
  carImage: {
    width: 400,
    height: 210,
  },
  topRightIcons: { position: 'absolute', top: 40, right: 20, flexDirection: 'row', zIndex: 5 },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginLeft: 10,
  },
  topIcon: { width: 24, height: 24 },
  titleContainer: { position: 'absolute', top: 10, alignSelf: 'center', zIndex: 3 },
  title: {
    width: width * 0.4, 
    height:120,
    resizeMode:"contain"
  },
  selectionContainer: {
    position: 'absolute', top: height * 0.3, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingHorizontal: 130, zIndex: 3,
  },
  optionContainer: {
    alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12, padding: 40, borderWidth: 3, borderColor: '#666', minWidth: 120,
  },
  iconContainer: { marginBottom: 15, alignItems: 'center', justifyContent: 'center', width: 100, height: 100 },
  optionImage: { width: 160, height: 350 },
  optionLabel: {
    fontSize: 16, color: 'white', fontFamily: 'Pixel3',
    textAlign: 'center', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2,
    bottom:-20
  },
  settingsPanel: {
    position: 'absolute',
    top: height * 0.15,
    alignSelf: 'center',
    width: Math.min(width * 0.9, 400),
    height: Math.min(height * 0.6, 400),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  settingsTab: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  settingsTitle: {
    fontSize: 15,
    color: 'black',
    fontFamily: "Pixel3",
    marginBottom: 20,
    textAlign: 'center',
  },
  settingsOptionsColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 25,
  },
  settingsOption: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: { width: 147, height: 50, resizeMode: 'contain',marginBottom:-10,marginTop:10},
  audioButton: { width: 120, height: 50, resizeMode: 'contain',marginBottom:-10 },
  backButtonImage: { width: 100, height: 50, resizeMode: 'contain', marginBottom:30 },
  
  // Library Panel Styles
  libraryPanel: {
    position: 'absolute',
    top: height * 0.05,
    alignSelf: 'center',
    width: Math.min(width * 0.95, 500),
    height: Math.min(height * 0.85, 600),
    alignItems: 'center',
    zIndex: 10,
  },
  libraryTitle: {
    fontSize: 25,
    color: 'black',
    fontFamily: "Pixel3",
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
    bottom: 20,
  },
  libraryContent: {
    flex: 1,
    width: '90%',
    marginBottom: 15,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  referenceContainer: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  referenceText: {
    fontSize: 10,
    color: 'black',
    fontFamily: "Pixel3",
    lineHeight: 14,
    textAlign: 'justify',
  },
  libraryBackButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
});