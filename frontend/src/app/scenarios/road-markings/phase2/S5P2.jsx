// frontend/src/app/scenarios/road-markings/phase2/S5P2.jsx
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
  road22: require("../../../../../assets/road/road22.png"),
  road23: require("../../../../../assets/road/road23.png"),
  road24: require("../../../../../assets/road/road24.png"),
  road49: require("../../../../../assets/road/road49.png"),
  road50: require("../../../../../assets/road/road50.png"),
  road51: require("../../../../../assets/road/road51.png"),
  road52: require("../../../../../assets/road/road52.png"),
  road57: require("../../../../../assets/road/road57.png"),
  road58: require("../../../../../assets/road/road58.png"),
  road60: require("../../../../../assets/road/road60.png"),
  road15: require("../../../../../assets/road/road15.png"),
  road28: require("../../../../../assets/road/road28.png"),
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
  ["road18", "road4", "road3", "road17", "road20"],
  ["road22", "road24", "road24", "road24", "road24"],
  ["road23", "road23", "road23", "road23", "road23"],
  ["road18", "road15", "road15", "road17", "road20"],
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

// NPC Car Sprites - Green Bus
const busSprites = {
  EAST: [
    require("../../../../../assets/car/BUS TOPDOWN/Green/MOVE/EAST/SEPARATED/Green_BUS_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/BUS TOPDOWN/Green/MOVE/EAST/SEPARATED/Green_BUS_CLEAN_EAST_001.png"),
  ],
  WEST: [
    require("../../../../../assets/car/BUS TOPDOWN/Green/MOVE/WEST/SEPARATED/Green_BUS_CLEAN_WEST_000.png"),
    require("../../../../../assets/car/BUS TOPDOWN/Green/MOVE/WEST/SEPARATED/Green_BUS_CLEAN_WEST_001.png"),
  ],
};

// NPC Car Sprites - Yellow Civic
const yellowCivicSprites = {
  EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/EAST/SEPARATED/Yellow_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/EAST/SEPARATED/Yellow_CIVIC_CLEAN_EAST_001.png"),
  ],
  WEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/WEST/SEPARATED/Yellow_CIVIC_CLEAN_WEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/WEST/SEPARATED/Yellow_CIVIC_CLEAN_WEST_001.png"),
  ],
};

// Give way sign sprite
const giveWaySign = require("../../../../../assets/signs/give_way.png");

