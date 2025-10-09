// frontend/src/app/scenarios/road-markings/phase2/S8P2.jsx
import { useSession, SessionProvider } from '../../../../contexts/SessionManager';
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
  ["road19", "road59", "road57", "road16", "road51"],
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

// Updated question structure for pedestrian crossing
const questions = [
  {
    question: "You approach a non-signalized pedestrian crossing (zebra crossing) where pedestrians are waiting to cross during rush hour traffic.",
    options: [
      "Continue driving since there's no traffic light controlling the crossing", 
      "Stop and give way to pedestrians wanting to cross", 
      "Honk to alert pedestrians and proceed carefully"
    ],
    correct: "Stop and give way to pedestrians wanting to cross",
    correctExplanation: "Correct! At non-signalized pedestrian crossings, drivers must yield to pedestrians who are crossing or about to cross.",
    wrongExplanations: {
      "Continue driving since there's no traffic light controlling the crossing": "Accident Prone! Non-signalized pedestrian crossings still give pedestrians right of way when they're crossing.",
      "Honk to alert pedestrians and proceed carefully": "Wrong! Honking doesn't give you right of way over pedestrians at designated crossings."
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
      console.log('🔍 SCENARIO DEBUG:', {
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
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [carDirection, setCarDirection] = useState("NORTH");
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  const [showHornIcon, setShowHornIcon] = useState(false);

  // FIXED: Show pedestrians from start
  const [showPedestrians, setShowPedestrians] = useState(true);

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
    setShowHornIcon(false);
    setShowPedestrians(true); // FIXED: Ensure pedestrians visible

    // FIXED: Stop at row 5.5 to show pedestrian crossing (int tiles at rows 7-8)
    const stopRow = 5.5;
    const stopOffset = startOffset + stopRow * tileSize;

    Animated.timing(scrollY, {
      toValue: stopOffset,
      duration: 3000,
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
    console.log('🎯 handleAnswer START:', answer);
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    await updateProgress(answer, isCorrect);
    console.log('✅ Progress updated');

    const currentRow = Math.abs(currentScroll.current - startOffset) / tileSize;

    try {
      if (answer === "Continue driving since there's no traffic light controlling the crossing") {
        console.log('🚗 Choice 1: Continue driving');
        const targetRow = 12;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;
        
        await new Promise(resolve => {
          Animated.timing(scrollY, {
            toValue: nextTarget,
            duration: 3500,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start(resolve);
        });

        handleFeedback(answer);
        
      } else if (answer === "Stop and give way to pedestrians wanting to cross") {
        console.log('🛑 Choice 2: Stop for pedestrians');
        const stopBeforeRow = 6.3;
        const rowsToMove = stopBeforeRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;
        
        await new Promise(resolve => {
          Animated.timing(scrollY, {
            toValue: nextTarget,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start(resolve);
        });

        setCarPaused(true);
        
        // FIXED: Pedestrians "cross" during wait
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setCarPaused(false);
        setShowPedestrians(false); // Pedestrians have crossed
        
        const finalTargetRow = 12;
        const finalRowsToMove = finalTargetRow - stopBeforeRow;
        const finalTarget = nextTarget + finalRowsToMove * tileSize;
        
        await new Promise(resolve => {
          Animated.timing(scrollY, {
            toValue: finalTarget,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start(resolve);
        });

        handleFeedback(answer);
        
      } else if (answer === "Honk to alert pedestrians and proceed carefully") {
        console.log('📯 Choice 3: Honk and proceed');
        setShowHornIcon(true);
        
        const targetRow = 12;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;
        
        await new Promise(resolve => {
          Animated.timing(scrollY, {
            toValue: nextTarget,
            duration: 6000,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start(resolve);
        });

        setShowHornIcon(false);
        handleFeedback(answer);
      }
    } catch (error) {
      console.error('❌ Error in animation:', error);
      handleFeedback(answer);
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setCarFrame(0);
    setCarPaused(false);
    setShowHornIcon(false);
    setShowPedestrians(true); // Reset pedestrians

    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario >= 10) {
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
      const nextScreen = `S${currentScenario + 1}P2`;
      router.push(`/scenarios/road-markings/phase2/${nextScreen}`);
    }
  };

  // Determine the feedback message
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? currentQuestionData.correctExplanation
    : currentQuestionData.wrongExplanations[selectedAnswer] || "Wrong answer!";

  // FIXED: Pedestrian positions on the zebra crossing (int tiles)
  const pedestrianSize = tileSize * 0.3;
  const pedestrian1X = 1.5 * tileSize; // On int3/int2
  const pedestrian2X = 2.5 * tileSize; // On int4/int1
  const pedestrian3X = 0.8 * tileSize; // Left side waiting
  const pedestrianY = 7.5 * tileSize; // On the crossing rows

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

        {/* FIXED: Pedestrians on crossing - visible when showPedestrians is true */}
        {showPedestrians && (
          <>
            {/* Pedestrian 1 - on crossing */}
            <View style={[styles.pedestrian, {
              left: pedestrian1X,
              top: pedestrianY,
              width: pedestrianSize,
              height: pedestrianSize,
            }]}>
              <Text style={styles.pedestrianEmoji}>🚶</Text>
            </View>

            {/* Pedestrian 2 - on crossing */}
            <View style={[styles.pedestrian, {
              left: pedestrian2X,
              top: pedestrianY,
              width: pedestrianSize,
              height: pedestrianSize,
            }]}>
              <Text style={styles.pedestrianEmoji}>🚶‍♀️</Text>
            </View>

            {/* Pedestrian 3 - waiting on left side */}
            <View style={[styles.pedestrian, {
              left: pedestrian3X,
              top: pedestrianY - tileSize * 0.2,
              width: pedestrianSize,
              height: pedestrianSize,
            }]}>
              <Text style={styles.pedestrianEmoji}>🧍</Text>
            </View>
          </>
        )}
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

      {/* Horn Icon */}
      {showHornIcon && (
        <View style={styles.hornIconContainer}>
          <Text style={styles.hornIcon}>📯</Text>
          <Text style={styles.hornText}>HONK!</Text>
        </View>
      )}

      {/* FIXED: Question Overlay - better positioning */}
      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image
            source={require("../../../../../assets/dialog/Dialog.png")}
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

      {/* FIXED: Responsive Answers - proper positioning */}
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

      {/* FIXED: Responsive Feedback - white text only */}
      {(animationType === "correct" || animationType === "wrong") && (
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/Dialog w answer.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>
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
  // FIXED: Better LTO positioning
  ltoImage: {
    width: ltoWidth,
    height: ltoHeight,
    resizeMode: "contain",
    marginLeft: -width * 0.02,
    marginBottom: -height * 0.10,
  },
  questionBox: {
    flex: 1,
    bottom: height * 0.1,
    alignItems: "center",
    justifyContent: "center",
  },
  questionTextContainer: {
    padding: -height * 0.04,
    maxWidth: width * 0.55, // FIXED: Reduced to prevent overflow
  },
  // FIXED: Increased font size to 22
  questionText: {
    flexWrap: "wrap",
    color: "white",
    fontSize: Math.min(width * 0.045, 22),
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: Math.min(width * 0.055, 26),
  },
  // FIXED: Moved answers to 0.175 (between 0.18 would overlap slightly)
  answersContainer: {
    position: "absolute",
    top: height * 0.175, // CHANGED from 0.25
    right: sideMargin,
    width: width * 0.35,
    height: height * 0.21,
    zIndex: 11,
  },
  answerButton: {
    backgroundColor: "#333",
    padding: height * 0.015,
    borderRadius: 8,
    marginBottom: height * 0.012,
    borderWidth: 1,
    borderColor: "#555",
  },
  // FIXED: Increased font size to 18
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
    paddingHorizontal: width * 0.05,
  },
  // FIXED: White text only, no color changes
  feedbackText: {
    color: "white", // FIXED: Always white
    fontSize: Math.min(width * 0.05, 24),
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: Math.min(width * 0.06, 28),
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
  hornIconContainer: {
    position: "absolute",
    top: height * 0.15,
    left: width / 2 - 40,
    alignItems: "center",
    zIndex: 15,
  },
  hornIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  hornText: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // FIXED: Pedestrian styles
  pedestrian: {
    position: "absolute",
    zIndex: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  pedestrianEmoji: {
    fontSize: width * 0.08, // Responsive pedestrian size
    textAlign: "center",
  },
});