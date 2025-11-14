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

const ambulanceSprites = {
  NORTH: [
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/NORTH/SEPARATED/AMBULANCE_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/NORTH/SEPARATED/AMBULANCE_CLEAN_NORTH_001.png"),
  ],
};

const npcCarSprites = {
  NORTH: [
    require("../../../../../assets/car/SEDAN TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SEDAN_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/SEDAN TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SEDAN_CLEAN_NORTH_001.png"),
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
  const navigation = useNavigation();

    const {
      updateScenarioProgress,
      moveToNextScenario,
      completeSession,
      currentScenario: sessionCurrentScenario,
      sessionData,
      speakQuestion,
      stopSpeaking
    } = useSession();

    const currentScenario = 7; 

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const scenarioId = currentScenario; 
      await updateScenarioProgress(scenarioId, selectedOption, isCorrect);
    } catch (error) {
      console.error('Error updating scenario progress:', error);
    }
  };

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isCarVisible, setIsCarVisible] = useState(true);
  const [isAmbulanceVisible, setIsAmbulanceVisible] = useState(false);
  const [isNpcCarVisible, setIsNpcCarVisible] = useState(true);

  const startOffset = -(mapHeight - height);

  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      currentScroll.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  useEffect(() => {
      if (showQuestion && questions[questionIndex]) {
        // Auto-play question after 1 second delay (gives time for animation)
        const timer = setTimeout(() => {
          speakQuestion(questions[questionIndex].question);
        }, 1000);

        return () => {
          clearTimeout(timer);
          stopSpeaking(); // Stop speaking when question disappears
        };
      }
    }, [showQuestion, questionIndex]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [carDirection, setCarDirection] = useState("NORTH");
  const [carFrame, setCarFrame] = useState(0);
  const [npcCarFrame, setNpcCarFrame] = useState(0);

  // FIXED: Using transform instead of top/left
  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;
  const ambulanceTranslateY = useRef(new Animated.Value(height + carHeight)).current;
  const ambulanceTranslateX = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;
  const npcCarTranslateY = useRef(new Animated.Value(height + carHeight)).current;
  const npcCarTranslateX = useRef(new Animated.Value(width / 2 - carWidth / 2 + tileSize)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;
  const npcCarAnimationRef = useRef(null);

  // Car animation frame cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // NPC Car sprite animation
  useEffect(() => {
    if (isNpcCarVisible) {
      const interval = setInterval(() => {
        setNpcCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isNpcCarVisible]);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    carXAnim.setValue(width / 2 - carWidth / 2);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setIsNpcCarVisible(true);

    // Reset NPC car position
    npcCarTranslateY.setValue(height + carHeight);

    const stopRow = 6.5;
    const stopOffset = startOffset + stopRow * tileSize;

    // Start NPC car animation - moves from bottom to specific position
    npcCarAnimationRef.current = Animated.timing(npcCarTranslateY, {
      toValue: -carHeight * 0.5, // Position in front of player car
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    npcCarAnimationRef.current.start();

    Animated.timing(scrollY, {
      toValue: stopOffset,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
      // Stop NPC car animation when question appears
      if (npcCarAnimationRef.current) {
        npcCarAnimationRef.current.stop();
      }
      setShowQuestion(true);
      setTimeout(() => {
        setShowAnswers(true);
      }, 1000);
    });
  }

  useEffect(() => {
    startScrollAnimation();
    return () => {
      if (npcCarAnimationRef.current) {
        npcCarAnimationRef.current.stop();
      }
    };
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

  const handleAnswer = (option) => {
    setSelectedAnswer(option);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = option === currentQuestion.correct;
    updateProgress(option, isCorrect);
    
    const actualCorrectAnswer = questions[questionIndex].correct;
    const originalLaneX = width / 2 - carWidth / 2;
    const rightLaneX = width / 2 - carWidth / 2 + tileSize;
    const leftLaneX = width / 2 - carWidth / 2 - tileSize;

    if (option === actualCorrectAnswer) {
      // Correct Answer: Player moves right, Ambulance passes on left
      setIsCarVisible(true);
      setIsAmbulanceVisible(true);

      Animated.sequence([
        // 1. Player car moves to the right lane
        Animated.parallel([
          Animated.timing(carXAnim, {
            toValue: rightLaneX,
            duration: 500,
            easing: Easing.easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 0.5,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
        // 2. Ambulance passes on the center lane, NPC car continues moving
        Animated.parallel([
          Animated.timing(ambulanceTranslateY, {
            toValue: -carHeight * 2,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(npcCarTranslateY, {
            toValue: -carHeight * 2, // NPC car also moves forward
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 3,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        handleFeedback(option);
      });

    } else if (option === "Stay in your lane since crossing solid white lines is discouraged") {
      // WRONG Answer: Ambulance overtakes from the right
      setIsAmbulanceVisible(true);


      Animated.sequence([
        Animated.parallel([
          Animated.timing(ambulanceTranslateY, {
            toValue: height * 0.6,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(npcCarTranslateY, {
            toValue: -carHeight * 2,
            duration: 2500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 7,
            duration: 2500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ]).start(() => handleFeedback(option));

    } else if (option === "Speed up to clear the way without changing lanes") {
      // Wrong Answer: Player car speeds up
      Animated.parallel([
        Animated.timing(scrollY, {
          toValue: currentScroll.current + tileSize * 14,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(npcCarTranslateY, {
          toValue: -carHeight * 3,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => {
        handleFeedback(option);
      });
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setCarFrame(0);
    setNpcCarFrame(0);

    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setIsAmbulanceVisible(false);
    setIsNpcCarVisible(true);
    ambulanceTranslateY.setValue(height + carHeight);
    ambulanceTranslateX.setValue(width / 2 - carWidth / 2);
    npcCarTranslateY.setValue(height + carHeight);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      // FIXED: Use the actual currentScenario from useSession instead of hardcoded value
      if (currentScenario >= 10) {
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
        moveToNextScenario();
        const nextScenario = currentScenario + 1;
        router.push(`/scenarios/road-markings/phase1/S${nextScenario}P1`);
      }

      setShowQuestion(false);
      if (npcCarAnimationRef.current) {
        npcCarAnimationRef.current.stop();
      }
    }
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! You must give way to emergency vehicles, even if it requires crossing solid white lines."
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

      {/* Responsive NPC Car (Red Sedan) - Behind ambulance */}
      {isNpcCarVisible && (
        <Animated.Image
          source={npcCarSprites["NORTH"][npcCarFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            top: 0,
            left: 0,
            transform: [
              { translateY: npcCarTranslateY },
              { translateX: npcCarTranslateX }
            ],
            zIndex: 3,
          }}
        />
      )}

      {/* Responsive Ambulance - MOVED BEFORE PLAYER CAR */}
      {isAmbulanceVisible && (
        <Animated.Image
          source={ambulanceSprites["NORTH"][carFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            top: 0,
            left: 0,
            transform: [
              { translateY: ambulanceTranslateY },
              { translateX: ambulanceTranslateX }
            ],
            zIndex: 4,
          }}
        />
      )}

      {/* Responsive Car */}
      {isCarVisible && (
        <Animated.Image
          source={playerCarSprites[carDirection][carFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: height * 0.1,
            left: 0,
            transform: [
              { translateX: carXAnim }
            ],
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
    top: height * 0.10,
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