import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { useSession, SessionProvider } from "../../../../contexts/SessionManager";

const { width, height } = Dimensions.get("window");

// Responsive calculations
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300 / 240);
const sideMargin = width * 0.05;

const roadTiles = {
  road3: require("../../../../../assets/road/road3.png"),
  road4: require("../../../../../assets/road/road4.png"),
  road16: require("../../../../../assets/road/road16.png"),
  road6: require("../../../../../assets/road/road6.png"),
  road8: require("../../../../../assets/road/road8.png"),
  road17: require("../../../../../assets/road/road17.png"),
  road18: require("../../../../../assets/road/road18.png"),
  road19: require("../../../../../assets/road/road19.png"),
  road20: require("../../../../../assets/road/road20.png"),
  road23: require("../../../../../assets/road/road23.png"),
  road24: require("../../../../../assets/road/road24.png"),
  road48: require("../../../../../assets/road/road48.png"),
  road49: require("../../../../../assets/road/road49.png"),
  road50: require("../../../../../assets/road/road50.png"),
  road51: require("../../../../../assets/road/road51.png"),
  road52: require("../../../../../assets/road/road52.png"),
  road57: require("../../../../../assets/road/road57.png"),
  road58: require("../../../../../assets/road/road58.png"),
  road59: require("../../../../../assets/road/road59.png"),
  road60: require("../../../../../assets/road/road60.png"),
};

const treeSprites = {
  tree1: require("../../../../../assets/tree/Tree3_idle_s.png"),
};

const mapLayout = [
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
];

const treePositions = [
  { row: 0, col: 0, type: "tree1" },
  { row: 1, col: 0, type: "tree1" },
  { row: 2, col: 0, type: "tree1" },
  { row: 3, col: 0, type: "tree1" },
  { row: 4, col: 0, type: "tree1" },
  { row: 5, col: 0, type: "tree1" },
  { row: 10, col: 0, type: "tree1" },
  { row: 11, col: 0, type: "tree1" },
  { row: 12, col: 0, type: "tree1" },
  { row: 13, col: 0, type: "tree1" },
  { row: 14, col: 0, type: "tree1" },
  { row: 15, col: 0, type: "tree1" },
  { row: 16, col: 0, type: "tree1" },
  { row: 17, col: 0, type: "tree1" },
  { row: 0, col: 3.5, type: "tree1" },
  { row: 1, col: 3.5, type: "tree1" },
  { row: 2, col: 3.5, type: "tree1" },
  { row: 3, col: 3.5, type: "tree1" },
  { row: 4, col: 3.5, type: "tree1" },
  { row: 5, col: 3.5, type: "tree1" },
  { row: 10, col: 3.5, type: "tree1" },
  { row: 11, col: 3.5, type: "tree1" },
  { row: 12, col: 3.5, type: "tree1" },
  { row: 13, col: 3.5, type: "tree1" },
  { row: 14, col: 3.5, type: "tree1" },
  { row: 15, col: 3.5, type: "tree1" },
  { row: 16, col: 3.5, type: "tree1" },
  { row: 17, col: 3.5, type: "tree1" },
  { row: 0.5, col: 4, type: "tree1" },
  { row: 2.5, col: 4, type: "tree1" },
  { row: 4.5, col: 4, type: "tree1" },
  { row: 11.5, col: 4, type: "tree1" },
  { row: 13.5, col: 4, type: "tree1" },
  { row: 15.5, col: 4, type: "tree1" },
  { row: 0.5, col: 3.5, type: "tree1" },
  { row: 2.5, col: 3.5, type: "tree1" },
  { row: 4.5, col: 3.5, type: "tree1" },
  { row: 11.5, col: 3.5, type: "tree1" },
  { row: 13.5, col: 4, type: "tree1" },
  { row: 15.5, col: 3.5, type: "tree1" },
  { row: 1, col: 4, type: "tree1" },
  { row: 3, col: 4, type: "tree1" },
  { row: 12, col: 4, type: "tree1" },
  { row: 14, col: 4, type: "tree1" },
  { row: 16, col: 4, type: "tree1" },
  { row: 1, col: 3.5, type: "tree1" },
  { row: 3, col: 3.5, type: "tree1" },
  { row: 12, col: 3.5, type: "tree1" },
  { row: 14, col: 3.5, type: "tree1" },
  { row: 16, col: 3.5, type: "tree1" },
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
  EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
};

const questions = [
  {
    question:
      "You're driving through Benguet province during the rainy season when you see a LANDSLIDE-PRONE AREA sign. Recent news reports mentioned heavy rains in the region, and you notice some loose rocks on the roadside.",
    options: [
      "Drive quickly through the area to minimize exposure time",
      "Proceed cautiously, watch for falling rocks or debris, and be prepared to stop or turn around",
      "Stop and wait for other vehicles to go first",
    ],
    correct: "Proceed cautiously, watch for falling rocks or debris, and be prepared to stop or turn around",
    correctExplanation:
      "Correct! Landslide-prone areas require extreme caution, continuous observation, and readiness to react to changing conditions.",
    wrongExplanation: {
      "Drive quickly through the area to minimize exposure time":
        "Accident prone! Speed increases risk and reduces reaction time for falling debris or unstable conditions.",
      "Stop and wait for other vehicles to go first":
        "Wrong! Stopping unnecessarily creates traffic hazards; cautious movement is safer than stationary waiting",
    },
  },
];

