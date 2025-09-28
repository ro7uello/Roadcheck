import { useSession } from '../../../SessionManager';
import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { router } from 'expo-router';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const pedestrianWidth = Math.min(width * 0.08, 60);
const pedestrianHeight = pedestrianWidth * (80/60);
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
  ["road49", "road59", "road57", "road50", "road52"],
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

// Pedestrian sprites - using simple colored circles as placeholders
// In a real implementation, you'd have actual pedestrian sprites
const pedestrianColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

const questions = [
  {
    question: "You encounter a complex intersection with stop lines, give way lines, and pedestrian crossings all present. You're turning right, and pedestrians are crossing your intended path.",
    options: [
      "Proceed with your turn since vehicles have right of way over pedestrians",
      "Stop at the stop line, yield to pedestrians, then complete your turn when safe", 
      "Turn quickly before more pedestrians enter the crosswalk"
    ],
    correct: "Stop at the stop line, yield to pedestrians, then complete your turn when safe",
    wrongExplanation: {
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
  const [showPedestrians, setShowPedestrians] = useState(false);

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
  const [carDirection, setCarDirection] = useState("NORTH");
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);

  // Pedestrians state
  const [pedestrians, setPedestrians] = useState([
    {
      id: 1,
      xAnim: useRef(new Animated.Value(-pedestrianWidth)).current,
      yPos: height * 0.52, // Crosswalk level
      color: pedestrianColors[0],
      moving: false,
    },
    {
      id: 2,
      xAnim: useRef(new Animated.Value(-pedestrianWidth * 2)).current,
      yPos: height * 0.54,
      color: pedestrianColors[1],
      moving: false,
    },
    {
      id: 3,
      xAnim: useRef(new Animated.Value(-pedestrianWidth * 3)).current,
      yPos: height * 0.50,
      color: pedestrianColors[2],
      moving: false,
    },
  ]);

  // Car positioning
  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;
  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Car animation frame cycling
  useEffect(() => {
    let iv;
    if (!carPaused && isCarVisible) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites[carDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused, carDirection, isCarVisible]);

  const scrollAnimationRef = useRef(null);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    
    // Reset car position
    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);

    // Start continuous map scrolling
    scrollAnimationRef.current = Animated.timing(scrollY, {
      toValue: startOffset + 6.5 * tileSize, // Stop before intersection
      duration: 4000,
      useNativeDriver: true,
    });

    scrollAnimationRef.current.start(() => {
      // Show pedestrians starting to cross
      setShowPedestrians(true);
      startPedestrianCrossing();
      
      // Show question after pedestrians start crossing
      setTimeout(() => {
        setShowQuestion(true);
        setTimeout(() => {
          setShowAnswers(true);
        }, 1000);
      }, 1500);
    });
  }

  const startPedestrianCrossing = () => {
    // Animate pedestrians crossing from left to right
    pedestrians.forEach((ped, index) => {
      setTimeout(() => {
        Animated.timing(ped.xAnim, {
          toValue: width + pedestrianWidth,
          duration: 6000 + (index * 1000), // Staggered timing
          useNativeDriver: true,
        }).start();
      }, index * 800);
    });
  };

  useEffect(() => {
    startScrollAnimation();
    return () => {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    };
  }, []);

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
    if (answer === "Proceed with your turn since vehicles have right of way over pedestrians") {
      // Animation: Car proceeds to turn right, potentially hitting pedestrians
      setCarDirection("NORTHEAST");
      
      Animated.parallel([
        // Car moves right and forward
        Animated.timing(carXAnim, {
          toValue: (width / 2 - carWidth / 2) + carWidth * 1.2,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(scrollY, {
          toValue: currentScroll.current + tileSize * 2,
          duration: 2000,
          useNativeDriver: true,
        })
      ]).start(() => {
        setCarDirection("EAST");
        // Show danger - car almost hits pedestrians
        setTimeout(() => {
          handleFeedback(answer);
        }, 1000);
      });

    } else if (answer === "Stop at the stop line, yield to pedestrians, then complete your turn when safe") {
      // Animation: Car stops, waits for pedestrians to clear, then turns
      setCarPaused(true);
      
      // Wait for pedestrians to cross (simulate waiting)
      setTimeout(() => {
        // After pedestrians clear, car makes the turn
        setCarPaused(false);
        setCarDirection("NORTHEAST");
        
        Animated.parallel([
          Animated.timing(carXAnim, {
            toValue: (width / 2 - carWidth / 2) + carWidth * 1.2,
            duration: 2500, // Slower, more careful turn
            useNativeDriver: false,
          }),
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 2,
            duration: 2500,
            useNativeDriver: true,
          })
        ]).start(() => {
          setCarDirection("EAST");
          handleFeedback(answer);
        });
      }, 4000); // Wait for pedestrians

    } else if (answer === "Turn quickly before more pedestrians enter the crosswalk") {
      // Animation: Car rushes through turn dangerously
      setCarDirection("NORTHEAST");
      
      Animated.parallel([
        // Rapid, aggressive turn
        Animated.timing(carXAnim, {
          toValue: (width / 2 - carWidth / 2) + carWidth * 1.2,
          duration: 1200, // Very fast/dangerous
          useNativeDriver: false,
        }),
        Animated.timing(scrollY, {
          toValue: currentScroll.current + tileSize * 2,
          duration: 1200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setCarDirection("EAST");
        // Show near-miss or accident warning
        handleFeedback(answer);
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

    // Reset positions
    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setShowPedestrians(false);

    // Reset pedestrians
    pedestrians.forEach(ped => {
      ped.xAnim.setValue(-pedestrianWidth);
    });

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
             moveToNextScenario();
             const nextScreen = `S${currentScenario + 1}P2`; // Will be S2P2
             router.push(`/scenarios/road-markings/phase2/${nextScreen}`);
           }
     };

  // Feedback message
  let feedbackMessage = "Wrong answer!";
  
  if (isCorrectAnswer) {
    feedbackMessage = "Correct! You must observe stop lines, yield to pedestrians at crossings, and proceed only when safe.";
  } else if (selectedAnswer === "Proceed with your turn since vehicles have right of way over pedestrians") {
    feedbackMessage = "Wrong! Pedestrians have right of way at designated crossings, even when vehicles are turning.";
  } else if (selectedAnswer === "Turn quickly before more pedestrians enter the crosswalk") {
    feedbackMessage = "Accident Prone! Rushing through crosswalks endangers pedestrians and violates their right of way.";
  }

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
      </Animated.View>

      {/* Pedestrians */}
      {showPedestrians && pedestrians.map((ped) => (
        <Animated.View
          key={ped.id}
          style={{
            position: "absolute",
            width: pedestrianWidth,
            height: pedestrianHeight,
            backgroundColor: ped.color,
            borderRadius: pedestrianWidth / 2,
            top: ped.yPos,
            transform: [{ translateX: ped.xAnim }],
            zIndex: 6,
            // Simple pedestrian representation
            borderWidth: 2,
            borderColor: 'white',
          }}
        >
          {/* Simple pedestrian icon */}
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{
              color: 'white',
              fontSize: pedestrianWidth * 0.3,
              fontWeight: 'bold',
            }}>
              🚶
            </Text>
          </View>
        </Animated.View>
      ))}

      {/* Blue Car (player car) */}
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

      {/* Question Overlay */}
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
          <Image source={require("../../../../../assets/dialog/Dialog w answer.png")} style={styles.ltoImage} />
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
  questionOverlay: {
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
  ltoImage: {
    width: ltoWidth,
    height: ltoHeight,
    resizeMode: "contain",
    marginLeft: -width * 0.03,
    marginBottom: -height * 0.09,
  },
  questionBox: {
    flex: 1,
    bottom: height * 0.1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: height * 0.05,
  },
  questionTextContainer: {
    maxWidth: width * 0.6,
  },
  questionText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.25,
    right: sideMargin,
    width: width * 0.35,
    zIndex: 11,
  },
  answerButton: {
    backgroundColor: "#333",
    padding: height * 0.02,
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
    fontSize: Math.min(width * 0.06, 28),
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