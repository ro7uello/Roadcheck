import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet, // Import StyleSheet for better organization
} from "react-native";

const { width, height } = Dimensions.get("window");

// Road tiles
const roadTiles = {
  road1: require("../assets/road/road1.png"),
  road2: require("../assets/road/road2.png"),
  road3: require("../assets/road/road3.png"),
  road4: require("../assets/road/road4.png"),
  road5: require("../assets/road/road5.png"),
  road6: require("../assets/road/road6.png"),
  road7: require("../assets/road/road7.png"),
  road8: require("../assets/road/road8.png"),
  road9: require("../assets/road/road9.png"),
  road10: require("../assets/road/road10.png"),
  road11: require("../assets/road/road11.png"),
  road12: require("../assets/road/road12.png"),
  road13: require("../assets/road/road13.png"),
  road14: require("../assets/road/road14.png"),
  road15: require("../assets/road/road15.png"),
  road16: require("../assets/road/road16.png"),
  road17: require("../assets/road/road17.png"),
  road18: require("../assets/road/road18.png"),
  road19: require("../assets/road/road19.png"),
  road20: require("../assets/road/road20.png"),
  road21: require("../assets/road/road21.png"),
  road22: require("../assets/road/road22.png"),
  road23: require("../assets/road/road23.png"),
  road24: require("../assets/road/road24.png"),
  road25: require("../assets/road/road25.png"),
  road26: require("../assets/road/road26.png"),
  road27: require("../assets/road/road27.png"),
  road28: require("../assets/road/road28.png"),
  road29: require("../assets/road/road29.png"),
  road30: require("../assets/road/road30.png"),
  road31: require("../assets/road/road31.png"),
  road32: require("../assets/road/road32.png"),
  road33: require("../assets/road/road33.png"),
  road34: require("../assets/road/road34.png"),
  road35: require("../assets/road/road35.png"),
  road36: require("../assets/road/road36.png"),
  road37: require("../assets/road/road37.png"),
  road38: require("../assets/road/road38.png"),
  road39: require("../assets/road/road39.png"),
  road40: require("../assets/road/road40.png"),
  road41: require("../assets/road/road41.png"),
  road42: require("../assets/road/road42.png"),
  road43: require("../assets/road/road43.png"),
  road44: require("../assets/road/road44.png"),
  road45: require("../assets/road/road45.png"),
  road46: require("../assets/road/road46.png"),
  road47: require("../assets/road/road47.png"),
  road48: require("../assets/road/road48.png"),
  road49: require("../assets/road/road49.png"),
  road50: require("../assets/road/road50.png"),
  road51: require("../assets/road/road51.png"),
  road52: require("../assets/road/road52.png"),
  road53: require("../assets/road/road53.png"),
  road54: require("../assets/road/road54.png"),
  road55: require("../assets/road/road55.png"),
  road56: require("../assets/road/road56.png"),
};

// Map layout
const mapLayout = [
  ["road18", "road1", "road1", "road1", "road17"],
  ["road18", "road1", "road1", "road1", "road17"],
  ["road18", "road13", "road13", "road13", "road17"],
  ["road49", "road53", "road15", "road56", "road50"],
  ["road55", "road48", "road48", "road48", "road55"],
  ["road54", "road48", "road48", "road48", "road54"],
  ["road47", "road48", "road48", "road48", "road47"],
  ["road19", "road53", "road15", "road56", "road16"],
  ["road18", "road9", "road13", "road12", "road17"],
  ["road18", "road1", "road1", "road1", "road17"],
  ["road18", "road1", "road1", "road1", "road17"],
  ["road18", "road4", "road2", "road3", "road17"],
  ["road18", "road4", "road2", "road3", "road17"],
  ["road18", "road4", "road2", "road3", "road17"],
  ["road18", "road4", "road2", "road3", "road17"],
  ["road18", "road4", "road2", "road3", "road17"],
  ["road18", "road4", "road2", "road3", "road17"],
  ["road18", "road4", "road2", "road3", "road17"],
  ["road18", "road4", "road2", "road3", "road17"],
  ["road18", "road4", "road2", "road3", "road17"],
];