const warningSignSprites = {
  floodRiskArea: require("../../../../../assets/signs/bridge.png"),
};

function DrivingGameContent() {
  const { updateScenarioProgress, moveToNextScenario, completeSession, currentScenario, sessionData } = useSession();

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const phaseId = sessionData?.phase_id;
      if (!phaseId) return;

      let scenarioId;
      if (phaseId === 4) {
        scenarioId = 30 + currentScenario;
      } else if (phaseId === 5) {
        scenarioId = 40 + currentScenario;
      } else {
        return;
      }

      await updateScenarioProgress(scenarioId, selectedOption, isCorrect);
    } catch (error) {
      console.error("Error updating scenario progress:", error);
    }
  };

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  const warningSignRowIndex = 12.5;
  const warningSignColIndex = 3;
  const warningSignXOffset = 0;

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
  const [carDirection, setCarDirection] = useState("NORTH");
  const [carPaused, setCarPaused] = useState(false);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopRow = 6;
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
      Animated.timing(correctAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start(() => {
        correctAnim.setValue(0);
        setShowNext(true);
      });
    } else {
      setIsCorrectAnswer(false);
      setAnimationType("wrong");
      Animated.timing(wrongAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start(() => {
        wrongAnim.setValue(0);
        setShowNext(true);
      });
    }
  };

 const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;

    // Update backend progress (non-blocking)
    updateProgress(answer, isCorrect).catch((error) => console.error(error));

    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);
    const targetRow = 16;
    const rowsToMove = targetRow - currentRow;
    const nextTarget = currentScroll.current + rowsToMove * tileSize;

    let duration = 5000;
    if (answer === "Reduce speed and be prepared to stop if the bridge is opening or about to open") {
      duration = 8000; // Slow speed - correct answer (cautious approach)
    } else if (answer === "Speed up to cross before the bridge opens") {
      duration = 3000; // Fast speed - wrong answer (reckless driving)
    } else if (answer === "Continue at normal speed since the bridge appears closed") {
      duration = 5000; // Normal speed - wrong answer (not being prepared)
    }

    Animated.timing(scrollY, { toValue: nextTarget, duration, useNativeDriver: true }).start(({ finished }) => {
      if (finished) handleFeedback(answer);
    });
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setCarFrame(0);
    setCarDirection("NORTH");

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario >= 10) {
      try {
        const sessionResults = await completeSession();
        router.push({
          pathname: "/result",
          params: { ...sessionResults, userAttempts: JSON.stringify(sessionResults.attempts) },
        });
      } catch (error) {
        console.error("Error completing session:", error);
        Alert.alert("Error", "Failed to save session results");
      }
    } else {
      moveToNextScenario();
      router.push("scenarios/traffic-signs/phase3/S9P3");
    }
  };

  const warningSignLeft = warningSignColIndex * tileSize + warningSignXOffset;
  const warningSignTop = warningSignRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? currentQuestionData.correctExplanation
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a2e" }}>
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
              style={{ position: "absolute", width: tileSize, height: tileSize, left: colIndex * tileSize, top: rowIndex * tileSize }}
              resizeMode="stretch"
            />
          ))
        )}

        {treePositions.map((tree, index) => (
          <Image
            key={`tree-${index}`}
            source={treeSprites[tree.type]}
            style={{ position: "absolute", width: tileSize, height: tileSize, left: tree.col * tileSize, top: tree.row * tileSize }}
          />
        ))}

        <Image
          source={warningSignSprites.floodRiskArea}
          style={{ position: "absolute", width: tileSize, height: tileSize, left: warningSignLeft, top: warningSignTop, zIndex: 2 }}
          resizeMode="contain"
        />
      </Animated.View>

      <Image
        source={carSprites[carDirection][carFrame]}
        style={{ width: tileSize * 2.0, height: tileSize * 2.0, position: "absolute", bottom: height * 0.1, left: width * 0.29, zIndex: 3 }}
      />

      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.questionBox}>
            <View style={styles.questionTextContainer}>
              <Text style={styles.questionText}>{currentQuestionData.question}</Text>
            </View>
          </View>
        </View>
      )}

      {showAnswers && (
        <View style={styles.answersContainer}>
          {currentQuestionData.options.map((option) => (
            <TouchableOpacity key={option} style={styles.answerButton} onPress={() => handleAnswer(option)}>
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

export default function S5P3() {
  return (
    <SessionProvider>
      <DrivingGameContent />
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
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
    zIndex: 200,
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
    top: height * 0.2,
    right: sideMargin,
    width: width * 0.35,
    height: height * 0.21,
    zIndex: 200,
  },
  answerButton: {
    backgroundColor: "#333",
    padding: height * 0.015,
    borderRadius: 8,
    marginBottom: height * 0.015,
    borderWidth: 1,
    borderColor: "#555",
  },
  answerText: { color: "white", fontSize: Math.min(width * 0.04, 16), textAlign: "center" },
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
    zIndex: 200,
  },
  feedbackBox: { flex: 1, bottom: height * 0.1, alignItems: "center", justifyContent: "center" },
  feedbackText: { color: "white", fontSize: Math.min(width * 0.06, 24), fontWeight: "bold", textAlign: "center" },
  nextButtonContainer: { position: "absolute", top: height * 0.5, right: sideMargin, width: width * 0.2, alignItems: "center", zIndex: 300 },
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
  nextButtonText: { color: "white", fontSize: Math.min(width * 0.045, 20), fontWeight: "bold" },
});