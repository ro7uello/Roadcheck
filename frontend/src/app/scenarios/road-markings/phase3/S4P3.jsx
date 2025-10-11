import { useSession } from '../../../../contexts/SessionManager';
import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
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
  road83: require("../../../../../assets/road/road83.png"),
  int1: require("../../../../../assets/road/int1.png"),
  int2: require("../../../../../assets/road/int2.png"),
  int3: require("../../../../../assets/road/int3.png"),
  int4: require("../../../../../assets/road/int4.png"),
};

// Map layout with complex intersection including crosswalks
const mapLayout = [
  ["road18", "road4", "road83", "road17", "road20"],
  ["road18", "road4", "road83", "road17", "road20"],
  ["road18", "road4", "road83", "road17", "road20"],
  ["road18", "road4", "road83", "road17", "road20"],
  ["road18", "road4", "road83", "road17", "road20"],
  ["road18", "road4", "road83", "road17", "road20"],
  ["road49", "road59", "road57", "road50", "road52"],
  ["road60", "int3", "int4", "road60", "road24"],
  ["road58", "int2", "int1", "road58", "road23"],
  ["road19", "road57", "road57", "road16", "road51"],
  ["road18", "road4", "road83", "road17", "road20"],
  ["road18", "road4", "road83", "road17", "road20"],
  ["road18", "road4", "road83", "road17", "road20"],
  ["road18", "road4", "road83", "road17", "road20"],
  ["road18", "road4", "road83", "road17", "road20"],
  ["road18", "road4", "road83", "road17", "road20"],
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

const questions = [
  {
    question: "You're driving on a road with a painted bicycle lane marked \"BIKE LANE\" with solid white lines. You need to turn right, but a cyclist is using the bike lane.",
    options: [
      "Drive into the bike lane to make your turn",
      "Wait behind the bike lane until the cyclist passes, then turn",
      "Honk at the cyclist to move out of your way"
    ],
    correct: "Wait behind the bike lane until the cyclist passes, then turn",
    wrongExplanation: {
      "Drive into the bike lane to make your turn": "Wrong! You are required to yield and let the bike pass before making your turn",
      "Honk at the cyclist to move out of your way": "Wrong! Cyclists have the right of way in bike lanes; honking is inappropriate and potentially dangerous."
    }
  },
];

export default function S4P3() {

  const {
    updateScenarioProgress,
    moveToNextScenario,
    completeSession,
    currentScenario,
    sessionData
  } = useSession();

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const scenarioId = 20 + currentScenario;
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
      toValue: startOffset + 4.7 * tileSize,
      duration: 4000,
      useNativeDriver: true,
    });

    scrollAnimationRef.current.start(() => {
      // Show question after scrolling
      setTimeout(() => {
        setShowQuestion(true);
        setTimeout(() => {
          setShowAnswers(true);
        }, 1000);
      }, 1500);
    });
  }

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
    
    if (answer === "Drive into the bike lane to make your turn") {
      // WRONG ANIMATION: Car drives into bike lane dangerously
      setCarPaused(false);
      
      Animated.parallel([
        Animated.timing(carXAnim, {
          toValue: (width / 2 - carWidth / 2) + carWidth * 0.2,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(scrollY, {
          toValue: currentScroll.current + tileSize * 0.5,
          duration: 1500,
          useNativeDriver: true,
        })
      ]).start(() => {
        setTimeout(() => {
          handleFeedback(answer);
        }, 500);
      });

    } else if (answer === "Wait behind the bike lane until the cyclist passes, then turn") {
      // CORRECT ANIMATION: Car stops, waits for cyclist to clear, then turns
      setCarPaused(true);
      
      // Wait for cyclist to pass (simulate waiting)
      setTimeout(() => {
        setCarPaused(false);
        
        // First move straight north
        Animated.timing(scrollY, {
          toValue: currentScroll.current + tileSize * 1.7,
          duration: 700,
          useNativeDriver: true,
        }).start(() => {
          // Then turn east
          setCarDirection("EAST");
          
          Animated.timing(carXAnim, {
            toValue: (width / 2 - carWidth / 2) + carWidth * 1,
            duration: 900,
            useNativeDriver: false,
          }).start(() => {
            handleFeedback(answer);
          });
        });
      }, 3000);

} else if (answer === "Honk at the cyclist to move out of your way") {
      // WRONG ANIMATION: Car moves aggressively
      setCarPaused(false);
      
      Animated.timing(scrollY, {
        toValue: currentScroll.current + tileSize * 1.7,
        duration: 700,
        useNativeDriver: true,
      }).start(() => {
        // Then turn east
        setCarDirection("EAST");
        
        Animated.timing(carXAnim, {
          toValue: (width / 2 - carWidth / 2) + carWidth * 1,
          duration: 900,
          useNativeDriver: false,
        }).start(() => {
          handleFeedback(answer);
        });
      });
    }
  }
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

    if (questionIndex < questions.length - 1) {
         setQuestionIndex(questionIndex + 1);
       } else if (currentScenario >= 10) {
         const sessionResults = await completeSession();
         navigation.navigate('/result-page', {
           ...sessionResults,
           userAttempts: JSON.stringify(sessionResults.attempts)
         });
       } else {
         moveToNextScenario();
         const nextScreen = `S${currentScenario + 1}P3`;
         navigation.navigate(nextScreen);
       }
    };

  // Feedback message
  let feedbackMessage = "Wrong answer!";
  
  if (isCorrectAnswer) {
    feedbackMessage = "Correct! You must always yield to cyclists in bike lanes. Wait for them to pass before making your turn.";
  } else if (selectedAnswer === "Drive into the bike lane to make your turn") {
    feedbackMessage = "Wrong! You are required to yield and let the bike pass before making your turn";
  } else if (selectedAnswer === "Honk at the cyclist to move out of your way") {
    feedbackMessage = "Wrong! Cyclists have the right of way in bike lanes; honking is inappropriate and potentially dangerous.";
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
  // ✅ DATABASE INTEGRATION - Added loading styles
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

  // ADDED: Intro styles (responsive)
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
    fontSize: Math.min(width * 0.045, 24),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.15,
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

//s4