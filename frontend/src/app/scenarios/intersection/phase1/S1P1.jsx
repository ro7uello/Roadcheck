import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { router } from 'expo-router';
import { useSession } from '../../../../contexts/SessionManager';
import { scale, fontSize, wp, hp } from '../../../../contexts/ResponsiveHelper';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

const roadTiles = {
    road1: require("../../../../../assets/road/road1.png"),
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
    road59: require("../../../../../assets/road/road59.png"),
    road60: require("../../../../../assets/road/road60.png"),
    road76: require("../../../../../assets/road/road76.png"),
    road84: require("../../../../../assets/road/road84.png"),
    road85: require("../../../../../assets/road/road85.png"),
  int1: require("../../../../../assets/road/int1.png"),
  int2: require("../../../../../assets/road/int2.png"),
  int3: require("../../../../../assets/road/int3.png"),
  int4: require("../../../../../assets/road/int4.png"),
};

const mapLayout = [
  ["road20", "road20", "road20", "road20", "road20"],
  ["road20", "road20", "road20", "road20", "road20"],
  ["road52", "road52", "road52", "road52", "road52"],
  ["road24", "int3", "int4", "road85", "road24"],
  ["road84", "int2", "int1", "road23", "road23"],
  ["road19", "road1", "road76", "road16", "road51"],
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
};

const treeSprites = {
  tree1: require("../../../../../assets/tree/Tree3_idle_s.png"),
};

const treePositions = [
  // Left side trees (column -1, outside the road)
    { row: 5, col: 0, type: 'tree1' },
    { row: 6, col: 0, type: 'tree1' },
    { row: 7, col: 0, type: 'tree1' },
    { row: 8, col: 0, type: 'tree1' },
    { row: 9, col: 0, type: 'tree1' },
    { row: 10, col: 0, type: 'tree1' },
    { row: 11, col: 0, type: 'tree1' },
    { row: 12, col: 0, type: 'tree1' },
    { row: 13, col: 0, type: 'tree1' },
    { row: 14, col: 0, type: 'tree1' },
  // right side trees
    { row: 5, col: 3.5, type: 'tree1' },
    { row: 6, col: 3.5, type: 'tree1' },
    { row: 7, col: 3.5, type: 'tree1' },
    { row: 8, col: 3.5, type: 'tree1' },
    { row: 9, col: 3.5, type: 'tree1' },
    { row: 10, col: 3.5, type: 'tree1' },
    { row: 11, col: 3.5, type: 'tree1' },
    { row: 12, col: 3.5, type: 'tree1' },
    { row: 13, col: 3.5, type: 'tree1' },
    { row: 14, col: 3.5, type: 'tree1' },
// scattered trees right side
    { row: 5.5, col: 4, type: 'tree1' },
    { row: 6.5, col: 4, type: 'tree1' },
    { row: 7.5, col: 4, type: 'tree1' },
    { row: 8.5, col: 4, type: 'tree1' },
    { row: 9.5, col: 4, type: 'tree1' },
    { row: 10.5, col: 4, type: 'tree1' },
    { row: 11.5, col: 4, type: 'tree1' },
    { row: 12.5, col: 4, type: 'tree1' },
    { row: 13.5, col: 4, type: 'tree1' },
    { row: 14.5, col: 4, type: 'tree1' },
    //top side trees
    { row: 1.4, col: 0, type: 'tree1' },
    { row: 1.4, col: 1, type: 'tree1' },
    { row: 1.4, col: 2, type: 'tree1' },
    { row: 1.4, col: 3, type: 'tree1' },
    { row: 1.4, col: 4, type: 'tree1' },
    { row: 1, col: 0.5, type: 'tree1' },
    { row: 1, col: 1.5, type: 'tree1' },
    { row: 1, col: 2.5, type: 'tree1' },
    { row: 1, col: 3.5, type: 'tree1' },
    { row: 1, col: 4.5, type: 'tree1' },
];

