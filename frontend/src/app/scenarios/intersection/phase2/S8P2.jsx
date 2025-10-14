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
    road80: require("../../../../../assets/road/road80.png"),
};

const mapLayout = [
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
  ["road2", "road2", "road2", "road2", "road80"],
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
    sign: require("../../../../../assets/signs/dir_sign_5.png"),
};

const questions = [
  {
    question: "You're on NLEX and see an EXIT 2 km sign, followed by overhead signs showing San Fernando Olongapo EXIT with an arrow. You're going to Olongapo, but you're not sure if this is the correct exit.",
    options: ["Take the exit since Olongapo is mentioned", "Continue to the next exit to be safe", "Slow down dangerously to read the sign again"],
    correct: "Take the exit since Olongapo is mentioned",
    wrongExplanation: {
      "Continue to the next exit to be safe": "Wrong! Ignoring clear directional signage can lead to longer travel times and missing your destination.",
      "Slow down dangerously to read the sign again": "Wrong! Slowing down dangerously to re-read signs creates traffic hazards. Trust the information provided by the advance warning system."
    }
  },
  // Add more questions here as needed
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

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  const trafficSignRowIndex = 14;
  const trafficSignColIndex = 3.8;
  const trafficSignXOffset = 20;

  // NPC Cars state
  const [npcCars, setNpcCars] = useState([]);
  const [npcFrames, setNpcFrames] = useState({});

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      currentScroll.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  // Initialize NPC cars
  useEffect(() => {
    const colors = ['red', 'black', 'green'];
    const columns = [0, 1, 3];
    const initialCars = columns.map((col, idx) => ({
      id: `npc-${idx}`,
      color: colors[idx],
      column: col,
      yAnim: new Animated.Value(-(Math.random() * 200)),
    }));
    setNpcCars(initialCars);

    const initialFrames = {};
    initialCars.forEach(car => {
      initialFrames[car.id] = 0;
    });
    setNpcFrames(initialFrames);
  }, []);

  // Animate NPC cars
  useEffect(() => {
    if (npcCars.length === 0) return;

    const animations = npcCars.map(car => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(car.yAnim, {
            toValue: - 1000,
            duration: 20000,
            useNativeDriver: true,
          }),
          Animated.timing(car.yAnim, {
            toValue: height + Math.random() * 500 + 800,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [npcCars]);

  // NPC sprite animation
  useEffect(() => {
    const interval = setInterval(() => {
      setNpcFrames(prev => {
        const updated = {};
        npcCars.forEach(car => {
          updated[car.id] = (prev[car.id] + 1) % 2;
        });
        return updated;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [npcCars]);

  // UI/game states
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);
  const [carDirection, setCarDirection] = useState("NORTH");

  // Car - start in middle lane
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  const middleLaneX = width * 0.5 - carWidth / 2;
  const carXAnim = useRef(new Animated.Value(middleLaneX)).current;

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

    if (answer === "Continue to the next exit to be safe") {
      // Drive straight at same speed
      setCarDirection("NORTH");
      setCarFrame(0);
      
      Animated.timing(scrollY, {
        toValue: currentScroll.current + tileSize * 8,
        duration: 3000,
        useNativeDriver: true,
      }).start(() => {
        setIsCarVisible(false);
        handleFeedback(answer);
      });
      return;
    } else if (answer === "Take the exit since Olongapo is mentioned") {
      // Step 1: Start facing NORTH and move forward slightly
      setCarDirection("NORTH");
      setCarFrame(0);
      
      Animated.timing(scrollY, {
        toValue: currentScroll.current + tileSize * 1.5,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        // Step 2: Change to NORTHEAST and perform lane change
        setCarDirection("NORTHEAST");
        setCarFrame(0);
        
        const rightLaneX = width * 0.7 - carWidth / 2;
        
        Animated.parallel([
          Animated.timing(carXAnim, {
            toValue: rightLaneX,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 1.5,
            duration: 1200,
            useNativeDriver: true,
          })
        ]).start(() => {
          // Step 3: Switch back to NORTH after lane change
          setCarDirection("NORTH");
          setCarFrame(0);
          
          // Continue straight in right lane
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 4,
            duration: 1500,
            useNativeDriver: true,
          }).start(() => {
            setIsCarVisible(false);
            handleFeedback(answer);
          });
        });
      });
      return;
    } else if (answer === "Slow down dangerously to read the sign again") {
      // Drive straight then brake (quick stop)
      setCarDirection("NORTH");
      setCarFrame(0);
      
      // Move forward briefly
      Animated.timing(scrollY, {
        toValue: currentScroll.current + tileSize * 2.5,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        // Sudden stop - pause briefly to simulate braking
        setCarPaused(true);
        setTimeout(() => {
          setIsCarVisible(false);
          handleFeedback(answer);
        }, 500);
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
    
    // Reset car position and visibility to middle lane
    const middleLaneX = width * 0.5 - carWidth / 2;
    carXAnim.setValue(middleLaneX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setCarPaused(false);
    
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

  const trafficSignLeft = trafficSignColIndex * tileSize + trafficSignXOffset;  
  const trafficSignTop = trafficSignRowIndex * tileSize;

  // Calculate feedback message
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Exit direction signs clearly indicate destinations accessible from that exit. If Olongapo is listed, this exit provides access to it."
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
        <Image
            source={trafficSign.sign}
            style={{
            width: tileSize * 1,
            height: tileSize *1,
            position: "absolute",
            top: trafficSignTop,
            left: trafficSignLeft,
            zIndex: 11,
                }}
            resizeMode="contain"
        />
      </Animated.View>

      {/* NPC Cars */}
      {npcCars.map(car => {
        const laneX = (car.column * tileSize) + (tileSize / 2) - (carWidth / 2);
        return (
          <Animated.Image
            key={car.id}
            source={npcCarSprites[car.color][npcFrames[car.id] || 0]}
            style={{
              width: carWidth,
              height: carHeight,
              position: "absolute",
              left: laneX,
              transform: [{ translateY: car.yAnim }],
              zIndex: 7,
            }}
          />
        );
      })}

      {/* Car - fixed in middle lane */}
      {isCarVisible && (
        <Animated.Image
          source={currentCarSprite}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: 80,
            transform: [{ translateX: carXAnim }],
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