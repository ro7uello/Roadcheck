import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { router } from 'expo-router';
import { useSession, SessionProvider } from '../../../../contexts/SessionManager';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

const roadTiles = {
  road3: require("../../../../../assets/road/road3.png"),
  road4: require("../../../../../assets/road/road4.png"),
  road16: require("../../../../../assets/road/road16.png"),
    road6: require("../../../../../assets/road/road6.png"),
      road8: require("../../../../../assets/road/road8.png"),
  road17: require("../../../../../assets/road/road17.png"),
  road18: require("../../../../../assets/road/road18.png"),
  road19: require("../../../../../assets/road/road19.png"),
  road20: require("../../../../../assets/road/road20.png"),
  road23: require("../../../../../assets/road/road23.png"),
  road24: require("../../../../../assets/road/road24.png"),
  road48: require("../../../../../assets/road/road48.png"),
  road49: require("../../../../../assets/road/road49.png"),
  road50: require("../../../../../assets/road/road50.png"),
  road51: require("../../../../../assets/road/road51.png"),
  road52: require("../../../../../assets/road/road52.png"),
  road57: require("../../../../../assets/road/road57.png"),
  road58: require("../../../../../assets/road/road58.png"),
  road59: require("../../../../../assets/road/road59.png"),
  road60: require("../../../../../assets/road/road60.png"),
};

// Tree sprites
const treeSprites = {
  tree1: require("../../../../../assets/tree/Tree3_idle_s.png"),
};

const mapLayout = [
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],  
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
    ["road18", "road4", "road3", "road17", "road20"],
    ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
];

// Tree positions
const treePositions = [
  { row: 0, col: 0, type: 'tree1' },
  { row: 1, col: 0, type: 'tree1' },
  { row: 2, col: 0, type: 'tree1' },
  { row: 3, col: 0, type: 'tree1' },
  { row: 4, col: 0, type: 'tree1' },
  { row: 5, col: 0, type: 'tree1' },
  { row: 10, col: 0, type: 'tree1' },
  { row: 11, col: 0, type: 'tree1' },
  { row: 12, col: 0, type: 'tree1' },
  { row: 13, col: 0, type: 'tree1' },
  { row: 14, col: 0, type: 'tree1' },
  { row: 15, col: 0, type: 'tree1' },
  { row: 16, col: 0, type: 'tree1' },
  { row: 17, col: 0, type: 'tree1' },
  { row: 0, col: 3.5, type: 'tree1' },
  { row: 1, col: 3.5, type: 'tree1' },
  { row: 2, col: 3.5, type: 'tree1' },
  { row: 3, col: 3.5, type: 'tree1' },
  { row: 4, col: 3.5, type: 'tree1' },
  { row: 5, col: 3.5, type: 'tree1' },
  { row: 10, col: 3.5, type: 'tree1' },
  { row: 11, col: 3.5, type: 'tree1' },
  { row: 12, col: 3.5, type: 'tree1' },
  { row: 13, col: 3.5, type: 'tree1' },
  { row: 14, col: 3.5, type: 'tree1' },
  { row: 15, col: 3.5, type: 'tree1' },
  { row: 16, col: 3.5, type: 'tree1' },
  { row: 17, col: 3.5, type: 'tree1' },
  { row: 0.5, col: 4, type: 'tree1' },
  { row: 2.5, col: 4, type: 'tree1' },
  { row: 4.5, col: 4, type: 'tree1' },
  { row: 11.5, col: 4, type: 'tree1' },
  { row: 13.5, col: 4, type: 'tree1' },
  { row: 15.5, col: 4, type: 'tree1' },
  { row: 0.5, col: 3.5, type: 'tree1' },
  { row: 2.5, col: 3.5, type: 'tree1' },
  { row: 4.5, col: 3.5, type: 'tree1' },
  { row: 11.5, col: 3.5, type: 'tree1' },
  { row: 13.5, col: 4, type: 'tree1' },
  { row: 15.5, col: 3.5, type: 'tree1' },
  { row: 1, col: 4, type: 'tree1' },
  { row: 3, col: 4, type: 'tree1' },
  { row: 12, col: 4, type: 'tree1' },
  { row: 14, col: 4, type: 'tree1' },
  { row: 16, col: 4, type: 'tree1' },
  { row: 1, col: 3.5, type: 'tree1' },
  { row: 3, col: 3.5, type: 'tree1' },
  { row: 12, col: 3.5, type: 'tree1' },
  { row: 14, col: 3.5, type: 'tree1' },
  { row: 16, col: 3.5, type: 'tree1' },
];

