import { useSession } from '../../../../contexts/SessionManager';
import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { router } from 'expo-router';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

const roadTiles = {
  road3: require("../../../../../assets/road/road3.png"),
  road4: require("../../../../../assets/road/road4.png"),
  road16: require("../../../../../assets/road/road16.png"),
  road17: require("../../../../../assets/road/road17.png"),
  road18: require("../../../../../assets/road/road18.png"),
  road19: require("../../../../../assets/road/road19.png"),
  road59: require("../../../../../assets/road/road59.png"),
  road20: require("../../../../../assets/road/road20.png"),
  road23: require("../../../../../assets/road/road23.png"),
  road24: require("../../../../../assets/road/road24.png"),
  road49: require("../../../../../assets/road/road49.png"),
  road50: require("../../../../../assets/road/road50.png"),
  road51: require("../../../../../assets/road/road51.png"),
  road52: require("../../../../../assets/road/road52.png"),
  road57: require("../../../../../assets/road/road57.png"),
  road58: require("../../../../../assets/road/road58.png"),
  road60: require("../../../../../assets/road/road60.png"),
  int1: require("../../../../../assets/road/int1.png"),
  int2: require("../../../../../assets/road/int2.png"),
  int3: require("../../../../../assets/road/int3.png"),
  int4: require("../../../../../assets/road/int4.png"),
};

const mapLayout = [
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road49", "road59", "road57", "road50", "road52"],
  ["road60", "int3", "int4", "road60", "road24"],
  ["road58", "int2", "int1", "road58", "road23"],
  ["road19", "road57", "road57", "road16", "road51"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
];

// Player car sprites (Blue)
const carSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHWEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_001.png"),
  ],
  WEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_001.png"),
  ],
  NORTHEAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
};

// Red car sprites (for the car ahead)
const otherCarSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHWEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTHWEST/SEPARATED/Red_CIVIC_CLEAN_NORTHWEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTHWEST/SEPARATED/Red_CIVIC_CLEAN_NORTHWEST_001.png"),
  ],
  WEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/WEST/SEPARATED/Red_CIVIC_CLEAN_WEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/WEST/SEPARATED/Red_CIVIC_CLEAN_WEST_001.png"),
  ],
  NORTHEAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTHEAST/SEPARATED/Red_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTHEAST/SEPARATED/Red_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/EAST/SEPARATED/Red_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/EAST/SEPARATED/Red_CIVIC_CLEAN_EAST_001.png"),
  ],
};

// Traffic light sprites
const trafficLightSprites = {
  normal: require("../../../../../assets/traffic light/traffic_light_green2.png"),
  yellow: require("../../../../../assets/traffic light/traffic_light_yellow2.png"),
  red: require("../../../../../assets/traffic light/traffic_light_red2.png"),
};

const questions = [
  {
    question: "You're behind several vehicles at a stop line before an intersection. The light turns red, but the vehicle in front stops past the stop line, blocking the crosswalk.",
    options: [
      "Also cross the stop line to keep traffic moving",
      "Stop at the proper stop line position even if it creates a gap",
      "Honk at the vehicle ahead to move forward"
    ],
    correct: "Stop at the proper stop line position even if it creates a gap",
    wrongExplanation: {
      "Also cross the stop line to keep traffic moving": "Wrong! One violation doesn't justify another. Stop lines must be respected by all vehicles.",
      "Honk at the vehicle ahead to move forward": "Wrong! Honking doesn't solve the violation and may cause confusion about traffic signals."
    }
  },
];

