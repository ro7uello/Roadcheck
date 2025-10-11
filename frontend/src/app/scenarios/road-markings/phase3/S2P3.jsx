import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { router } from 'expo-router';
import { useSession } from '../../../../contexts/SessionManager';

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
  NORTHWEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_001.png"),
  ],
  WEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_001.png"),
  ],
};

const busSprites = {
  NORTH: [
    require("../../../../../assets/car/BUS TOPDOWN/Black/MOVE/NORTH/SEPARATED/Black_BUS_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/BUS TOPDOWN/Black/MOVE/NORTH/SEPARATED/Black_BUS_CLEAN_NORTH_001.png"),
  ],
};

// Traffic jam cars
const trafficCarSprites = {
  BROWN_NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_CIVIC_CLEAN_NORTH_000.png"),
  ],
  RED_NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_000.png"),
  ],
  BLACK_NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Black/MOVE/NORTH/SEPARATED/Black_CIVIC_CLEAN_NORTH_000.png"),
  ],
};

// Updated question structure for S2P3
const questions = [
  {
    question: "You're driving a private car on EDSA and see solid yellow lines marking the bus lane. Traffic in your lane is extremely slow while the bus lane moves freely.",
    options: ["Use the bus lane temporarily to bypass the traffic jam", "Stay in the designated lane for private vehicles", "Use the bus lane only when no buses are visible"],
    correct: "Stay in the designated lane for private vehicles",
    correctExplanation: "Correct! Private vehicles must stay in designated lanes even during heavy traffic.",
    wrongExplanation: {
      "Use the bus lane temporarily to bypass the traffic jam": "Wrong! Bus lanes are exclusively for public transportation vehicles, regardless of traffic conditions.",
      "Use the bus lane only when no buses are visible": "Wrong! Bus lanes are restricted to authorized vehicles at all times, not just when buses are present."
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
      const phaseId = sessionData?.phase_id || 3;
      const categoryId = sessionData?.category?.id || 2; // Road Markings category
      
      let baseId;
      if (categoryId === 1) {
        // Traffic Signs
        baseId = (phaseId - 1) * 10;
      } else {
        // Road Markings (categoryId === 2)
        baseId = 30 + ((phaseId - 1) * 10);
      }
      
      const scenarioId = baseId + currentScenario;

      console.log('🔍 SCENARIO DEBUG:', {
        categoryId,
        phaseId,
        currentScenario,
        baseId,
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
  const [isBusVisible, setIsBusVisible] = useState(false);

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

  // Traffic jam cars state - increased number and tighter spacing
  const [trafficCars, setTrafficCars] = useState([
    { id: 1, type: 'BROWN_NORTH', yOffset: carHeight * 1.2 },
    { id: 2, type: 'RED_NORTH', yOffset: carHeight * 2.2 },
    { id: 3, type: 'BLACK_NORTH', yOffset: carHeight * 3.2 },
    { id: 4, type: 'BROWN_NORTH', yOffset: carHeight * 4.2 },
    { id: 5, type: 'RED_NORTH', yOffset: carHeight * 5.2 },
    { id: 6, type: 'BLACK_NORTH', yOffset: carHeight * 6.2 },
    { id: 7, type: 'BROWN_NORTH', yOffset: carHeight * 7.2 },
    { id: 8, type: 'RED_NORTH', yOffset: carHeight * 8.2 },
  ]);

  // Responsive car positioning
  const regularLaneX = width / 2 - carWidth / 2 + tileSize; // Regular lane (right side)
  const busLaneX = width / 2 - carWidth / 2; // Bus lane (middle/left)
  
  const carXAnim = useRef(new Animated.Value(regularLaneX)).current; // Player car starts in REGULAR lane
  const BusYAnim = useRef(new Animated.Value(height * 1.5)).current; // Start well below the screen
  const BusXAnim = useRef(new Animated.Value(busLaneX)).current; // Bus starts in bus lane
  const BusEntryAnim = useRef(new Animated.Value(0)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Car animation frame cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    carXAnim.setValue(regularLaneX); // Reset car position to REGULAR lane
    setCarDirection("NORTH");
    setIsCarVisible(true);

    const stopRow = 2.5;
    const stopOffset = startOffset + stopRow * tileSize;

    // Very slow animation to emphasize traffic jam (12 seconds)
    Animated.timing(scrollY, {
      toValue: stopOffset,
      duration: 5000, // Much slower to show traffic jam clearly
      easing: Easing.inOut(Easing.ease), // Smoother easing to show struggle
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

    if (answer === "Use the bus lane temporarily to bypass the traffic jam") {
        // WRONG: Car moves to bus lane diagonally (NORTHWEST) then continues NORTH
        setIsCarVisible(true);
        setIsBusVisible(false);

        // 1. Car faces Northwest and moves to the bus lane (initial lane change)
        await new Promise(resolve => {
          setCarDirection("NORTHWEST");
          Animated.parallel([
            Animated.timing(carXAnim, {
              toValue: busLaneX, // Move to bus lane
              duration: 600, // Slower lane change
              easing: Easing.easeOut,
              useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
              toValue: scrollY._value + (tileSize * 0.5), // Move forward slightly
              duration: 600,
              easing: Easing.easeOut,
              useNativeDriver: true,
            })
          ]).start(resolve);
        });

        // 2. Car faces North and moves faster in empty bus lane
        await new Promise(resolve => {
          setCarDirection("NORTH"); // Face North
          Animated.timing(scrollY, {
            toValue: scrollY._value + (tileSize * 5), // Continue forward significantly
            duration: 1500, // Faster in bus lane (empty)
            easing: Easing.easeOut,
            useNativeDriver: true,
          }).start(resolve);
        });

        handleFeedback(answer);

    } else if (answer === "Stay in the designated lane for private vehicles") {
      // CORRECT: Car stays in regular lane and continues
      setIsCarVisible(true);
      setIsBusVisible(true);

      // Bus passes in the bus lane
      BusXAnim.setValue(busLaneX);
      BusYAnim.setValue(height * 1.5);

      Animated.parallel([
        // Bus passes smoothly in bus lane
        Animated.timing(BusYAnim, {
          toValue: -carHeight,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        // Player car continues in regular lane
        Animated.timing(scrollY, {
          toValue: currentScroll.current + tileSize * .3,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => {
        handleFeedback(answer);
      });

    } else if (answer === "Use the bus lane only when no buses are visible") {
        // WRONG: Car waits, bus passes, then car moves to bus lane
        setIsCarVisible(true);
        setIsBusVisible(true);

        // Bus starts in bus lane
        BusXAnim.setValue(busLaneX);
        BusYAnim.setValue(height * 1.5);

        // 1. Car stays still while bus approaches and passes
        await new Promise(resolve => {
          Animated.parallel([
            Animated.timing(BusYAnim, {
              toValue: -carHeight, // Bus passes
              duration: 2500,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
              toValue: scrollY._value + (tileSize * .1), // Car moves very slowly
              duration: 4000,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ]).start(resolve);
        });

        // 2. After bus passes, car faces Northwest and moves to bus lane (initial lane change)
        await new Promise(resolve => {
          setCarDirection("NORTHWEST");
          Animated.parallel([
            Animated.timing(carXAnim, {
              toValue: busLaneX, // Move to bus lane
              duration: 600,
              easing: Easing.easeOut,
              useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
              toValue: scrollY._value + (tileSize * 0.5), // Move forward slightly
              duration: 600,
              easing: Easing.easeOut,
              useNativeDriver: true,
            })
          ]).start(resolve);
        });

        // 3. Car faces North and continues in bus lane
        await new Promise(resolve => {
          setCarDirection("NORTH"); // Face North
          Animated.timing(scrollY, {
            toValue: scrollY._value + (tileSize * 3), // Continue forward significantly
            duration: 600,
            easing: Easing.easeOut,
            useNativeDriver: true,
          }).start(resolve);
        });

        handleFeedback(answer);
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setCarFrame(0);

    carXAnim.setValue(regularLaneX); // Reset to regular lane
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setIsBusVisible(false);
    BusYAnim.setValue(height * 1.5);
    BusXAnim.setValue(busLaneX);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      // Get current scenario number from this file
      const currentFileScenario = getCurrentScenarioNumber();

      if (currentFileScenario >= 10) {
        // Last scenario - complete session
        try {
          const sessionResults = await completeSession();
          if (!sessionResults) {
            Alert.alert('Error', 'Failed to complete session. Please try again.');
            return;
          }

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
       // moveToNextScenario();

        // Navigate to next scenario
       // const nextScenarioNumber = currentFileScenario + 1;
       // const phaseId = sessionData?.phase_id || 3;
        //const nextScreen = `S${nextScenarioNumber}P${phaseId}`;

        //router.replace(`/scenarios/road-markings/phase${phaseId}/${nextScreen}`);
         router.replace(`/scenarios/road-markings/phase3/S3P3`);
      }
    }
  };

  // Helper function to return the scenario number based on the current file
  const getCurrentScenarioNumber = () => {
    // For S2P3 (Bus Lane scenario), return 2
    return 2; // Change this to match your scenario number (1-10)
  };

  // Determine the feedback message based on whether the answer was correct or wrong
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? currentQuestionData.correctExplanation
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

      {/* Traffic Jam Cars in Regular Lane - positioned relative to map scroll */}
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: mapHeight,
          left: 0,
          transform: [{ translateY: scrollY }],
          zIndex: 3,
        }}
      >
        {trafficCars.map((car, index) => {
          // Position cars ahead of the player in the map
          // Start from row 2 onwards with spacing
          const carRow = 2 + (index * 1.5);
          const carYPosition = carRow * tileSize;
          
          return (
            <Image
              key={car.id}
              source={trafficCarSprites[car.type][0]}
              style={{
                width: carWidth,
                height: carHeight,
                position: "absolute",
                left: regularLaneX,
                top: carYPosition,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 3,
              }}
            />
          );
        })}
      </Animated.View>

      {/* Responsive Car */}
      {isCarVisible && (
        <Animated.Image
          source={playerCarSprites[carDirection][carFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: height * 0.1,
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
          source={busSprites["NORTH"][carFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            top: BusYAnim,
            left: BusXAnim,
            zIndex: 4,
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

//s2