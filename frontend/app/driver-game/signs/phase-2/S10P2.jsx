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
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

const roadTiles = {
  road2: require("../../../../assets/road/road2.png"),  
  road83: require("../../../../assets/road/road83.png"),
  road17: require("../../../../assets/road/road17.png"),
  road20: require("../../../../assets/road/road20.png"),

};

//FIX ANIMATION

const mapLayout = [
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
  ["road2", "road2", "road83", "road17", "road20"],
];

const treeSprites = {
  tree1: require("../../../../assets/tree/Tree3_idle_s.png"),
  // Add more tree variations if you have them
  // tree2: require("../assets/tree/Tree2_idle_s"),
  // tree3: require("../assets/tree/Tree1_idle_s"),
};
const treePositions = [
  // Left side trees (column -1, outside the road)
  { row: 7, col: 4, type: 'tree1' },
  { row: 8, col: 4, type: 'tree1' },
  { row: 9, col: 4, type: 'tree1' },
  { row: 10, col: 4, type: 'tree1' },
  { row: 11, col: 4, type: 'tree1' },
  { row: 12, col: 4, type: 'tree1' },
  { row: 13, col: 4, type: 'tree1' },
  { row: 14, col: 4, type: 'tree1' },
  { row: 15, col: 4, type: 'tree1' },
  { row: 16, col: 4, type: 'tree1' },
  { row: 17, col: 4, type: 'tree1' },
  { row: 18, col: 4, type: 'tree1' },
  { row: 19, col: 4, type: 'tree1' },
  { row: 20, col: 4, type: 'tree1' },
];

const carSprites = {
  NORTH: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

const questions = [
  {
    question: "You're driving along Makati Avenue when you see a BICYCLE LANE AHEAD warning sign. As you continue, you notice the road narrows and there's a dedicated bicycle lane marked on the right side with several cyclists using it.",
    options: ["Drive normally since you're in the car lane", "Reduce speed, maintain safe distance from bicycle lane, and be extra cautious of cyclists", "Use the bicycle lane to accomodate more cars in the road."],
    correct: "Reduce speed, maintain safe distance from bicycle lane, and be extra cautious of cyclists",
    wrongExplanation: {
      "Drive normally since you're in the car lane": "Not the best answer! Normal driving doesn't account for the increased need for caution around cyclists.",
      "Use the bicycle lane to accommodate more cars in the road.": "Wrong! Motor vehicles are prohibited from using bicycle lanes regardless of traffic conditions."
    }
  },
  // Add more questions here as needed
];

const trafficSign = {
    sign: require("../../../../assets/signs/bike_lane.png"),
};

export default function DrivingGame() {

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  const trafficSignRowIndex = 14.5;
  const trafficSignColIndex = 2.8;
  const trafficSignXOffset = 20;

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

  // Car
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  const carXAnim = useRef(new Animated.Value(width / 2 - (280 / 2))).current;

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopRow = 4; // Adjusted to match the visual stop point
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

  // Car sprite frame loop (stops when carPaused=true)
  useEffect(() => {
    let iv;
    if (!carPaused) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites["NORTH"].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused]);

  // feedback anims
  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);

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

    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);

    if (answer === "Drive normally since you're in the car lane") {
      const targetRow = 10;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 4000,
        useNativeDriver: true,
      }).start(() => {
        handleFeedback(answer);
      });
    } else if (answer === "Reduce speed, maintain safe distance from bicycle lane, and be extra cautious of cyclists") {
        const targetRow = 9;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;

        setTimeout(() => {
            Animated.timing(scrollY, {
                toValue: nextTarget,
                duration: 5000,
                useNativeDriver: true,
            }).start(() => {
                handleFeedback(answer);
            });
        }); // Simulate a 2-second yield time
    } else if(answer === "Use the bicycle lane to accomodate more cars in the road."){
        const targetRow = 9;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;

        setTimeout(() => {
            Animated.timing(scrollY, {
                toValue: nextTarget,
                duration: 4000,
                useNativeDriver: true,
            }).start(() => {
                handleFeedback(answer);
            });
        }); // Simulate a 2-second yield time
    }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    carXAnim.setValue(width / 2 - (280 / 2));
    
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      router.push('/driver-game/signs');
      setQuestionIndex(0);
      setShowQuestion(false);
    }
  };

  const trafficSignLeft = trafficSignColIndex * tileSize + trafficSignXOffset;  
  const trafficSignTop = trafficSignRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Warning signs require increased caution; you must be extra careful around bicycle lanes and cyclists."
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
            width: tileSize * .8,
            height: tileSize *.8,
            position: "absolute",
            top: trafficSignTop,
            left: trafficSignLeft,
            zIndex: 11,
        }}
        resizeMode="contain"
        />

        {/* Pedestrian (REMOVED) */}
        {/*
        {pedestrianVisible && (
          <Animated.Image
            source={isCrossing ? maleWalkSprites[maleFrame] : maleStandingSprite}
            style={{
              width: FRAME_WIDTH,
              height: FRAME_HEIGHT,
              position: "absolute",
              top: pedestrianRowIndex * tileSize + maleVerticalOffset,
              left: isCrossing ? maleCrossingXAnim : maleFixedLeft,
              zIndex: 6,
            }}
            resizeMode="contain"
          />
        )}
        */}
      </Animated.View>

      {/* Car - fixed */}
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

      {/* Question overlay - moved to bottom */}
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

      {/* Answers - moved above bottom overlay */}
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

      {/* Feedback - moved to bottom */}
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

      {/* Next button - positioned above bottom overlay */}
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
    marginBottom: -height * 0.09,
  },
  questionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  questionTextContainer: {
    padding: width * 0.04,
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
    top: height * 0.4,
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
    bottom: height * 0.45,
    right: sideMargin,
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