export default function DrivingGame() {

  const {
  updateScenarioProgress,
  moveToNextScenario,
  completeSession,
  currentScenario,
  sessionData
} = useSession();

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const scenarioId = 10 + currentScenario;
      await updateScenarioProgress(scenarioId, selectedOption, isCorrect);
    } catch (error) {
      console.error('Error updating scenario progress:', error);
    }
  };

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  // Grid-based positioning helper
  const getGridPosition = (col, row) => ({
    x: col * tileSize + (tileSize - carWidth) / 2,
    y: row * tileSize + (tileSize - carHeight) / 2
  });

  const [isCarVisible, setIsCarVisible] = useState(true);
  const [isOtherCarVisible, setIsOtherCarVisible] = useState(true);

  // Calculate start offset to show cars at rows 9-10 (intersection area)
  // We want row 9-10 to be in the middle of the screen
  const targetRow = 9.5; // Between rows 9 and 10
  const startOffset = -(targetRow * tileSize - height / 2);

  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  // Traffic light position (place it at the intersection)
  const trafficLightRowIndex = 8.5;
  const trafficLightColIndex = 2;
  const trafficLightXOffset = -30;

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      currentScroll.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [carDirection, setCarDirection] = useState("NORTH");
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);

  // Red car states
  const [otherCarDirection, setOtherCarDirection] = useState("NORTH");
  const [otherCarFrame, setOtherCarFrame] = useState(0);
  const [otherCarPaused, setOtherCarPaused] = useState(false);

  // Traffic light states
  const [trafficLightState, setTrafficLightState] = useState('normal');
  const [lightChangeTriggered, setLightChangeTriggered] = useState(false);

  // Honk effect
  const [showHonk, setShowHonk] = useState(false);

  // Car positioning with grid-based system
  // Red car starts at column 2, row 9 (road57 - stops past stop line, blocking crosswalk)
  const redCarStartPos = getGridPosition(2, 9);
  // Blue car starts at column 2, row 11 (road3 - behind red car at proper stop line)
  const blueCarStartPos = getGridPosition(2, 11);

  const carXAnim = useRef(new Animated.Value(0)).current;
  const carYAnim = useRef(new Animated.Value(0)).current;
  const otherCarXAnim = useRef(new Animated.Value(0)).current;
  const otherCarYAnim = useRef(new Animated.Value(0)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;
  const honkAnim = useRef(new Animated.Value(0)).current;

  // Initialize car positions
  useEffect(() => {
    // Set initial positions relative to the map
    carXAnim.setValue(blueCarStartPos.x);
    carYAnim.setValue(blueCarStartPos.y);
    otherCarXAnim.setValue(redCarStartPos.x);
    otherCarYAnim.setValue(redCarStartPos.y);
  }, []);

  // Blue car animation frame cycling
  useEffect(() => {
    let iv;
    if (!carPaused && isCarVisible) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites[carDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused, carDirection, isCarVisible]);

  // Red car animation frame cycling
  useEffect(() => {
    let iv;
    if (!otherCarPaused && isOtherCarVisible) {
      iv = setInterval(() => {
        setOtherCarFrame((p) => (p + 1) % otherCarSprites[otherCarDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [otherCarPaused, otherCarDirection, isOtherCarVisible]);

  const scrollAnimationRef = useRef(null);

  function startScrollAnimation() {
    // Set initial position to show cars immediately
    scrollY.setValue(startOffset);
    setTrafficLightState('green'); // Start with green light
    setLightChangeTriggered(false);

    // Cars start moving forward initially
    setCarPaused(false);
    setOtherCarPaused(false);

    // Reset car positions to starting positions
    carXAnim.setValue(blueCarStartPos.x);
    carYAnim.setValue(blueCarStartPos.y);
    otherCarXAnim.setValue(redCarStartPos.x);
    otherCarYAnim.setValue(redCarStartPos.y);

    // Start with cars moving forward slowly
    const moveForwardAnimation = Animated.parallel([
      Animated.timing(scrollY, {
        toValue: startOffset - tileSize, // Move forward one tile
        duration: 2000,
        useNativeDriver: true,
      })
    ]);

    moveForwardAnimation.start(() => {
      // Stop cars when they reach the intersection
      setCarPaused(true);
      setOtherCarPaused(true);

      // Traffic light changes to red
      setTrafficLightState('red');
      setLightChangeTriggered(true);

      // Show question after light turns red
      setTimeout(() => {
        setShowQuestion(true);
        setTimeout(() => {
          setShowAnswers(true);
        }, 1000);
      }, 500);
    });
  }

  useEffect(() => {
    startScrollAnimation();
    return () => {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    };
  }, []);

  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    if (answerGiven === currentQuestion.correct) {
      setIsCorrectAnswer(true);
      setAnimationType("correct");
      // Show feedback after 0.5 second delay
      setTimeout(() => {
        Animated.timing(correctAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          correctAnim.setValue(0);
          setShowNext(true);
        });
      }, 500);
    } else {
      setIsCorrectAnswer(false);
      setAnimationType("wrong");
      // Show feedback after 0.5 second delay
      setTimeout(() => {
        Animated.timing(wrongAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          wrongAnim.setValue(0);
          setShowNext(true);
        });
      }, 500);
    }
  };

  const showHonkEffect = () => {
    setShowHonk(true);
    Animated.sequence([
      Animated.timing(honkAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(honkAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(honkAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(honkAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowHonk(false);
      honkAnim.setValue(0);
    });
  };

  const handleAnswer = async (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    await updateProgress(answer, isCorrect);

    if (answer === "Also cross the stop line to keep traffic moving") {
      // Animation: Blue car moves to road4 (2nd column, row 11) then to road57 (column 2, row 10) beside red car
      setCarDirection("WEST");

      const road4Pos = getGridPosition(1, 11); // road4 position (2nd column)
      const road57Pos = getGridPosition(1, 9); // road57 position beside red car

      // First move to road4 (left lane)
      Animated.timing(carXAnim, {
        toValue: road4Pos.x,
        duration: 1000,
        useNativeDriver: false,
      }).start(() => {
        // Then move forward to be beside red car
        setCarDirection("NORTH");
        Animated.timing(carYAnim, {
          toValue: road57Pos.y,
          duration: 1000,
          useNativeDriver: false,
        }).start(() => {
          handleFeedback(answer);
        });
      });

    } else if (answer === "Stop at the proper stop line position even if it creates a gap") {
  // Animation: Blue car moves forward to stop right before red car
  setCarDirection("NORTH");
  setCarPaused(false); // Keep animation running during movement

  // Calculate position right before red car (one tile behind)
  const stopBeforeRedCarPos = getGridPosition(2, 10); // Stop at row 10, right before red car at row 9

  console.log('Moving blue car from', blueCarStartPos.y, 'to', stopBeforeRedCarPos.y);

  // Move blue car forward to stop before red car
  Animated.timing(carYAnim, {
    toValue: stopBeforeRedCarPos.y,
    duration: 1500,
    easing: Easing.linear,
    useNativeDriver: false,
  }).start(() => {
    setCarPaused(true); // Stop animation after reaching position

    // Wait a bit, then turn green
    setTimeout(() => {
      setTrafficLightState('green');
      setTimeout(() => {
        setCarPaused(false);
        setOtherCarPaused(false);

        // Move map forward to simulate cars proceeding
        Animated.timing(scrollY, {
          toValue: startOffset - tileSize * 2,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          handleFeedback(answer);
        });
      }, 1000);
    }, 1000);
  });
} // <-- ADD THIS CLOSING BRACE

else if (answer === "Honk at the vehicle ahead to move forward") {
  // Animation: Show honking effect, wait for green light, then proceed
  setCarPaused(true);
  showHonkEffect();

  setTimeout(() => {
    setTrafficLightState('green');
    setTimeout(() => {
      setCarPaused(false);
      setOtherCarPaused(false);

      // Get current positions to move relative from where they are
      const currentBlueCarY = carYAnim._value;
      const currentRedCarY = otherCarYAnim._value;

      // Move both car and map forward together
      Animated.parallel([
        // Move the blue car forward smoothly
        Animated.timing(carYAnim, {
          toValue: currentBlueCarY - tileSize * 4, // Move 4 tiles from current position
          duration: 3000,
          easing: Easing.inOut(Easing.ease), // Smooth easing
          useNativeDriver: false,
        }),
        // Move the red car forward smoothly
        Animated.timing(otherCarYAnim, {
          toValue: currentRedCarY - tileSize * 4, // Move 4 tiles from current position
          duration: 3000,
          easing: Easing.inOut(Easing.ease), // Smooth easing
          useNativeDriver: false,
        }),
        // Move map forward with same timing
        Animated.timing(scrollY, {
          toValue: startOffset - tileSize * 4,
          duration: 3000,
          easing: Easing.inOut(Easing.ease), // Smooth easing
          useNativeDriver: true,
        })
      ]).start(() => {
        handleFeedback(answer);
      });
    }, 1000);
  }, 1500);
}

}

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setCarFrame(0);
    setOtherCarFrame(0);
    setCarPaused(false);
    setOtherCarPaused(false);
    setShowHonk(false);

    // Reset positions
    carXAnim.setValue(blueCarStartPos.x);
    carYAnim.setValue(blueCarStartPos.y);
    otherCarXAnim.setValue(redCarStartPos.x);
    otherCarYAnim.setValue(redCarStartPos.y);

    setCarDirection("NORTH");
    setOtherCarDirection("NORTH");
    setIsCarVisible(true);
    setIsOtherCarVisible(true);

    setTrafficLightState('normal');
    setLightChangeTriggered(false);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario >= 10) {
              // Last scenario in phase - complete session
              try {
                const sessionResults = await completeSession();
                router.push({
                  pathname: '/result',
                  params: {
                    ...sessionResults,
                    userAttempts: JSON.stringify(sessionResults.attempts)
                  }
                });
              } catch (error) {
                console.error('Error completing session:', error);
                Alert.alert('Error', 'Failed to save session results');
              }
            } else {
              moveToNextScenario();
              const nextScreen = `S${currentScenario + 1}P2`; // Will be S2P2
              router.push(`/scenarios/road-markings/phase2/${nextScreen}`);
            }
      };

  // Calculate traffic light position
  const trafficLightLeft = trafficLightColIndex * tileSize + trafficLightXOffset;
  const trafficLightTop = trafficLightRowIndex * tileSize;

  // Feedback message
  let feedbackMessage = "";

  if (isCorrectAnswer) {
    feedbackMessage = "Correct! Maintaining proper position respects traffic laws and ensures pedestrian safety.";
  } else if (selectedAnswer === "Also cross the stop line to keep traffic moving") {
    feedbackMessage = "Wrong! One violation doesn't justify another. Stop lines must be respected by all vehicles.";
  } else if (selectedAnswer === "Honk at the vehicle ahead to move forward") {
    feedbackMessage = "Wrong! Honking doesn't solve the violation and may cause confusion about traffic signals.";
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* Map */}
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: mapHeight,
          left: 0,
          transform: [{ translateY: scrollY }],
          zIndex: 1,
        }}
      >
        {mapLayout.map((row, rowIndex) =>
          row.map((tile, colIndex) => (
            <Image
              key={`${rowIndex}-${colIndex}`}
              source={roadTiles[tile]}
              style={{
                position: "absolute",
                width: tileSize,
                height: tileSize,
                left: colIndex * tileSize,
                top: rowIndex * tileSize,
              }}
              resizeMode="stretch"
            />
          ))
        )}

        {/* Traffic Light */}
        <Image
          source={trafficLightSprites[trafficLightState === 'green' ? 'normal' : trafficLightState]}
          style={{
            width: tileSize * 1.5,
            height: tileSize * 2,
            position: "absolute",
            top: trafficLightTop,
            left: trafficLightLeft,
            zIndex: 10,
          }}
          resizeMode="contain"
        />

        {/* Red Car (positioned on the map) */}
        {isOtherCarVisible && (
          <Animated.Image
            source={otherCarSprites[otherCarDirection][otherCarFrame]}
            style={{
              width: carWidth,
              height: carHeight,
              position: "absolute",
              left: otherCarXAnim,
              top: otherCarYAnim,
              zIndex: 6,
            }}
          />
        )}

        {/* Blue Car (positioned on the map) */}
        {isCarVisible && (
          <Animated.Image
            source={carSprites[carDirection][carFrame]}
            style={{
              width: carWidth,
              height: carHeight,
              position: "absolute",
              left: carXAnim,
              top: carYAnim,
              zIndex: 5,
            }}
          />
        )}
      </Animated.View>

      {/* Honk Effect */}
      {showHonk && (
        <Animated.View
          style={{
            position: "absolute",
            top: height * 0.4,
            left: width / 2 - 30,
            zIndex: 15,
            opacity: honkAnim,
          }}
        >
          <Text style={{ fontSize: 60, color: 'yellow' }}>📢</Text>
        </Animated.View>
      )}

      {/* Question Overlay */}
      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image
            source={require("../../../../../assets/dialog/LTO.png")}
            style={styles.ltoImage}
          />
          <View style={styles.questionBox}>
            <View style={styles.questionTextContainer}>
              <Text style={styles.questionText}>
                {questions[questionIndex].question}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Answers */}
      {showAnswers && (
        <View style={styles.answersContainer}>
          {questions[questionIndex].options.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.answerButton}
              onPress={() => handleAnswer(option)}
            >
              <Text style={styles.answerText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Feedback */}
      {(animationType === "correct" || animationType === "wrong") && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Next Button */}
      {showNext && (
        <View style={styles.nextButtonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    marginTop: 20,
  },
  introContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    padding: width * 0.05,
  },
  introLTOImage: {
    width: width * 0.6,
    height: height * 0.25,
    resizeMode: "contain",
    marginBottom: height * 0.03,
  },
  introTextBox: {
    backgroundColor: "rgba(8, 8, 8, 0.7)",
    padding: width * 0.06,
    borderRadius: 15,
    alignItems: "center",
    maxWidth: width * 0.85,
    minHeight: height * 0.3,
    justifyContent: "center",
  },
  introTitle: {
    color: "white",
    fontSize: Math.min(width * 0.07, 32),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: height * 0.02,
  },
  introSubtitle: {
    color: "#aaa",
    fontSize: Math.min(width * 0.05, 22),
    textAlign: "center",
    marginBottom: height * 0.02,
  },
  introText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    textAlign: "center",
    marginBottom: height * 0.04,
    lineHeight: Math.min(width * 0.06, 26),
    paddingHorizontal: width * 0.02,
  },
  startButton: {
    backgroundColor: "#007bff",
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.08,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    minWidth: width * 0.4,
    alignItems: "center",
  },
  startButtonText: {
    color: "white",
    fontSize: Math.min(width * 0.055, 24),
    fontWeight: "bold",
  },
  questionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: overlayHeight,
    backgroundColor: "rgba(8, 8, 8, 0.43)",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: 0,
    zIndex: 10,
  },
ltoImage: {
    width: ltoWidth,
    height: ltoHeight,
    resizeMode: "contain",
    marginLeft: -width * 0.03,
    marginBottom: -height * 0.12,
  },
  questionBox: {
    flex: 1,
    bottom: height * 0.1,
    alignItems: "center",
    justifyContent: "center",
  },
  questionTextContainer: {
    padding: -height * 0.04,
    maxWidth: width * 0.7,
  },
  questionText: {
    flexWrap: "wrap",
    color: "white",
    fontSize: Math.min(width * 0.045, 22),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.175,
    right: sideMargin,
    width: width * 0.35,
    height: height * 0.21,
    zIndex: 11,
  },
  answerButton: {
    backgroundColor: "#333",
    padding: height * 0.015,
    borderRadius: 8,
    marginBottom: height * 0.015,
    borderWidth: 1,
    borderColor: "#555",
  },
  answerText: {
    color: "white",
    fontSize: Math.min(width * 0.04, 18),
    textAlign: "center",
  },
  feedbackOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: overlayHeight,
    backgroundColor: "rgba(8, 8, 8, 0.43)",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: height * 0.01,
    zIndex: 10,
  },
  feedbackBox: {
    flex: 1,
    bottom: height * 0.1,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackText: {
    color: "white",
    fontSize: Math.min(width * 0.06, 24),
    fontWeight: "bold",
    textAlign: "center",
  },
  nextButtonContainer: {
    position: "absolute",
    top: height * 0.50,
    right: sideMargin,
    width: width * 0.2,
    alignItems: "center",
    zIndex: 11,
  },
  nextButton: {
    backgroundColor: "#007bff",
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.06,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: width * 0.15,
    alignItems: "center",
  },
  nextButtonText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
  },
});