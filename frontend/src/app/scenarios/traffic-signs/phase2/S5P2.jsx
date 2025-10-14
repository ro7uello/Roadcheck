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

const questions = [
  {
    question: "You're driving a private car on EDSA and accidentally enter a lane with BUS ONLY signs and markings. You realize your mistake when you see a city bus approaching from behind with its horn honking.",
    options: ["Speed up to stay ahead of the bus", "Safely exit the bus lane at the next legal opportunity", "Continue in the bus lane since you're already there"],
    correct: "Safely exit the bus lane at the next legal opportunity",
    wrongExplanation: {
      "Speed up to stay ahead of the bus": "Wrong! Speeding in a restricted lane compounds the violation and creates dangerous situation.",
      "Continue in the bus lane since you're already there": "Accident prone! Staying in a restricted lane continues the violation and might present you to longer danger."
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

  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;
  const BusYAnim = useRef(new Animated.Value(height * 1.5)).current;
  const BusXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2 + tileSize)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    carXAnim.setValue(width / 2 - carWidth / 2);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setIsBusVisible(false);

    const stopRow = 6.5;
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

  const handleAnswer = async (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    await updateProgress(answer, isCorrect);

    const actualCorrectAnswer = questions[questionIndex].correct;
    const originalLaneX = width / 2 - carWidth / 2;
    const rightLaneX = width / 2 - carWidth / 2 + tileSize;
    const leftLaneX = width / 1.3 - carWidth / 1.3 - tileSize;
    const busLaneX = tileSize * 2; // Column 2 (0-indexed: column 1)

    // CORRECT ANSWER: Safely exit the bus lane
    if (answer === actualCorrectAnswer) {
      setIsCarVisible(true);
      setIsBusVisible(true);

      // Set bus initial position at column 2, behind the car
      BusXAnim.setValue(busLaneX);
      BusYAnim.setValue(height * 0.35);

      Animated.sequence([
        // Step 1: Car starts moving diagonally (NORTHEAST) to exit right
        Animated.parallel([
          Animated.timing(carXAnim, {
            toValue: rightLaneX,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 1.2,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
        // Step 2: Car continues NORTH in right lane, bus passes in bus lane (column 2)
        Animated.parallel([
          Animated.timing(BusYAnim, {
            toValue: -carHeight * 2.5,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 4,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setCarDirection("NORTH");
        handleFeedback(answer);
      });

      // Change car direction during animation
      setTimeout(() => {
        setCarDirection("NORTHEAST");
      }, 50);
      
      setTimeout(() => {
        setCarDirection("NORTH");
      }, 850);
    }
    // WRONG ANSWER 1: Continue in the bus lane
    else if (answer === "Continue in the bus lane since you're already there") {
      setIsBusVisible(true);

      // Bus stays in same lane and approaches
      BusXAnim.setValue(rightLaneX);
      BusYAnim.setValue(height * 1.5);

      Animated.parallel([
        Animated.timing(BusYAnim, {
          toValue: -carHeight,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: currentScroll.current + tileSize * 5,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => handleFeedback(answer));
    }
    // WRONG ANSWER 2: Speed up to stay ahead of the bus
    else if (answer === "Speed up to stay ahead of the bus") {
      setIsBusVisible(true);

      // Bus starts behind in the same lane
      BusXAnim.setValue(rightLaneX);
      BusYAnim.setValue(height * 0.4);

      // Player car speeds up, but bus overtakes
      Animated.parallel([
        // Car speeds forward
        Animated.timing(scrollY, {
          toValue: currentScroll.current + tileSize * 8,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Bus overtakes faster
        Animated.timing(BusYAnim, {
          toValue: -carHeight * 3,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => {
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

    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setIsBusVisible(false);
    BusYAnim.setValue(height * 1.5);
    BusXAnim.setValue(width / 2 - carWidth / 2 + tileSize);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario >= 10) {
      try {
        const sessionResults = await completeSession();
        router.push({
          pathname: '/result-page',
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

      const nextScreen = `S${currentScenario + 1}P${phaseNumber}`;
      router.push(`/scenarios/traffic-signs/phase${phaseNumber}/${nextScreen}`);
    }
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! You should safely exit the restricted lane as soon as legally possible."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

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

      {/* Player Car */}
      {isCarVisible && (
        <Animated.Image
          source={playerCarSprites[carDirection][carFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: height * 0.1,
            transform: [{ translateX: carXAnim }],
            zIndex: 5,
          }}
        />
      )}

      {/* Bus */}
      {isBusVisible && (
        <Animated.Image
          source={busSprites["NORTH"][carFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: 0,
            left: 0,
            transform: [
              { translateX: BusXAnim },
              { translateY: BusYAnim }
            ],
            zIndex: 4,
          }}
        />
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