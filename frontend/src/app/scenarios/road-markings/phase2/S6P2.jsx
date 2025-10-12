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
  road23: require("../../../../../assets/road/road23.png"),
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
  road22: require("../../../../../assets/road/road22.png"),
  int1: require("../../../../../assets/road/int1.png"),
  int2: require("../../../../../assets/road/int2.png"),
  int3: require("../../../../../assets/road/int3.png"),
  int4: require("../../../../../assets/road/int4.png"),
};

const mapLayout = [
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
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
  SOUTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Brown/MOVE/SOUTH/SEPARATED/Brown_CIVIC_CLEAN_SOUTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Brown/MOVE/SOUTH/SEPARATED/Brown_CIVIC_CLEAN_SOUTH_001.png"),
  ],
};

// Rain drop component
const RainDrop = ({ style }) => (
  <View style={[styles.rainDrop, style]} />
);

// Updated question structure
const questions = [
  {
    question: "You're driving on Coastal Road during heavy rain. The edge lines are clearly visible, but the road surface appears flooded near the shoulder area.",
    options: [
      "Drive closer to the center line to avoid the flooded shoulder",
      "Use the edge lines as a guide to maintain proper lane position",
      "Drive on the shoulder since it's marked by edge lines"
    ],
    correct: "Use the edge lines as a guide to maintain proper lane position",
    wrongExplanation: {
      "Drive closer to the center line to avoid the flooded shoulder": "Accident Prone! Moving toward center increases collision risk with oncoming traffic.",
      "Drive on the shoulder since it's marked by edge lines": "Wrong! Edge lines mark the boundary between safe roadway and shoulder, not an additional driving lane."
    },
    correctExplanation: "Correct! Edge lines help maintain proper lane position and separate the road from unsafe shoulder areas."
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

  // Rain animation
  const [rainDrops, setRainDrops] = useState([]);
  const rainOpacity = useRef(new Animated.Value(1)).current;

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
  const [isAnimating, setIsAnimating] = useState(false);

  // Brown car state (oncoming traffic)
  const [brownCarFrame, setBrownCarFrame] = useState(0);
  const brownCarY = useRef(new Animated.Value(-carHeight)).current; // Start above screen
  const brownCarX = 1 * tileSize + tileSize/2 - carWidth/2; // Position in 1st column (road4)

  // Animation speed control
  const [animationSpeed, setAnimationSpeed] = useState(4000);

  // Position car in 3rd column (index 2) of road4
  const carXAnim = useRef(new Animated.Value(2 * tileSize + tileSize/2 - carWidth/2)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Rain effect initialization
  useEffect(() => {
    const generateRainDrops = () => {
      const drops = [];
      for (let i = 0; i < 50; i++) {
        drops.push({
          id: i,
          x: Math.random() * width,
          animatedValue: new Animated.Value(-20),
          delay: Math.random() * 2000,
        });
      }
      setRainDrops(drops);
    };

    generateRainDrops();
  }, []);

  // Rain animation
  useEffect(() => {
    const animateRain = () => {
      rainDrops.forEach((drop) => {
        const animateDropLoop = () => {
          drop.animatedValue.setValue(-20);
          Animated.timing(drop.animatedValue, {
            toValue: height + 20,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: true,
          }).start(() => {
            animateDropLoop();
          });
        };

        setTimeout(() => {
          animateDropLoop();
        }, drop.delay);
      });
    };

    if (rainDrops.length > 0) {
      animateRain();
    }
  }, [rainDrops]);

  // Car animation frame cycling
  useEffect(() => {
    let iv;
    if (!carPaused && !isAnimating) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites[carDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused, carDirection, isAnimating]);

  // Brown car animation frame cycling
  useEffect(() => {
    const iv = setInterval(() => {
      setBrownCarFrame((p) => (p + 1) % carSprites.SOUTH.length);
    }, 200);
    return () => clearInterval(iv);
  }, []);

  // Brown car continuous movement
  useEffect(() => {
    const animateBrownCar = () => {
      brownCarY.setValue(-carHeight);
      Animated.timing(brownCarY, {
        toValue: height + carHeight,
        duration: 6000,
        useNativeDriver: true,
      }).start(() => {
        animateBrownCar(); // Loop the animation
      });
    };

    animateBrownCar();
  }, []);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);

    const stopRow = 6.5;
    const stopOffset = startOffset + stopRow * tileSize;

    Animated.timing(scrollY, {
      toValue: stopOffset,
      duration: animationSpeed,
      useNativeDriver: true,
    }).start(() => {
        setCarPaused(true);
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
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);
    setIsAnimating(true);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    await updateProgress(answer, isCorrect);

    const currentRow = Math.abs(currentScroll.current - startOffset) / tileSize;

    if (answer === "Drive closer to the center line to avoid the flooded shoulder") {
      // Animation: Car moves toward center (left) to avoid flood
      setCarDirection("NORTH");

      // Move car to column 1 (road3 - center line area)
      Animated.parallel([
        Animated.timing(carXAnim, {
          toValue: 1.7 * tileSize + tileSize/2 - carWidth/2,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: currentScroll.current + 4 * tileSize,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start(() => {
          setIsAnimating(false);
        setTimeout(() => {setIsAnimating(false);
          handleFeedback(answer);
        }, 500);
      });

    } else if (answer === "Use the edge lines as a guide to maintain proper lane position") {
      // Animation: Car continues straight in the same lane
      setCarDirection("NORTH");

      Animated.timing(scrollY, {
        toValue: currentScroll.current + 4 * tileSize,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          handleFeedback(answer);
        }, 500);
      });

  } else if (answer === "Drive on the shoulder since it's marked by edge lines") {
  // Animation: Car moves right to shoulder (column 3)
  setCarDirection("NORTHEAST");

  // Move car to column 3 (shoulder area)
  Animated.parallel([
    Animated.timing(carXAnim, {
      toValue: 3 * tileSize + tileSize/2 - carWidth/2,
      duration: 700,
      useNativeDriver: true,
    }),
    Animated.timing(scrollY, {
      toValue: currentScroll.current + 4 * tileSize,
      duration: 2000,
      useNativeDriver: true,
    })
  ]).start(() => {
    // Once on the shoulder, car faces north again
    setCarDirection("NORTH");

    setTimeout(() => {
      handleFeedback(answer);
    }, 500);
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

    // Reset car to column 2 (3rd column)
    const centerX = 2 * tileSize + tileSize/2 - carWidth/2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario >= 10) {
              // Last scenario in phase - complete session
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

  // Determine the feedback message
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? currentQuestionData.correctExplanation
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

  // Flood areas - positioned on the right shoulder areas and 1st column
  const renderFloodAreas = () => {
      if (isAnimating) return null
    const floodAreas = [];

    // Right shoulder flood areas (column 3)
    for (let row = 3; row < 12; row++) {
      floodAreas.push(
        <View
          key={`flood-right-${row}`}
          style={[
            styles.floodArea,
            {
              position: 'absolute',
              left: 3 * tileSize + tileSize * 0.7, // Right edge of road
              top: row * tileSize + tileSize * 0.3,
              width: tileSize * 0.3,
              height: tileSize * 0.4,
            }
          ]}
        />
      );
    }

    // Left side flood areas (column 0 - 1st column)
    for (let row = 2; row < 13; row++) {
      // Multiple water sprouts/puddles in 1st column
      floodAreas.push(
        <View
          key={`flood-left-main-${row}`}
          style={[
            styles.floodArea,
            {
              position: 'absolute',
              left: 0 * tileSize + tileSize * 0.1, // Left side of 1st column
              top: row * tileSize + tileSize * 0.2,
              width: tileSize * 0.4,
              height: tileSize * 0.6,
            }
          ]}
        />
      );

      // Additional smaller water sprouts
      floodAreas.push(
        <View
          key={`flood-left-small-${row}`}
          style={[
            styles.floodArea,
            {
              position: 'absolute',
              left: 0 * tileSize + tileSize * 0.6, // Center-left of 1st column
              top: row * tileSize + tileSize * 0.1,
              width: tileSize * 0.3,
              height: tileSize * 0.3,
            }
          ]}
        />
      );

      // Edge water accumulation near center line
      if (row % 2 === 0) { // Every other row for variation
        floodAreas.push(
          <View
            key={`flood-left-edge-${row}`}
            style={[
              styles.waterSpout,
              {
                position: 'absolute',
                left: 0 * tileSize + tileSize * 0.8, // Near center line
                top: row * tileSize + tileSize * 0.4,
                width: tileSize * 0.2,
                height: tileSize * 0.5,
              }
            ]}
          />
        );
      }
    }

    return floodAreas;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#2c3e50" }}>
      {/* Rain Effect */}
      <Animated.View style={[styles.rainContainer, { opacity: rainOpacity }]}>
        {rainDrops.map((drop) => (
          <Animated.View
            key={drop.id}
            style={[
              styles.rainDrop,
              {
                left: drop.x,
                transform: [{ translateY: drop.animatedValue }],
              },
            ]}
          />
        ))}
      </Animated.View>

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

        {/* Flood Areas */}
        {renderFloodAreas()}
      </Animated.View>

      {/* Car */}
      {isCarVisible && (
        <Animated.Image
          source={carSprites[carDirection][carFrame]}
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

      {/* Brown Car (Oncoming Traffic) */}
      <Animated.Image
        source={carSprites.SOUTH[brownCarFrame]}
        style={{
          width: carWidth,
          height: carHeight,
          position: "absolute",
          left: brownCarX,
          transform: [{ translateY: brownCarY }],
          zIndex: 5,
        }}
      />

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
  // Loading screen styles
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
  // No intro styles (responsive)
  // In-game responsive styles
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
  // Rain and flood effects
  rainContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 8,
    pointerEvents: 'none',
  },
  rainDrop: {
    position: 'absolute',
    width: 2,
    height: 15,
    backgroundColor: '#87CEEB',
    opacity: 0.7,
    borderRadius: 1,
  },
  floodArea: {
    backgroundColor: 'rgba(65, 105, 225, 0.6)',
    borderRadius: 3,
    zIndex: 2,
  },
  waterSpout: {
    backgroundColor: 'rgba(30, 144, 255, 0.7)',
    borderRadius: 2,
    zIndex: 2,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});