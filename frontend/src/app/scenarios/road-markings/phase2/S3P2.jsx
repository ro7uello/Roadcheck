import { useSession } from '../../../../contexts/SessionManager';
import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { router } from 'expo-router';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const jeepWidth = Math.min(width * 0.28, 300);
const jeepHeight = jeepWidth * (350/280);
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

const roadTiles = {
  road8: require("../../../../../assets/road/road8.png"),
  road3: require("../../../../../assets/road/road3.png"),
  road4: require("../../../../../assets/road/road4.png"),
  road17: require("../../../../../assets/road/road17.png"),
  road62: require("../../../../../assets/road/road62.png"),
  road70: require("../../../../../assets/road/road70.png"),
  road73: require("../../../../../assets/road/road73.png"),
};

const mapLayout = [
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
  ["road62", "road8", "road73", "road17"],
];

// Player car sprites (blue car)
const playerCarSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  WEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_001.png"),
  ],
  EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
};

// Jeepney sprites
const jeepneySprites = {
  NORTH: [
    require("../../../../../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
  ],
  SOUTH: [
    require("../../../../../assets/car/JEEP TOPDOWN/Brown/MOVE/SOUTH/SEPARATED/Brown_JEEP_CLEAN_SOUTH_000.png"),
    require("../../../../../assets/car/JEEP TOPDOWN/Brown/MOVE/SOUTH/SEPARATED/Brown_JEEP_CLEAN_SOUTH_001.png"),
  ],
};

const questions = [
  {
    question: "You encounter broken yellow line on your side, solid yellow on the opposite side. The car ahead is moving very slowly, and you can see the road is clear ahead.",
    options: [
      "Don't overtake since the opposite side has a solid line",
      "Overtake carefully since your side has a broken line allowing it",
      "Wait for both sides to have broken lines"
    ],
    correct: "Overtake carefully since your side has a broken line allowing it",
    wrongExplanation: {
      "Don't overtake since the opposite side has a solid line": "Wrong! The solid line on the opposite side only restricts vehicles from that direction, not yours.",
      "Wait for both sides to have broken lines": "Wrong! You only need permission from your side of the road markings."
    }
  },
];

export default function DrivingGame() {

  const {
  updateScenarioProgress,
  moveToNextScenario,
  completeSession,
  currentScenario,
  sessionData
} = useSession();

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const scenarioId = 10 + currentScenario;
      await updateScenarioProgress(scenarioId, selectedOption, isCorrect);
    } catch (error) {
      console.error('Error updating scenario progress:', error);
    }
  };

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isPlayerCarVisible, setIsPlayerCarVisible] = useState(true);
  const [isJeepneyVisible, setIsJeepneyVisible] = useState(true);
  const [isOncomingJeepneyVisible, setIsOncomingJeepneyVisible] = useState(true);

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
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [playerCarDirection, setPlayerCarDirection] = useState("NORTH");
  const [playerCarFrame, setPlayerCarFrame] = useState(0);
  const [jeepneyFrame, setJeepneyFrame] = useState(0);
  const [oncomingJeepneyFrame, setOncomingJeepneyFrame] = useState(0);

  // Player car starts in the rightmost lane (lane 2 - index 2)
  const playerCarLane = 2;
  const playerCarInitialX = playerCarLane * tileSize + (tileSize / 2 - carWidth / 2);
  const carXAnim = useRef(new Animated.Value(playerCarInitialX)).current;

  // Jeepney ahead in the same lane as player (right lane) - positioned further ahead
  const jeepneyLane = 2;
  const jeepneyInitialX = jeepneyLane * tileSize + (tileSize / 2 - jeepWidth / 2);
  const jeepneyYAnim = useRef(new Animated.Value(-jeepHeight * 4)).current;

  // Oncoming jeepney in left lane (lane 1) going south
  const oncomingJeepneyLane = 1;
  const oncomingJeepneyInitialX = oncomingJeepneyLane * tileSize + (tileSize / 2 - jeepWidth / 2);
  const oncomingJeepneyYAnim = useRef(new Animated.Value(-height * 1.5)).current;

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

  // Animation for oncoming jeepney's sprite
  useEffect(() => {
    if (!showQuestion && isOncomingJeepneyVisible) {
      const interval = setInterval(() => {
        setOncomingJeepneyFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 300);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isOncomingJeepneyVisible]);

  const scrollAnimationRef = useRef(null);
  const jeepneyAnimationRef = useRef(null);
  const oncomingJeepneyAnimationRef = useRef(null);

  function startScrollAnimation() {
    scrollY.setValue(0);
    jeepneyYAnim.setValue(-jeepHeight * 3);
    oncomingJeepneyYAnim.setValue(-height * 1.5);

    // Continuous looping background scroll
    scrollAnimationRef.current = Animated.loop(
      Animated.timing(scrollY, {
        toValue: -mapHeight,
        duration: mapHeight * 15,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    scrollAnimationRef.current.start();

    // Animate jeepney ahead into view
    jeepneyAnimationRef.current = Animated.timing(jeepneyYAnim, {
      toValue: -height * 0.2,
      duration: 2500,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    // Animate oncoming jeepney
    oncomingJeepneyAnimationRef.current = Animated.timing(oncomingJeepneyYAnim, {
      toValue: height + jeepHeight,
      duration: 8000,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    jeepneyAnimationRef.current.start();
    oncomingJeepneyAnimationRef.current.start();

    setTimeout(() => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }

      setIsPlayerCarVisible(true);
      setIsJeepneyVisible(true);
      setIsOncomingJeepneyVisible(true);
      setPlayerCarFrame(0);
      setJeepneyFrame(0);
      setOncomingJeepneyFrame(0);

      setShowQuestion(true);
      setTimeout(() => {
        setShowAnswers(true);
      }, 1000);
    }, 3000);
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
      if (oncomingJeepneyAnimationRef.current) {
        oncomingJeepneyAnimationRef.current.stop();
      }
    };
  }, []);

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

  // Animation for "Don't overtake since the opposite side has a solid line" - WRONG
  const animateNoOvertake = async () => {
    try {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

      setPlayerCarFrame(0);
      setJeepneyFrame(0);
      setOncomingJeepneyFrame(0);

      // Player stays behind the jeepney - maintaining safe distance
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Move both vehicles together, player staying well behind (missing opportunity)
      await new Promise(resolve => {
        Animated.parallel([
          Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 1.5),
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(jeepneyYAnim, {
            toValue: jeepneyYAnim._value + (tileSize * 0.05),
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ]).start(resolve);
      });

      // Continue following behind at safe distance
      await new Promise(resolve => {
        Animated.parallel([
          Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 1),
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(jeepneyYAnim, {
            toValue: jeepneyYAnim._value + (tileSize * 0.03),
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ]).start(resolve);
      });

    } catch (error) {
      console.error('Error in animateNoOvertake:', error);
    }
  };

  // Animation for "Overtake carefully since your side has a broken line allowing it" - CORRECT
  const animateSafeOvertake = async () => {
    try {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

      setPlayerCarFrame(0);
      setJeepneyFrame(0);
      setOncomingJeepneyFrame(0);

      // Wait a moment to show proper decision making
      await new Promise(resolve => setTimeout(resolve, 800));

      // 1. Signal and move to center lane (lane 1 - the passing lane with broken yellow line)
      await new Promise(resolve => {
        setPlayerCarDirection("WEST");
        Animated.timing(carXAnim, {
          toValue: 1 * tileSize + (tileSize / 2 - carWidth / 2),
          duration: 1200,
          easing: Easing.easeInOut,
          useNativeDriver: false,
        }).start(resolve);
      });

      // 2. Accelerate and pass the jeepney - move forward significantly
      await new Promise(resolve => {
        setPlayerCarDirection("NORTH");
        Animated.parallel([
          // Move jeepney backward relative to player (player passing it)
          Animated.timing(jeepneyYAnim, {
            toValue: height * 0.5,
            duration: 2800,
            easing: Easing.easeOut,
            useNativeDriver: true,
          }),
          // Scroll road to show forward movement
          Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 4),
            duration: 2800,
            easing: Easing.easeOut,
            useNativeDriver: true,
          })
        ]).start(resolve);
      });

      // Wait until jeepney is behind player
      await new Promise(resolve => setTimeout(resolve, 300));

      // Hide jeepney after it's passed
      setIsJeepneyVisible(false);

      // 3. Continue forward a bit more to create safe distance
      await new Promise(resolve => {
        Animated.timing(scrollY, {
          toValue: scrollY._value - (tileSize * 1.5),
          duration: 1000,
          easing: Easing.easeOut,
          useNativeDriver: true,
        }).start(resolve);
      });

      // 4. Signal and return to rightmost lane after safe distance
      await new Promise(resolve => {
        setPlayerCarDirection("EAST");
        Animated.parallel([
          Animated.timing(carXAnim, {
            toValue: playerCarInitialX,
            duration: 1200,
            easing: Easing.easeInOut,
            useNativeDriver: false,
          }),
          Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 0.8),
            duration: 1200,
            easing: Easing.easeOut,
            useNativeDriver: true,
          })
        ]).start(resolve);
      });

      // 5. Continue normal driving
      setPlayerCarDirection("NORTH");

    } catch (error) {
      console.error('Error in animateSafeOvertake:', error);
      setPlayerCarDirection("NORTH");
    }
  };

  // Animation for "Wait for both sides to have broken lines" - WRONG
  const animateWaitForBothLines = async () => {
    try {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

      setPlayerCarFrame(0);
      setJeepneyFrame(0);
      setOncomingJeepneyFrame(0);

      // Player waits unnecessarily - maintaining safe distance
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Move both vehicles together, player staying well behind
      await new Promise(resolve => {
        Animated.parallel([
          Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 1.5),
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(jeepneyYAnim, {
            toValue: jeepneyYAnim._value + (tileSize * 0.05),
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ]).start(resolve);
      });

      // Continue waiting and following at safe distance
      await new Promise(resolve => {
        Animated.parallel([
          Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 1),
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(jeepneyYAnim, {
            toValue: jeepneyYAnim._value + (tileSize * 0.03),
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ]).start(resolve);
      });

    } catch (error) {
      console.error('Error in animateWaitForBothLines:', error);
    }
  };

  const handleAnswer = async (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    await updateProgress(answer, isCorrect);

    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);
    setIsOncomingJeepneyVisible(true);

    if (answer === questions[questionIndex].correct) {
      animateSafeOvertake();
      handleFeedback(answer);
    } else if (answer === "Don't overtake since the opposite side has a solid line") {
      animateNoOvertake();
      handleFeedback(answer);
    } else if (answer === "Wait for both sides to have broken lines") {
      animateWaitForBothLines();
      handleFeedback(answer);
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setOncomingJeepneyFrame(0);

    // Reset player car to rightmost lane
    carXAnim.setValue(playerCarInitialX);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);
    setIsOncomingJeepneyVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario >= 10) {
      // Last scenario in phase - complete session
      try {
        const sessionResults = await completeSession();
        router.push({
          pathname: '/result',
          params: {
            ...sessionResults,
            userAttempts: JSON.stringify(sessionResults.attempts)
          }
        });
      } catch (error) {
        console.error('Error completing session:', error);
        Alert.alert('Error', 'Failed to save session results');
      }
    } else {
      moveToNextScenario();
      const nextScreen = `S${currentScenario + 1}P2`;
      router.push(`/scenarios/road-markings/phase2/${nextScreen}`);
    }

    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.stop();
    }
    if (jeepneyAnimationRef.current) {
      jeepneyAnimationRef.current.stop();
    }
    if (oncomingJeepneyAnimationRef.current) {
      oncomingJeepneyAnimationRef.current.stop();
    }
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! The broken line on your side permits overtaking when safe, regardless of the opposite side's markings."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

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
          mapLayout.map((row, rowIndex) => (
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
          ))
        ))}
      </Animated.View>

      {/* Jeepney ahead in the same lane as player */}
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

      {/* Oncoming jeepney in left lane */}
      {isOncomingJeepneyVisible && (
        <Animated.Image
          source={jeepneySprites.SOUTH[oncomingJeepneyFrame]}
          style={{
            width: jeepWidth,
            height: jeepHeight,
            position: "absolute",
            left: oncomingJeepneyInitialX,
            transform: [{ translateY: oncomingJeepneyYAnim }],
            zIndex: 4,
          }}
        />
      )}

      {/* Player Car (Blue) in right lane */}
      {isPlayerCarVisible && (
        <Animated.Image
          source={playerCarSprites[playerCarDirection][playerCarFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: height * 0.1,
            left: carXAnim,
            zIndex: 5,
          }}
        />
      )}

      {/* Question Overlay */}
      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image
            source={require("../../../../../assets/dialog/LTO.png")}
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

      {/* Feedback - Correct/Wrong */}
      {(animationType === "correct" || animationType === "wrong") && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image
            source={require("../../../../../assets/dialog/LTO.png")}
            style={styles.ltoImage}
          />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Next Button */}
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
    paddingHorizontal: sideMargin * 0.5,
  },
  questionTextContainer: {
    paddingHorizontal: width * 0.02,
    maxWidth: width * 0.65,
  },
  questionText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: Math.min(width * 0.055, 24),
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.1,
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
    paddingHorizontal: sideMargin * 0.5,
  },
  feedbackText: {
    color: "white",
    fontSize: Math.min(width * 0.05, 22),
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