// Updated question structure
const questions = [
  {
    question: "You're approaching an intersection with give way or holding lines (two adjacent broken white lines). You can see a vehicle approaching from your left about 100 meters away, moving at normal speed.",
    options: [
      "Stop completely at the give way lines and wait for the vehicle to pass", 
      "Speed up to cross before the approaching vehicle reaches the intersection", 
      "Yield by slowing down or stopping as needed to let the vehicle pass safely first"
    ],
    correct: "Yield by slowing down or stopping as needed to let the vehicle pass safely first",
    wrongExplanation: {
      "Stop completely at the give way lines and wait for the vehicle to pass": "Wrong! While stopping is acceptable, give way lines don't always require complete stops - you can yield by adjusting speed appropriately.",
      "Speed up to cross before the approaching vehicle reaches the intersection": "Accident Prone! Speeding up to cross before cross traffic violates the yield requirement and creates dangerous situations."
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

  // Give way sign position
  const giveWayRowIndex = 9;
  const giveWayColIndex = 3;
  const giveWayXOffset = -30;

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

  // Animation speed control
  const [animationSpeed, setAnimationSpeed] = useState(4000);

  // Responsive car positioning
  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // NPC Cars State
  const [showNPCCars, setShowNPCCars] = useState(false);
  const [npcBusFrame, setNpcBusFrame] = useState(0);
  const [npcCivicFrame, setNpcCivicFrame] = useState(0);
  const busXAnim = useRef(new Animated.Value(-carWidth * 2)).current;
  const civicXAnim = useRef(new Animated.Value(-carWidth * 2.5)).current;

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

  // NPC Cars animation frame cycling
  useEffect(() => {
    let iv;
    if (showNPCCars) {
      iv = setInterval(() => {
        setNpcBusFrame((p) => (p + 1) % busSprites.EAST.length);
        setNpcCivicFrame((p) => (p + 1) % yellowCivicSprites.EAST.length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [showNPCCars]);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    
    const stopRow = 5.7;
    const stopOffset = startOffset + stopRow * tileSize;

    Animated.timing(scrollY, {
      toValue: stopOffset,
      duration: animationSpeed,
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
  }, [animationSpeed]);

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
    console.log('🎯 handleAnswer START:', answer);
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    await updateProgress(answer, isCorrect);
    console.log('✅ Progress updated');

    const currentRow = Math.abs(currentScroll.current - startOffset) / tileSize;

    // Pan camera to road22 to show NPC cars
    const road22Row = 7.5;
    const panTarget = startOffset + road22Row * tileSize;
    
    setShowNPCCars(true);
    
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(busXAnim, {
          toValue: width + carWidth,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(civicXAnim, {
          toValue: width + carWidth,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: panTarget,
          duration: 1500,
          useNativeDriver: true,
        })
      ]).start(resolve);
    });

    executeAnswerBehavior(answer, currentRow);
  };

  const executeAnswerBehavior = async (answer, currentRow) => {
    try {
      if (answer === "Stop completely at the give way lines and wait for the vehicle to pass") {
        console.log('🛑 Choice 1: Complete stop');
        setCarPaused(true);
        await new Promise(resolve => setTimeout(resolve, 3000));
        handleFeedback(answer);
        
      } else if (answer === "Speed up to cross before the approaching vehicle reaches the intersection") {
        console.log('⚡ Choice 2: Speed up');
        const currentScrollValue = currentScroll.current;
        const road22Row = 7.5;
        const targetRow = 12;
        const rowsToMove = targetRow - road22Row;
        const nextTarget = currentScrollValue + rowsToMove * tileSize;
        
        await new Promise(resolve => {
          Animated.timing(scrollY, {
            toValue: nextTarget,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start(resolve);
        });

        handleFeedback(answer);
        
      } else if (answer === "Yield by slowing down or stopping as needed to let the vehicle pass safely first") {
        console.log('🟢 Choice 3: Yield properly');
        const giveWayStopRow = 7.8;
        const rowsToGiveWay = giveWayStopRow - currentRow;
        const giveWayTarget = currentScroll.current + rowsToGiveWay * tileSize;
        
        await new Promise(resolve => {
          Animated.timing(scrollY, {
            toValue: giveWayTarget,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start(resolve);
        });

        setCarPaused(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setCarPaused(false);
        const targetRow = 12;
        const finalRowsToMove = targetRow - giveWayStopRow;
        const finalTarget = giveWayTarget + finalRowsToMove * tileSize;
        
        await new Promise(resolve => {
          Animated.timing(scrollY, {
            toValue: finalTarget,
            duration: 2500,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start(resolve);
        });

        handleFeedback(answer);
      }
    } catch (error) {
      console.error('❌ Error in executeAnswerBehavior:', error);
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
    setAnimationSpeed(4000);
    
    setShowNPCCars(false);
    busXAnim.setValue(-carWidth * 2);
    civicXAnim.setValue(-carWidth * 2.5);

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

  // Calculate give way sign position
  const giveWayLeft = giveWayColIndex * tileSize + giveWayXOffset;
  const giveWayTop = giveWayRowIndex * tileSize;

  // Determine the feedback message
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Give way signs require yielding right of way, which may involve slowing down, stopping, or adjusting timing to let cross traffic pass safely."
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
        
        {/* Give Way Sign */}
        <Image
          source={giveWaySign}
          style={{
            width: tileSize * 1.5,
            height: tileSize * 2,
            position: "absolute",
            top: giveWayTop,
            left: giveWayLeft,
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

      {/* NPC Cars - Green Bus and Yellow Civic */}
      {showNPCCars && (
        <>
          <Animated.Image
            source={busSprites.EAST[npcBusFrame]}
            style={{
              width: carWidth * 1.3,
              height: carHeight * 1.3,
              position: "absolute",
              top: -110,
              bottom: -90,
              transform: [{ translateX: busXAnim }],
              zIndex: 6,
            }}
          />
          
          <Animated.Image
            source={yellowCivicSprites.EAST[npcCivicFrame]}
            style={{
              width: carWidth,
              height: carHeight,
              bottom: -80,
              position: "absolute",
              top: -130,
              transform: [{ translateX: civicXAnim }],
              zIndex: 6,
            }}
          />
        </>
      )}

      {/* Responsive Question Overlay - FIXED: Better LTO positioning */}
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

      {/* FIXED: Responsive Answers - moved down to avoid overlap */}
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

      {/* FIXED: Responsive Feedback - better text sizing */}
      {(animationType === "correct" || animationType === "wrong") && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/Dialog w answer.png")} style={styles.ltoImage} />
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
  // FIXED: Better LTO image positioning
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
  },
  // FIXED: Moved answers down to avoid overlap with scenario description
  answersContainer: {
    position: "absolute",
    top: height * 0.18, // CHANGED from 0.076 to 0.18 to avoid overlap
    right: sideMargin,
    width: width * 0.35,
    height: height * 0.21,
    zIndex: 11,
  },
  answerButton: {
    backgroundColor: "#333",
    padding: height * 0.015,
    borderRadius: 8,
    marginBottom: height * 0.012, // FIXED: Slightly reduced spacing
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
    paddingHorizontal: width * 0.05, // FIXED: Added padding to prevent overflow
  },
  // FIXED: Reduced font size slightly to prevent overflow
  feedbackText: {
    color: "white",
    fontSize: Math.min(width * 0.05, 24), // CHANGED from 0.06/24 to 0.05/24
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: Math.min(width * 0.06, 28), // FIXED: Added line height for better readability
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