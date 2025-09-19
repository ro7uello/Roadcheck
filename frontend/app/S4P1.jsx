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
import { useNavigation } from '@react-navigation/native';

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
    road2: require("../assets/road/road2.png"),
    road5: require("../assets/road/road5.png"),
    road7: require("../assets/road/road7.png"),
};

// Map layout
const mapLayout = [
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
  ["road7", "road5", "road2", "road2", "road2"],
];

// Separated sprites for clarity and easier management
const playerCarSprites = {
  NORTH: [
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
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
  // Add other directions if needed for specific overtaking maneuvers
};

const jeepneySprites = {
  NORTH: [
    require("../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
    require("../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
  ],
};

// Updated question structure following S2P1 format
const questions = [
  {
    question: "You're on an expressway with broken white lane lines between lanes going in the same direction. You want to move to the faster left lane.",
    options: ["Change lanes without signaling since the lines are broken", "Stay in your current lane to avoid any violations", "Signal, check mirrors and blind spots, then change lanes when safe"],
    correct: "Signal, check mirrors and blind spots, then change lanes when safe",
    wrongExplanation: {
      "Change lanes without signaling since the lines are broken": "Accident prone! Always let other drivers know you are changing lanes by turning on your signal and check your side mirrors if it's clear to change.",
      "Stay in your current lane to avoid any violations": "Wrong! Changing lanes on a broken white line is accepted although change lane with care."
    }
  },
];

export default function DrivingGame() {
  const navigation = useNavigation();

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
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null); // NEW STATE from S2P1 for correct/wrong feedback
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [playerCarDirection, setPlayerCarDirection] = useState("NORTH"); // Renamed for clarity
  const [playerCarFrame, setPlayerCarFrame] = useState(0);
  const [jeepneyFrame, setJeepneyFrame] = useState(0);

  const playerCarXAnim = useRef(new Animated.Value(width / 2 - playerCarWidth / 2)).current;

  // Jeepney's X position: middle of the 'road5' tile (index 2 in the previous map, adjusted for new map if needed)
  // Assuming the jeepney will still be in a central lane, let's pick lane index 2 (road67) for now.
  const jeepneyInitialX = 2 * tileSize + (tileSize / 2 - jeepWidth / 2); // Center of the 3rd column (index 2)
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

    // Ensure player car is centered at the start
    playerCarXAnim.setValue(width / 2 - playerCarWidth / 2);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

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

    // Animate jeepney into view from the top, stopping it at a position relative to the player
    // This example stops it a bit above the player to simulate being "in front"
    jeepneyAnimationRef.current = Animated.timing(jeepneyYAnim, {
      toValue: -height * 0.2, // Stop jeepney at this Y position (relative to its initial off-screen start)
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
    startScrollAnimation();
    return () => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
          jeepneyAnimationRef.current.stop();
      }
    };
  }, []);

  // Updated handleFeedback function from S2P1
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

  // NEW ANIMATION: Player stays in lane, jeepney remains in front
  const animateStayInLane = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop(); // Stop for a moment
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();

    setPlayerCarDirection("NORTH");
    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true); // Ensure jeepney remains visible

    // Simply restart the continuous scroll for a short duration
    // Both cars will appear to scroll forward together
    await new Promise(resolve => {
        Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 2), // Move forward slightly more
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(resolve);
    });

    // Optionally, pause briefly before showing feedback
    await new Promise(resolve => setTimeout(resolve, 500));

    // Then handle feedback
    handleFeedback(selectedAnswer);
  };

  // NEW ANIMATION: Sudden Overtake (for "Change lanes without signaling")
  const animateSuddenOvertake = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();

    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true); // Start with jeepney visible

    const targetXLeftLane = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2); // Left lane (index 1)

    // 1. Car faces Northwest and moves quickly left
    await new Promise(resolve => {
        setPlayerCarDirection("NORTHWEST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: targetXLeftLane, // Move to left lane
                duration: 400, // Fast
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 0.8), // Move forward a bit
                duration: 400,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // 2. Car faces North, continues forward rapidly, and jeepney falls behind
    await new Promise(resolve => {
        setPlayerCarDirection("NORTH"); // Face North
        Animated.parallel([
            Animated.timing(jeepneyYAnim, {
                toValue: height + jeepHeight, // Move the jeepney off-screen bottom
                duration: 800, // Quickly disappear
                easing: Easing.easeIn, // Faster exit
                useNativeDriver: true,
            }),
            Animated.timing(scrollY, { // Player car moves significantly forward
                toValue: scrollY._value - (tileSize * 4), // More forward movement
                duration: 800,
                easing: Easing.easeOut,
                useNativeDriver: true,
            }),
        ]).start(resolve);
    });
    setIsJeepneyVisible(false); // Hide jeepney after it's out of view

    // Player car stays in the left lane
    setPlayerCarDirection("NORTH"); // Keep facing North in new lane

    // Pause briefly before showing feedback
    await new Promise(resolve => setTimeout(resolve, 1000));

    handleFeedback(selectedAnswer); // Pass the selected wrong answer to feedback
  };

  // NEW ANIMATION: Careful Overtake (for "Signal, check mirrors...")
  const animateCarefulOvertake = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();

    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true); // Start with jeepney visible

    const targetXLeftLane = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2); // Left lane (index 1)

    // 1. Scroll for 3 seconds first (simulating careful approach)
    await new Promise(resolve => {
        Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 3), // Move forward for 3 seconds
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(resolve);
    });

    // 2. Car faces Northwest and moves smoothly left
    await new Promise(resolve => {
        setPlayerCarDirection("NORTHWEST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: targetXLeftLane, // Move to left lane
                duration: 800, // Smooth duration
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 1), // Move forward a bit during change
                duration: 800,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // 3. Car faces North, continues forward, and jeepney falls behind
    await new Promise(resolve => {
        setPlayerCarDirection("NORTH"); // Face North
        Animated.parallel([
            Animated.timing(jeepneyYAnim, {
                toValue: height + jeepHeight, // Move the jeepney off-screen bottom
                duration: 1200, // Smoothly disappear
                easing: Easing.easeIn,
                useNativeDriver: true,
            }),
            Animated.timing(scrollY, { // Player car moves significantly forward
                toValue: scrollY._value - (tileSize * 5), // More forward movement
                duration: 1200,
                easing: Easing.easeOut,
                useNativeDriver: true,
            }),
        ]).start(resolve);
    });
    setIsJeepneyVisible(false); // Hide jeepney after it's out of view

    // Player car stays in the left lane
    setPlayerCarDirection("NORTH"); // Keep facing North in new lane

    // Pause briefly before showing feedback
    await new Promise(resolve => setTimeout(resolve, 1000));

    handleFeedback(selectedAnswer); // Pass the selected correct answer to feedback
  };


  const handleAnswer = async (option) => {
    setSelectedAnswer(option);
    setShowQuestion(false);
    setShowAnswers(false);

    // Stop continuous scroll and sprite animations immediately
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true); // Ensure both are visible before animating
    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    // Determine which animation to play based on the selected answer
    const actualCorrectAnswer = questions[questionIndex].correct;

    if (option === actualCorrectAnswer) {
      if (option === "Signal, check mirrors and blind spots, then change lanes when safe") {
        await animateCarefulOvertake();
      } else if (option === "Stay in your current lane to avoid any violations") {
        await animateStayInLane();
      }
      handleFeedback(option);
    } else if (option === "Change lanes without signaling since the lines are broken") {
      await animateSuddenOvertake();
      handleFeedback(option);
    } else {
        // Fallback for any other answer (e.g., the other wrong answer from the example)
        // For now, just show feedback after a small delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        handleFeedback(option);
    }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null); // Reset feedback state from S2P1
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
      navigation.navigate('S5P1');
      setShowQuestion(false);
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
          jeepneyAnimationRef.current.stop();
      }
    }
  };

  // Determine the feedback message based on whether the answer was correct or wrong (from S2P1)
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Broken white lines allow lane changes. Always signal and check your surroundings before changing lanes."
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
            left: jeepneyInitialX, // Keep it in its lane
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

      {/* Responsive Feedback - Updated to use S2P1 format */}
      {(animationType === "correct" || animationType === "wrong") && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../assets/dialog/LTO.png")} style={styles.ltoImage} />
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