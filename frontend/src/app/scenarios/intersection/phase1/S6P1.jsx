import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { router } from 'expo-router';
import { useSession } from '../../../contexts/SessionManager';

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
  road2: require("../../../../../assets/road/road2.png"),
  road3: require("../../../../../assets/road/road3.png"),
  road4: require("../../../../../assets/road/road4.png"),
  road9: require("../../../../../assets/road/road9.png"),
  road11: require("../../../../../assets/road/road11.png"),
  road12: require("../../../../../assets/road/road12.png"),
  road15: require("../../../../../assets/road/road15.png"),
  road16: require("../../../../../assets/road/road16.png"),
  road17: require("../../../../../assets/road/road17.png"), 
  road47: require("../../../../../assets/road/road47.png"),
  road48: require("../../../../../assets/road/road48.png"),
  road50: require("../../../../../assets/road/road50.png"),
  road54: require("../../../../../assets/road/road54.png"),
  road55: require("../../../../../assets/road/road55.png"),
  road56: require("../../../../../assets/road/road56.png"),
  road76: require("../../../../../assets/road/road76.png"),
  int1: require("../../../../../assets/road/int1.png"),
  int4: require("../../../../../assets/road/int4.png"),
  int10: require("../../../../../assets/road/int10.png"),
  int12: require("../../../../../assets/road/int12.png"),
  int13: require("../../../../../assets/road/int13.png"),
  int14: require("../../../../../assets/road/int14.png"),
  int15: require("../../../../../assets/road/int15.png"),
};

const mapLayout = [
  ["road3", "road4", "road2", "road3", "road17"],
  ["road3", "road4", "road2", "road3", "road17"],
  ["road3", "road4", "road2", "road3", "road17"],
  ["road15", "road15", "road15", "road56", "road50"],
  ["int12", "int12", "int12", "int4", "road55"],
  ["road48", "road48", "int14", "int13", "road54"],
  ["int15", "int14", "road48", "int13", "road54"],
  ["int14", "int15", "road48", "int13", "road54"],
  ["road48", "road48", "int15", "int13", "road54"],
  ["int10", "int10", "int10", "int1", "road47"],
  ["road15", "road15", "road15", "road56", "road16"],
  ["road3", "road76", "road76", "road76", "road17"],
  ["road3", "road9", "road11", "road12", "road17"],
  ["road3", "road4", "road2", "road3", "road17"],
  ["road3", "road4", "road2", "road3", "road17"],
  ["road3", "road4", "road2", "road3", "road17"],
  ["road3", "road4", "road2", "road3", "road17"],
  ["road3", "road4", "road2", "road3", "road17"],
  ["road3", "road4", "road2", "road3", "road17"],

];

const carSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
  NORTHEAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
};

const busSprites = {
  NORTH: [
    require("../../../../../assets/car/BUS TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_BUS_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/BUS TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_BUS_CLEAN_NORTH_001.png"),
  ],
};

const treeSprites = {
  tree1: require("../../../../../assets/tree/Tree3_idle_s.png"),
  // Add more tree variations if you have them
  // tree2: require("../assets/tree/Tree2_idle_s"),
  // tree3: require("../assets/tree/Tree1_idle_s"),
};
const treePositions = [
  // right side trees
    { row: 10, col: 4.3, type: 'tree1' },
    { row: 11, col: 4.3, type: 'tree1' },
    { row: 12, col: 4.3, type: 'tree1' },
    { row: 13, col: 4.3, type: 'tree1' },
    { row: 14, col: 4.3, type: 'tree1' },
    { row: 15, col: 4.3, type: 'tree1' },
    { row: 16, col: 4.3, type: 'tree1' },
    { row: 17, col: 4.3, type: 'tree1' },
    { row: 18, col: 4.3, type: 'tree1' },
];

// Stationary bus position (right lane, near the signs)
const busPosition = {
  row: 12,
  col: 2.2, // Right lane position
};

const questions = [
  {
    question: "You're at a busy Manila intersection with an Intersection Direction Sign showing Manila ⬅, Legaspi ➡. You need to go to Legaspi, but the right lane is occupied by a stopped bus loading passengers.",
    options: ["Quickly change to the right lane behind the bus", "Stay in your current lane, signal right early, and merge when safe", "Go straight and make a U-turn later"],
    correct: "Stay in your current lane, signal right early, and merge when safe",
    wrongExplanation: {
      "Quickly change to the right lane behind the bus": "Wrong! Quick, unsignaled lane changes near intersections are dangerous and illegal.",
      "Go straight and make a U-turn later": "Wrong! Making unnecessary U-turns wastes time and fuel, and may be illegal in some areas."
    }
  },
  // Add more questions here as needed
];

