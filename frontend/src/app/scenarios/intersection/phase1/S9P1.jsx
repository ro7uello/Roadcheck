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
};

const busSprites = {
    NORTH: [
    require("../../../../../assets/car/BUS TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_BUS_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/BUS TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_BUS_CLEAN_NORTH_001.png"),
  ],
};

const treeSprites = {
  tree1: require("../../../../../assets/tree/Tree3_idle_s.png"),
};

const treePositions = [
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

const questions = [
  {
    question: "On a highway in Laguna, you see an Approach to Intersection sign followed by a reassurance sign showing Angeles 70km and Baguio 156km. A provincial bus is tailgating you, and there's an intersection ahead.",
    options: ["Speed up to get away from the tailgating bus", "Maintain safe speed, signal early for your intended direction, and let the bus pass if safe", "Brake suddenly to teach the bus driver a lesson"],
    correct: "Maintain safe speed, signal early for your intended direction, and let the bus pass if safe",
    wrongExplanation: {
      "Speed up to get away from the tailgating bus": "Accident Prone! Speeding near intersections is dangerous, and you shouldn't let other drivers pressure you into unsafe behavior.",
      "Brake suddenly to teach the bus driver a lesson": "Accident Prone! Road rage behaviors like brake-checking are extremely dangerous and illegal."
    }
  },
];

const trafficSign = {
  sign: require("../../../../../assets/signs/dir_sign_4.png"),
};
const trafficSign2 = {
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

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  const trafficSignRowIndex = 14;
  const trafficSignColIndex = 4;
  const trafficSignXOffset = -30;

  const trafficSign2RowIndex = 15;
  const trafficSign2ColIndex = 4;
  const trafficSign2XOffset = -30;

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
  const [carDirection, setCarDirection] = useState("NORTH");

  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;

  const [busFrame, setBusFrame] = useState(0);
  const [isBusVisible, setIsBusVisible] = useState(true);
  const busYAnim = useRef(new Animated.Value(180)).current; // Distance behind car
  const busXAnim = useRef(new Animated.Value(width / 2.3 - carWidth / 2.3)).current;

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
    const stopRow = 2;
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

  useEffect(() => {
    let iv;
    if (isBusVisible && busSprites["NORTH"]) {
      iv = setInterval(() => {
        setBusFrame((p) => (p + 1) % busSprites["NORTH"].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [isBusVisible]);

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

    if (answer === "Speed up to get away from the tailgating bus") {
      // Speed up - car accelerates forward, bus falls behind
      const speedUpRow = 7;
      const speedUpTarget = currentScroll.current + (speedUpRow - currentRow) * tileSize;

      Animated.parallel([
        Animated.timing(scrollY, {
          toValue: speedUpTarget,
          duration: 1500,
          useNativeDriver: true,
        }),
        // Bus falls behind as car speeds up
        Animated.timing(busYAnim, {
          toValue: 250,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCarPaused(true);
        setTimeout(() => {
          handleFeedback(answer);
        }, 500);
      });
      return;
    } else if (answer === "Maintain safe speed, signal early for your intended direction, and let the bus pass if safe") {
        // Continue straight at same speed
        const passRow = 7;
        const passTarget = currentScroll.current + (passRow - currentRow) * tileSize;

        Animated.parallel([
          Animated.timing(scrollY, {
            toValue: passTarget,
            duration: 2500,
            useNativeDriver: true,
          }),
          // Bus maintains distance
          Animated.timing(busYAnim, {
            toValue: 120,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setCarPaused(true);
          handleFeedback(answer);
        });
    } else if(answer === "Brake suddenly to teach the bus driver a lesson"){
        // Sudden brake - car stops, bus crashes into it
        const brakeRow = 4;
        const brakeTarget = currentScroll.current + (brakeRow - currentRow) * tileSize;

        Animated.timing(scrollY, {
            toValue: brakeTarget,
            duration: 1000,
            useNativeDriver: true,
        }).start(() => {
            // Sudden stop
            setCarPaused(true);
            
            // Bus crashes into car
            Animated.timing(busYAnim, {
              toValue: 100, // Crash position - very close to car
              duration: 800,
              useNativeDriver: true,
            }).start(() => {
              setTimeout(() => {
                handleFeedback(answer);
              }, 300);
            });
        });
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    
    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    busXAnim.setValue(centerX);
    busYAnim.setValue(120);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setIsBusVisible(true);
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

  const trafficSignLeft = trafficSignColIndex * tileSize + trafficSignXOffset;
  const trafficSignTop = trafficSignRowIndex * tileSize;

  const trafficSign2Left = trafficSign2ColIndex * tileSize + trafficSign2XOffset;
  const trafficSign2Top = trafficSign2RowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Defensive driving means maintaining safe speeds and clear communication while managing aggressive drivers safely."
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

      {isBusVisible && (
        <Animated.Image
          source={busSprites["NORTH"][busFrame]}
          style={{
            width: carWidth * 1.5,
            height: carHeight * 1.5,
            position: "absolute",
            bottom: -100,
            left: busXAnim,
            zIndex: 9,
            transform: [{ translateY: busYAnim }],
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