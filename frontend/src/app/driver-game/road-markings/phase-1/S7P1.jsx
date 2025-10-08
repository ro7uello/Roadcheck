import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
  Easing, // Import Easing for more control over animations
} from "react-native";
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

// --- assets and tiles (same as yours) ---
const roadTiles = {
  road1: require("../../../../assets/road/road1.png"),
  road3: require("../../../../assets/road/road3.png"),
  road4: require("../../../../assets/road/road4.png"),
  road17: require("../../../../assets/road/road17.png"),
  road62: require("../../../../assets/road/road62.png"),
  road70: require("../../../../assets/road/road70.png"),
};

const mapLayout = [
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
];

// Separated sprites (unchanged)
const playerCarSprites = {
  NORTH: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHEAST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  EAST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
};

const ambulanceSprites = {
  NORTH: [
    require("../../../../assets/car/AMBULANCE TOPDOWN/MOVE/NORTH/SEPARATED/AMBULANCE_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/AMBULANCE TOPDOWN/MOVE/NORTH/SEPARATED/AMBULANCE_CLEAN_NORTH_001.png"),
  ],
};

// Updated question structure following S2P1 format
const questions = [
  {
    question: "You're in heavy traffic with solid white lines between lanes. An ambulance is approaching from behind with sirens on.",
    options: ["Stay in your lane since crossing solid white lines is discouraged", "Speed up to clear the way without changing lanes", "Carefully move to give way to the ambulance, crossing the solid white line if necessary"],
    correct: "Carefully move to give way to the ambulance, crossing the solid white line if necessary",
    wrongExplanation: {
      "Stay in your lane since crossing solid white lines is discouraged": "Wrong! Emergency vehicles have priority, and giving way overrides lane marking restrictions.",
      "Speed up to clear the way without changing lanes": "Accident prone! Speeding up might not provide adequate clearance and could be dangerous in heavy traffic."
    }
  },
];

export default function DrivingGame() {

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isCarVisible, setIsCarVisible] = useState(true);
  const [isAmbulanceVisible, setIsAmbulanceVisible] = useState(false); // New state for ambulance visibility

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
  const AmbulanceYAnim = useRef(new Animated.Value(height * 1.5)).current; // Start well below the screen
  const AmbulanceXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2 - tileSize)).current; // Default lane to the left of player
  // const AmbulanceXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2 + tileSize)).current; // Default lane to the right of player
  const AmbulanceEntryAnim = useRef(new Animated.Value(0)).current;

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

  const handleAnswer = (option) => {
    setSelectedAnswer(option);
    setShowQuestion(false);
    setShowAnswers(false);

    const actualCorrectAnswer = questions[questionIndex].correct;
    const originalLaneX = width / 2 - carWidth / 2; // Original lane center
    const rightLaneX = width / 2 - carWidth / 2 + tileSize; // One lane to the right
    const leftLaneX = width / 2 - carWidth / 2 - tileSize; // One lane to the left

    if (option === actualCorrectAnswer) {
      // Correct Answer: Player moves right, Ambulance passes on left
      setIsCarVisible(true);
      setIsAmbulanceVisible(true); // Show ambulance for this scenario

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
        // 2. Ambulance passes on the left
        Animated.parallel([
          Animated.timing(AmbulanceYAnim, {
            toValue: -carHeight, // Move off-screen to the top
            duration: 1500, // Speed of ambulance passing
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(AmbulanceXAnim, {
            toValue: leftLaneX, // Ensure ambulance is in the left lane
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

    } else if (option === "Stay in your lane since crossing solid white lines is discouraged") {
      // WRONG Answer: Ambulance overtakes from the right
      setIsAmbulanceVisible(true); // Show ambulance

      // Ensure ambulance starts from behind and in the right lane
      AmbulanceXAnim.setValue(rightLaneX);
      AmbulanceYAnim.setValue(height * 1.5); // Start off-screen bottom

      Animated.sequence([
        // 1. Ambulance appears from behind and overtakes in the right lane
        Animated.parallel([
          Animated.timing(AmbulanceYAnim, {
            toValue: -carHeight, // Move off-screen to the top
            duration: 2500, // Duration for ambulance to pass
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          // Player car continues to scroll slowly during ambulance's appearance and pass
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 5, // Scroll for 5 tiles
            duration: 2500, // Duration adjusted to match ambulance's pass
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ]).start(() => handleFeedback(option));

    } else if (option === "Speed up to clear the way without changing lanes") {
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

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null); // Reset feedback state from S2P1
    setCarFrame(0);

    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setIsAmbulanceVisible(false); // Hide ambulance for next question
    AmbulanceYAnim.setValue(height * 1.5); // Reset ambulance position off-screen bottom
    AmbulanceXAnim.setValue(width / 2 - carWidth / 2 - tileSize); // Reset ambulance X to left lane for next potential pass

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      router.push('/driver-game/road-markings/phase-1/S8P1');
      setShowQuestion(false);
    }
  };

  // Determine the feedback message based on whether the answer was correct or wrong (from S2P1)
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! You must give way to emergency vehicles, even if it requires crossing solid white lines."
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

      {/* Responsive Ambulance */}
      {isAmbulanceVisible && (
        <Animated.Image
          source={ambulanceSprites["NORTH"][carFrame]} // Ambulance always faces NORTH
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            top: AmbulanceYAnim, // Position controlled by animation
            left: AmbulanceXAnim, // Position in the lane (left or right of player)
            zIndex: 4, // Always behind player car
          }}
        />
      )}

      {/* Responsive Question Overlay */}
      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image
            source={require("../../../../assets/dialog/LTO.png")}
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
          <Image source={require("../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
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
  // Responsive styles for in-game elements
  questionOverlay: {
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
  ltoImage: {
    width: ltoWidth,
    height: ltoHeight,
    resizeMode: "contain",
    marginLeft: -width * 0.03,
    marginBottom: -height * 0.09,
  },
  questionBox: {
    flex: 1,
    bottom: height * 0.1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: height * 0.05,
  },
  questionTextContainer: {
    maxWidth: width * 0.6,
  },
  questionText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.25,
    right: sideMargin,
    width: width * 0.35,
    zIndex: 11,
  },
  answerButton: {
    backgroundColor: "#333",
    padding: height * 0.02,
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
    fontSize: Math.min(width * 0.06, 28),
    fontWeight: "bold",
    textAlign: 'center', // Added for multi-line explanations
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