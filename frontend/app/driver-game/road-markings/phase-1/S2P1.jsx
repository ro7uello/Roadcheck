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
const playerCarWidth = Math.min(width * 0.25, 280); // Renamed for clarity
const playerCarHeight = playerCarWidth * (350/280);
const jeepWidth = Math.min(width * 0.28, 300); // Slightly wider
const jeepHeight = jeepWidth * (350/280); // Maintain aspect ratio
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Road tiles
const roadTiles = {
    road17: require("../../../../assets/road/road17.png"),
    road18: require("../../../../assets/road/road18.png"),
    road20: require("../../../../assets/road/road20.png"),
    road66: require("../../../../assets/road/road66.png"),
    road67: require("../../../../assets/road/road67.png"),
};

// Map layout
const mapLayout = [
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],

];

// Separated sprites for clarity and easier management
const playerCarSprites = {
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
  NORTHEAST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  EAST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
  // Add other directions if needed for specific overtaking maneuvers
};

const jeepneySprites = {
  NORTH: [
    require("../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
  ],
};
const questions = [
  {
    question: "You're driving on a highway and see a single solid yellow lines in the center. Traffic is heavy, and you notice a faster-moving lane to your left.",
    options: ["Overtake by crossing the solid yellow lines to reach the faster lane", "Stay in your current lane", "Honk for a long time to make the cars move faster."],
    correct: "Stay in your current lane",
    wrongExplanation: {
      "Overtake by crossing the solid yellow lines to reach the faster lane": "Violation. Solid yellow lane means overtaking is not allowed. You can only make a left turn to another street or an establishment.",
      "Honk for a long time to make the cars move faster.": "Road rage prone! In a situation where the area is experiencing traffic, honking a lot can only make other drivers mad and wouldn't make the cars move faster."
    }
  },
];

export default function DrivingGame() {

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isPlayerCarVisible, setIsPlayerCarVisible] = useState(true); // Renamed for clarity
  const [isJeepneyVisible, setIsJeepneyVisible] = useState(true); // State for jeep visibility

  const scrollY = useRef(new Animated.Value(0)).current;
  const currentScroll = useRef(0);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      currentScroll.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null); // NEW STATE for correct/wrong feedback
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [playerCarDirection, setPlayerCarDirection] = useState("NORTH"); // Renamed for clarity
  const [playerCarFrame, setPlayerCarFrame] = useState(0);
  const [jeepneyFrame, setJeepneyFrame] = useState(0);

  const playerCarXAnim = useRef(new Animated.Value(width / 2 - playerCarWidth / 2)).current;

  // Jeepney's X position: middle of the 'road5' tile (index 2 in the previous map, adjusted for new map if needed)
  // Assuming the jeepney will still be in a central lane, let's pick lane index 2 (road67) for now.
  const jeepneyInitialX = 2 * tileSize + (tileSize / 2 - jeepWidth / 2);
  // Jeepney's Y position: dynamically set based on scroll and its row
  // Starts off-screen TOP
  const jeepneyYAnim = useRef(new Animated.Value(-jeepHeight)).current;


  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Animation for player's car sprite
  useEffect(() => {
    if (!showQuestion && isPlayerCarVisible) {
      const interval = setInterval(() => {
        setPlayerCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isPlayerCarVisible]);

  // Animation for jeepney's sprite
  useEffect(() => {
    if (!showQuestion && isJeepneyVisible) {
      const interval = setInterval(() => {
        setJeepneyFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 250);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isJeepneyVisible]);

  const scrollAnimationRef = useRef(null);
  const jeepneyAnimationRef = useRef(null); // Ref to hold the jeepney's entry animation

  function startScrollAnimation() {
    scrollY.setValue(0);
    jeepneyYAnim.setValue(-jeepHeight); // Reset jeepney to off-screen top

    // Continuous looping background scroll - MUCH FASTER
    scrollAnimationRef.current = Animated.loop(
      Animated.timing(scrollY, {
        toValue: -mapHeight,
        duration: mapHeight * 10, // Significantly reduced duration for faster scroll
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    scrollAnimationRef.current.start();

    // Animate jeepney into view from the top
    jeepneyAnimationRef.current = Animated.timing(jeepneyYAnim, {
      toValue: -height * 0.2,
      duration: 3000, // Duration for jeepney to move into position
      easing: Easing.linear,
      useNativeDriver: true,
    });

    jeepneyAnimationRef.current.start(() => {
      // After jeepney is in position, set a timeout to stop scrolling and show question
      setTimeout(() => {
        if (scrollAnimationRef.current) {
          scrollAnimationRef.current.stop(); // Stop the continuous scroll
        }
        // Freeze car and jeepney sprite animations
        setIsPlayerCarVisible(true);
        setIsJeepneyVisible(true);
        setPlayerCarFrame(0);
        setJeepneyFrame(0);

        setShowQuestion(true);
        setTimeout(() => {
          setShowAnswers(true);
        }, 1000);
      }, 2000); // Time to drive before the question appears after jeepney is in view
    });
  }

  useEffect(() => {
    // Start immediately since intro is removed
    startScrollAnimation();
    return () => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
          jeepneyAnimationRef.current.stop();
      } // Clean up animations
    };
  }, []); // Empty dependency array to run once on mount

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

const animateOvertake = async (targetX) => {
    // Stop continuous scroll and sprite animations for a moment
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    // 1. Car faces Northwest and moves slightly to the left (initial lane change)
    await new Promise(resolve => {
        setPlayerCarDirection("NORTHWEST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: targetX, // Move left towards the target lane
                duration: 300,
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 0.5), // Move forward slightly
                duration: 300,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // 2. Car faces North and moves further forward (main overtaking acceleration)
    await new Promise(resolve => {
        setPlayerCarDirection("NORTH"); // Face North
        Animated.parallel([
            Animated.timing(jeepneyYAnim, { // <--- ADD THIS ANIMATION FOR JEEPNEY
                toValue: height + jeepHeight, // Move the jeepney off-screen bottom
                duration: 1000, // Duration for jeepney to disappear
                easing: Easing.linear,
                useNativeDriver: true,
            }),
            Animated.timing(scrollY, { // Player car continues to move significantly forward
                toValue: scrollY._value - (tileSize * 3), // More forward movement
                duration: 1000,
                easing: Easing.easeOut,
                useNativeDriver: true,
            }),
        ]).start(resolve);
    });
    setIsJeepneyVisible(false); // Hide jeepney after it's out of view

    // 3. Car faces Northeast and moves back towards the right (returning to lane)
    await new Promise(resolve => {
        setPlayerCarDirection("NORTHEAST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: width / 2 - playerCarWidth / 2, // Move back to center X
                duration: 400,
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, { // Still moving forward slightly during lane change
                toValue: scrollY._value - (tileSize * 0.5),
                duration: 400,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // 4. Car faces North again
    setPlayerCarDirection("NORTH");

    // Restart continuous scroll and sprite animations
    if (scrollAnimationRef.current) scrollAnimationRef.current.start();
    
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(false); // Reset for next scenario, if needed
  };
  // Adjust handleAnswer to call animateOvertake without turnDirection parameters
  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    // If scrollAnimationRef.current exists, restart it for continuous movement after answering
    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.start();
    }
    // Restart player car animations
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);


    if (answer === questions[questionIndex].correct) {
      // Correct answer, no overtake action if it's "Don't overtake at all"
      handleFeedback(answer); // Call feedback directly
    } else if (answer === "Overtake by crossing the solid yellow lines to reach the faster lane") { // Adjusted option text
      // Overtake to the left lane (column 1) if this was a wrong answer
      const targetX = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2);
      animateOvertake(targetX); // Call without turn directions, as they are now internal
      handleFeedback(answer); // Call feedback here, or after animateOvertake completes
    } else if (answer === "Honk for a long time to make the cars move faster.") { // Adjusted option text
        setTimeout(() => {
            // No specific car animation for this wrong answer, just feedback
            handleFeedback(answer);
        }, 1000); // A small delay before showing feedback
      } else {
        // Fallback for any other answer (e.g., if there were more options)
        handleFeedback(answer);
      }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null); // Reset feedback state
    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    const centerX = width / 2 - playerCarWidth / 2;
    playerCarXAnim.setValue(centerX);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      router.push('/driver-game/road-markings/phase-1/S3P1');
      setShowQuestion(false);
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
          jeepneyAnimationRef.current.stop();
      }
    }
  };

  // Determine the feedback message based on whether the answer was correct or wrong
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Solid yellow lane means you cannot overtake. Stay in your lane to avoid unnecessary accidents."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";


  return (
    <View style={{ flex: 1, backgroundColor: "black", overflow: 'hidden' }}>
      {/* Map - Looping background */}
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: mapHeight * 2,
          left: 0,
          transform: [{
            translateY: scrollY.interpolate({
              inputRange: [-mapHeight, 0],
              outputRange: [0, -mapHeight],
              extrapolate: 'clamp',
            })
          }],
          zIndex: 1,
        }}
      >
        {[0, 1].map((multiplier) => (
          mapLayout.map((row, rowIndex) =>
            <React.Fragment key={`${rowIndex}-${multiplier}`}>
              {row.map((tile, colIndex) => (
                <Image
                  key={`${rowIndex}-${colIndex}-${multiplier}`}
                  source={roadTiles[tile]}
                  style={{
                    position: "absolute",
                    width: tileSize,
                    height: tileSize,
                    left: colIndex * tileSize,
                    top: rowIndex * tileSize + (multiplier * mapHeight),
                  }}
                  resizeMode="stretch"
                />
              ))}
            </React.Fragment>
          )
        ))}
      </Animated.View>

      {/* Responsive Jeepney */}
      {isJeepneyVisible && (
        <Animated.Image
          source={jeepneySprites.NORTH[jeepneyFrame]}
          style={{
            width: jeepWidth,
            height: jeepHeight,
            position: "absolute",
            left: jeepneyInitialX,
            transform: [{ translateY: jeepneyYAnim }],
            zIndex: 4,
          }}
        />
      )}

      {/* Responsive Player Car */}
      {isPlayerCarVisible && (
        <Animated.Image
          source={playerCarSprites[playerCarDirection][playerCarFrame]}
          style={{
            width: playerCarWidth,
            height: playerCarHeight,
            position: "absolute",
            bottom: height * 0.1,
            left: playerCarXAnim,
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

      {/* Responsive Feedback - Correct/Wrong */}
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
  // No intro styles (responsive)
  // In-game responsive styles
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
  },
  questionTextContainer: {
    padding: -height * 0.04,
    maxWidth: width * 0.6,
  },
  questionText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 28),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.4,
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