// frontend\src\app\scenarios\road-markings\phase1\S5P1.jsx
import { useSession } from '../../../../contexts/SessionManager';
import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const playerCarWidth = Math.min(width * 0.25, 280);
const playerCarHeight = playerCarWidth * (350/280);
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Road tiles
const roadTiles = {
    road6: require("../../../../../assets/road/road6.png"),
    road8: require("../../../../../assets/road/road8.png"),
    road17: require("../../../../../assets/road/road17.png"),
    road18: require("../../../../../assets/road/road18.png"),
    road20: require("../../../../../assets/road/road20.png"),
};

// Map layout
const mapLayout = [
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
];

// Separated sprites for clarity and easier management
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
  NORTHEAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
};

const npcCarSprites = {
  blue: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  red: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_001.png"),
  ],
  green: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Green/MOVE/NORTH/SEPARATED/Green_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Green/MOVE/NORTH/SEPARATED/Green_CIVIC_CLEAN_NORTH_001.png"),
  ],
  yellow: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

// Updated question structure
const questions = [
  {
    question: "You encounter double solid yellow lines but traffic on your side has completely stopped. You're tempted to use the opposite lane to bypass the jam.",
    options: ["Move to the opposite lane to bypass the traffic jam.", "Check if the opposite lane is clear and overtake to move further on the road.", "Stay on your lane."],
    correct: "Stay on your lane.",
    wrongExplanation: {
      "Move to the opposite lane to bypass the traffic jam.": "Violation! Double solid yellow lines prohibit crossing regardless of traffic conditions on either side.",
      "Check if the opposite lane is clear and overtake to move further on the road.": "Violation! Even if the opposite lane is clear, double solid yellow lines prohibit overtaking and crossing."
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

  const currentScenario = 5; 

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

  const [isPlayerCarVisible, setIsPlayerCarVisible] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;
  const currentScroll = useRef(0);

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
  const [playerCarDirection, setPlayerCarDirection] = useState("NORTH");
  const [playerCarFrame, setPlayerCarFrame] = useState(0);

  const playerCarXAnim = useRef(new Animated.Value(width / 2 - playerCarWidth / 2)).current;

  // NPC Cars setup - Static cars from row 1 to row 9
  const npcCars = [
    { color: 'red', row: 1, lane: 2 },
    { color: 'green', row: 2, lane: 2 },
    { color: 'yellow', row: 3, lane: 2 },
    { color: 'blue', row: 4, lane: 2 },
    { color: 'red', row: 5, lane: 2 },
    { color: 'green', row: 6, lane: 2 },
    { color: 'yellow', row: 7, lane: 2 },
    { color: 'blue', row: 8, lane: 2 },
    { color: 'red', row: 9, lane: 2 },
  ];

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Animation for player's car sprite
  useEffect(() => {
    if (!showQuestion && isPlayerCarVisible) {
      const interval = setInterval(() => {
        setPlayerCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isPlayerCarVisible]);

  const scrollAnimationRef = useRef(null);
  const npcCarAnimationsRef = useRef([]);

  function startScrollAnimation() {
    scrollY.setValue(0);

    // Ensure player car is centered at the start
    playerCarXAnim.setValue(width / 2 - playerCarWidth / 2);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);

    // Continuous looping background scroll - stops at row 6
    const stopAtRow10 = -(5.5 * tileSize);
    
    scrollAnimationRef.current = Animated.timing(scrollY, {
      toValue: stopAtRow10,
      duration: Math.abs(stopAtRow10) * 3,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    
    scrollAnimationRef.current.start(({ finished }) => {
      if (finished) {
        // Stop at row 10 and show question
        setIsPlayerCarVisible(true);
        setPlayerCarFrame(0);
        
        setShowQuestion(true);
        setTimeout(() => {
          setShowAnswers(true);
        }, 1000);
      }
    });
  }

  useEffect(() => {
    startScrollAnimation();
    return () => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
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

  // Player stays in lane animation
  const animateStayInLane = async (answer) => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

    setPlayerCarDirection("NORTH");
    setPlayerCarFrame(0);
    setIsPlayerCarVisible(true);

    await new Promise(resolve => {
        Animated.timing(scrollY, {
            toValue: scrollY._value,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(resolve);
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    handleFeedback(answer);
  };

  // Sudden Overtake animation
  const animateSuddenOvertake = async (answer) => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

    setPlayerCarFrame(0);
    setIsPlayerCarVisible(true);

    const targetXLeftLane = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2);

    // Move to left lane quickly
    await new Promise(resolve => {
        setPlayerCarDirection("NORTHWEST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: targetXLeftLane,
                duration: 400,
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 0.8),
                duration: 400,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // Continue forward rapidly in left lane
    await new Promise(resolve => {
        setPlayerCarDirection("NORTH");
        Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 4),
            duration: 800,
            easing: Easing.easeOut,
            useNativeDriver: true,
        }).start(resolve);
    });

    setPlayerCarDirection("NORTH");

    await new Promise(resolve => setTimeout(resolve, 1000));

    handleFeedback(answer);
  };

  const handleAnswer = async (option) => {
    setSelectedAnswer(option);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = option === currentQuestion.correct;
    updateProgress(option, isCorrect);
    
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    setIsPlayerCarVisible(true);
    setPlayerCarFrame(0);

    const actualCorrectAnswer = questions[questionIndex].correct;

    if (option === actualCorrectAnswer) {
      if (option === "Stay on your lane.") {
        await animateStayInLane(option);
      }
    } else {
      if (option === "Move to the opposite lane to bypass the traffic jam." || 
          option === "Check if the opposite lane is clear and overtake to move further on the road.") {
        await animateSuddenOvertake(option);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        handleFeedback(option);
      }
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setPlayerCarFrame(0);

    const centerX = width / 2 - playerCarWidth / 2;
    playerCarXAnim.setValue(centerX);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      const currentFileScenario = 5;
      
      if (currentFileScenario >= 10) {
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
        
        const nextScenarioNumber = currentFileScenario + 1;
        const nextScreen = `S${nextScenarioNumber}P1`;
        router.push(`/scenarios/road-markings/phase1/${nextScreen}`);
      }

      setShowQuestion(false);
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      npcCarAnimationsRef.current.forEach(anim => anim.stop());
    }
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Solid yellow double lines means that you cannot overtake or cross. Respecting the road markings will help you avoid violations, accidents, and potential road rage."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

  return (
    <View style={{ flex: 1, backgroundColor: "black", overflow: 'hidden' }}>
      {/* Map - Looping background */}
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: mapHeight * 2,
          left: 0,
          transform: [{
            translateY: scrollY.interpolate({
              inputRange: [-mapHeight, 0],
              outputRange: [0, -mapHeight],
              extrapolate: 'clamp',
            })
          }],
          zIndex: 1,
        }}
      >
        {[0, 1].map((multiplier) => (
          mapLayout.map((row, rowIndex) =>
            <React.Fragment key={`${rowIndex}-${multiplier}`}>
              {row.map((tile, colIndex) => (
                <Image
                  key={`${rowIndex}-${colIndex}-${multiplier}`}
                  source={roadTiles[tile]}
                  style={{
                    position: "absolute",
                    width: tileSize,
                    height: tileSize,
                    left: colIndex * tileSize,
                    top: rowIndex * tileSize + (multiplier * mapHeight),
                  }}
                  resizeMode="stretch"
                />
              ))}
            </React.Fragment>
          )
        ))}
      </Animated.View>

      {/* Static NPC Cars - Rows 1-9 */}
      {npcCars.map((npc, index) => {
        const npcX = npc.lane * tileSize + (tileSize / 2 - playerCarWidth / 2);
        const npcY = npc.row * tileSize;
        
        return (
          <Animated.Image
            key={`npc-${index}`}
            source={npcCarSprites[npc.color][0]}
            style={{
              width: playerCarWidth,
              height: playerCarHeight,
              position: "absolute",
              left: npcX,
              transform: [{
                translateY: scrollY.interpolate({
                  inputRange: [-mapHeight, 0],
                  outputRange: [npcY, npcY - mapHeight],
                  extrapolate: 'clamp',
                })
              }],
              zIndex: 3,
            }}
          />
        );
      })}

      {/* Responsive Player Car */}
      {isPlayerCarVisible && (
        <Animated.Image
          source={playerCarSprites[playerCarDirection][playerCarFrame]}
          style={{
            width: playerCarWidth,
            height: playerCarHeight,
            position: "absolute",
            bottom: height * 0.1,
            left: playerCarXAnim,
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