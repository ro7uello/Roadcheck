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
  int1: require("../../../../../assets/road/int1.png"),
  int2: require("../../../../../assets/road/int2.png"),
  int3: require("../../../../../assets/road/int3.png"),
  int4: require("../../../../../assets/road/int4.png"),
};

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
  NPC_NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_CIVIC_CLEAN_NORTH_000.png"),
  ],
};

const questions = [
  {
    question: "You're approaching a busy intersection in Makati with a yellow box \"Do Not Block\" marking. Traffic ahead is slow, and you might get stuck in the box when the light changes.",
    options: [
      "Enter the yellow box since you have a green light", 
      "Wait outside the yellow box until you can completely clear it", 
      "Enter partially and move forward when space becomes available"
    ],
    correct: "Wait outside the yellow box until you can completely clear it",
    wrongExplanation: {
      "Enter the yellow box since you have a green light": "Wrong! Green lights don't override the \"Do Not Block\" rule - you must not enter unless you can exit completely.",
      "Enter partially and move forward when space becomes available": "Wrong! Partial entry still blocks the intersection for cross traffic when lights change."
    }
  },
];

const trafficLightSprites = {
  normal: require("../../../../../assets/traffic light/Traffic_Light.png"),
  green: require("../../../../../assets/traffic light/traffic_light_green2.png"),
};

// NPC car positions (rows 2-7, column 2 - right lane)
const npcCarPositions = [
  { row: 2, col: 1.8 },
  { row: 3, col: 1.8 },
  { row: 4, col: 1.8 },
  { row: 5, col: 1.6 },
  { row: 6, col: 1.6 },
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
      const scenarioId = 20 + currentScenario;
      await updateScenarioProgress(scenarioId, selectedOption, isCorrect);
    } catch (error) {
      console.error('Error updating scenario progress:', error);
    }
  };

  const [showIntro, setShowIntro] = useState(true);

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  const trafficLightRowIndex = 9;
  const trafficLightColIndex = 2;
  const trafficLightXOffset = -30;

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
  const carXAnim = useRef(new Animated.Value(width / 2 - (280 / 2))).current;
  
  const [trafficLightState, setTrafficLightState] = useState('green');

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopRow = 6.5;
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
        setCarFrame((p) => (p + 1) % carSprites["NORTH"].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused]);

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);

  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    const isCorrect = answerGiven === currentQuestion.correct;
    
    if (isCorrect) {
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

    if (answer === "Enter the yellow box since you have a green light") {
      const targetRow = 9.2;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        setCarPaused(true);
        handleFeedback(answer);
      });
      
    } else if (answer === "Wait outside the yellow box until you can completely clear it") {
      setCarPaused(true);
      
      setTimeout(() => {
        setCarPaused(false);
        const targetRow = 7;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;
        
        Animated.timing(scrollY, {
          toValue: nextTarget,
          duration: 3000,
          useNativeDriver: true,
        }).start(() => {
          handleFeedback(answer);
        });
      });
      
    } else if (answer === "Enter partially and move forward when space becomes available") {
      const targetRow = 7;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          const targetRow2 = 9;
          const nextTarget2 = currentScroll.current + (targetRow2 - 7.5) * tileSize;
          
          Animated.timing(scrollY, {
            toValue: nextTarget2,
            duration: 1000,
            useNativeDriver: true,
          }).start(() => {
            setCarPaused(true);
            handleFeedback(answer);
          });
        }, 500);
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
    carXAnim.setValue(width / 2 - (280 / 2));
    setTrafficLightState('green');

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

  const handleStartGame = () => {
    setShowIntro(false);
  };

  const trafficLightLeft = trafficLightColIndex * tileSize + trafficLightXOffset;
  const trafficLightTop = trafficLightRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! You must wait until you can completely clear the yellow box before entering, regardless of light color."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  if (showIntro) {
    return (
      <View style={styles.introContainer}>
        <Image
          source={require("../../../../../assets/dialog/LTO.png")}
          style={styles.introLTOImage}
        />
        <View style={styles.introTextBox}>
          <Text style={styles.introTitle}>Road Markings - Phase 3</Text>
          <Text style={styles.introText}>
            Test your knowledge of road rules and signs.
            Choose the correct option to proceed safely.
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Text style={styles.startButtonText}>Start Scenario</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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

        {/* NPC Cars - placed at rows 2-7, column 2 (right lane) */}
        {npcCarPositions.map((pos, index) => (
          <Image
            key={`npc-${index}`}
            source={carSprites["NPC_NORTH"][0]}
            style={{
              width: tileSize * 1.7,
              height: tileSize * 1.7,
              position: "absolute",
              top: pos.row * tileSize,
              left: pos.col * tileSize + (tileSize * 0.1),
              zIndex: 5,
            }}
            resizeMode="contain"
          />
        ))}

        <Image
          source={trafficLightSprites[trafficLightState]}
          style={{
            width: tileSize * 1.5,
            height: tileSize * 2,
            position: "absolute",
            top: trafficLightTop,
            left: trafficLightLeft,
            zIndex: 10,
          }}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.Image
        source={carSprites["NORTH"][carFrame]}
        style={{
          width: 280,
          height: 350,
          position: "absolute",
          bottom: 80,
          left: carXAnim,
          zIndex: 8,
        }}
      />

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

      {animationType && (
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
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