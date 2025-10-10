import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { router } from 'expo-router';
import { useSession } from '../../../../contexts/SessionManager';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

const roadTiles = {
  road48: require("../../../../../assets/road/road48.png"),
  road76: require("../../../../../assets/road/road76.png"),
  road86: require("../../../../../assets/road/road86.png"),
  road85: require("../../../../../assets/road/road85.png"),
  road84: require("../../../../../assets/road/road84.png"),
  road97: require("../../../../../assets/road/road97.png"),
  road98: require("../../../../../assets/road/road98.png"),
};

const mapLayout = [
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48",],
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48",],
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48",],
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48",],
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48", ],
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48",], 
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48",],
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48",],
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48",],
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48",],
  ["road85", "road84", "road48", "road48", "road48", "road48", "road48",],
  ["road85", "road84", "road48", "road48", "road85", "road84", "road48",],
  ["road85", "road84", "road48", "road48", "road85", "road84", "road48",],
  ["road85", "road84", "road48", "road48", "road85", "road84", "road48",],
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48",],
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48",],
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48",],
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48",],
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48",],
  ["road48", "road48", "road48", "road48", "road48", "road48", "road48",],
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
};

const npcCarSprites = {
  EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Black/MOVE/EAST/SEPARATED/Black_CIVIC_CLEAN_EAST_000.png"),
  ],
  WEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Black/MOVE/WEST/SEPARATED/Black_CIVIC_CLEAN_WEST_000.png"),
  ],
  BROWN_EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Brown/MOVE/EAST/SEPARATED/Brown_CIVIC_CLEAN_EAST_000.png"),
  ],
  BROWN_WEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Brown/MOVE/WEST/SEPARATED/Brown_CIVIC_CLEAN_WEST_000.png"),
  ],
  RED_EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/EAST/SEPARATED/Red_CIVIC_CLEAN_EAST_000.png"),
  ],
  RED_WEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/WEST/SEPARATED/Red_CIVIC_CLEAN_WEST_000.png"),
  ],
};

const questions = [
  {
    question: "You're looking for parking at SM North EDSA and see an empty PWD parking bay marked with the blue wheelchair symbol. You don't have a PWD sticker but the mall is very crowded.",
    options: ["Park there temporarily since you'll only be shopping for 30 minutes", "Continue looking for regular parking spaces", " Park there and display a makeshift disability sign"],
    correct: "Continue looking for regular parking spaces",
    wrongExplanation: {
      "Park there temporarily since you'll only be shopping for 30 minutes": "Wrong! PWD parking bays are strictly reserved for persons with disabilities regardless of duration or crowd levels.",
      "Park there and display a makeshift disability sign": "Wrong! Using fake or makeshift disability signs is illegal and disrespectful to people with legitimate needs."
    }
  },
];

const pwdSign = {
    sign: require("../../../../../assets/signs/pwd_parking.png"),
};

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
      const phaseId = sessionData?.phase_id || 1;
      const baseId = phaseId === 1 ? 40 : 50;
      const scenarioId = baseId + currentScenario;

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

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  const pwdSignRowIndex = 13.2;
  const pwdSignColIndex = 3.7;
  const pwdSignXOffset = 0;

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      currentScroll.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);

  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  const [carDirection, setCarDirection] = useState("NORTH");
  const carXAnim = useRef(new Animated.Value(width / 2 - (280 / 2))).current;

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopRow = 4.2;
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
    if (!carPaused) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites[carDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused, carDirection]);

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

    // Option 1: Park there temporarily (WRONG - parks in PWD spot)
    if (answer === "Park there temporarily since you'll only be shopping for 30 minutes") {
       // Face EAST immediately
  setCarDirection("EAST");
  setCarFrame(0);
  
  // Then move forward
  const targetRow = 4.5;
  const rowsToMove = targetRow - currentRow;
  const forwardTarget = currentScroll.current + rowsToMove * tileSize;

  Animated.timing(scrollY, {
    toValue: forwardTarget,
    duration: 1000,
    useNativeDriver: true,
  }).start(() => {
    // Move car to the right (PWD parking spot)
    const parkingSpotX = 4.2 * tileSize;
    
    Animated.timing(carXAnim, {
      toValue: parkingSpotX,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      setCarPaused(true);
      setTimeout(() => {
        handleFeedback(answer);
      }, 500);
    });
  });
    } 
    // Option 2: Continue looking for regular parking (CORRECT - goes straight)
    else if (answer === "Continue looking for regular parking spaces") {
      const targetRow = 8;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;

      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 3000,
        useNativeDriver: true,
      }).start(() => {
        handleFeedback(answer);
      });
    } 
    // Option 3: Park with makeshift sign (WRONG - parks in PWD spot)
