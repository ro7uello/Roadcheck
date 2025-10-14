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
    road2: require("../../../../../assets/road/road2.png"),
    road93: require("../../../../../assets/road/road93.png"),
    road94: require("../../../../../assets/road/road94.png"),
    toll1: require("../../../../../assets/road/tollgate1.png"),
    toll2: require("../../../../../assets/road/tollgate2.png"),
    toll3: require("../../../../../assets/road/tollgate3.png"),

    "tollgate1-1": require("../../../../../assets/road/tollgate1-1.png"),
    "tollgate1-2": require("../../../../../assets/road/tollgate1-2.png"),
    "tollgate3-1": require("../../../../../assets/road/tollgate3-1.png"),
    "tollgate3-2": require("../../../../../assets/road/tollgate3-2.png"),
};

const mapLayout = [
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road94", "road94", "road94", "road94", "road94"],
  ["toll1", "toll1", "toll1", "toll2", "toll3"],
  ["road93", "road93", "road93", "road93", "road93"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road2", "road2", "road2", "road2", "road2"],
  ["road2", "road2", "road2", "road2", "road2"],
  ["road2", "road2", "road2", "road2", "road2"],
  ["road2", "road2", "road2", "road2", "road2"],
  ["road2", "road2", "road2", "road2", "road2"],
  ["road2", "road2", "road2", "road2", "road2"],
  ["road2", "road2", "road2", "road2", "road2"],
  ["road2", "road2", "road2", "road2", "road2"],
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


const questions = [
  {
    question: "You're driving on NLEX and see a TOLL PLAZA AHEAD 2 km sign followed by a PAY TOLL AHEAD sign. You're in the right lane but notice it's moving very slowly. The middle lanes seem to be moving faster, and you have an RFID tag.",
    options: ["Stay in your current lane since you're already positioned", "Change to the middle lane immediately without signaling", "Signal and carefully change to an RFID lane when safe"],
    correct: "Signal and carefully change to an RFID lane when safe",
    wrongExplanation: {
      "Stay in your current lane since you're already positioned": "Wrong! If you have RFID and the right lane is for cash payments, you'll waste time and may not be in the correct lane type.",
      "Change to the middle lane immediately without signaling": "Accident prone!  Changing lanes without signaling is dangerous, especially near toll plazas where traffic patterns change."
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

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isCarVisible, setIsCarVisible] = useState(true);
  const [tollgate1Open, setTollgate1Open] = useState(false);
  const [tollgate3Open, setTollgate3Open] = useState(false);
  const [currentMapLayout, setCurrentMapLayout] = useState(mapLayout);

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

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

  // Car - start in rightmost lane (lane 5)
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  const rightmostLaneX = width * 0.9 - carWidth / 2;
  const carXAnim = useRef(new Animated.Value(rightmostLaneX)).current;

  // NPC Cars - traffic animations
  const [npcCarFrames, setNpcCarFrames] = useState({});
  
  // Define NPC car positions for traffic lanes (1, 2, 5) with more cars closer together
  const npcCars = [
    // Lane 1 - leftmost, heavy traffic
    { id: 'l1-1', lane: 1, initialRow: 2, color: 'red' },
    { id: 'l1-2', lane: 1, initialRow: 4, color: 'black' },
    { id: 'l1-3', lane: 1, initialRow: 6, color: 'green' },
    { id: 'l1-4', lane: 1, initialRow: 8, color: 'blue' },
    { id: 'l1-5', lane: 1, initialRow: 10, color: 'white' },
    
    // Lane 2 - heavy traffic
    { id: 'l2-1', lane: 2, initialRow: 1.5, color: 'blue' },
    { id: 'l2-2', lane: 2, initialRow: 3.5, color: 'brown' },
    { id: 'l2-3', lane: 2, initialRow: 5.5, color: 'red' },
    { id: 'l2-4', lane: 2, initialRow: 7.5, color: 'white' },
    { id: 'l2-5', lane: 2, initialRow: 9.5, color: 'black' },
    { id: 'l2-6', lane: 2, initialRow: 11.5, color: 'green' },
    
    // Lane 5 - rightmost, heavy traffic (player starts here)
    { id: 'l5-1', lane: 5, initialRow: 2.5, color: 'brown' },
    { id: 'l5-2', lane: 5, initialRow: 4.5, color: 'white' },
    { id: 'l5-3', lane: 5, initialRow: 6.5, color: 'red' },
    { id: 'l5-4', lane: 5, initialRow: 8.5, color: 'black' },
    { id: 'l5-5', lane: 5, initialRow: 10.5, color: 'blue' },
  ];

  // NPC car positions with slow traffic animation
  const [npcCarPositions, setNpcCarPositions] = useState(() => {
    const positions = {};
    npcCars.forEach(car => {
      positions[car.id] = new Animated.Value(car.initialRow * tileSize);
    });
    return positions;
  });

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const scenarioId = 70 + currentScenario;  
      
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
    startTrafficAnimation();
  }, []);

  // Start slow traffic animation for NPC cars
  const startTrafficAnimation = () => {
    npcCars.forEach(car => {
      const animateTraffic = () => {
        // Very slow movement - 0.3 tiles over 5 seconds
        Animated.timing(npcCarPositions[car.id], {
          toValue: car.initialRow * tileSize - tileSize * 0.3,
          duration: 5000,
          useNativeDriver: true,
        }).start(() => {
          // Reset and loop
          npcCarPositions[car.id].setValue(car.initialRow * tileSize);
          animateTraffic();
        });
      };
      animateTraffic();
    });
  };

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

  // NPC Car sprite frame loops
  useEffect(() => {
    const intervals = [];
    npcCars.forEach((car) => {
      const interval = setInterval(() => {
        setNpcCarFrames((prev) => ({
          ...prev,
          [car.id]: ((prev[car.id] || 0) + 1) % 2,
        }));
      }, 300); // Slower animation for traffic effect
      intervals.push(interval);
    });
    return () => intervals.forEach(clearInterval);
  }, []);

  // Update map tiles when tollgates open
  useEffect(() => {
    const newLayout = mapLayout.map((row, rowIndex) => 
      row.map((tile, colIndex) => {
        // Middle tollgate (column 2) - starts closed
        if (rowIndex === 6 && colIndex === 2) {
          if (tile === "toll1" || tile === "tollgate1-1" || tile === "tollgate1-2") {
            if (tollgate1Open) return "tollgate1-2"; // Fully open
            return "toll1"; // Closed
          }
        }
        // Rightmost tollgate (column 4) - starts closed
        if (rowIndex === 6 && colIndex === 4) {
          if (tile === "toll3" || tile === "tollgate3-1" || tile === "tollgate3-2") {
            if (tollgate3Open) return "tollgate3-2"; // Fully open
            return "toll3"; // Closed
          }
        }
        return tile;
      })
    );
    setCurrentMapLayout(newLayout);
  }, [tollgate1Open, tollgate3Open]);

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

    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);

    if (answer === "Change to the middle lane immediately without signaling") {
      // Quickly move to middle lane (lane 3) with space between traffic
      const middleLaneX = width * 0.5 - carWidth / 2;
      
      // Quick diagonal movement using NORTHWEST sprite
      setCarDirection("NORTHWEST");
      setCarFrame(0);
      
      Animated.parallel([
        Animated.timing(carXAnim, {
          toValue: middleLaneX,
          duration: 800, // Fast movement
          useNativeDriver: false,
        }),
        Animated.timing(scrollY, {
          toValue: currentScroll.current + tileSize * 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Switch to NORTH sprite
        setCarDirection("NORTH");
        setCarFrame(0);
        
        // Animate middle tollgate opening
        setTimeout(() => {
          setTollgate1Open(true);
        }, 300);
        
        // Move forward through tollgate
        setTimeout(() => {
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 3,
            duration: 1500,
            useNativeDriver: true,
          }).start(() => {
            setIsCarVisible(false);
            handleFeedback(answer);
          });
        }, 800);
      });
      return;
    } else if (answer === "Signal and carefully change to an RFID lane when safe") {
      // Slowly move to middle lane (lane 3) with more forward progress
      const middleLaneX = width * 0.5 - carWidth / 2;
      
      // Slow diagonal movement using NORTHWEST sprite
      setCarDirection("NORTHWEST");
      setCarFrame(0);
      
      Animated.parallel([
        Animated.timing(carXAnim, {
          toValue: middleLaneX,
          duration: 2000, // Slow, careful movement
          useNativeDriver: false,
        }),
        Animated.timing(scrollY, {
          toValue: currentScroll.current + tileSize * 1.5,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Switch to NORTH sprite
        setCarDirection("NORTH");
        setCarFrame(0);
        
        // Animate middle tollgate opening
        setTimeout(() => {
          setTollgate1Open(true);
        }, 300);
        
        // Move forward through tollgate
        setTimeout(() => {
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 2.5,
            duration: 1500,
            useNativeDriver: true,
          }).start(() => {
            setIsCarVisible(false);
            handleFeedback(answer);
          });
        }, 800);
      });
      return;
    } else if (answer === "Stay in your current lane since you're already positioned") {
      // Stay stationary in rightmost lane (traffic scenario)
      setTimeout(() => {
        setIsCarVisible(false);
        handleFeedback(answer);
      }, 2000);
      return;
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    setIsCorrectAnswer(null);
    
    // Reset car position and visibility to rightmost lane
    const rightmostLaneX = width * 0.9 - carWidth / 2;
    carXAnim.setValue(rightmostLaneX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setCarPaused(false);
    setTollgate1Open(false);
    setTollgate3Open(false);
    
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario === 10) {
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
      const nextScreen = `S${currentScenario + 1}P2`;  
      router.push(`/scenarios/intersection/phase2/${nextScreen}`); 
    }
  };

  // Calculate feedback message
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! The advance warning gives you time to position yourself in the appropriate lane type (RFID/cash) safely with proper signaling."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  // Ensure car sprite exists for current direction
  const currentCarSprite = carSprites[carDirection] && carSprites[carDirection][carFrame] 
    ? carSprites[carDirection][carFrame] 
    : carSprites["NORTH"][0];

  // Lane X positions
  const lanePositions = [
    width * 0.1 - carWidth / 2,  // lane 1
    width * 0.3 - carWidth / 2,  // lane 2
    width * 0.5 - carWidth / 2,  // lane 3 (middle - clear for player)
    width * 0.7 - carWidth / 2,  // lane 4 (clear)
    width * 0.9 - carWidth / 2,  // lane 5 (rightmost)
  ];

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
        {currentMapLayout.map((row, rowIndex) =>
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

      {/* Car - starts in rightmost lane */}
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

      {/* NPC Cars - slow moving traffic in lanes 1, 2, and 5 */}
      {npcCars.map((npc) => {
        const laneIndex = [1, 2, 5].indexOf(npc.lane);
        const actualLaneIndex = npc.lane - 1; // Convert to 0-indexed
        
        return (
          <Animated.Image
            key={npc.id}
            source={npcCarSprites[npc.color][npcCarFrames[npc.id] || 0]}
            style={{
              width: carWidth,
              height: carHeight,
              position: "absolute",
              left: lanePositions[actualLaneIndex],
              transform: [
                { translateY: scrollY },
                { translateY: npcCarPositions[npc.id] }
              ],
              zIndex: 7,
            }}
          />
        );
      })}

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
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.16,
    right: sideMargin,
    width: wp(30),
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
    fontSize: Math.min(width * 0.04, 18),
    textAlign: "center",
  },
  feedbackOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: wp(100),
    height: hp(35),
    backgroundColor: "rgba(8, 8, 8, 0.43)",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: scale(10),
    zIndex: 10,
  },
  feedbackBox: {
    flex: 1,
    bottom: hp(10),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(15),
  },
  feedbackText: {
    color: "white",
    fontSize: fontSize(16),
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: fontSize(22),
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
    paddingVertical: scale(12),
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