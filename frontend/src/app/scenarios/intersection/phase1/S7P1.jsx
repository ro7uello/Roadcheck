import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { router } from 'expo-router';
import { useSession } from '../../../../contexts/SessionManager';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

const roadTiles = {
  road2: require("../../../../../assets/road/road2.png"),
  road3: require("../../../../../assets/road/road3.png"),
  road4: require("../../../../../assets/road/road4.png"),
  road48: require("../../../../../assets/road/road48.png"),
  road80: require("../../../../../assets/road/road80.png"),
  road87: require("../../../../../assets/road/road87.png"),
  road92: require("../../../../../assets/road/road92.png"),
};

const mapLayout = [
  ["road4", "road3", "road4", "road3", "road80"],
  ["road4", "road3", "road4", "road3", "road80"],
  ["road4", "road3", "road4", "road3", "road80"],
  ["road4", "road3", "road4", "road3", "road80"],
  ["road4", "road3", "road4", "road2", "road92"],
  ["road4", "road3", "road4", "road2", "road48"],
  ["road4", "road3", "road4", "road2", "road87"],
  ["road4", "road3", "road4", "road3", "road80"],
  ["road4", "road3", "road4", "road3", "road80"],
  ["road4", "road3", "road4", "road3", "road80"],
  ["road4", "road3", "road4", "road3", "road80"],
  ["road4", "road3", "road4", "road3", "road80"],
  ["road4", "road3", "road4", "road3", "road80"],
];

const carSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

const truckSprites = {
  NORTH: [
    require("../../../../../assets/car/BOX TRUCK TOPDOWN/White/MOVE/NORTH/SEPARATED/White_BOXTRUCK_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/BOX TRUCK TOPDOWN/White/MOVE/NORTH/SEPARATED/White_BOXTRUCK_CLEAN_NORTH_001.png"),
  ], 
  NORTHWEST: [
    require("../../../../../assets/car/BOX TRUCK TOPDOWN/White/MOVE/NORTHWEST/SEPARATED/White_BOXTRUCK_CLEAN_NORTHWEST_000.png"),
    require("../../../../../assets/car/BOX TRUCK TOPDOWN/White/MOVE/NORTHWEST/SEPARATED/White_BOXTRUCK_CLEAN_NORTHWEST_001.png"),
  ]
};

const npcCarSprite1 = {
  NORTH: [
    require("../../../../../assets/car/SEDAN TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SEDAN_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/SEDAN TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SEDAN_CLEAN_NORTH_001.png"),
  ],
};
const npcCarSprite2 = {
  NORTH: [
    require("../../../../../assets/car/SEDAN TOPDOWN/Green/MOVE/NORTH/SEPARATED/Green_SEDAN_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/SEDAN TOPDOWN/Green/MOVE/NORTH/SEPARATED/Green_SEDAN_CLEAN_NORTH_001.png"),
  ],
};
const npcCarSprite3 = {
  NORTH: [
    require("../../../../../assets/car/SEDAN TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_SEDAN_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/SEDAN TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_SEDAN_CLEAN_NORTH_001.png"),
  ],
};
const questions = [
  {
    question: "You see an Approach to intersection merging traffic sign while driving in Quezon City. Traffic from your right is merging onto your road, and a delivery truck is approaching from that merge point.",
    options: ["Maintain your speed since merging traffic must yield", "Slow down slightly and create space for smooth merging", "Speed up to get ahead of the merging traffic"],
    correct: "Slow down slightly and create space for smooth merging",
    wrongExplanation: {
      "Maintain your speed since merging traffic must yield": "Not the best! While legally correct, this approach can create dangerous situations and traffic congestion.",
      "Speed up to get ahead of the merging traffic": "Wrong! Speeding up during merging situations increases accident risk and shows aggressive driving behavior."
    }
  },
  // Add more questions here as needed
];