const carSprites = {
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

const questions = [
  {
    question: "You're driving near Clark International Airport when you encounter a LOW-FLYING AIRPLANE ZONE sign. You can hear aircraft engines overhead, and the road passes very close to the airport runway approach path.",
    options: ["Ignore the sign since it doesn't affect driving", "Be aware of potential noise and distractions from low-flying aircraft", "Stop the vehicle when you hear aircraft approaching"],
    correct: "Be aware of potential noise and distractions from low-flying aircraft", //correct explanation:Correct! This sign warns of potential distractions from aircraft noise and activity that require mental preparation.
    wrongExplanation: {
      "Ignore the sign since it doesn't affect driving": " Wrong! Low-flying aircraft can create significant noise and visual distractions that affect driving concentration.",
      "Stop the vehicle when you hear aircraft approaching": "Accident Prone! Stopping for every aircraft would create traffic hazards; awareness and continued cautious driving are appropriate."
    }
  },
];

// Warning sign sprites
const warningSignSprites = {
  sharpRightTurn: require("../../../../../assets/signs/low-flying_aircraft.png"),
};

function DrivingGameContent() {
  const {
    updateScenarioProgress,
    moveToNextScenario,
    completeSession,
    currentScenario,
    sessionData
  } = useSession();

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const phaseId = sessionData?.phase_id;
      let scenarioId;

      if (phaseId === 4) {
        scenarioId = 30 + currentScenario;
      } else if (phaseId === 5) {
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

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  const warningSignRowIndex = 12;
  const warningSignColIndex = 3;
  const warningSignXOffset = 0;

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      currentScroll.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);

  const [carFrame, setCarFrame] = useState(0);
  const [carDirection, setCarDirection] = useState("NORTH");
  const [carPaused, setCarPaused] = useState(false);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopRow = 6;
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

  useEffect(() => {
    let iv;
    if (!carPaused) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites[carDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused, carDirection]);

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);

  // No turn animation needed - car goes straight

  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    if (answerGiven === currentQuestion.correct) {
      setIsCorrectAnswer(true);
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
      setIsCorrectAnswer(false);
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

  // ✅ --- START OF MODIFIED HANDLEANSWER ---
  const handleAnswer = (answer) => {
    console.log('🎯 Answer selected:', answer);
    
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    // 🛑 Stop any animation that might be running
    scrollY.stopAnimation(); 

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    
    console.log('✅ Is correct?', isCorrect);
    
    // ✅ Update backend progress (non-blocking)
    updateProgress(answer, isCorrect).catch(error => {
      console.error('❌ Failed to update progress:', error);
      console.error('Error message:', error.message);
      // Continue with animation even if backend update fails
    });

    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);
    const targetRow = 16;
    const rowsToMove = targetRow - currentRow;
    const nextTarget = currentScroll.current + rowsToMove * tileSize;

    console.log('🚗 Animation details:', {
      currentRow,
      targetRow,
      rowsToMove,
      nextTarget
    });

    let duration = 5000; // Default speed
    let carMovement = "NORTH";
    
    // This flag controls whether the default animation runs at the end
    let startAnimationImmediately = true; 

    // --- Animations for LOW-FLYING AIRCRAFT scenario ---

    if (answer === "Ignore the sign since it doesn't affect driving") {
      duration = 5000; // Normal speed, unaware
      carMovement = "NORTH";
      console.log('⏱️ Ignoring sign - normal speed');

    } else if (answer === "Be aware of potential noise and distractions from low-flying aircraft") {
      duration = 8000; // Correct - slow, aware, and cautious speed
      carMovement = "NORTH";
      console.log('⏱️ Correct - slow and cautious');

    } else if (answer === "Stop the vehicle when you hear aircraft approaching") {
      // --- THIS IS THE STOPPING BLOCK ---
      startAnimationImmediately = false; // Prevent default animation
      carMovement = "NORTH";
      duration = 5000; // The movement *after* the stop will take 5s
      
      console.log('⏱️ Stopping unnecessarily... will wait 10 seconds.');
      
      setCarDirection(carMovement);
      setCarPaused(true); // 1. Stop the car visually RIGHT NOW

      // 2. Wait for 10 seconds
      setTimeout(() => {
        console.log('⏱️ 10s wait over. Proceeding slowly.');
        setCarPaused(false); // 3. Unpause the car to start moving

        // 4. Proceed with the animation
        Animated.timing(scrollY, {
          toValue: nextTarget,
          duration: duration, // Use the 5000ms duration
          useNativeDriver: true,
        }).start(() => {
          setCarPaused(true); // Stop at the end
          handleFeedback(answer);
        });
      }, 5000); // 10,000 milliseconds = 10 seconds
      
      // --- END OF STOPPING BLOCK ---
    }

    setCarDirection(carMovement); // Set visual direction

    // Only run the default animation if our special case wasn't triggered
    if (startAnimationImmediately) {
      setCarPaused(false); // Unpause for immediate movement

      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: duration, 
        useNativeDriver: true,
      }).start(() => {
        setCarPaused(true);
        handleFeedback(answer);
      });
    }
  };
  // ✅ --- END OF MODIFIED HANDLEANSWER ---

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    setCarDirection("NORTH");
    
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
      let phaseNumber;
      const categoryId = sessionData?.category_id;
      const phaseId = sessionData?.phase_id;

      if (categoryId === 1) {
        phaseNumber = phaseId;
      } else if (categoryId === 2) {
        phaseNumber = phaseId - 3;
      } else if (categoryId === 3) {
        phaseNumber = phaseId - 6;
      }

      router.push('scenarios/traffic-signs/phase3/S1P3');
    }
  };

  const warningSignLeft = warningSignColIndex * tileSize + warningSignXOffset;
  const warningSignTop = warningSignRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  // ✅ --- MODIFIED FEEDBACK MESSAGE ---
  const feedbackMessage = isCorrectAnswer
    ? "Correct! This sign warns of potential distractions from aircraft noise and activity that require mental preparation."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";
  // ✅ --- END OF MODIFIED FEEDBACK MESSAGE ---

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

        {/* Trees */}
        {treePositions.map((tree, index) => (
          <Image
            key={`tree-${index}`}
            source={treeSprites[tree.type]}
            style={{
              position: "absolute",
              width: tileSize * 0.8,
              height: tileSize * 1.2,
              left: tree.col * tileSize,
              top: tree.row * tileSize,
              zIndex: 2,
            }}
            resizeMode="contain"
          />
        ))}

        {/* Warning Sign */}
        <Image
          source={warningSignSprites.sharpRightTurn}
          style={{
            width: tileSize * 1.2,
            height: tileSize * 1.2,
            position: "absolute",
            top: warningSignTop,
            left: warningSignLeft,
            zIndex: 10,
          }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Car */}
      <Animated.Image
        source={carSprites[carDirection][carFrame]}
        style={{
          width: 280,
          height: 350,
          position: "absolute",
          bottom: 80,
          left: width / 2 - (280 / 2),
          zIndex: 8,
        }}
      />

      {/* Question overlay */}
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
      {animationType === "correct" && (
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
        <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </View>
      )}

      {animationType === "wrong" && (
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </View>
      )}

      {/* Next button */}
      {showNext && (
        <View style={styles.nextButtonContainer}>
          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function DrivingGame() {
  return (
    <SessionProvider>
      <DrivingGameContent />
    </SessionProvider>
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
    fontSize: Math.min(width * 0.04, 16),
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