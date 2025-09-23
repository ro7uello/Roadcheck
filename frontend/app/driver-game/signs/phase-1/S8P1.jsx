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
  road1: require("../../../../assets/road/road1.png"),
  road3: require("../../../../assets/road/road3.png"),
  road4: require("../../../../assets/road/road4.png"),
  road10: require("../../../../assets/road/road10.png"),
  road13: require("../../../../assets/road/road13.png"),
  road15: require("../../../../assets/road/road15.png"),
  road17: require("../../../../assets/road/road17.png"),
  road20: require("../../../../assets/road/road20.png"),
  road48: require("../../../../assets/road/road48.png"),
  road56: require("../../../../assets/road/road56.png"),
  road58: require("../../../../assets/road/road58.png"),
  road61: require("../../../../assets/road/road61.png"),
  road62: require("../../../../assets/road/road62.png"),
  road63: require("../../../../assets/road/road63.png"),
  int1: require("../../../../assets/road/int1.png"),
  int2: require("../../../../assets/road/int2.png"),
  int3: require("../../../../assets/road/int3.png"),
  int4: require("../../../../assets/road/int4.png"),
  int9: require("../../../../assets/road/int9.png"),
  int10: require("../../../../assets/road/int10.png"),
  int12: require("../../../../assets/road/int12.png"),
  int13: require("../../../../assets/road/int13.png"),
  int14: require("../../../../assets/road/int14.png"),
  int15: require("../../../../assets/road/int15.png"),


};

const mapLayout = [
  ["road62", "road4", "road3", "road17", "road20"],
  ["road62", "road4", "road3", "road17", "road20"],
  ["road63", "road4", "road3", "road17", "road20"],
  ["road15", "road15", "road15", "road17", "road20"],
  ["int12", "int12", "int4", "road17", "road20"],
  ["road48", "int14", "int13", "road17", "road20"],
  ["int9", "road48", "int13", "road17", "road20"],
  ["road48", "int15", "int13", "road17", "road20"],
  ["int10", "int10", "int1", "road17", "road20"],
  ["road15", "road15", "road56", "road17", "road20"],
  ["road61", "road10", "road13", "road17", "road20"],
  ["road62", "road1", "road1", "road17", "road20"],
  ["road62", "road1", "road1", "road17", "road20"],
  ["road62", "road4", "road3", "road17", "road20"],
  ["road62", "road4", "road3", "road17", "road20"],
  ["road62", "road4", "road3", "road17", "road20"],
  ["road62", "road4", "road3", "road17", "road20"],
  ["road62", "road4", "road3", "road17", "road20"],
];

const carSprites = {
  NORTH: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

const questions = [
  {
    question: "You're exiting the toll plaza and approaching a traffic light near an intersection. the traffic light turns red just as you're about to enter the intersection. There's a long line of vehicles behind you and some are honking impatiently.",
    options: ["Proceed at the intersection quickly so that the long line can pass.", "Move slightly forward to make room for vehicles behind you.", "Stop at the stoplight even if they're honking."],
    correct: "Stop at the stoplight even if they're honking.",
    wrongExplanation: {
      "Proceed at the intersection quickly so that the long line can pass.": "Accident prone! Proceeding at a red light is a risky behavior. Follow the traffic light unless directed by an official.",
      "Move slightly forward to make room for vehicles behind you.": "Wrong. Stop at the marked line or before the stoplight when the light is red to avoid any obstruction and violation regardless of the long line behind you."
    }
  },
  // Add more questions here as needed
];

// Traffic light sprites
const trafficLightSprites = {
  normal: require("../../../../assets/traffic light/Traffic_Light.png"),
  yellow: require("../../../../assets/traffic light/traffic_light_yellow2.png"),
};

export default function DrivingGame() {

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  // Traffic light position (place it before the pedestrian crossing)
  const trafficLightRowIndex = 9.2; // One row before the 'crossing' point
  const trafficLightColIndex = 2; // Left side of the road
  const trafficLightXOffset = -30;

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

  // Traffic light
  const [trafficLightState, setTrafficLightState] = useState('yellow');
  const [isBlinking, setIsBlinking] = useState(true);

  useEffect(() => {
    let blinkInterval;
    if (isBlinking) {
      blinkInterval = setInterval(() => {
        setTrafficLightState(prev => prev === 'normal' ? 'yellow' : 'normal');
      }, 500); // Blink every 500ms
    }
    return () => {
      if (blinkInterval) {
        clearInterval(blinkInterval);
      }
    };
  }, [isBlinking]);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopRow = 6; // Adjusted to match the visual stop point
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

    if (answer === "Stop at the stoplight even if they're honking.") {
      const targetRow = 6.5;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 3000,
        useNativeDriver: true,
      }).start(() => {
        handleFeedback(answer);
      });
    } else if (answer === "Move slightly forward to make room for vehicles behind you.") {
        // Since there's no pedestrian, "yielding" means pausing briefly and then proceeding.
        const targetRow = 8.5;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;

        setCarPaused(true); // Car pauses as if yielding
        setTimeout(() => {
            setCarPaused(false); // Car resumes after a short pause
            Animated.timing(scrollY, {
                toValue: nextTarget,
                duration: 5000,
                useNativeDriver: true,
            }).start(() => {
                handleFeedback(answer);
            });
        }); // Simulate a 2-second yield time
    } else if(answer === "Proceed at the intersection quickly so that the long line can pass."){
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
        return;
    }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    carXAnim.setValue(width / 2 - (280 / 2));
    
    setTrafficLightState('yellow');
    setIsBlinking(true);
    
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      router.push('/driver-game/signs/phase-1/S9P1');
      setQuestionIndex(0);
      setShowQuestion(false);
    }
  };

  // Calculate traffic light position
  const trafficLightLeft = trafficLightColIndex * tileSize + trafficLightXOffset;
  const trafficLightTop = trafficLightRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct. No matter the situation, unless there is an emergency or directed by an official, always follow the traffic light."
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
        {/* Traffic Light */}
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
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: height * 0.05,
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