import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { router } from 'expo-router';
import { useSession, SessionProvider } from '../../../../contexts/SessionManager';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350 / 280);
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300 / 240);
const sideMargin = width * 0.05;

const roadTiles = {
  road2: require("../../../../../assets/road/road2.png"),
  road3: require("../../../../../assets/road/road3.png"),
  road80: require("../../../../../assets/road/road80.png"),
  road92: require("../../../../../assets/road/road92.png"),
  road20: require("../../../../../assets/road/road20.png"),
road79:require("../../../../../assets/road/road79.png"),
road70:require("../../../../../assets/road/road70.png"),
road9222:require("../../../../../assets/road/road9222.png"),
};

const mapLayout = [
  ["road2", "road2", "road2", "road79", "road79"],
  ["road2", "road2", "road2", "road79", "road79"],
  ["road2", "road2", "road2", "road79", "road79"],
  ["road2", "road2", "road2", "road79", "road79"],
  ["road2", "road2", "road2", "road79", "road79"],
  ["road2", "road2", "road2", "road79", "road79"],
  ["road79", "road79", "road2", "road79", "road79"],
  ["road79", "road79", "road2", "road79", "road79"],
  ["road79", "road79", "road2", "road79", "road79"],
  ["road79", "road79", "road2", "road79", "road79"],
  ["road79", "road79", "road2", "road79", "road79"],
  ["road79", "road79", "road2", "road79", "road79"],
  ["road79", "road79", "road2", "road79", "road79"],
  ["road79", "road9222", "road2", "road79", "road79"],
  ["road9222", "road2", "road2", "road92", "road79"],
  ["road2", "road2", "road2", "road2", "road92"],
  ["road2", "road2", "road2", "road2", "road2"],
  ["road2", "road2", "road2", "road2", "road2"],
  ["road2", "road2", "road2", "road2", "road2"],
  ["road2", "road2", "road2", "road2", "road2"],
  ["road2", "road2", "road2", "road2", "road2"],
  ["road2", "road2", "road2", "road3", "road2"],
  ["road2", "road2", "road2", "road2", "road2"],
];

const carSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHEAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  NORTHWEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_001.png"),
  ],
  EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
  SOUTHEAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTHEAST/SEPARATED/Blue_CIVIC_CLEAN_SOUTHEAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTHEAST/SEPARATED/Blue_CIVIC_CLEAN_SOUTHEAST_001.png"),
  ],
  SOUTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTH/SEPARATED/Blue_CIVIC_CLEAN_SOUTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTH/SEPARATED/Blue_CIVIC_CLEAN_SOUTH_001.png"),
  ],
};

