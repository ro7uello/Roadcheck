import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// --- assets and tiles (same as yours) ---
const roadTiles = {
  road1: require("../assets/road/road1.png"),
  road3: require("../assets/road/road3.png"),
  road4: require("../assets/road/road4.png"),
  road17: require("../assets/road/road17.png"),
  road62: require("../assets/road/road62.png"),
  road70: require("../assets/road/road70.png"),
};

const mapLayout = [
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road3"],
  ["road1", "road62", "road1", "road4", "road70"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
];

// Separated sprites (unchanged)
const playerCarSprites = {
  NORTH: [
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHEAST: [
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  EAST: [
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
  // Add other directions if needed for specific overtaking maneuvers
};

const jeepneySprites = {
  NORTH: [
    require("../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
    require("../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
  ],
};
const questions = [
  {
    question: "You're on a two-lane highway with a solid white center line separating lanes going in the same direction. You need to change lanes to exit but the line is still solid on your exit.",
    options: ["Continue straight and find another exit", "Slow down and wait for the line to become broken", "Cross the solid white line to change lanes for your exit"],
    correct: "Cross the solid white line to change lanes for your exit",
    wrongExplanation: {
      "Slow down and wait for the line to become broken": "Accident prone! Unneccessary slowing down on a highway might be dangerous and unexpected for the vehicle behind you.",
      "Continue straight and find another exit": "Impractical! You may not find another exit for miles ahead."
    }
  },
];

export default function DrivingGame() {
  const navigation = useNavigation();

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
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [carDirection, setCarDirection] = useState("NORTH");
  const [carFrame, setCarFrame] = useState(0);

  // Responsive car positioning
  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Car animation frame cycling
  function animateTurnLeft(onComplete) {
    const sequence = ["NORTH", "NORTHWEST", "WEST"];
    let step = 0;
    const interval = setInterval(() => {
      setCarDirection(sequence[step]);
      setCarFrame(0);
      step++;
      if (step >= sequence.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 300);
  }

  function animateTurnRight(onComplete) {
    const sequence = ["NORTH", "NORTHEAST", "EAST"];
    let step = 0;
    const interval = setInterval(() => {
      setCarDirection(sequence[step]);
      setCarFrame(0);
      step++;
      if (step >= sequence.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 300);
  }

  function startScrollAnimation() {
    scrollY.setValue(startOffset); // Ensure scroll starts from bottom for each game start

    const stopRow = 6.5;
    const stopOffset = startOffset + stopRow * tileSize;

    Animated.timing(scrollY, {
      toValue: stopOffset,
      duration: 4000,
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

  const handleFeedback = (answer) => {
    if (answer === questions[questionIndex].correct) {
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

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentRow = Math.abs(currentScroll.current - startOffset) / tileSize;

    if (answer === "Option 1") {
      const targetRow = 14;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 3000,
        useNativeDriver: true,
      }).start(() => handleFeedback(answer));
    } else if (answer === "Option 2 Correct") {
      const turnStartRow = 12;
      const turnEndRow = 14;

      const initialScrollTarget =
        currentScroll.current + (turnStartRow - currentRow) * tileSize;

      Animated.timing(scrollY, {
        toValue: initialScrollTarget,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        const turnSequence = ["NORTH", "NORTHWEST", "WEST"];
        let currentTurnStep = 0;

        const animateTurnAndMove = () => {
          if (currentTurnStep < turnSequence.length) {
            setCarDirection(turnSequence[currentTurnStep]);
            setCarFrame(0);

            let deltaX = 0;
            let deltaYScroll = 0;

            if (turnSequence[currentTurnStep] === "NORTHWEST") {
              deltaX = -tileSize / 4;
              deltaYScroll = tileSize / 4;
            } else if (turnSequence[currentTurnStep] === "WEST") {
              deltaX = -tileSize / 2;
              deltaYScroll = tileSize / 2;
            }

            Animated.parallel([
              Animated.timing(carXAnim, {
                toValue: carXAnim._value + deltaX,
                duration: 300,
                useNativeDriver: false,
              }),
              Animated.timing(scrollY, {
                toValue: scrollY._value + deltaYScroll,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start(() => {
              currentTurnStep++;
              animateTurnAndMove();
            });
          } else {
            Animated.timing(carXAnim, {
              toValue: -width,
              duration: 2500,
              useNativeDriver: false,
            }).start(() => {
              setIsCarVisible(false);
              handleFeedback(answer);
            });
          }
        };
        animateTurnAndMove();
      });
      return;
    } else if (answer === "Option 3") {
      const turnStartRow = 10;
      const turnEndRow = 12;

      const initialScrollTarget =
        currentScroll.current + (turnStartRow - currentRow) * tileSize;

      Animated.timing(scrollY, {
        toValue: initialScrollTarget,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        const turnSequence = ["NORTH", "NORTHEAST", "EAST"];
        let currentTurnStep = 0;

        const animateTurnAndMove = () => {
          if (currentTurnStep < turnSequence.length) {
            setCarDirection(turnSequence[currentTurnStep]);
            setCarFrame(0);

            let deltaX = 0;
            let deltaYScroll = 0;

            if (turnSequence[currentTurnStep] === "NORTHEAST") {
              deltaX = tileSize / 4;
              deltaYScroll = tileSize / 4;
            } else if (turnSequence[currentTurnStep] === "EAST") {
              deltaX = tileSize / 2;
              deltaYScroll = tileSize / 2;
            }

            Animated.parallel([
              Animated.timing(carXAnim, {
                toValue: carXAnim._value + deltaX,
                duration: 300,
                useNativeDriver: false,
              }),
              Animated.timing(scrollY, {
                toValue: scrollY._value + deltaYScroll,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start(() => {
              currentTurnStep++;
              animateTurnAndMove();
            });
          } else {
            Animated.timing(carXAnim, {
              toValue: width * 2,
              duration: 2500,
              useNativeDriver: false,
            }).start(() => {
              setIsCarVisible(false);
              handleFeedback(answer);
            });
          }
        };
        animateTurnAndMove();
      });
      return;
    }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);

    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      navigation.navigate('Scenario4');
      setShowQuestion(false);
    }
  };

  // Main game rendering
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

      {/* Responsive Car */}
      {isCarVisible && (
        <Animated.Image
          source={playerCarSprites[carDirection][carFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: height * 0.1, // Responsive bottom positioning
            left: carXAnim,
            zIndex: 5,
          }}
        />
      )}

      {/* Responsive Question Overlay */}
      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image
            source={require("../assets/dialog/LTO.png")}
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

      {/* Responsive Answers */}
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

      {/* Responsive Feedback - Correct */}
      {animationType === "correct" && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>Correct!</Text>
          </View>
        </Animated.View>
      )}

      {/* Responsive Feedback - Wrong */}
      {animationType === "wrong" && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>Wrong!</Text>
          </View>
        </Animated.View>
      )}

      {/* Responsive Next Button */}
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
  // Responsive styles for in-game elements
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