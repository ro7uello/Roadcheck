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
  road3: require("../../../../assets/road/road3.png"),
  road4: require("../../../../assets/road/road4.png"),
  road16: require("../../../../assets/road/road16.png"),
  road17: require("../../../../assets/road/road17.png"),
  road18: require("../../../../assets/road/road18.png"),
  road19: require("../../../../assets/road/road19.png"),
  road59: require("../../../../assets/road/road59.png"),
  road20: require("../../../../assets/road/road20.png"),
  road23: require("../../../../assets/road/road23.png"),
  road24: require("../../../../assets/road/road24.png"),
  road49: require("../../../../assets/road/road49.png"),
  road50: require("../../../../assets/road/road50.png"),
  road51: require("../../../../assets/road/road51.png"),
  road52: require("../../../../assets/road/road52.png"),
  road57: require("../../../../assets/road/road57.png"),
  road58: require("../../../../assets/road/road58.png"),
  road59: require("../../../../assets/road/road59.png"),
  road60: require("../../../../assets/road/road60.png"),
  int1: require("../../../../assets/road/int1.png"),
  int2: require("../../../../assets/road/int2.png"),
  int3: require("../../../../assets/road/int3.png"),
  int4: require("../../../../assets/road/int4.png"),

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

const treeSprites = {
  tree1: require("../../../../assets/tree/Tree3_idle_s.png"),
  // Add more tree variations if you have them
  // tree2: require("../assets/tree/Tree2_idle_s"),
  // tree3: require("../assets/tree/Tree1_idle_s"),
};