const questions = [
  {
    question: "You're driving along EDSA and see a T-Junction ahead warning sign followed by an intersection direction sign showing Mandaluyong ➡ and Makati ⬅. Traffic is moderate, and you need to go to Makati.",
    options: ["Speed up to beat the traffic and make a quick left turn", "Slow down, check for oncoming traffic, signal left, and turn when safe", "Stop completely at the intersection and wait for all traffic to clear"],
    correct: "Slow down, check for oncoming traffic, signal left, and turn when safe",
    wrongExplanation: {
      "Speed up to beat the traffic and make a quick left turn": "Wrong! Speeding up near intersections is dangerous and violates traffic safety rules. The T-junction sign warns you to prepare for the intersection.",
      "Stop completely at the intersection and wait for all traffic to clear": "Wrong! Stopping completely when not required can cause traffic congestion and rear-end collisions. You only need to yield, not stop completely."
    }
  },
];

const trafficSign = {
  sign: require("../../../../../assets/signs/dir_sign_1.png"),
};
const trafficSign2 = {
  sign: require("../../../../../assets/signs/t_junction1.png"),
};

export default function DrivingGame() {

  const {
    updateScenarioProgress,
    moveToNextScenario,
    completeSession,
    currentScenario,
    sessionData
  } = useSession();

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isCarVisible, setIsCarVisible] = useState(true);

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  // Traffic Sign position
  const trafficSignRowIndex = 4.8;
  const trafficSignColIndex = 3;
  const trafficSignXOffset = -30;

  const trafficSign2RowIndex = 5.3;
  const trafficSign2ColIndex = 3;
  const trafficSign2XOffset = -30;

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      currentScroll.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  // UI/game states
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);
  const [carDirection, setCarDirection] = useState("NORTH");

  // Car
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      // Intersection Phase 1: scenarios 61-70
      const scenarioId = 60 + currentScenario;
      
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

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopRow = 8;
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
    if (!carPaused && carSprites[carDirection]) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites[carDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused, carDirection]);

  // feedback anims
  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);

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

    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);

    if (answer === "Speed up to beat the traffic and make a quick left turn") {
      const turnStartRow = 10;
      const initialScrollTarget = currentScroll.current + (turnStartRow - currentRow) * tileSize;

      Animated.timing(scrollY, {
        toValue: initialScrollTarget,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        const turnSequence = ["NORTH", "NORTHWEST", "WEST"];
        let currentTurnStep = 0;

        const animateTurnAndMove = () => {
          if (currentTurnStep < turnSequence.length) {
            setCarDirection(turnSequence[currentTurnStep]);
            setCarFrame(0);

            let deltaX = 0;
            let deltaYScroll = 0;

            if (turnSequence[currentTurnStep] === "NORTHWEST") {
              deltaX = -tileSize / 4;
              deltaYScroll = tileSize / 4;
            } else if (turnSequence[currentTurnStep] === "WEST") {
              deltaX = -tileSize / 2;
              deltaYScroll = tileSize / 2;
            }

            const currentCarX = carXAnim._value;
            const currentScrollY = scrollY._value;

            Animated.parallel([
              Animated.timing(carXAnim, {
                toValue: currentCarX + deltaX,
                duration: 300,
                useNativeDriver: false,
              }),
              Animated.timing(scrollY, {
                toValue: currentScrollY + deltaYScroll,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start(() => {
              currentTurnStep++;
              animateTurnAndMove();
            });
          } else {
            Animated.timing(carXAnim, {
              toValue: -width,
              duration: 2500,
              useNativeDriver: false,
            }).start(() => {
              setIsCarVisible(false);
              handleFeedback(answer);
            });
          }
        };
        animateTurnAndMove();
      });
      return;
    } else if (answer === "Stop completely at the intersection and wait for all traffic to clear") {
        const targetRow = 8;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;

        setCarPaused(true);
        setTimeout(() => {
            setCarPaused(false);
            Animated.timing(scrollY, {
                toValue: nextTarget,
                duration: 2000,
                useNativeDriver: true,
            }).start(() => {
                handleFeedback(answer);
            });
        }, 1500);
    } else if(answer === "Slow down, check for oncoming traffic, signal left, and turn when safe"){
        const turnStartRow = 10;
        const initialScrollTarget = currentScroll.current + (turnStartRow - currentRow) * tileSize;

        Animated.timing(scrollY, {
          toValue: initialScrollTarget,
          duration: 2000,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(() => {
            const turnSequence = ["NORTH", "NORTHWEST", "WEST"];
            let currentTurnStep = 0;

            const animateTurnAndMove = () => {
              if (currentTurnStep < turnSequence.length) {
                setCarDirection(turnSequence[currentTurnStep]);
                setCarFrame(0);

                let deltaX = 0;
                let deltaYScroll = 0;

                if (turnSequence[currentTurnStep] === "NORTHWEST") {
                  deltaX = -tileSize / 4;
                  deltaYScroll = tileSize / 4;
                } else if (turnSequence[currentTurnStep] === "WEST") {
                  deltaX = -tileSize / 2;
                  deltaYScroll = tileSize / 2;
                }

                const currentCarX = carXAnim._value;
                const currentScrollY = scrollY._value;

                Animated.parallel([
                  Animated.timing(carXAnim, {
                    toValue: currentCarX + deltaX,
                    duration: 500,
                    useNativeDriver: false,
                  }),
                  Animated.timing(scrollY, {
                    toValue: currentScrollY + deltaYScroll,
                    duration: 500,
                    useNativeDriver: true,
                  }),
                ]).start(() => {
                  currentTurnStep++;
                  animateTurnAndMove();
                });
              } else {
                Animated.timing(carXAnim, {
                  toValue: -width,
                  duration: 1000,
                  useNativeDriver: false,
                }).start(() => {
                  setIsCarVisible(false);
                  handleFeedback(answer);
                });
              }
            };
            animateTurnAndMove();
          }, 1000);
        });
      return;
    }
  };

  const handleNext = async () => { 
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    setIsCorrectAnswer(null);
    
    // Reset car position and visibility
    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setCarPaused(false);
    
    if (questionIndex < questions.length - 1) {
      // Next question in current scenario
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario === 10) {
      // Last scenario - complete session
      try {
        console.log('🔍 Completing session for scenario 10...');
        const sessionResults = await completeSession();
        
        if (!sessionResults) {
          Alert.alert('Error', 'Failed to complete session.');
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
      // Move to next scenario (S1P1 → S2P1 → ... → S10P1)
      moveToNextScenario();
      const nextScreen = `S${currentScenario + 1}P1`;
      router.push(`/scenarios/intersection/phase1/${nextScreen}`);
    }
  };

  // Calculate traffic Sign position
  const trafficSignLeft = trafficSignColIndex * tileSize + trafficSignXOffset;
  const trafficSignTop = trafficSignRowIndex * tileSize;

  const trafficSign2Left = trafficSign2ColIndex * tileSize + trafficSign2XOffset;
  const trafficSign2Top = trafficSign2RowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! This follows proper intersection protocol - reduce speed when approaching intersections, signal your intention, check for oncoming traffic, and proceed when safe."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  const currentCarSprite = carSprites[carDirection] && carSprites[carDirection][carFrame] 
    ? carSprites[carDirection][carFrame] 
    : carSprites["NORTH"][0];

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
                source={trafficSign.sign}
                style={{
                    width: tileSize * .8,
                    height: tileSize *.8,
                    position: "absolute",
                    top: trafficSignTop,
                    left: trafficSignLeft,
                    zIndex: 11,
                }}
                resizeMode="contain"
                />
        <Image
                source={trafficSign2.sign}
                style={{
                    width: tileSize * .8,
                    height: tileSize *.8,
                    position: "absolute",
                    top: trafficSign2Top,
                    left: trafficSign2Left,
                    zIndex: 11,
                }}
                resizeMode="contain"
                />        

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
      </Animated.View>

      {isCarVisible && (
        <Animated.Image
          source={currentCarSprite}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: 80,
            left: carXAnim,
            zIndex: 8,
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
            <Text style={styles.feedbackText}>
                {feedbackMessage}
            </Text>
          </View>
        </View>
      )}

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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: fontSize(18),
    fontWeight: 'bold',
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
    fontSize: Math.min(width * 0.045, 18),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.2,
    right: sideMargin,
    width: wp(30)5,
    height: height * 0.21,
    zIndex: 11,
  },
  answerButton: {
    backgroundColor: "#333",
    padding: height * 0.015,
    borderRadius: scale(8),
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
    fontSize: Math.min(width * 0.06, 20),
    fontWeight: "bold",
    textAlign: "center",
  },
  nextButtonContainer: {
    position: "absolute",
    top: hp(50),
    right: wp(5),
    width: wp(20),
    alignItems: "center",
    zIndex: 11,
  },
  nextButton: {
    backgroundColor: "#007bff",
    paddingVertical: height * 0.015,
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: wp(15),
    alignItems: "center",
  },
  nextButtonText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
  },
});