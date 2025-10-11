import { useSession } from '../../../../contexts/SessionManager';
import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { useNavigation } from '@react-navigation/native';
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

// --- ../../../assets and tiles (same as yours) ---
const roadTiles = {
  road1: require("../../../../../assets/road/road1.png"),
  road3: require("../../../../../assets/road/road3.png"),
  road4: require("../../../../../assets/road/road4.png"),
  road17: require("../../../../../assets/road/road17.png"),
  road62: require("../../../../../assets/road/road62.png"),
  road70: require("../../../../../assets/road/road70.png"),
};

const mapLayout = [
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road1", "road70"],
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

const jeepneySprites = {
  NORTH: [
    require("../../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
  ],
};

// Updated question structure following S2P1 format
const questions = [
  {
    question: "You're on a two-lane highway with a solid white center line separating lanes going in the same direction. You need to change lanes to exit but the line is still solid on your exit.",
    options: ["Continue straight and find another exit", "Slow down and wait for the line to become broken", "Cross the solid white line to change lanes for your exit"],
    correct: "Cross the solid white line to change lanes for your exit",
    wrongExplanation: {
      "Slow down and wait for the line to become broken": "Accident prone! Unneccessary slowing down on a highway might be dangerous and unexpected for the vehicle behind you.",
      "Continue straight and find another exit": "Impractical! You may not find another exit for miles ahead."
    }
  },
];

export default function DrivingGame() {
  const navigation = useNavigation();

  const {
    updateScenarioProgress,
    moveToNextScenario,
    completeSession,
    currentScenario: sessionCurrentScenario,
    sessionData
  } = useSession();

  const currentScenario = 3; 

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const scenarioId = currentScenario; // For Phase 1: S1P1 = scenario 1, S2P1 = scenario 2, etc.
      await updateScenarioProgress(scenarioId, selectedOption, isCorrect);
    } catch (error) {
      console.error('Error updating scenario progress:', error);
    }
  };

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isCarVisible, setIsCarVisible] = useState(true);
  const [isJeepneyVisible, setIsJeepneyVisible] = useState(false); // New state for jeepney visibility

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
  const carXAnim = useRef(new Animated.Value(0)).current;
  const jeepneyYAnim = useRef(new Animated.Value(height * 1.5)).current; // Start well below the screen
  const jeepneyXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2 + tileSize)).current; // Default lane to the right of player
  const jeepneyEntryAnim = useRef(new Animated.Value(0)).current;

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
    carXAnim.setValue(width / 2 - carWidth / 2); // Reset car position
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

    const currentQuestion = questions[questionIndex];
    const isCorrect = option === currentQuestion.correct;
    updateProgress(option, isCorrect);

    const actualCorrectAnswer = questions[questionIndex].correct;
    const currentRow = getCarCurrentRow();
    const exitLaneX = width / 2 - carWidth / 2 + tileSize; // One lane to the right
    const originalLaneX = width / 2 - carWidth / 2; // Original lane center

    if (option === actualCorrectAnswer) {
      setIsCarVisible(true);

  // 1. Instantly change direction to NORTHEAST
  setCarDirection("NORTHEAST");

  Animated.sequence([
    // 2. Move NORTHEAST one row (now that the direction is set)
    Animated.parallel([
      Animated.timing(carXAnim, {
        toValue: width / 2 - carWidth / 2 + tileSize, // Move to the right lane
        duration: 500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(scrollY, {
        toValue: currentScroll.current + tileSize, // Move one tile forward
        duration: 500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]),
    Animated.delay(100), // Small delay after moving NORTHEAST
  ]).start(() => {
    // 3. Face NORTH and move to row 16
    setCarDirection("NORTH"); // Instantly change direction back to NORTH
    animateCarToTargetRow(16, 2000, () => {
      handleFeedback(option); // Show feedback after animation
    });
  });

    } else if (option === "Slow down and wait for the line to become broken") {
      // WRONG Answer: Slow down and wait for the line to become broken
      setIsJeepneyVisible(true); // Show jeepney

      Animated.sequence([
        // 1. Jeepney appears from behind and overtakes
        Animated.parallel([
          Animated.timing(jeepneyYAnim, {
            toValue: height * 0.5, // Stop in front of player car, higher on screen
            duration: 1500, // Faster appearance
            easing: Easing.easeOut,
            useNativeDriver: false,
          }),
          // Player car continues to scroll slowly during jeepney's appearance
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 3, // Scroll for 3 tiles
            duration: 2000, // Duration adjusted to match jeepney's "stop"
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(500), // Hold jeepney in place (and player car continues slow scroll)
        // After delay, jeepney overtakes and disappears
        Animated.parallel([
          Animated.timing(jeepneyYAnim, {
            toValue: -carHeight, // Move off-screen to the top
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          // Player car continues to scroll slowly during jeepney's disappearance
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 3, // Scroll for another 3 tiles
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ]).start(() => handleFeedback(option));
      // No car lane change for this wrong answer, as they waited.

    } else if (option === "Continue straight and find another exit") {
      // Wrong Answer: Continue straight
      // Player car simply scrolls further down the road
      Animated.timing(scrollY, { // Continue scrolling for 5 tiles
        toValue: currentScroll.current + tileSize * 10, // Continue scrolling for 10 tiles, signifying missing the exit
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        handleFeedback(option);
      });
      // Car stays NORTH
    }
  };

  const handleNext = async() => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null); // Reset feedback state from S2P1
    setCarFrame(0);

    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setIsJeepneyVisible(false); // Hide jeepney for next question
    jeepneyYAnim.setValue(height * 1.5); // Reset jeepney position off-screen bottom

    if (questionIndex < questions.length - 1) {
    setQuestionIndex(questionIndex + 1);
    startScrollAnimation();
  } else {
    // Get current scenario number from file name
    const currentFileScenario = 3; // For S1P1, this is 1; for S2P1 it would be 2, etc.
    
    if (currentFileScenario >= 10) {
      // Last scenario of phase 1 - complete session and go to results
      try {
        const sessionResults = await completeSession();
        if (sessionResults) {
          router.push({
            pathname: '/result',
            params: {
              ...sessionResults,
              userAttempts: JSON.stringify(sessionResults.attempts),
              scenarioProgress: JSON.stringify(sessionResults.scenarioProgress)
            }
          });
        }
      } catch (error) {
        console.error('Error completing session:', error);
        Alert.alert('Error', 'Failed to save session results');
      }
    } else {
      // Move to next scenario in phase 1
      moveToNextScenario();
      
      const nextScenarioNumber = currentFileScenario + 1;
      const nextScreen = `S${nextScenarioNumber}P1`;
      router.push(`/scenarios/road-markings/phase1/${nextScreen}`);
    }

    setShowQuestion(false);
    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.stop();
    }
    if (jeepneyAnimationRef.current) {
      jeepneyAnimationRef.current.stop();
    }
    npcCarAnimationsRef.current.forEach(anim => anim.stop());
  }
};

  // Determine the feedback message based on whether the answer was correct or wrong (from S2P1)
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! You can cross solid white lines but it is heavily discouraged. Do so with care."
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

      {/* Responsive Jeepney */}
      {isJeepneyVisible && (
        <Animated.Image
          source={jeepneySprites["NORTH"][carFrame]} // Jeepney always faces NORTH
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            top: jeepneyYAnim, // Position controlled by animation
            left: jeepneyXAnim, // Position in the lane to the right of the player        
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
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    marginTop: 20,
  },

  // ADDED: Intro styles (responsive)
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
    fontSize: Math.min(width * 0.045, 24),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.15,
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