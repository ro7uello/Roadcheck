import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { router } from 'expo-router';
import { useSession, SessionProvider } from '../../../../contexts/SessionManager';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// --- assets and tiles (same as yours) ---
const roadTiles = {
  road2: require("../../../../../assets/road/road2.png"),
  road8: require("../../../../../assets/road/road8.png"),
  road20: require("../../../../../assets/road/road20.png"),
  road64: require("../../../../../assets/road/road64.png"),
  road79: require("../../../../../assets/road/road79.png"),

};

const mapLayout = [
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],
  ["road20", "road79", "road8", "road64", "road2"],

];
// Separated sprites (unchanged)
const playerCarSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
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

const busSprites = {
  NORTH: [
    require("../../../../../assets/car/BUS TOPDOWN/Black/MOVE/NORTH/SEPARATED/Black_BUS_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/BUS TOPDOWN/Black/MOVE/NORTH/SEPARATED/Black_BUS_CLEAN_NORTH_001.png"),
  ],
};

// Updated question structure following S2P1 format
const questions = [
  {
    question: "You're driving a private car on EDSA and accidentally enter a lane with BUS ONLY signs and markings. You realize your mistake when you see a city bus approaching from behind with its horn honking.",
    options: ["Speed up to stay ahead of the bus", "Safely exit the bus lane at the next legal opportunity", "Continue in the bus lane since you're already there"],
    correct: "Safely exit the bus lane at the next legal opportunity",
    wrongExplanation: {
      "Speed up to stay ahead of the bus": "wrong! speeding in a restricted lane compounds the violation.",
      "Continue in the bus lane since you're already there": "Accident prone!  Staying in a restricted lane continues the violation and might present you to longer danger."
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
      // Get phase from sessionData
      const phaseId = sessionData?.phase_id;

      // Traffic Signs Phase 1 (phaseId = 4): scenarios 31-40
      // Traffic Signs Phase 2 (phaseId = 5): scenarios 41-50
      let scenarioId;

      if (phaseId === 4) {
        // Phase 1: scenarios 31-40
        scenarioId = 30 + currentScenario;
      } else if (phaseId === 5) {
        // Phase 2: scenarios 41-50
        scenarioId = 40 + currentScenario;
      } else {
        console.error('Unknown phase ID:', phaseId);
        return;
      }

      console.log('🔍 SCENARIO DEBUG:', {
        phaseId,
        currentScenario,
        calculatedScenarioId: scenarioId,
        selectedOption,
        isCorrect
      });

      await updateScenarioProgress(scenarioId, selectedOption, isCorrect);
    } catch (error) {
      console.error('Error updating scenario progress:', error);
    }
  };

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isCarVisible, setIsCarVisible] = useState(true);
  const [isBusVisible, setIsBusVisible] = useState(false); // New state for Bus visibility

  const startOffset = -(mapHeight - height);

  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      currentScroll.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null); // NEW STATE from S2P1 for correct/wrong feedback
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [carDirection, setCarDirection] = useState("NORTH");
  const [carFrame, setCarFrame] = useState(0);

  // Responsive car positioning
  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current; // Player car starts centered
  const BusYAnim = useRef(new Animated.Value(height * 1.5)).current; // Start well below the screen
  const BusXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2 + tileSize    )).current; // Bus now starts in middle lane (same as player car)
  const BusEntryAnim = useRef(new Animated.Value(0)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Car animation frame cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
    }, 200); // Adjust speed of car animation
    return () => clearInterval(interval);
  }, []);

  function startScrollAnimation() {
    scrollY.setValue(startOffset); // Ensure scroll starts from bottom for each game start
    carXAnim.setValue(width / 2 - carWidth / 2); // Reset car position to center lane
    setCarDirection("NORTH"); // Reset car direction
    setIsCarVisible(true); // Ensure car is visible

    const stopRow = 6.5; // Row where the question appears
    const stopOffset = startOffset + stopRow * tileSize;

    Animated.timing(scrollY, {
      toValue: stopOffset,
      duration: 4000,
      useNativeDriver: true,
    }).start(() => {
      setShowQuestion(true);
      setTimeout(() => {
        setShowAnswers(true);
      }, 1000);
    });
  }

  useEffect(() => {
    startScrollAnimation();
  }, []);

  // Updated handleFeedback function from S2P1
  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    if (answerGiven === currentQuestion.correct) {
      setIsCorrectAnswer(true); // Set to true for correct feedback
      setAnimationType("correct");
      Animated.timing(correctAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        correctAnim.setValue(0);
        setShowNext(true);
      });
    } else {
      setIsCorrectAnswer(false); // Set to false for wrong feedback
      setAnimationType("wrong");
      Animated.timing(wrongAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        wrongAnim.setValue(0);
        setShowNext(true);
      });
    }
  };

  const getCarCurrentRow = () => {
    const currentY = currentScroll.current - startOffset;
    return Math.floor(currentY / tileSize);
  };

  const animateCarToTargetRow = (targetRow, duration, callback) => {
    const currentRow = getCarCurrentRow();
    const rowsToMove = targetRow - currentRow;
    const nextTarget = currentScroll.current + rowsToMove * tileSize;

    Animated.timing(scrollY, {
      toValue: nextTarget,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(callback);
  };

  const handleAnswer = async (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    await updateProgress(answer, isCorrect);
    const actualCorrectAnswer = questions[questionIndex].correct;
    const originalLaneX = width / 2 - carWidth / 2; // Original lane center
    const rightLaneX = width / 2 - carWidth / 2 + tileSize; // One lane to the right
    const leftLaneX = width / 1.3 - carWidth / 1.3 - tileSize; // One lane to the left

    if (option === actualCorrectAnswer) {
      // Correct Answer: Player moves right, Bus passes on left
      setIsCarVisible(true);
      setIsBusVisible(true); // Show Bus for this scenario

      Animated.sequence([
        // 1. Player car moves to the right lane
        Animated.parallel([
          Animated.timing(carXAnim, {
            toValue: rightLaneX, // Move to the right lane
            duration: 500,
            easing: Easing.easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 0.5, // Small forward movement
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
        // 2. Bus passes on the left
        Animated.parallel([
          Animated.timing(BusYAnim, {
            toValue: -carHeight, // Move off-screen to the top
            duration: 1500, // Speed of Bus passing
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(BusXAnim, {
            toValue: leftLaneX, // Ensure Bus is in the left lane
            duration: 1, // Instantly set position
            useNativeDriver: false,
          }),
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 3, // Player car scrolls slowly
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        handleFeedback(option); // Show feedback after animation
      });

    } else if (option === "Continue in the bus lane since you're already there") {
      // WRONG Answer: Bus overtakes from the right
      setIsBusVisible(true); // Show Bus

      // Ensure Bus starts from behind and in the right lane
      BusXAnim.setValue(rightLaneX);
      BusYAnim.setValue(height * 1.5); // Start off-screen bottom

      Animated.sequence([
        // 1. Bus appears from behind and overtakes in the right lane
        Animated.parallel([
          Animated.timing(BusYAnim, {
            toValue: -carHeight, // Move off-screen to the top
            duration: 2500, // Duration for Bus to pass
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          // Player car continues to scroll slowly during Bus's appearance and pass
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 5, // Scroll for 5 tiles
            duration: 2500, // Duration adjusted to match Bus's pass
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ]).start(() => handleFeedback(option));

    } else if (option === "Speed up to stay ahead of the bus") {
      // Wrong Answer: Player car speeds up (scrolls faster and further)
      Animated.timing(scrollY, {
        toValue: currentScroll.current + tileSize * 18, // Target row 18 (relative to current position)
        duration: 4000, // Speed of 4 seconds
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        handleFeedback(option);
      });
      // Car stays NORTH, in its original lane.
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null); // Reset feedback state from S2P1
    setCarFrame(0);

    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setIsBusVisible(false); // Hide Bus for next question
    BusYAnim.setValue(height * 1.5); // Reset Bus position off-screen bottom
    BusXAnim.setValue(width / 2 - carWidth / 2); // Reset Bus X to middle lane for next potential scenario

    if (questionIndex < questions.length - 1) {
        setQuestionIndex(questionIndex + 1);
        startScrollAnimation();
      } else if (currentScenario >= 10) {
        // Last scenario - complete session
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
        // Move to next scenario
        moveToNextScenario();
        let phaseNumber;
        const categoryId = sessionData?.category_id;
        const phaseId = sessionData?.phase_id;

        if (categoryId === 1) {
          // Road Markings: phase IDs 1,2,3 → phase numbers 1,2,3
          phaseNumber = phaseId;
        } else if (categoryId === 2) {
          // Traffic Signs: phase IDs 4,5,6 → phase numbers 1,2,3
          phaseNumber = phaseId - 3;
        } else if (categoryId === 3) {
          // Intersection: phase IDs 7,8,9 → phase numbers 1,2,3
          phaseNumber = phaseId - 6;
        }

        const nextScreen = `S${currentScenario + 1}P${phaseNumber}`;
        router.push(`/scenarios/traffic-signs/phase${phaseNumber}/${nextScreen}`);
      }
  };

  // Determine the feedback message based on whether the answer was correct or wrong (from S2P1)
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! You should safely exit the restricted lane as soon as legally possible."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

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
      </Animated.View>

      {/* Responsive Car */}
      {isCarVisible && (
        <Animated.Image
          source={playerCarSprites[carDirection][carFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: height * 0.1, // Responsive bottom positioning
            transform: [
              { translateX: carXAnim }
            ],
            zIndex: 5,
          }}
        />
      )}

      {/* Responsive bus */}
      {isBusVisible && (
        <Animated.Image
          source={busSprites["NORTH"][carFrame]} // bus always faces NORTH
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            top: BusYAnim, // Position controlled by animation
            left: BusXAnim, // Position in the lane (starts in middle)
            zIndex: 4, // Always behind player car
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

      {/* Responsive Feedback - Updated to use S2P1 format */}
      {(animationType === "correct" || animationType === "wrong") && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </Animated.View>
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
  // ✅ DATABASE INTEGRATION - Added loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // No intro styles (responsive)
  // In-game responsive styles
 questionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: overlayHeight, // Corrected line: use the variable directly
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
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.2,
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
    height: overlayHeight, // Corrected line: use the variable directly
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