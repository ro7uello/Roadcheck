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

// --- assets and tiles (same as yours) ---
const roadTiles = {
    road1: require("../../../../assets/road/road1.png"),
    road3: require("../../../../assets/road/road3.png"),
    road4: require("../../../../assets/road/road4.png"),
    road11: require("../../../../assets/road/road11.png"),
    road13: require("../../../../assets/road/road13.png"),
    road15: require("../../../../assets/road/road15.png"),
    road16: require("../../../../assets/road/road16.png"),
    road17: require("../../../../assets/road/road17.png"),
    road47: require("../../../../assets/road/road47.png"),
    road48: require("../../../../assets/road/road48.png"),
    road54: require("../../../../assets/road/road54.png"),
    road55: require("../../../../assets/road/road55.png"),
    road56: require("../../../../assets/road/road56.png"),
    road61: require("../../../../assets/road/road61.png"),
    road62: require("../../../../assets/road/road62.png"),
    road63: require("../../../../assets/road/road63.png"),
    int1: require("../../../../assets/road/int1.png"),
    int4: require("../../../../assets/road/int4.png"),
    int9: require("../../../../assets/road/int9.png"),
    int10: require("../../../../assets/road/int10.png"),
    int12: require("../../../../assets/road/int12.png"),
    int13: require("../../../../assets/road/int13.png"),
    int14: require("../../../../assets/road/int14.png"),
    int15: require("../../../../assets/road/int15.png"),

};
 // FIX ROAD AND ANIMATIONS
const mapLayout = [
  ["road3", "road62", "road4", "road3", "road17"],
  ["road3", "road62", "road4", "road3", "road17"],
  ["road3", "road62", "road4", "road3", "road17"],
  ["road3", "road63", "road4", "road3", "road17"],
  ["int12", "int12", "int12", "int4", "road55"],
  ["int15", "road48", "int14", "int13", "road54"],
  ["road48", "int9", "road48", "int13", "road54"],
  ["int14", "road48", "int15", "int13", "road54"],
  ["int10", "int10", "int10", "int1", "road47"],
  ["road15", "road15", "road15", "road56", "road16"],
  ["road3", "road61", "road13", "road11", "road17"],
  ["road3", "road62", "road1", "road1", "road17"],
  ["road3", "road62", "road1", "road1", "road17"],
  ["road3", "road62", "road4", "road4", "road17"],
  ["road3", "road62", "road4", "road3", "road17"],
  ["road3", "road62", "road4", "road3", "road17"],
  ["road3", "road62", "road4", "road3", "road17"],
  ["road3", "road62", "road4", "road3", "road17"],
  ["road3", "road62", "road4", "road3", "road17"],
];


const carSprites = {
  NORTH: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHWEST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_001.png"),
  ],
  WEST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_001.png"),
  ],
};

const treeSprites = {
  tree1: require("../../../../assets/tree/Tree3_idle_s.png"),
  // Add more tree variations if you have them
  // tree2: require("../assets/tree/Tree2_idle_s"),
  // tree3: require("../assets/tree/Tree1_idle_s"),
};
const treePositions = [
  // Left side trees (column -1, outside the road)

  { row: 10, col: 1.1, type: 'tree1' },
  { row: 11, col: 1.1, type: 'tree1' },
  { row: 12, col: 1.1, type: 'tree1' },
  { row: 13, col: 1.1, type: 'tree1' },
  { row: 14, col: 1.1, type: 'tree1' },
  { row: 15, col: 1.1, type: 'tree1' },
  { row: 16, col: 1.1, type: 'tree1' },
  { row: 17, col: 1.1, type: 'tree1' },
  { row: 18, col: 1.1, type: 'tree1' },
];

const trafficSign = {
    sign: require("../../../../assets/signs/no_left_turn.png"),
};

// Updated question structure following S9P1 format
const questions = [
  {
    question: "You're on Commonwealth Avenue needing to reach a mall on your left side. You encounter a NO LEFT TURN sign at the intersection where you planned to turn. The next intersection is 2 kilometers away.",
    options: ["Make a quick left turn when traffic enforcers aren't looking", "Continue straight and find a legal U-turn or alternate route", "Turn left slowly with hazard lights on"],
    correct: "Continue straight and find a legal U-turn or alternate route",
    wrongExplanation: {
      "Make a quick left turn when traffic enforcers aren't looking": "Wrong! Making an illegal turn violates traffic laws regardless of enforcement presence.",
      "Turn left slowly with hazard lights on": "Accident prone! Unexpected behaviors on the road is a risky behavior. Hazard lights don't make an illegal turn legal."
    }
  },
];

export default function DrivingGame() {

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isCarVisible, setIsCarVisible] = useState(true);

  const startOffset = -(mapHeight - height);

  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  const trafficSignRowIndex = 9.8;
  const trafficSignColIndex = 1.3;
  const trafficSignXOffset = 20;

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      currentScroll.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null); // NEW STATE from S9P1 for correct/wrong feedback
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

  //SCROLL ANIMATION BEFORE QUESTION APPEARS
  function startScrollAnimation() {
    scrollY.setValue(startOffset); // Ensure scroll starts from bottom for each game start

    const stopRow = 7;
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

  // Updated handleFeedback function from S9P1
  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    if (answerGiven === currentQuestion.correct) {
      setIsCorrectAnswer(true); // Set to true for correct feedback
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
      setIsCorrectAnswer(false); // Set to false for wrong feedback
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


    // STRAIGHT DRIVE ANIMATION
    if (answer === "Continue straight and find a legal U-turn or alternate route") {
      const targetRow = 14;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 3000,
        useNativeDriver: true,
      }).start(() => handleFeedback(answer));

    // QUICK LEFT TURN ANIMATION
    } else if (answer === "Make a quick left turn when traffic enforcers aren't looking") {
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

    // SLOW LEFT TURN ANIMATION
    } else if (answer === "Turn left slowly with hazard lights on") {
      const turnStartRow = 12;
      const turnEndRow = 14;

      const initialScrollTarget =
        currentScroll.current + (turnStartRow - currentRow) * tileSize;

      Animated.timing(scrollY, {
        toValue: initialScrollTarget,
        duration: 4000,
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
                duration: 500,
                useNativeDriver: false,
              }),
              Animated.timing(scrollY, {
                toValue: scrollY._value + deltaYScroll,
                duration: 500,
                useNativeDriver: true,
              }),
            ]).start(() => {
              currentTurnStep++;
              animateTurnAndMove();
            });
          } else {
            Animated.timing(carXAnim, {
              toValue: -width,
              duration: 5000,
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
    setIsCorrectAnswer(null); // Reset feedback state from S9P1
    setCarFrame(0);

    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      router.push('/driver-game/signs/phase-2/S5P2');
      setShowQuestion(false);
    }
  };

  const trafficSignLeft = trafficSignColIndex * tileSize + trafficSignXOffset;  
  const trafficSignTop = trafficSignRowIndex * tileSize;

  // Determine the feedback message based on whether the answer was correct or wrong (from S9P1)
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! You must obey the sign and find a legal route, even if it's inconvenient."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

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
        
                {/*Traffic Sign */}
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

      {/* Responsive Car */}
      {isCarVisible && (
        <Animated.Image
          source={carSprites[carDirection][carFrame]}
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

      {/* Responsive Feedback - Updated to use S9P1 format */}
      {(animationType === "correct" || animationType === "wrong") && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
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