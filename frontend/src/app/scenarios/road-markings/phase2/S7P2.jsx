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
  road59: require("../../../../../assets/road/road59.png"),
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
   ["road18", "road4", "road3", "road17", "road20"],
  ["road19", "road59", "road59", "road16", "road51"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
];

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

// Traffic light sprites
const trafficLightSprites = {
  normal: require("../../../../../assets/traffic light/traffic_light_green2.png"),
  yellow: require("../../../../../assets/traffic light/traffic_light_yellow2.png"),
  red: require("../../../../../assets/traffic light/traffic_light_red2.png"),
};

// Updated question structure
const questions = [
  {
    question: "You're approaching a signalized pedestrian intersection in a school zone. The traffic light is green for vehicles, but you see children waiting to cross.",
    options: [
      "Proceed since you have a green light",
      "Stop and allow the children to cross safely",
      "Slow down but maintain right of way"
    ],
    correct: "Proceed since you have a green light",
    correctExplanation: "Correct! At signalized intersections, traffic signals control right of way. Pedestrians should wait for their signal.",
    wrongExplanations: {
      "Stop and allow the children to cross safely": "Wrong! This could confuse other drivers and pedestrians about who has right of way at a controlled intersection.",
      "Slow down but maintain right of way": "Accident Prone! Slowing unnecessarily at a green light can cause rear-end collisions."
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

  const [isCarVisible, setIsCarVisible] = useState(true);

  const startOffset = -(mapHeight - height);

  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  // Traffic light position (place it at the intersection - row 7, column 2)
  const trafficLightRowIndex = 7; // Just before the intersection
  const trafficLightColIndex = 2; // Center column
  const trafficLightXOffset = -10;

  // School zone sign position (beside road59, third column)
  const schoolZoneRowIndex = 8; // Row with road59
  const schoolZoneColIndex = 2; // Third column
  const schoolZoneXOffset = tileSize * 0.6; // Positioned to the right side of the tile

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

  // Traffic light states
  const [trafficLightState, setTrafficLightState] = useState('normal');
  const [animationSpeed, setAnimationSpeed] = useState(4000); // Default animation duration

  // Responsive car positioning
  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Car animation frame cycling
  useEffect(() => {
    let iv;
    if (!carPaused) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites[carDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused, carDirection]);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    setTrafficLightState('normal'); // Start with green light

    const stopRow = 6.7; // Stop before the intersection to show the question
    const stopOffset = startOffset + stopRow * tileSize;

    Animated.timing(scrollY, {
      toValue: stopOffset,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
      // Show question when car reaches the stopping point
      setShowQuestion(true);
      setTimeout(() => {
        setShowAnswers(true);
      }, 1000);
    });
  }

  useEffect(() => {
    startScrollAnimation();
  }, []);

  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    if (answerGiven === currentQuestion.correct) {
      setIsCorrectAnswer(true);
      setAnimationType("correct");
      setTimeout(() => {
        setShowNext(true);
      }, 500);
    } else {
      setIsCorrectAnswer(false);
      setAnimationType("wrong");
      setTimeout(() => {
        setShowNext(true);
      }, 500);
    }
  };

  const handleAnswer = async (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);
    const currentQuestion = questions[questionIndex];
      const isCorrect = answer === currentQuestion.correct;
      await updateProgress(answer, isCorrect);
    const currentRow = Math.abs(currentScroll.current - startOffset) / tileSize;

    if (answer === "Proceed since you have a green light") {
      // Option 1: Continue with green light and proceed normally
      const targetRow = 12;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;

      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 4000, // Normal speed
        useNativeDriver: true,
      }).start(() => {
        handleFeedback(answer);
      });
    } else if (answer === "Stop and allow the children to cross safely") {
      // Option 2: Proceed to traffic light and stop at the stop line (before road59)
      const stopAtTrafficLightRow = 6.5; // Stop at the traffic light/stop line
      const rowsToMove = stopAtTrafficLightRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;

      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 2000, // Normal speed to reach the traffic light
        useNativeDriver: true,
      }).start(() => {
        // Car stops at the traffic light
        setCarPaused(true);

        // Wait for 1 second then show feedback
        setTimeout(() => {
          handleFeedback(answer);
        }, 1000);
      });
    } else if (answer === "Slow down but maintain right of way") {
      // Option 3: Slow down significantly while approaching traffic light
      const targetRow = 12;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;

      // Much slower animation to represent slowing down
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 8000, // Much slower speed
        useNativeDriver: true,
      }).start(() => {
        handleFeedback(answer);
      });
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setCarFrame(0);
    setCarPaused(false);
    setAnimationSpeed(4000); // Reset animation speed

    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);

    // Reset traffic light
    setTrafficLightState('normal');

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

  // Calculate school zone sign position
  const schoolZoneLeft = schoolZoneColIndex * tileSize + schoolZoneXOffset;
  const schoolZoneTop = schoolZoneRowIndex * tileSize;

  // Determine the feedback message
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? currentQuestionData.correctExplanation
    : currentQuestionData.wrongExplanations[selectedAnswer] || "Wrong answer!";

  // Main game rendering
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
          source={trafficLightSprites[trafficLightState]}
          style={{
            width: tileSize * 1.2,
            height: tileSize * 1.8,
            position: "absolute",
            top: trafficLightTop,
            left: trafficLightLeft,
            zIndex: 10,
          }}
          resizeMode="contain"
        />

        {/* School Zone Sign */}
        <Image
          source={require("../../../../../assets/signs/school_zone.png")}
          style={{
            width: tileSize * 0.8,
            height: tileSize * 0.5,
            position: "absolute",
            top: schoolZoneTop,
            left: schoolZoneLeft,
            zIndex: 10,
          }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Responsive Car */}
      {isCarVisible && (
        <Animated.Image
          source={carSprites[carDirection][carFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: height * 0.1,
            left: carXAnim,
            zIndex: 5,
          }}
        />
      )}

      {/* Responsive Question Overlay */}
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

      {/* Responsive Answers */}
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

      {/* Responsive Feedback */}
      {(animationType === "correct" || animationType === "wrong") && (
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={[styles.feedbackText, { color: isCorrectAnswer ? '#ffffffff' : '#ffffffff' }]}>
              {feedbackMessage}
            </Text>
          </View>
        </View>
      )}

      {/* Responsive Next Button */}
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
  // Loading screen styles
  loadingContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  // No intro styles (responsive)
  // In-game responsive styles
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
    fontSize: Math.min(width * 0.045, 21),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.20,
    right: sideMargin,
    width: width * 0.35,
    height: height * 0.23,
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
  // Rain and flood effects
  rainContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 8,
    pointerEvents: 'none',
  },
  rainDrop: {
    position: 'absolute',
    width: 2,
    height: 15,
    backgroundColor: '#87CEEB',
    opacity: 0.7,
    borderRadius: 1,
  },
  floodArea: {
    backgroundColor: 'rgba(65, 105, 225, 0.6)',
    borderRadius: 3,
    zIndex: 2,
  },
  waterSpout: {
    backgroundColor: 'rgba(30, 144, 255, 0.7)',
    borderRadius: 2,
    zIndex: 2,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});