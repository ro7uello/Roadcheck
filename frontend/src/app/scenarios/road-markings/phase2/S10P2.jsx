import { useSession } from '../../../../contexts/SessionManager';
import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { router } from 'expo-router';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Pedestrian sprite dimensions
const spriteWidth = Math.min(width * 0.15, 120);
const spriteHeight = spriteWidth * 1.2;

const roadTiles = {
  road3: require("../../../../../assets/road/road3.png"),
  road4: require("../../../../../assets/road/road4.png"),
  road16: require("../../../../../assets/road/road16.png"),
  road17: require("../../../../../assets/road/road17.png"),
  road18: require("../../../../../assets/road/road18.png"),
  road19: require("../../../../../assets/road/road19.png"),
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

// Map layout with complex intersection including crosswalks
const mapLayout = [
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road49", "road57", "road57", "road50", "road52"],
  ["road60", "int3", "int4", "road60", "road24"],
  ["road58", "int2", "int1", "road58", "road23"],
  ["road19", "road57", "road57", "road16", "road51"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
];

// Player car sprites (Blue)
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

// Male pedestrian sprites facing EAST
const maleSprites = {
  EAST: [
    require("../../../../../assets/character/sprites/east/east_walk1.png"),
    require("../../../../../assets/character/sprites/east/east_walk2.png"),
    require("../../../../../assets/character/sprites/east/east_walk3.png"),
    require("../../../../../assets/character/sprites/east/east_walk4.png"),
  ],
};

const questions = [
  {
    question: "You encounter a complex intersection with stop lines, give way lines, and pedestrian crossings all present. You're turning right, and pedestrians are crossing your intended path.",
    options: [
      "Proceed with your turn since vehicles have right of way over pedestrians",
      "Stop at the stop line, yield to pedestrians, then complete your turn when safe",
      "Turn quickly before more pedestrians enter the crosswalk"
    ],
    correct: "Stop at the stop line, yield to pedestrians, then complete your turn when safe",
    correctExplanation: "Correct! You must observe stop lines, yield to pedestrians at crossings, and proceed only when safe.",
    wrongExplanations: {
      "Proceed with your turn since vehicles have right of way over pedestrians": "Wrong! Pedestrians have right of way at designated crossings, even when vehicles are turning.",
      "Turn quickly before more pedestrians enter the crosswalk": "Accident Prone! Rushing through crosswalks endangers pedestrians and violates their right of way."
    }
  },
];

export default function DrivingGame() {
  const {
    updateScenarioProgress,
    moveToNextScenario,
    completeSession,
    currentScenario,
  } = useSession();

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const scenarioId = 10 + (currentScenario || 0);
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
  const [isCarVisible, setIsCarVisible] = useState(true);
  const [carDirection, setCarDirection] = useState("NORTH");
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);

  // Pedestrian state
  const [pedestrianVisible, setPedestrianVisible] = useState(true);
  const [pedestrianDirection, setPedestrianDirection] = useState("EAST");
  const [pedestrianFrame, setPedestrianFrame] = useState(0);
  const [pedestrianAnimating, setPedestrianAnimating] = useState(true);
  const pedestrianInitialX = width * 0.10; // Start on left side
  const pedestrianXAnim = useRef(new Animated.Value(pedestrianInitialX)).current;

  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;

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

  // Pedestrian animation frame cycling
  useEffect(() => {
    let iv;
    if (pedestrianAnimating) {
      iv = setInterval(() => {
        setPedestrianFrame((p) => (p + 1) % maleSprites[pedestrianDirection].length);
      }, 150);
    }
    return () => clearInterval(iv);
  }, [pedestrianAnimating, pedestrianDirection]);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);

    const stopRow = 5;
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
    setIsCorrectAnswer(answerGiven === questions[questionIndex].correct);
    setAnimationType(answerGiven === questions[questionIndex].correct ? "correct" : "wrong");
    setTimeout(() => setShowNext(true), 500);
  };

  const handleAnswer = async (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const isCorrect = answer === questions[questionIndex].correct;
    await updateProgress(answer, isCorrect);

    const currentRow = Math.abs(currentScroll.current - startOffset) / tileSize;

if (answer === "Proceed with your turn since vehicles have right of way over pedestrians") {
      // WRONG: Car proceeds and turns without yielding - pedestrian is crossing
      // Step 1: Start pedestrian crossing animation
      const rightX = width * 0.75;
      Animated.timing(pedestrianXAnim, {
        toValue: rightX,
        duration: 2000,
        useNativeDriver: true,
      }).start();

      // Step 2: Move north into intersection
      Animated.timing(scrollY, {
        toValue: currentScroll.current + tileSize * 1.5,
        duration: 1200,
        useNativeDriver: true,
      }).start(() => {
        // Step 3: Turn to face east
        setCarDirection("EAST");
        setTimeout(() => {
          // Step 4: Move east (while pedestrian is still crossing - dangerous!)
          Animated.timing(carXAnim, {
            toValue: (width / 2 - carWidth / 2) + tileSize * 2,
            duration: 800,
            useNativeDriver: false,
          }).start(() => {
            handleFeedback(answer);
          });
        }, 300);
      });

    } else if (answer === "Stop at the stop line, yield to pedestrians, then complete your turn when safe") {
      // CORRECT: Stop, let pedestrian cross, then proceed
      const stopAtCrossingRow = 5;
      const rowsToMove = stopAtCrossingRow - currentRow;
      const stopTarget = currentScroll.current + rowsToMove * tileSize;

      Animated.timing(scrollY, {
        toValue: stopTarget,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        setCarPaused(true);

        // Animate pedestrian crossing from left to right
        const rightX = width * 0.75;
        Animated.timing(pedestrianXAnim, {
          toValue: rightX,
          duration: 3000,
          useNativeDriver: true,
        }).start(() => {
          setPedestrianVisible(false);
          setPedestrianAnimating(false);
          
          setTimeout(() => {
            setCarPaused(false);
            
            // Step 1: Move north into intersection
            Animated.timing(scrollY, {
              toValue: stopTarget + tileSize * 1.5,
              duration: 1200,
              useNativeDriver: true,
            }).start(() => {
              // Step 2: Turn to face east
              setCarDirection("EAST");
              setTimeout(() => {
                // Step 3: Move east
                Animated.timing(carXAnim, {
                  toValue: (width / 2 - carWidth / 2) + tileSize * 2,
                  duration: 2000,
                  useNativeDriver: false,
                }).start(() => {
                  handleFeedback(answer);
                });
              }, 300);
            });
          }, 500);
        });
      });

    } else if (answer === "Turn quickly before more pedestrians enter the crosswalk") {
      // WRONG: Rush through dangerously
      // Step 1: Quick move north into intersection
      Animated.timing(scrollY, {
        toValue: currentScroll.current + tileSize * 1.5,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        // Step 2: Quick turn to face east
        setCarDirection("EAST");
        setTimeout(() => {
          // Step 3: Rush east
          Animated.timing(carXAnim, {
            toValue: (width / 2 - carWidth / 2) + tileSize * 2,
            duration: 1000,
            useNativeDriver: false,
          }).start(() => {
            handleFeedback(answer);
          });
        }, 200);
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

    // Reset pedestrian
    setPedestrianVisible(true);
    setPedestrianAnimating(true);
    pedestrianXAnim.setValue(pedestrianInitialX);

    carXAnim.setValue(width / 2 - carWidth / 2);
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
      try {
        await moveToNextScenario();
        const nextScreen = `S${currentScenario + 1}P2`;
        console.log('Navigating to:', nextScreen);
        router.push(`/scenarios/road-markings/phase2/${nextScreen}`);
      } catch (error) {
        console.error('Navigation error:', error);
        Alert.alert('Error', 'Failed to navigate to next scenario');
      }
    }
  };

  const getFeedbackMessage = () => {
    if (!selectedAnswer || isCorrectAnswer === null) return "";
    
    if (isCorrectAnswer) {
      return questions[questionIndex]?.correctExplanation || "";
    }
    
    return questions[questionIndex]?.wrongExplanations?.[selectedAnswer] || "Wrong answer!";
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: mapHeight,
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
        
        {/* Pedestrian positioned on the map */}
        {pedestrianVisible && (
          <Animated.View
            style={{
              position: "absolute",
              width: spriteWidth,
              height: spriteHeight,
              top: 9 * tileSize,
              transform: [{ translateX: pedestrianXAnim }],
              zIndex: 6,
            }}
          >
            <Image
              source={maleSprites[pedestrianDirection][pedestrianFrame]}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </Animated.View>
        )}
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
          {questions[questionIndex].options.map((option, idx) => (
            <TouchableOpacity
              key={`${option}-${idx}`}
              style={styles.answerButton}
              onPress={() => handleAnswer(option)}
            >
              <Text style={styles.answerText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {(animationType === "correct" || animationType === "wrong") && (
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>
              {getFeedbackMessage()}
            </Text>
          </View>
        </View>
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
  introSubtitle: {
    color: "#aaa",
    fontSize: Math.min(width * 0.05, 22),
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
    fontSize: Math.min(width * 0.045, 22),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.12,
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