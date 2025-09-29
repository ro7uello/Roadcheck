import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
  Easing,
} from "react-native";
import { router } from 'expo-router';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

const roadTiles = {
  road1: require("../../../../assets/road/road1.png"),
  road2: require("../../../../assets/road/road2.png"),
  road3: require("../../../../assets/road/road3.png"),
  road4: require("../../../../assets/road/road4.png"),
  road18: require("../../../../assets/road/road18.png"),
  road57: require("../../../../assets/road/road57.png"),
  road59: require("../../../../assets/road/road59.png"),
  road62: require("../../../../assets/road/road62.png"),
  road77: require("../../../../assets/road/road77.png"),
  road78: require("../../../../assets/road/road78.png"),
  road79: require("../../../../assets/road/road79.png"),
};

const mapLayout = [
  ["road79", "road1", "road1", "road62", "road4"],
  ["road79", "road1", "road1", "road62", "road4"],
  ["road79", "road1", "road1", "road62", "road4"],
  ["road79", "road1", "road1", "road62", "road4"],
  ["road79", "road1", "road1", "road62", "road4"],
  ["road79", "road1", "road1", "road62", "road4"],
  ["road79", "road1", "road1", "road62", "road4"],
  ["road79", "road1", "road1", "road62", "road4"],
  ["road79", "road1", "road1", "road62", "road4"],
  ["road79", "road1", "road1", "road62", "road4"],
  ["road79", "road4", "road2", "road78", "road4"],
  ["road79", "road4", "road2", "road77", "road4"],
  ["road79", "road4", "road2", "road3", "road4"],
  ["road79", "road4", "road2", "road3", "road4"],
  ["road79", "road4", "road2", "road3", "road4"],
  ["road79", "road4", "road2", "road2", "road4"],
  ["road79", "road4", "road2", "road2", "road4"],
  ["road79", "road4", "road2", "road2", "road4"],
];

const carSprites = {
  NORTH: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHEAST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
};

const questions = [
  {
    question: "You're riding your SUV along Roxas Boulevard heading to Manila Bay. You encounter a NO MOTORCYCLES sign at the entrance to a tunnel section. There are other motorcycles ahead of you that seem to be ignoring the sign and continuing through.",
    options: ["Follow the other motorcycles since they seem familiar with the route", "Do not enter the tunnel and find an alternate route that allows motorcycles", "Proceed through"],
    correct: "Proceed through",
    wrongExplanation: {
      "Follow the other motorcycles since they seem familiar with the route": "Wrong! Following other violators doesn't make your actions legal and you'll still face penalties.",
      "Do not enter the tunnel and find an alternate route that allows motorcycles": "Wrong! Only motorcycles are not allowed to enter."
    }
  },
];

const trafficSign = {
    sign: require("../../../../assets/signs/no_motorcycle.png"),
};

export default function DrivingGame() {
  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;
  const carWidth = 280;
  const carHeight = 350;

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  const trafficSignRowIndex = 11;
  const trafficSignColIndex = 3;
  const trafficSignXOffset = -20;

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

  // Car states
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  const [carDirection, setCarDirection] = useState("NORTH");
  const carXAnim = useRef(new Animated.Value(width / 2 - (carWidth / 2))).current;

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopRow = 4.5;
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
    if (!carPaused) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites[carDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused, carDirection]);

  // Feedback animations
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

  // Helper function to animate car to target row
  const animateCarToTargetRow = (targetRow, duration, callback) => {
    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);
    const rowsToMove = targetRow - currentRow;
    const nextTarget = currentScroll.current + rowsToMove * tileSize;
    
    Animated.timing(scrollY, {
      toValue: nextTarget,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      if (callback) callback();
    });
  };

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);

    if (answer === "Follow the other motorcycles since they seem familiar with the route") {
      const targetRow = 10;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 5000,
        useNativeDriver: true,
      }).start(() => {
        handleFeedback(answer);
      });
    } else if (answer === "Do not enter the tunnel and find an alternate route that allows motorcycles") {
      // Enhanced smooth turn animation sequence
      
      // Step 1: Change direction to NORTHEAST and move diagonally
      setCarDirection("NORTHEAST");
      
      Animated.sequence([
        // Step 2: Move NORTHEAST diagonally (right and forward)
        Animated.parallel([
          Animated.timing(carXAnim, {
            toValue: width / 2 - carWidth / 2 + tileSize * 1.8, // Move to the right lane (road4)
            duration: 800,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Smooth easing
            useNativeDriver: true,
          }),
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 0.8, // Move forward slightly
            duration: 800,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
        ]),
        
        // Step 3: Small pause for smooth transition
        Animated.delay(200),
        
        // Step 4: Change direction to NORTH and continue straight
        Animated.timing(scrollY, {
          toValue: currentScroll.current + tileSize * 0.8, // Small adjustment
          duration: 300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Step 5: Set direction to NORTH and move to final position
        setCarDirection("NORTH");
        
        // Final movement to target row
        setTimeout(() => {
          animateCarToTargetRow(14, 2500, () => {
            handleFeedback(answer);
          });
        }, 100); // Small delay to let direction change take effect
      });

    } else if (answer === "Proceed through") {
      const targetRow = 10;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 5000,
        useNativeDriver: true,
      }).start(() => {
        handleFeedback(answer);
      });
    }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    setCarDirection("NORTH");
    carXAnim.setValue(width / 2 - (carWidth / 2));

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      router.push('/driver-game/signs/phase-2/S2P2');
      setQuestionIndex(0);
      setShowQuestion(false);
    }
  };

  const trafficSignLeft = trafficSignColIndex * tileSize + trafficSignXOffset;
  const trafficSignTop = trafficSignRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! SUV and other cars are allowed to enter the tunnel as long as it's not a motorcycle."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

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
        
        {/* Traffic Sign */}
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

      {/* Car - fixed position with dynamic direction */}
      <Animated.Image
        source={carSprites[carDirection][carFrame]}
        style={{
          width: carWidth,
          height: carHeight,
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
            source={require("../../../../assets/dialog/LTO.png")}
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
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
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
  // ✅ DATABASE INTEGRATION - Added loading styles
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
  // No intro styles (responsive)
  // In-game responsive styles
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
    fontSize: Math.min(width * 0.04, 16),
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