const carSprites = {
  NORTH: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

const treePositions = [
  // Left side trees (column -1, outside the road)
  { row: 0, col: 0, type: 'tree1' },
  { row: 1, col: 0, type: 'tree1' },
  { row: 2, col: 0, type: 'tree1' },
  { row: 3, col: 0, type: 'tree1' },
  { row: 4, col: 0, type: 'tree1' },
  { row: 5, col: 0, type: 'tree1' },
  { row: 10, col: 0, type: 'tree1' },
  { row: 11, col: 0, type: 'tree1' },
  { row: 12, col: 0, type: 'tree1' },
  { row: 13, col: 0, type: 'tree1' },
  { row: 14, col: 0, type: 'tree1' },
  { row: 15, col: 0, type: 'tree1' },
  { row: 16, col: 0, type: 'tree1' },
  { row: 17, col: 0, type: 'tree1' },

  // Right side trees (column 5, outside the road)
  { row: 0, col: 3.5, type: 'tree1' },
  { row: 1, col: 3.5, type: 'tree1' },
  { row: 2, col: 3.5, type: 'tree1' },
  { row: 3, col: 3.5, type: 'tree1' },
  { row: 4, col: 3.5, type: 'tree1' },
  { row: 5, col: 3.5, type: 'tree1' },
  { row: 10, col: 3.5, type: 'tree1' },
  { row: 11, col: 3.5, type: 'tree1' },
  { row: 12, col: 3.5, type: 'tree1' },
  { row: 13, col: 3.5, type: 'tree1' },
  { row: 14, col: 3.5, type: 'tree1' },
  { row: 15, col: 3.5, type: 'tree1' },
  { row: 16, col: 3.5, type: 'tree1' },
  { row: 17, col: 3.5, type: 'tree1' },

  // Additional scattered trees for more density
  { row: 0.5, col: 4, type: 'tree1' },
  { row: 2.5, col: 4, type: 'tree1' },
  { row: 4.5, col: 4, type: 'tree1' },
  { row: 11.5, col: 4, type: 'tree1' },
  { row: 13.5, col: 4, type: 'tree1' },
  { row: 15.5, col: 4, type: 'tree1' },

  { row: 0.5, col: 3.5, type: 'tree1' },
  { row: 2.5, col: 3.5, type: 'tree1' },
  { row: 4.5, col: 3.5, type: 'tree1' },
  { row: 11.5, col: 3.5, type: 'tree1' },
  { row: 13.5, col: 4, type: 'tree1' },
  { row: 15.5, col: 3.5, type: 'tree1' },

  // More trees further out
  { row: 1, col: 4, type: 'tree1' },
  { row: 3, col: 4, type: 'tree1' },
  { row: 12, col: 4, type: 'tree1' },
  { row: 14, col: 4, type: 'tree1' },
  { row: 16, col: 4, type: 'tree1' },

  { row: 1, col: 3.5, type: 'tree1' },
  { row: 3, col: 3.5, type: 'tree1' },
  { row: 12, col: 3.5, type: 'tree1' },
  { row: 14, col: 3.5, type: 'tree1' },
  { row: 16, col: 3.5, type: 'tree1' },
];

const questions = [
  {
    question: "You are driving on an intersection near a university. The traffic light ahead is red but the traffic is congesting the intersection, stopping you in the middle of an intersection from the previous green light.",
    options: ["Stay where you are until the traffic light turns green.", "Back up to clear the intersection.", "Proceed forward to clear the intersection."],
    correct: "Proceed forward to clear the intersection.",
    wrongExplanation: {
      "Stay where you are until the traffic light turns green.": "Wrong! Staying put would likely block the intersection even more. In this situation, it is more appropriate to move forward when you have the space and it's clear to do so to clear the intersection.",
      "Back up to clear the intersection.": "Accident prone! Backing up an intersection is dangerous if you are alread in the middle of it.",
    }
  },
  // Add more questions here as needed
];

// Traffic light sprites
const trafficLightSprites = {
  normal: require("../../../../assets/traffic light/traffic_light_green2.png"),
  yellow: require("../../../../assets/traffic light/traffic_light_yellow2.png"), // You may want to add a yellow sprite
  red: require("../../../../assets/traffic light/traffic_light_red2.png"),
};

export default function DrivingGame() {

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  // Traffic light position (place it before the pedestrian crossing)
  const trafficLightRowIndex = 9.3; // One row before the 'crossing' point
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

  // Traffic light - Updated states
  const [trafficLightState, setTrafficLightState] = useState('normal');
  const [lightChangeTriggered, setLightChangeTriggered] = useState(false);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    setTrafficLightState('green'); // Start with green/normal light
    setLightChangeTriggered(false);
    
    const stopRow = 9; // Adjusted to match the visual stop point
    const stopOffset = startOffset + stopRow * tileSize;

    // Calculate when to trigger yellow light (about 2/3 of the way through animation)
    const yellowTriggerTime = 1000; // 2 seconds into the 3-second animation
    const redTriggerTime = 2000; // 2.5 seconds into animation

    // Start the scroll animation
    Animated.timing(scrollY, {
      toValue: stopOffset,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
      // Animation complete - show question after light turns red
    });

    // Trigger traffic light changes during animation
    setTimeout(() => {
      if (!lightChangeTriggered) {
        setTrafficLightState('yellow'); // Yellow light (using normal sprite as placeholder)
        setLightChangeTriggered(true);
      }
    }, yellowTriggerTime);

    setTimeout(() => {
      setTrafficLightState('red'); // Red light
      // Show question when light turns red
      setTimeout(() => {
        setShowQuestion(true);
        setTimeout(() => {
          setShowAnswers(true);
        }, 1000);
      }, 500);
    }, redTriggerTime);
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

    if (answer === "Proceed forward to clear the intersection.") {
      const targetRow = 12;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        handleFeedback(answer);
      });
    } else if (answer === "Back up to clear the intersection.") {
        const targetRow = 7.5;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;

        setCarPaused(true); 
        setTimeout(() => {
            setCarPaused(false); 
            Animated.timing(scrollY, {
                toValue: nextTarget,
                duration: 3000,
                useNativeDriver: true,
            }).start(() => {
                handleFeedback(answer);
            });
        });
    } else if(answer === "Stay where you are until the traffic light turns green."){
        const targetRow = 9;
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
    
    // Reset traffic light to original state
    setTrafficLightState('normal');
    setLightChangeTriggered(false);
    
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      router.push('/driver-game/signs/');
      setQuestionIndex(0);
      setShowQuestion(false);
    }
  };

  // Calculate traffic light position
  const trafficLightLeft = trafficLightColIndex * tileSize + trafficLightXOffset;
  const trafficLightTop = trafficLightRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct. Clear the intersection by moving forward when there is space and it's safe even if the light is red. "
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
        
        {/* Trees */}
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
        
        {/* Traffic Light - Now with animated states */}
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
    paddingHorizontalorizontal: width * 0.06,
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