const npcCarSprites = {
  red: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_001.png"),
  ],
  black: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Black/MOVE/NORTH/SEPARATED/Black_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Black/MOVE/NORTH/SEPARATED/Black_CIVIC_CLEAN_NORTH_001.png"),
  ],
  blue: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  brown: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_CIVIC_CLEAN_NORTH_001.png"),
  ],
  green: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Green/MOVE/NORTH/SEPARATED/Green_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Green/MOVE/NORTH/SEPARATED/Green_CIVIC_CLEAN_NORTH_001.png"),
  ],
  white: [
    require("../../../../../assets/car/CIVIC TOPDOWN/White/MOVE/NORTH/SEPARATED/White_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/White/MOVE/NORTH/SEPARATED/White_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

const trafficSign = {
  sign: require("../../../../../assets/signs/road_narrows_ahead.png"),
};

const questions = [
  {
    question: "You're on NLEX approaching a construction zone where you see a ROAD NARROWS AHEAD sign. Traffic is heavy, and vehicles are traveling at about 60 kph in multiple lanes.",
    options: [
      "Speed up to get ahead of other vehicles before the merge",
      "Slow down, signal early, and merge safely when space allows", 
      "Continue in your current lane and let others merge around you"
    ],
    correct: "Slow down, signal early, and merge safely when space allows",
    wrongExplanation: {
      "Speed up to get ahead of other vehicles before the merge": "Accident prone! Racing to get ahead creates dangerous conditions and aggressive driving situations.",
      "Continue in your current lane and let others merge around you": "Wrong! If you're in the lane that's ending, you must merge; if not, you should help others merge safely."
    }
  },
];

function DrivingGameContent() {
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
  const startOffset = -(mapHeight - height);

  const [isCarVisible, setIsCarVisible] = useState(true);

  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  const trafficSignRowIndex = 14.6;
  const trafficSignColIndex = 3;
  const trafficSignXOffset = 20;

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

  // Car - start in lane 4 (rightmost road lane)
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  
  // Define lane positions (these are left positions for the car)
  const lane1X = width * 0.1 - carWidth / 2;  // leftmost
  const lane2X = width * 0.3 - carWidth / 2;
  const lane3X = width * 0.5 - carWidth / 2;
  const lane4X = width * 0.7 - carWidth / 2;  // Starting position
  const lane5X = width * 0.9 - carWidth / 2;  // rightmost (off-road)
  
  // Start car in lane 4
  const carXAnim = useRef(new Animated.Value(lane4X)).current;

  // NPC Cars - static traffic in lanes 1 and 2 only, at row 8
  const [npcCarFrames, setNpcCarFrames] = useState({
    lane1: 0,
    lane2: 0,
  });

  const npcCars = [
    { lane: 1, row: 8, color: 'red' },
    { lane: 2, row: 8, color: 'black' },
  ];

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const scenarioId = 20 + currentScenario;
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
    const stopRow = 5.6
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

  // Car sprite frame loop
  useEffect(() => {
    let iv;
    if (!carPaused && carSprites[carDirection]) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites[carDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused, carDirection]);

  // NPC Car sprite frame loops
  useEffect(() => {
    const intervals = [];
    Object.keys(npcCarFrames).forEach((key) => {
      const interval = setInterval(() => {
        setNpcCarFrames((prev) => ({
          ...prev,
          [key]: (prev[key] + 1) % 2,
        }));
      }, 200);
      intervals.push(interval);
    });
    return () => intervals.forEach(clearInterval);
  }, []);

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
      setTimeout(() => {
        setShowNext(true);
      }, 1000);
    } else {
      setIsCorrectAnswer(false);
      setAnimationType("wrong");
      setTimeout(() => {
        setShowNext(true);
      }, 1000);
    }
  };

const handleAnswer = async (answer) => {
  setSelectedAnswer(answer);
  setShowQuestion(false);
  setShowAnswers(false);

  const currentQuestion = questions[questionIndex];
  const isCorrect = answer === currentQuestion.correct;
  await updateProgress(answer, isCorrect);

  if (answer === "Speed up to get ahead of other vehicles before the merge") {
setCarDirection("NORTHWEST"); // 1. Face diagonally for the merge
    setCarFrame(0);

    const firstPartScroll = currentScroll.current + tileSize * 1;
    const secondPartScroll = firstPartScroll + tileSize * 2;

    // PART 1: The merge (diagonal)
    Animated.parallel([
      Animated.timing(carXAnim, {
        toValue: lane3X, // Merge from Lane 4 to Lane 3
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scrollY, {
        toValue: firstPartScroll,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // ---- Completion callback for Part 1 ----
      
      // 2. The merge is finished. NOW set the direction to NORTH.
      setCarDirection("NORTH");

      // PART 2: The second scroll (facing north)
      Animated.timing(scrollY, {
        toValue: secondPartScroll,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        // ---- Completion callback for Part 2 ----
        
        // 3. The entire animation is done.
        currentScroll.current = secondPartScroll;
        setCarFrame(0);
        setIsCarVisible(false);
        handleFeedback(answer);
      });
    });

    return;
  }

if (answer === "Slow down, signal early, and merge safely when space allows") {
    // From Lane 4 merge to Lane 3
    setCarDirection("NORTHWEST"); // 1. Face diagonally for the merge
    setCarFrame(0);

    const firstPartScroll = currentScroll.current + tileSize * 1;
    const secondPartScroll = firstPartScroll + tileSize * 2;

    // PART 1: The merge (diagonal)
    Animated.parallel([
      Animated.timing(carXAnim, {
        toValue: lane3X, // Merge from Lane 4 to Lane 3
        duration: 2500,
        useNativeDriver: true,
      }),
      Animated.timing(scrollY, {
        toValue: firstPartScroll,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // ---- Completion callback for Part 1 ----
      
      // 2. The merge is finished. NOW set the direction to NORTH.
      setCarDirection("NORTH");

      // PART 2: The second scroll (facing north)
      Animated.timing(scrollY, {
        toValue: secondPartScroll,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        // ---- Completion callback for Part 2 ----
        
        // 3. The entire animation is done.
        currentScroll.current = secondPartScroll;
        setCarFrame(0);
        setIsCarVisible(false);
        handleFeedback(answer);
      });
    });

    return;
  }

  if (answer === "Continue in your current lane and let others merge around you") {
    setCarDirection("NORTH");
    setCarFrame(0);

    const targetScroll = currentScroll.current + tileSize * 0.3;

    Animated.timing(scrollY, {
      toValue: targetScroll,
      duration: 6000,
      useNativeDriver: true,
    }).start(() => {
      currentScroll.current = targetScroll;
      setIsCarVisible(false);
      handleFeedback(answer);
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

    // Reset car position and visibility to lane 4
    carXAnim.setValue(lane4X);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setCarPaused(false);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario === 10) {
      try {
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
            router.push(`/scenarios/traffic-signs/phase3/S5P3`);

    }
  };

  const trafficSignLeft = trafficSignColIndex * tileSize + trafficSignXOffset;
  const trafficSignTop = trafficSignRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Early signaling communicates your intention to other drivers, giving them time to create space for safe merging."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  const currentCarSprite = (carSprites[carDirection] && carSprites[carDirection][carFrame])
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

        <Image
          source={trafficSign.sign}
          style={{
            width: tileSize * 1,
            height: tileSize * 1,
            position: "absolute",
           top: trafficSignTop,
            left: trafficSignLeft,
            zIndex: 11,
          }}
          resizeMode="contain"
        />

      </Animated.View>

      {/* Car - starts in lane 4, uses left positioning with translateX animation */}
      {isCarVisible && (
        <Animated.Image
          source={currentCarSprite}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: 80,
            left: 0,
            transform: [{ translateX: carXAnim }],
            zIndex: 8,
          }}
        />
  	)}

      {/* NPC Cars - static traffic in lanes 1 and 2 at row 8 */}
      {npcCars.map((npc, index) => {
        const lanePositions = [lane1X, lane2X];
        const laneIndex = [1, 2].indexOf(npc.lane);
        const laneKey = `lane${npc.lane}`;

        return (
          <Animated.Image
            key={`npc-${index}`}
            source={npcCarSprites[npc.color][npcCarFrames[laneKey] || 0]}
            style={{
              width: carWidth,
              height: carHeight,
             position: "absolute",
              top: npc.row * tileSize,
              left: lanePositions[laneIndex],
              transform: [{ translateY: scrollY }],
             zIndex: 7,
            }}
          />
        );
      })}

      {/* Question overlay */}
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

      {/* Next button */}
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

export default function DrivingGame() {
  return (
    <SessionProvider>
      <DrivingGameContent />
    </SessionProvider>
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
    fontSize: 18,
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
    padding: 0,
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
    top: height * 0.16,
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