const trafficSign = {
  sign: require("../../../../../assets/signs/dir_sign_3.png"),
};
const trafficSign2 = {
  sign: require("../../../../../assets/signs/t_junction4.png"),
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

  // Traffic Sign position (place it before the pedestrian crossing)
  const trafficSignRowIndex = 14; // One row before the 'crossing' point
  const trafficSignColIndex = 4; // Left side of the road
  const trafficSignXOffset = -30;

  const trafficSign2RowIndex = 15; // One row before the 'crossing' point
  const trafficSign2ColIndex = 4; // Left side of the road
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
    const stopRow = 2; // Adjusted to match the visual stop point
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

  // Car sprite frame loop (stops when carPaused=true)
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
        setIsCorrectAnswer(true); // Set to true for correct feedback
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
        setIsCorrectAnswer(false); // Set to false for wrong feedback
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

    if (answer === "Quickly change to the right lane behind the bus") {
      // Move to lane change position (row 11-12)
      const laneChangeRow = 2;
      const initialScrollTarget = currentScroll.current + (laneChangeRow - currentRow) * tileSize;

      Animated.timing(scrollY, {
        toValue: initialScrollTarget,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        // Start lane change animation
        setCarDirection("NORTHEAST");
        setCarFrame(0);

        const currentCarX = carXAnim._value;
        const currentScrollY = scrollY._value;
        
        // Move diagonally to right lane
        Animated.parallel([
          Animated.timing(carXAnim, {
            toValue: currentCarX + tileSize * 0.8, // Move to right lane
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(scrollY, {
            toValue: currentScrollY + tileSize * 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Straighten out in right lane
          setCarDirection("NORTH");
          setCarFrame(0);

          // Move forward slightly then stop behind bus
          Animated.timing(scrollY, {
            toValue: scrollY._value + tileSize * 0.5,
            duration: 600,
            useNativeDriver: true,
          }).start(() => {
            setCarPaused(true);
            setTimeout(() => {
              handleFeedback(answer);
            }, 500);
          });
        });
      });
      return;
    } else if (answer === "Stay in your current lane, signal right early, and merge when safe") {
        // Continue straight in current lane
        const passRow = 5; // Pass the bus position
        const passTarget = currentScroll.current + (passRow - currentRow) * tileSize;

        setCarPaused(true);
        setTimeout(() => {
          setCarPaused(false);
          Animated.timing(scrollY, {
            toValue: passTarget,
            duration: 1500,
            useNativeDriver: true,
          }).start(() => {
            // Now merge to right lane after passing the bus
            setCarDirection("NORTHEAST");
            setCarFrame(0);

            const currentCarX = carXAnim._value;
            const currentScrollY = scrollY._value;

            Animated.parallel([
              Animated.timing(carXAnim, {
                toValue: currentCarX + tileSize * 0.8, // Move to right lane
                duration: 800,
                useNativeDriver: false,
              }),
              Animated.timing(scrollY, {
                toValue: currentScrollY + tileSize * 0.8,
                duration: 800,
                useNativeDriver: true,
              }),
            ]).start(() => {
              setCarDirection("NORTH");
              setCarFrame(0);

              // Continue forward in right lane
              Animated.timing(scrollY, {
                toValue: scrollY._value + tileSize * .5,
                duration: 800,
                useNativeDriver: true,
              }).start(() => {
                handleFeedback(answer);
              });
            });
          });
        }, 800);
    } else if(answer === "Go straight and make a U-turn later"){
        const targetRow = 15;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;

        setCarPaused(true); // Car pauses as if yielding
        setTimeout(() => {
            setCarPaused(false); // Car resumes after a short pause
            Animated.timing(scrollY, {
                toValue: nextTarget,
                duration: 2000,
                useNativeDriver: true,
            }).start(() => {
                handleFeedback(answer);
            });
        }); // Added delay duration
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    
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
      // Move to next scenario
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
    ? "Correct! Early signaling allows other drivers to accommodate your lane change, and waiting for a safe opportunity prevents accidents."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  // Ensure car sprite exists for current direction
  const currentCarSprite = carSprites[carDirection] && carSprites[carDirection][carFrame] 
    ? carSprites[carDirection][carFrame] 
    : carSprites["NORTH"][0];

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
        {/* Traffic Sign */}
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
        
        {/* Stationary Bus in right lane */}
        <Image
          source={busSprites.NORTH[0]}
          style={{
            width: carWidth * 2,
            height: carHeight * 2,
            position: "absolute",
            left: busPosition.col * tileSize,
            top: busPosition.row * tileSize,
            zIndex: 9,
          }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Car - fixed */}
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

      {/* Question overlay - moved to bottom */}
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

      {/* Answers - moved above bottom overlay */}
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

      {/* Feedback - moved to bottom */}
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

      {/* Next button - positioned above bottom overlay */}
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
    fontSize: Math.min(width * 0.045, 18),
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
    fontSize: Math.min(width * 0.06, 20),
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