import { useFonts } from 'expo-font';
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

export default function DriverGame() {
  const [fontsLoaded] = useFonts({
    pixel: require('../../assets/fonts/pixel3.ttf'),
  });

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [libraryVisible, setLibraryVisible] = useState(false);
  
  const modalScale = useRef(new Animated.Value(0)).current;
  const libraryModalScale = useRef(new Animated.Value(0)).current;

  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const carBounce = useRef(new Animated.Value(0)).current;
  const roadMarkingsScale = useRef(new Animated.Value(1)).current;
  const signsScale = useRef(new Animated.Value(1)).current;
  const intersectionScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (fontsLoaded) {
      startBackgroundAnimation();
      startCarAnimation();
    }
    return () => {
      backgroundAnimation.stopAnimation();
      carBounce.stopAnimation();
      roadMarkingsScale.stopAnimation();
      signsScale.stopAnimation();
      intersectionScale.stopAnimation();
      modalScale.stopAnimation();
      libraryModalScale.stopAnimation();
    };
  }, [fontsLoaded]);

  useEffect(() => {
    Animated.spring(modalScale, {
      toValue: settingsVisible ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [settingsVisible]);

  useEffect(() => {
    Animated.spring(libraryModalScale, {
      toValue: libraryVisible ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
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
        Animated.timing(carBounce, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(carBounce, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
      { iterations: -1 }
    ).start();
  };

  const handleRoadMarkingsPress = () => {
    Animated.sequence([
      Animated.timing(roadMarkingsScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(roadMarkingsScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => router.push('/driver-game/road-markings'));
  };

  const handleSignsPress = () => {
    Animated.sequence([
      Animated.timing(signsScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(signsScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => router.push('/driver-game/signs'));
  };

  const handleIntersectionPress = () => {
    Animated.sequence([
      Animated.timing(intersectionScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(intersectionScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => router.push('/driver-game/intersections'));
  };

  const handleLibraryPress = () => {
    setLibraryVisible(true);
  };

  const goBack = () => {
    setTimeout(() => {
      router.back();
    }, -5000); // small delay lets animation complete
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
      {/* Background */}
      <View style={styles.backgroundContainer}>
        <Animated.View style={[styles.backgroundWrapper, { transform: [{ translateX: backgroundTranslate }] }]}>
          <ImageBackground
            source={require('../../assets/background/city-background.png')}
            style={styles.backgroundImage}
            resizeMode="stretch"
            imageStyle={styles.backgroundImageStyle}
          />
        </Animated.View>
        <Animated.View style={[styles.backgroundWrapper, { transform: [{ translateX: Animated.add(backgroundTranslate, width) }] }]}>
          <ImageBackground
            source={require('../../assets/background/city-background.png')}
            style={styles.backgroundImage}
            resizeMode="stretch"
            imageStyle={styles.backgroundImageStyle}
          />
        </Animated.View>
      </View>

      <View style={styles.skyOverlay} />

      {/* Car */}
      <Animated.View style={[styles.carContainer, { transform: [{ translateY: carVerticalBounce }] }]}>
        <Image source={require('../../assets/car/blue-car.png')} style={styles.carImage} resizeMode="contain" />
      </Animated.View>

         {/* Back Button */}
    <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
      <Image
        source={require('../../assets/icon/backButton.png')}
        style={styles.backButtonImageTop}
        resizeMode="contain"
      />
    </TouchableOpacity>

      {/* Top-right Icons (same style as OptionPage) */}
      <View style={styles.topRightIcons}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setSettingsVisible(true)}>
          <Image source={require('../../assets/icon/Settings.png')} style={styles.topIcon} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleLibraryPress}>
          <Image source={require('../../assets/icon/Library.png')} style={styles.topIcon} resizeMode="contain" />
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

      {/* Options */}
      <View style={styles.selectionContainer}>
        <Animated.View style={[{ transform: [{ scale: roadMarkingsScale }] }]}>
          <TouchableOpacity style={styles.optionContainer} onPress={handleRoadMarkingsPress} activeOpacity={0.8}>
            <View style={styles.iconContainer}>
              <Image source={require('../../assets/icon/roadmarkings.png')} style={styles.optionImage} resizeMode="contain" />
            </View>
            <Text style={styles.optionLabel}>ROAD MARKINGS</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[{ transform: [{ scale: signsScale }] }]}>
          <TouchableOpacity style={styles.optionContainer} onPress={handleSignsPress} activeOpacity={0.8}>
            <View style={styles.iconContainer}>
              <Image source={require('../../assets/icon/roadsigns.png')} style={styles.optionImage} resizeMode="contain" />
            </View>
            <Text style={styles.optionLabel}>SIGNS</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[{ transform: [{ scale: intersectionScale }] }]}>
          <TouchableOpacity style={styles.optionContainer} onPress={handleIntersectionPress} activeOpacity={0.8}>
            <View style={styles.iconContainer}>
              <Image source={require('../../assets/icon/intersection.png')} style={styles.optionImage} resizeMode="contain" />
            </View>
            <Text style={styles.optionLabel}>INTERSECTIONS</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Settings Panel */}
      {settingsVisible && (
        <Animated.View style={[styles.settingsPanel, { transform: [{ scale: modalScale }] }]}>
          <Image
            source={require('../../assets/background/settings-tab.png')}
            style={styles.settingsTab}
            resizeMode="stretch"
          />
          <Text style={styles.settingsTitle}>SETTINGS</Text>

          <View style={styles.settingsOptionsColumn}>
            <TouchableOpacity onPress={() => { setSettingsVisible(false); router.push('/profile'); }}>
              <Image source={require('../../assets/background/profile.png')} style={styles.profileButton} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSettingsVisible(false); router.push('/audio'); }}>
              <Image source={require('../../assets/background/audio.png')} style={styles.audioButton} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
              <Image source={require('../../assets/background/back.png')} style={styles.backButtonImage} />
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
  container: { flex: 1, backgroundColor: '#87CEEB' },
  backgroundContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  backgroundWrapper: { position: 'absolute', width, height },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  backgroundImageStyle: { width: '100%', height: '100%', transform: [{ scale: 1.3 }] },
  skyOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height, backgroundColor: 'rgba(0,0,0,0)', zIndex: 0 },
  carContainer: { position: 'absolute', bottom: height * 0.05, left: width * 0.05, zIndex: 2 },
  carImage: { width: 200, height: 300, bottom: -90 },

  // Back button (you need to add this style)
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 5,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonImageTop: {
    width: 80,
    height: 84,
  },

  // Top-right icons (same as OptionPage)
  topRightIcons: { position: 'absolute', top: 40, right: 20, flexDirection: 'row', zIndex: 5 },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  topIcon: { width: 24, height: 24 },

  // Title
  titleContainer: { position: 'absolute', top: 10, alignSelf: 'center', zIndex: 3 },
  title: { width: width * 0.8, height: 90, resizeMode: "contain" },

  // Options
  selectionContainer: { position: 'absolute', top: height * 0.25, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 20, zIndex: 3 },
  optionContainer: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 12, padding: 15, borderWidth: 3, borderColor: '#666', width: 200, height: 200, justifyContent: 'center' },
  iconContainer: { marginBottom: 10, alignItems: 'center', justifyContent: 'center', width: 50, height: 50 },
  optionImage: { width: 150, height: 150 },
  optionLabel: { fontSize: 12, color: 'white', fontFamily: 'pixel', textAlign: 'center', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, bottom: -40 },

  // Settings panel
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
    fontSize: 15,
    color: 'black',
    fontFamily: "Pixel3",
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
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