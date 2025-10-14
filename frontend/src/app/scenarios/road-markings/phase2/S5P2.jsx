// frontend\src\app\scenarios\road-markings\phase2\S5P2.jsx
import { useSession } from '../../../../contexts/SessionManager';
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
  road24: require("../../../../../assets/road/road24.png"),
  road49: require("../../../../../assets/road/road49.png"),
  road50: require("../../../../../assets/road/road50.png"),
  road51: require("../../../../../assets/road/road51.png"),
  road52: require("../../../../../assets/road/road52.png"),
  road57: require("../../../../../assets/road/road57.png"),
  road58: require("../../../../../assets/road/road58.png"),
  road59: require("../../../../../assets/road/road59.png"),
  road60: require("../../../../../assets/road/road60.png"),
  road15: require("../../../../../assets/road/road15.png"),
  road23: require("../../../../../assets/road/road23.png"),
  road24: require("../../../../../assets/road/road24.png"),
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

// Ambulance Sprite
const ambulanceSprite = {
  EAST: [
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_001.png"),
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_002.png"),
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_003.png"),
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_004.png"),
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_005.png"),
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_006.png"),
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_007.png"),
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_008.png"),
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_009.png"),
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_010.png"),
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_011.png"),
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

  // Ambulance State
  const [showAmbulance, setShowAmbulance] = useState(false);
  const [ambulanceFrame, setAmbulanceFrame] = useState(0);
  const ambulanceXAnim = useRef(new Animated.Value(-carWidth * 2)).current;
  const ambulanceYAnim = useRef(new Animated.Value(0)).current;

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

  // Ambulance animation frame cycling
  useEffect(() => {
    let iv;
    if (showAmbulance) {
      iv = setInterval(() => {
        setAmbulanceFrame((p) => (p + 1) % ambulanceSprite.EAST.length);
      }, 100);
    }
    return () => clearInterval(iv);
  }, [showAmbulance]);

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

  const animateAmbulanceCrossing = () => {
    const intersectionRow = 10;
    const ambulanceY = height - (intersectionRow * tileSize) + Math.abs(currentScroll.current - startOffset);
    
    ambulanceYAnim.setValue(ambulanceY);
    ambulanceXAnim.setValue(-carWidth);
    
    setShowAmbulance(true);
    
    Animated.timing(ambulanceXAnim, {
      toValue: width + carWidth,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
      setShowAmbulance(false);
      
      const finalTarget = currentScroll.current + (1 * tileSize);
      
      setCarPaused(false);
      Animated.timing(scrollY, {
        toValue: finalTarget,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        handleFeedback("Stop completely at the give way lines and wait for the vehicle to pass");
      });
    });
  };

  const animateCollision = () => {
    // Calculate ambulance position to align with car's intersection point
    const intersectionRow = 7.5;
    // Calculate Y position relative to viewport, not the map
    const carBottomPosition = height * 0.1; // Car's bottom position
    const ambulanceY = carBottomPosition - (carHeight * 0.3); // Slightly overlap with car
    
    ambulanceYAnim.setValue(ambulanceY);
    ambulanceXAnim.setValue(-carWidth * 1.5);
    
    setShowAmbulance(true);
    
    // Ambulance moves to collision point (where car will be)
    const carPosition = width / 2 - carWidth / 2; // Center position of car
    
    Animated.timing(ambulanceXAnim, {
      toValue: carPosition,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      handleFeedback("Speed up to cross before the approaching vehicle reaches the intersection");
    });
  };

  const handleAnswer = async (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    await updateProgress(answer, isCorrect);

    const currentRow = Math.abs(currentScroll.current - startOffset) / tileSize;

    const road22Row = 6;
    const panTarget = startOffset + road22Row * tileSize;

    Animated.timing(scrollY, {
      toValue: panTarget,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      executeAnswerBehavior(answer, currentRow);
    });
  };

const executeAnswerBehavior = (answer, currentRow) => {
    if (answer === "Stop completely at the give way lines and wait for the vehicle to pass") {
      // Choice 1: Car proceeds to give way lines and makes COMPLETE STOP
      const giveWayStopRow = 6.5; // Stop exactly at give way lines
      const currentScrollValue = currentScroll.current;
      const rowsToMove = giveWayStopRow - 6; // From road22Row (6) to give way lines
      const giveWayTarget = currentScrollValue + rowsToMove * tileSize;

      // Move to give way lines with slower speed to show controlled stop
      Animated.timing(scrollY, {
        toValue: giveWayTarget,
        duration: 2500, // Slower approach for complete stop
        easing: Easing.out(Easing.quad), // Deceleration easing
        useNativeDriver: true,
      }).start(() => {
        // Complete stop at give way lines
        setCarPaused(true);
        
        // Finish animation after stop
        handleFeedback(answer);
      });

    } else if (answer === "Speed up to cross before the approaching vehicle reaches the intersection") {
      // Choice 2: Speed up and collision
      const currentScrollValue = currentScroll.current;
      const targetRow = 7.5; // Intersection point
      const rowsToMove = targetRow - 6; // From current position
      const nextTarget = currentScrollValue + rowsToMove * tileSize;

      // Car speeds up to intersection
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 1000, // Fast movement
        useNativeDriver: true,
      }).start(() => {
        // Pause car at intersection
        setCarPaused(true);
        // Trigger collision animation immediately
        animateCollision();
      });

    } else if (answer === "Yield by slowing down or stopping as needed to let the vehicle pass safely first") {
      // Choice 3: Slow approach, ambulance passes by safely, then proceed
      const giveWayStopRow = 7.8; // Just at the give way lines
      const rowsToGiveWay = giveWayStopRow - currentRow;
      const giveWayTarget = currentScroll.current + rowsToGiveWay * tileSize;

      // First, slow approach to give way lines
      Animated.timing(scrollY, {
        toValue: giveWayTarget,
        duration: 2000, // Slower to show yielding behavior
        useNativeDriver: true,
      }).start(() => {
        // Brief pause to yield
        setCarPaused(true);
        
        // Show ambulance passing by after car stops
        setTimeout(() => {
          // Ambulance passes in front of stopped car
          const carBottomPosition = height * 0.1;
          const ambulanceY = carBottomPosition - (carHeight * 0.5);
          
          ambulanceYAnim.setValue(ambulanceY);
          ambulanceXAnim.setValue(-carWidth * 1.5);
          
          setShowAmbulance(true);
          
          // Ambulance crosses completely across screen
          Animated.timing(ambulanceXAnim, {
            toValue: width + carWidth,
            duration: 1500,
            useNativeDriver: true,
          }).start(() => {
            // After ambulance passes, hide it
            setShowAmbulance(true);
            
            // Car resumes and proceeds through intersection
            setCarPaused(false);
            const targetRow = 12;
            const finalRowsToMove = targetRow - giveWayStopRow;
            const finalTarget = giveWayTarget + finalRowsToMove * tileSize;

            Animated.timing(scrollY, {
              toValue: finalTarget,
              duration: 2500,
              useNativeDriver: true,
            }).start(() => {
              handleFeedback(answer);
            });
          });
        }, 500); // Small delay before ambulance appears
      });
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

    setShowAmbulance(false);
    ambulanceXAnim.setValue(-carWidth * 2);
    ambulanceYAnim.setValue(0);
    setAmbulanceFrame(0);

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
                 const nextScreen = `S${currentScenario + 1}P2`; // Will be S2P2
                 router.push(`/scenarios/road-markings/phase2/${nextScreen}`);
        }
  };

  const giveWayLeft = giveWayColIndex * tileSize + giveWayXOffset;
  const giveWayTop = giveWayRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Give way signs require yielding right of way, which may involve slowing down, stopping, or adjusting timing to let cross traffic pass safely."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
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

        <Image
          source={giveWaySign}
          style={{
            width: tileSize * .6,
            height: tileSize * .8,
            position: "absolute",
            top: giveWayTop,
            left: giveWayLeft,
            zIndex: 10,
          }}
          resizeMode="contain"
        />
      </Animated.View>

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

      {showAmbulance && (
        <Animated.Image
          source={ambulanceSprite.EAST[ambulanceFrame]}
          style={{
            width: carWidth * 1.3,
            height: carHeight * 1.3,
            position: "absolute",
            transform: [
              { translateX: ambulanceXAnim },
              { translateY: ambulanceYAnim }
            ],
            zIndex: 6,
          }}
        />
      )}

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

      {(animationType === "correct" || animationType === "wrong") && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </Animated.View>
      )}

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
    fontSize: 20,
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
    fontSize: Math.min(width * 0.045, 21),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.076,
    right: sideMargin,
    width: width * 0.35,
    height: height * 0.23,
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