const trafficSign = {
  sign: require("../../../../../assets/signs/t_junction5.png"),
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
  const [isTruckVisible, setIsTruckVisible] = useState(true);

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  // Truck animation
  const [truckFrame, setTruckFrame] = useState(0);
  const [truckDirection, setTruckDirection] = useState("NORTHWEST");
  // Adjusted initial truck position to row 6, column 4
  const truckXAnim = useRef(new Animated.Value(4.2 * tileSize)).current; // Column 4
  const truckYAnim = useRef(new Animated.Value(5.5 * tileSize)).current; // Row 6


  // NPC Cars
  const npcCar1XAnim = useRef(new Animated.Value(2.5 * tileSize)).current;
  const npcCar1YAnim = useRef(new Animated.Value(3 * tileSize)).current; // Adjusted position
  
  const npcCar2XAnim = useRef(new Animated.Value(3.5 * tileSize)).current;
  const npcCar2YAnim = useRef(new Animated.Value(2 * tileSize)).current; // Adjusted position
  
  const npcCar3XAnim = useRef(new Animated.Value(2.5 * tileSize)).current;
  const npcCar3YAnim = useRef(new Animated.Value(1 * tileSize)).current; // Adjusted position


  // Traffic Sign position (place it before the pedestrian crossing)
  const trafficSignRowIndex = 7; // One row before the 'crossing' point
  const trafficSignColIndex = 4; // Left side of the road
  const trafficSignXOffset = -30;

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
    const stopRow = 6; // Adjusted to match the visual stop point
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

  // Truck sprite frame loop
  useEffect(() => {
    let iv;
    if (isTruckVisible && truckSprites[truckDirection]) {
      iv = setInterval(() => {
        setTruckFrame((p) => (p + 1) % truckSprites[truckDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [isTruckVisible, truckDirection]);

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

    if (answer === "Speed up to get ahead of the merging traffic") {
     const targetRow = 8;
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
    } else if (answer === "Maintain your speed since merging traffic must yield") {
      // Maintain speed - normal animation, truck stays stationary
      const targetRow = 8;
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
     } else if(answer === "Slow down slightly and create space for smooth merging"){
      setCarPaused(true); // Pause the user's car immediately
      setIsTruckVisible(true); // Ensure truck stays visible
      
      // Add a short delay to show the car pausing before truck moves
      setTimeout(() => {
        setTruckDirection("NORTHWEST"); // Start with diagonal movement

        // 1. Animate the truck moving diagonally right and up (NORTHWEST)
        Animated.parallel([
          Animated.timing(truckXAnim, { // Move right to the right lane
            toValue: 3.2 * tileSize, // Target X for the right lane
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(truckYAnim, { // Move up while merging
            toValue: 5 * tileSize, // Intermediate position
            duration: 1500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Switch to NORTH direction for straight movement
          setTruckDirection("NORTH");
          
          // 2. Continue moving straight up (NORTH)
          Animated.timing(truckYAnim, {
            toValue: 4 * tileSize, // Final stop position at row 9
            duration: 1000,
            useNativeDriver: true,
          }).start(() => {
            // Truck animation complete, now move the user's car
            setCarPaused(false); // Allow user's car to resume animation

            const targetRow = 8; // Row past where the truck stopped
            const rowsToMove = targetRow - currentRow;
            const nextTarget = currentScroll.current + rowsToMove * tileSize;

            Animated.timing(scrollY, {
              toValue: nextTarget,
              duration: 2000, // Duration for the car to move past the truck
              useNativeDriver: true,
            }).start(() => {
              handleFeedback(answer);
            });
          });
        });
      }, 500); // 500ms delay to show car pausing first

      return; // Return immediately to prevent other animations from firing
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
    
    // Reset truck position and visibility
    truckXAnim.setValue(4.2 * tileSize); // Reset to adjusted initial position (col 4)
    truckYAnim.setValue(5.5 * tileSize); // Reset to adjusted initial position (row 6)
    setTruckDirection("NORTHWEST");
    setIsTruckVisible(true);
    setTruckFrame(0);
    
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

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Defensive driving and traffic courtesy require helping merging traffic when safe to do so. This keeps traffic flowing smoothly"
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  // Ensure car sprite exists for current direction
  const currentCarSprite = carSprites[carDirection] && carSprites[carDirection][carFrame] 
    ? carSprites[carDirection][carFrame] 
    : carSprites["NORTH"][0];

  // Truck sprite
  const currentTruckSprite = truckSprites[truckDirection] && truckSprites[truckDirection][truckFrame]
    ? truckSprites[truckDirection][truckFrame]
    : truckSprites["NORTH"][0];

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

        {/* NPC Cars - Traffic Jam */}
        <Animated.Image
          source={npcCarSprite1.NORTH[0]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            transform: [
              { translateX: npcCar1XAnim },
              { translateY: npcCar1YAnim }
            ],
            marginLeft: -carWidth / 2,
            marginTop: -carHeight / 2,
            zIndex: 5,
          }}
        />
        <Animated.Image
          source={npcCarSprite2.NORTH[0]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            transform: [
              { translateX: npcCar2XAnim },
              { translateY: npcCar2YAnim }
            ],
            marginLeft: -carWidth / 2,
            marginTop: -carHeight / 2,
            zIndex: 5,
          }}
        />
        <Animated.Image
          source={npcCarSprite3.NORTH[0]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            transform: [
              { translateX: npcCar3XAnim },
              { translateY: npcCar3YAnim }
            ],
            marginLeft: -carWidth / 2,
            marginTop: -carHeight / 2,
            zIndex: 5,
          }}
        />

        {/* Truck */}
        {isTruckVisible && (
          <Animated.Image
            source={currentTruckSprite}
            style={{
              width: carWidth,
              height: carHeight,
              position: "absolute",
              transform: [
                { translateX: truckXAnim },
                { translateY: truckYAnim }
              ],
              marginLeft: -carWidth / 2,
              marginTop: -carHeight / 2,
              zIndex: 6,
            }}
          />
        )}
        
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