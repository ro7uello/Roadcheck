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
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

const roadTiles = {
  road1: require("../../../../assets/road/road1.png"),
  road2: require("../../../../assets/road/road2.png"),
  road3: require("../../../../assets/road/road3.png"),
  road4: require("../../../../assets/road/road4.png"),
  road9: require("../../../../assets/road/road9.png"),
  road11: require("../../../../assets/road/road11.png"),
  road12: require("../../../../assets/road/road12.png"),
  road15: require("../../../../assets/road/road15.png"),
  road16: require("../../../../assets/road/road16.png"),
  road17: require("../../../../assets/road/road17.png"), 
  road47: require("../../../../assets/road/road47.png"),
  road48: require("../../../../assets/road/road48.png"),
  road50: require("../../../../assets/road/road50.png"),
  road54: require("../../../../assets/road/road54.png"),
  road55: require("../../../../assets/road/road55.png"),
  road56: require("../../../../assets/road/road56.png"),
  road76: require("../../../../assets/road/road76.png"),
  int1: require("../../../../assets/road/int1.png"),
  int4: require("../../../../assets/road/int4.png"),
  int10: require("../../../../assets/road/int10.png"),
  int12: require("../../../../assets/road/int12.png"),
  int13: require("../../../../assets/road/int13.png"),
  int14: require("../../../../assets/road/int14.png"),
  int15: require("../../../../assets/road/int15.png"),
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
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHWEST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_001.png"),
  ],
};

const treeSprites = {
  tree1: require("../../../../assets/tree/Tree3_idle_s.png"),
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
    question: "You're driving along Commonwealth Avenue and encounter an Intersection ahead warning sign, followed by advance direction signs showing Bataan ➡ and Pampanga ⬅. You're going to Pampanga, and it's rush hour with heavy traffic.",
    options: ["Change lanes immediately to the left lane", "Plan your lane change early, signal, and move to the left lane when traffic permits", "Stay in the right lane and change at the last moment"],
    correct: "Plan your lane change early, signal, and move to the left lane when traffic permits",
    wrongExplanation: {
      "Change lanes immediately to the left lane": "Accident Prone! Immediate lane changes without proper signaling and checking are dangerous, especially in heavy traffic.",
      "Stay in the right lane and change at the last moment": "Wrong! Last-minute lane changes are dangerous and often illegal, especially in heavy traffic conditions."
    }
  },
];

const trafficSign = {
  sign: require("../../../../assets/signs/dir_sign_3.png"),
};
const trafficSign2 = {
  sign: require("../../../../assets/signs/t_junction4.png"),
};

export default function DrivingGame() {

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

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);

    if (answer === "Change lanes immediately to the left lane") {
      // Move forward slightly then immediately change to left lane
      const moveForwardRow = 2;
      const initialScrollTarget = currentScroll.current + (moveForwardRow - currentRow) * tileSize;

      Animated.timing(scrollY, {
        toValue: initialScrollTarget,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        // Start immediate lane change animation to LEFT
        setCarDirection("NORTHWEST");
        setCarFrame(0);

        const currentCarX = carXAnim._value;
        const currentScrollY = scrollY._value;
        
        // Move diagonally to LEFT lane (subtract from X position)
        Animated.parallel([
          Animated.timing(carXAnim, {
            toValue: currentCarX - tileSize * 0.8, // Move to LEFT lane
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(scrollY, {
            toValue: currentScrollY + tileSize * 0.6,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Straighten out in left lane
          setCarDirection("NORTH");
          setCarFrame(0);

          Animated.timing(scrollY, {
            toValue: scrollY._value + tileSize * 2,
            duration: 600,
            useNativeDriver: true,
          }).start(() => {
            setCarPaused(true);
            setTimeout(() => {
              handleFeedback(answer);
            }, 500);
          });
        });
      });
      return;
    } else if (answer === "Plan your lane change early, signal, and move to the left lane when traffic permits") {
        // Continue straight, then SLOWLY change to left lane
        const passRow = 3;
        const passTarget = currentScroll.current + (passRow - currentRow) * tileSize;

        setCarPaused(true);
        setTimeout(() => {
          setCarPaused(false);
          Animated.timing(scrollY, {
            toValue: passTarget,
            duration: 2000,
            useNativeDriver: true,
          }).start(() => {
            setCarDirection("NORTHWEST");
            setCarFrame(0);

            const currentCarX = carXAnim._value;
            const currentScrollY = scrollY._value;

            // SLOWLY move to LEFT lane
            Animated.parallel([
              Animated.timing(carXAnim, {
                toValue: currentCarX - tileSize * 0.8, // Move to LEFT lane
                duration: 1200,
                useNativeDriver: false,
              }),
              Animated.timing(scrollY, {
                toValue: currentScrollY + tileSize * 1.0,
                duration: 1200,
                useNativeDriver: true,
              }),
            ]).start(() => {
              setCarDirection("NORTH");
              setCarFrame(0);

              // Continue forward in left lane
              Animated.timing(scrollY, {
                toValue: scrollY._value + tileSize * 2,
                duration: 800,
                useNativeDriver: true,
              }).start(() => {
                handleFeedback(answer);
              });
            });
          });
        }, 800);
    } else if(answer === "Stay in the right lane and change at the last moment"){
        // Stay in right lane until just before intersection
        const beforeIntersectionRow = 5;
        const rowsToMove = beforeIntersectionRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;

        Animated.timing(scrollY, {
            toValue: nextTarget,
            duration: 2500,
            useNativeDriver: true,
        }).start(() => {
            // Last moment lane change to LEFT
            setCarDirection("NORTHWEST");
            setCarFrame(0);

            const currentCarX = carXAnim._value;
            const currentScrollY = scrollY._value;

            Animated.parallel([
              Animated.timing(carXAnim, {
                toValue: currentCarX - tileSize * 0.8, // Move to LEFT lane
                duration: 500,
                useNativeDriver: false,
              }),
              Animated.timing(scrollY, {
                toValue: currentScrollY + tileSize * 0.5,
                duration: 500,
                useNativeDriver: true,
              }),
            ]).start(() => {
              setCarDirection("NORTH");
              setCarFrame(0);

              Animated.timing(scrollY, {
                toValue: scrollY._value + tileSize * 0.3,
                duration: 400,
                useNativeDriver: true,
              }).start(() => {
                handleFeedback(answer);
              });
            });
        });
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
    setCarPaused(false);
    
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      router.push('/driver-game/intersections/phase-1/S9P1');
      setQuestionIndex(0);
      setShowQuestion(false);
    }
  };

  const trafficSignLeft = trafficSignColIndex * tileSize + trafficSignXOffset;
  const trafficSignTop = trafficSignRowIndex * tileSize;

  const trafficSign2Left = trafficSign2ColIndex * tileSize + trafficSign2XOffset;
  const trafficSign2Top = trafficSign2RowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Early signaling allows other drivers to accommodate your lane change, and waiting for a safe opportunity prevents accidents."
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
          <Image source={require("../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </View>
      )}

      {animationType === "wrong" && (
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
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
    fontSize: 18,
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