else if (answer === " Park there and display a makeshift disability sign") {
  // Face EAST immediately
  setCarDirection("EAST");
  setCarFrame(0);
  
  // Then move forward
  const targetRow = 4.5;
  const rowsToMove = targetRow - currentRow;
  const forwardTarget = currentScroll.current + rowsToMove * tileSize;

  Animated.timing(scrollY, {
    toValue: forwardTarget,
    duration: 1000,
    useNativeDriver: true,
  }).start(() => {
    // Move car to the right (PWD parking spot)
    const parkingSpotX = 4.2 * tileSize;
    
    Animated.timing(carXAnim, {
      toValue: parkingSpotX,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      setCarPaused(true);
      setTimeout(() => {
        handleFeedback(answer);
      }, 500);
    });
  });
}
  }

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    setCarDirection("NORTH");
    setCarPaused(false);
    carXAnim.setValue(width / 2 - (280 / 2));
    
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario >= 10) {
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
      router.push(`/scenarios/road-markings/phase3/S10P3`);
    }
  };

  const pwdSignLeft = pwdSignColIndex * tileSize + pwdSignXOffset;  
  const pwdSignTop = pwdSignRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  // --- FIX: normalize selectedAnswer before using it as a key to lookup wrongExplanation ---
  const normalizedSelected = (selectedAnswer || "").trim();
  const feedbackMessage = isCorrectAnswer
    ? "Correct! PWD parking bays are strictly reserved for persons with disabilities. Always continue looking for regular parking spaces."
    : currentQuestionData.wrongExplanation[normalizedSelected] || "Wrong!";

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

        {/*PWD Parking Sign */}
        <Image
          source={pwdSign.sign}
          style={{
            width: tileSize * .8,
            height: tileSize *.8,
            position: "absolute",
            top: pwdSignTop,
            left: pwdSignLeft,
            zIndex: 11,
          }}
          resizeMode="contain"
        />

        {/* Parked Cars - 7th row from bottom (row 13) - Left side only */}
        <Image
          source={npcCarSprites.EAST[0]}
          style={{
            width: tileSize * 2.5,
            height: tileSize * 2.5,
            position: "absolute",
            top: 12 * tileSize,
            left: -0.2 * tileSize,
            zIndex: 7,
          }}
          resizeMode="contain"
        />

        {/* Parked Cars - 8th row from bottom (row 12) - Both sides */} 
        <Image
          source={npcCarSprites.BROWN_EAST[0]}
          style={{
            width: tileSize * 2.5,
            height: tileSize * 2.5,
            position: "absolute",
            top: 11 * tileSize,
            left: -0.2 * tileSize,
            zIndex: 7,
          }}
          resizeMode="contain"
        />


        <Image
          source={npcCarSprites.BROWN_WEST[0]}
          style={{
            width: tileSize * 2.5,
            height: tileSize * 2.5,
            position: "absolute",
            top: 11 * tileSize,
            left: 3.8 * tileSize,
            zIndex: 7,
          }}
          resizeMode="contain"
        />

        {/* Parked Cars - 9th row from bottom (row 11) - Both sides */}
        <Image
          source={npcCarSprites.RED_EAST[0]}
          style={{
            width: tileSize * 2.5,
            height: tileSize * 2.5,
            position: "absolute",
            top: 10 * tileSize,
            left: -0.2 * tileSize,
            zIndex: 7,
          }}
          resizeMode="contain"
        />
        <Image
          source={npcCarSprites.RED_WEST[0]}
          style={{
            width: tileSize * 2.5,
            height: tileSize * 2.5,
            position: "absolute",
            top: 10 * tileSize,
            left: 3.8 * tileSize,
            zIndex: 7,
          }}
          resizeMode="contain"
        />

      </Animated.View>

      {/* Car - fixed */}
      <Animated.Image
        source={carSprites[carDirection][carFrame]}
        style={{
          width: 280,
          height: 350,
          position: "absolute",
          bottom: 80,
          transform: [{ translateX: carXAnim }],
          zIndex: 8,
        }}
      />

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