const carSprites = {
  NORTH: [
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
  ],
  NORTHWEST: [
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_000.png"),
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_001.png"),
  ],
  WEST: [
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_000.png"),
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_001.png"),
  ],
  NORTHEAST: [
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  EAST: [
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
};

// Questions
const questions = [
  {
    question: "What does this road marking mean?",
    options: ["Option 1", "Option 2", "Option 3"],
    correct: "Option 1",
  },
];

export default function DrivingGame() {
  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns + 11;
  const mapHeight = mapLayout.length * tileSize;

  const [showIntro, setShowIntro] = useState(true); // New state for introduction
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
  const carXAnim = useRef(new Animated.Value(width / 2 - 110)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // No longer directly used, but keeping for reference if needed elsewhere
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

    const stopRow = 10;
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

  // Effect to start game logic only when not showing intro
  useEffect(() => {
    if (!showIntro) {
      startScrollAnimation();
    }
  }, [showIntro]); // Depend on showIntro

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
      const targetRow = 17;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 3000,
        useNativeDriver: true,
      }).start(() => handleFeedback(answer));
    } else if (answer === "Option 2") {
      const turnStartRow = 13;
      // You can adjust turnEndRow to control how far the car drives off
      // For now, it drives off immediately after the turn sequence
      // const turnEndRow = 15;

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
      const turnStartRow = 13;
      // const turnEndRow = 15;

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

    const centerX = width / 2 - 110;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      // After handling next question, restart the scroll animation for the new question context
      startScrollAnimation();
      // setShowQuestion(true); // startScrollAnimation will show the question
      // setTimeout(() => { // startScrollAnimation will show answers
      //   setShowAnswers(true);
      // }, 1000);
    } else {
      setShowQuestion(false);
      // Optionally show a "Game Over" screen or reset to intro
      setShowIntro(true); // Go back to intro after all questions
    }
  };

  // Handler for the "Start Game" button on the intro screen
  const handleStartGame = () => {
    setShowIntro(false);
    // The useEffect will now trigger startScrollAnimation()
  };

  if (showIntro) {
    return (
      <View style={styles.introContainer}>
        <Image
          source={require("../assets/dialog/LTO.png")}
          style={styles.introLTOImage}
        />
        <View style={styles.introTextBox}>
          <Text style={styles.introTitle}>Welcome to ROADCHECK!</Text>
          <Text style={styles.introText}>
            Test your knowledge of road rules and signs.
            Choose the correct option to proceed safely.
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main game rendering starts here (if not showing intro)
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

      {/* Car (fixed) - Only one Image component now */}
      {isCarVisible && (
        <Animated.Image
          source={carSprites[carDirection][carFrame]}
          style={{
            width: 280,
            height: 350,
            position: "absolute",
            bottom: 80,
            left: carXAnim,
            zIndex: 5,
          }}
        />
      )}

      {/* Question Overlay */}
      {showQuestion && (
        <View
          style={{
            position: "absolute",
            top: 310,
            left: 0,
            width,
            height: 265,
            backgroundColor: "rgba(8, 8, 8, 0.43)",
            flexDirection: "row",
            alignItems: "flex-end",
            paddingBottom: 10,
            zIndex: 10,
          }}
        >
          {/* LTO image at bottom-left */}
          <Image
            source={require("../assets/dialog/LTO.png")}
            style={{
              width: 240,
              height: 300,
              resizeMode: "contain",
              marginLeft: -30,
            }}
          />

          {/* Question box bottom-center */}
          <View
            style={{
              flex: 1,
              bottom: 90,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                padding: 16,
                maxWidth: width * 0.6,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 18,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                {questions[questionIndex].question}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Answers still float separately */}
      {showAnswers && (
        <View
          style={{
            position: "absolute",
            top: height * 0.25,
            right: 20,
            width: width * 0.35,
            zIndex: 11,
          }}
        >
          {questions[questionIndex].options.map((option) => (
            <TouchableOpacity
              key={option}
              style={{
                backgroundColor: "#333",
                padding: 14,
                borderRadius: 8,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#555",
              }}
              onPress={() => handleAnswer(option)}
            >
              <Text style={{ color: "white", fontSize: 16, textAlign: "center" }}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Feedback */}
      {animationType === "correct" && (
        <Animated.View
          style={{
            position: "absolute",
            top: height / 2 - 50,
            left: width / 2 - 100,
            width: 200,
            height: 100,
            backgroundColor: "green",
            justifyContent: "center",
            alignItems: "center",
            opacity: correctAnim,
            borderRadius: 16,
            zIndex: 20,
          }}
        >
          <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
            Correct!
          </Text>
        </Animated.View>
      )}

      {animationType === "wrong" && (
        <Animated.View
          style={{
            position: "absolute",
            top: height / 2 - 50,
            left: width / 2 - 100,
            width: 200,
            height: 100,
            backgroundColor: "red",
            justifyContent: "center",
            alignItems: "center",
            opacity: wrongAnim,
            borderRadius: 16,
            zIndex: 20,
          }}
        >
          <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
            Wrong!
          </Text>
        </Animated.View>
      )}

      {/* Next button */}
      {showNext && (
        <View
          style={{
            position: "absolute",
            top: height / 2 + 70,
            left: width / 2 - 60,
            zIndex: 30,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: "#007bff",
              paddingVertical: 12,
              paddingHorizontal: 32,
              borderRadius: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
            onPress={handleNext}
          >
            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  introContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  introLTOImage: {
    width: 300, // Adjust size as needed
    height: 300, // Adjust size as needed
    resizeMode: "contain",
    marginBottom: 40,
  },
  introTextBox: {
    backgroundColor: "rgba(8, 8, 8, 0.7)", // Slightly darker for text box
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    maxWidth: width * 0.8,
  },
  introTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  introText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: "#007bff", // Blue like your Next button
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  startButtonText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
});