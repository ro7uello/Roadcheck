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
  road59: require("../../../../../assets/road/road59.png"),
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

// Map layout with a non-signalized pedestrian crossing (zebra crossing)
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
  ["road19", "road59", "road57", "road16", "road51"],
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
  WEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_001.png"),
  ],
  EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
};

const maleSprites = {
  WEST: [
    require("../../../../../assets/character/sprites/west/west_walk1.png"),
    require("../../../../../assets/character/sprites/west/west_walk2.png"),
    require("../../../../../assets/character/sprites/west/west_walk3.png"),
    require("../../../../../assets/character/sprites/west/west_walk4.png"),
  ],
};

const questions = [
  {
    question: "You approach a non-signalized pedestrian crossing (zebra crossing) where pedestrians are waiting to cross during rush hour traffic.",
    options: [
      "Continue driving since there's no traffic light controlling the crossing",
      "Stop and give way to pedestrians wanting to cross",
      "Honk to alert pedestrians and proceed carefully"
    ],
    correct: "Stop and give way to pedestrians wanting to cross",
    correctExplanation: "Correct! At non-signalized pedestrian crossings, drivers must yield to pedestrians who are crossing or about to cross.",
    wrongExplanations: {
      "Continue driving since there's no traffic light controlling the crossing": "Accident Prone! Non-signalized pedestrian crossings still give pedestrians right of way when they're crossing.",
      "Honk to alert pedestrians and proceed carefully": "Wrong! Honking doesn't give you right of way over pedestrians at designated crossings."
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
  const [showHonk, setShowHonk] = useState(false);
  const honkOpacity = useRef(new Animated.Value(0)).current;

  const [pedestrianVisible, setPedestrianVisible] = useState(true);
  const [pedestrianDirection, setPedestrianDirection] = useState("WEST");
  const [pedestrianFrame, setPedestrianFrame] = useState(0);
  const [pedestrianAnimating, setPedestrianAnimating] = useState(true);
  const pedestrianInitialX = width * 0.60;
  const pedestrianXAnim = useRef(new Animated.Value(pedestrianInitialX)).current;

  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;

  useEffect(() => {
    let iv;
    if (!carPaused) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites[carDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused, carDirection]);

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
    setShowHonk(false);
    honkOpacity.setValue(0);

    const stopRow = 6.7;
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

    if (answer === "Continue driving since there's no traffic light controlling the crossing") {
      const targetRow = 12;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;

      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 3500,
        useNativeDriver: true,
      }).start(() => handleFeedback(answer));

    } else if (answer === "Stop and give way to pedestrians wanting to cross") {
      const stopAtCrossingRow = 6.9;
      const rowsToMove = stopAtCrossingRow - currentRow;
      const stopTarget = currentScroll.current + rowsToMove * tileSize;

      Animated.timing(scrollY, {
        toValue: stopTarget,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        setCarPaused(true);

        const leftX = width * 0.15;
        Animated.timing(pedestrianXAnim, {
          toValue: leftX,
          duration: 3000,
          useNativeDriver: true,
        }).start(() => {
          setPedestrianVisible(false);
          setPedestrianAnimating(false);
          
          setTimeout(() => {
            setCarPaused(false);
            const finalTargetRow = 12;
            const finalRowsToMove = finalTargetRow - stopAtCrossingRow;
            const finalTarget = stopTarget + finalRowsToMove * tileSize;

            Animated.timing(scrollY, {
              toValue: finalTarget,
              duration: 3000,
              useNativeDriver: true,
            }).start(() => handleFeedback(answer));
          }, 500);
        });
      });

    } else if (answer === "Honk to alert pedestrians and proceed carefully") {
      setShowHonk(true);
      
      Animated.sequence([
        Animated.timing(honkOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(honkOpacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start(() => {
        setShowHonk(false);
      });

      const targetRow = 12;
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
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setCarFrame(0);
    setCarPaused(false);
    setShowHonk(false);
    honkOpacity.setValue(0);

    setPedestrianVisible(true);
    setPedestrianAnimating(true);
    pedestrianXAnim.setValue(pedestrianInitialX);

    carXAnim.setValue(width / 2 - carWidth / 2);
    setIsCarVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario >= 10) {
      // Last scenario in phase - complete session
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

      {/* Honk Animation - "BEEP!" text */}
      {showHonk && (
        <Animated.View
          style={{
            position: "absolute",
            bottom: height * 0.1 + carHeight - 20,
            left: width / 2 - 35,
            opacity: honkOpacity,
            zIndex: 6,
          }}
        >
          <Text
            style={{
              fontSize: 70,
              fontWeight: "bold",
              color: "#ffd000ff",
              textShadowColor: "#000",
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 4,
            }}
          >
            BEEP!
          </Text>
        </Animated.View>
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
  questionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: overlayHeight,
    backgroundColor: "rgba(8, 8, 8, 0.43)",
    flexDirection: "row",
    alignItems: "flex-end",
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
    paddingHorizontal: width * 0.02,
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
    top: height * 0.175,
    right: sideMargin,
    width: width * 0.35,
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
    paddingHorizontal: width * 0.05
  },
  nextButtonContainer: {
    position: "absolute",
    top: height * 0.50,
    right: sideMargin,
    zIndex: 11,
  },
  nextButton: {
    backgroundColor: "#007bff",
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.06,
    borderRadius: 8,
    elevation: 5,
    alignItems: "center",
  },
  nextButtonText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
  },
});