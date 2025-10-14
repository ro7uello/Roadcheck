import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { router } from 'expo-router';
import { useSession } from '../../../../contexts/SessionManager';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const spriteWidth = Math.min(width * 0.08, 64);
const spriteHeight = spriteWidth * 1.5;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Map setup - CHANGED TO MAP6
const mapImage = require("../../../../../assets/map/map6.png");
const mapWidth = 320;
const mapHeight = 768;
const mapScale = width / mapWidth;
const scaledMapHeight = mapHeight * mapScale;

// Character sprites
const maleSprites = {
  WEST: [
    require("../../../../../assets/character/sprites/west/west_walk1.png"),
    require("../../../../../assets/character/sprites/west/west_walk2.png"),
    require("../../../../../assets/character/sprites/west/west_walk3.png"),
    require("../../../../../assets/character/sprites/west/west_walk4.png"),
  ],
  NORTH: [
    require("../../../../../assets/character/sprites/north/north_walk1.png"),
    require("../../../../../assets/character/sprites/north/north_walk2.png"),
    require("../../../../../assets/character/sprites/north/north_walk3.png"),
    require("../../../../../assets/character/sprites/north/north_walk4.png"),
  ],
};

const trafficSign = {
  green: require("../../../../../assets/traffic light/street_light2.png"), // Green light
  red: require("../../../../../assets/traffic light/street_light3.png"),   // Red light
};

// Multiple streetlight positions (row, column, xOffset, initial light state)
const streetLights = [
  { row: 3, col: 4, xOffset: -50, image: require("../../../../../assets/traffic light/street_light2.png") },
  { row: 6, col: 4, xOffset: -50, image: require("../../../../../assets/traffic light/street_light2.png") },
  { row: 9, col: 4, xOffset: -50, image: require("../../../../../assets/traffic light/street_light2.png") },
  { row: 12, col: 4, xOffset: -50, image: require("../../../../../assets/traffic light/street_light2.png") },
  { row: 15, col: 4, xOffset: -50, image: require("../../../../../assets/traffic light/street_light2.png") },
  { row: 4, col: 2, xOffset: -50, image: require("../../../../../assets/traffic light/street_light3.png") },
  { row: 5, col: 2, xOffset: -50, image: require("../../../../../assets/traffic light/street_light3.png") },
  { row: 8, col: 2, xOffset: -50, image: require("../../../../../assets/traffic light/street_light3.png") },
  { row: 11, col: 2, xOffset: -50, image: require("../../../../../assets/traffic light/street_light3.png") },
  { row: 14, col: 2, xOffset: -50, image: require("../../../../../assets/traffic light/street_light3.png") },
];

const questions = [
  {
    question: "You are crossing a major road, right before you reach the center island of the road the traffic light turns red for pedestrian. You saw that the center island provides a space for a pedestrian to stop. ",
    options: [
      "Walk quickly to reach the other side of the road.",
      "Walk and stop at the center island and wait for the traffic light for pedestrian to turn green.",
      "Stop where you are right now."
    ],
    correct: "Walk and stop at the center island and wait for the traffic light for pedestrian to turn green.",
    wrongExplanation: {
      "Walk quickly to reach the other side of the road.": "Accident prone! Some drivers might not be able to notice you while crossing the road quickly getting you involved in an accident.",
      "Stop where you are right now.": "Accident prone! Stopping at the middle of the road is dangerous."
    }
  },
];

export default function DrivingGame() {
  const {
    currentScenario,
    updateScenarioProgress,
    moveToNextScenario,
    completeSession,
  } = useSession();

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const scenarioId = 90 + currentScenario;
      await updateScenarioProgress(scenarioId, selectedOption, isCorrect);
    } catch (error) {
      console.error('Error updating scenario progress:', error);
    }
  };

  const [isPlayerVisible, setIsPlayerVisible] = useState(true);
  const [trafficLightState, setTrafficLightState] = useState('green');

  const startOffset = -(scaledMapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);
  const numColumns = 10;
  const tileSize = width / numColumns;

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
  const [playerDirection, setPlayerDirection] = useState("NORTH");

  // Player
  const [playerFrame, setPlayerFrame] = useState(0);
  const [playerPaused, setPlayerPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const startX = width * 0.50 - spriteWidth / 2;
  const playerXAnim = useRef(new Animated.Value(startX)).current;
  const animationFrameRef = useRef(null);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopDistance = scaledMapHeight * 0.46;
    const stopOffset = startOffset + stopDistance;

    // Start player walking animation immediately
    setPlayerDirection("NORTH");
    setPlayerPaused(false);
    setIsAnimating(true);
    setTrafficLightState('green');

    Animated.timing(scrollY, {
      toValue: stopOffset,
      duration: 5000,
      useNativeDriver: true,
    }).start(() => {
      setTrafficLightState('red');
      setPlayerPaused(true);
      setIsAnimating(false);
      setShowQuestion(true);
      setTimeout(() => {
        setShowAnswers(true);
      }, 1000);
    });
  }

  useEffect(() => {
    startScrollAnimation();
  }, []);

  // Synchronized player sprite animation with scroll
  useEffect(() => {
    let frameCount = 0;
    const animate = () => {
      if (isAnimating && !playerPaused && maleSprites[playerDirection]) {
        frameCount++;
        // Update frame every 10 animation frames (approximately 167ms at 60fps)
        if (frameCount % 10 === 0) {
          setPlayerFrame((prev) => (prev + 1) % maleSprites[playerDirection].length);
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (isAnimating && !playerPaused) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, playerPaused, playerDirection]);

  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);

  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    if (answerGiven === currentQuestion.correct) {
      setIsCorrectAnswer(true);
      setAnimationType("correct");
      setTimeout(() => {
        setShowNext(true);
      }, 1000);
    } else {
      setIsCorrectAnswer(false);
      setAnimationType("wrong");
      setTimeout(() => {
        setShowNext(true);
      }, 1000);
    }
  };

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    updateProgress(answer, isCorrect);

    if (answer === "Walk quickly to reach the other side of the road.") {
      setPlayerPaused(false);
      setPlayerDirection("NORTH");
      setIsAnimating(true);
      
      const quickScrollDistance = scaledMapHeight * 0.3;
      const quickScrollTarget = currentScroll.current + quickScrollDistance;

      Animated.timing(scrollY, {
        toValue: quickScrollTarget,
        duration: 1600,
        useNativeDriver: true,
      }).start(() => {
        setPlayerPaused(true);
        setIsAnimating(false);
        setIsPlayerVisible(false);
        handleFeedback(answer);
      });

      return;
    } else if (answer === "Walk and stop at the center island and wait for the traffic light for pedestrian to turn green.") {
      setPlayerPaused(false);
      setPlayerDirection("NORTH");
      setIsAnimating(true);

      const centerIslandScrollDistance = scaledMapHeight * 0.05;
      const centerIslandTarget = currentScroll.current + centerIslandScrollDistance;

      Animated.timing(scrollY, {
        toValue: centerIslandTarget,
        duration: 2300,
        useNativeDriver: true,
      }).start(() => {
        setPlayerPaused(true);
        setIsAnimating(false);
        
        setTimeout(() => {
          setTrafficLightState('green');
          setPlayerPaused(false);
          setIsAnimating(true);
          
          const remainingScrollDistance = scaledMapHeight * 0.2;
          const finalTarget = currentScroll.current + remainingScrollDistance;
          
          Animated.timing(scrollY, {
            toValue: finalTarget,
            duration: 1800,
            useNativeDriver: true,
          }).start(() => {
            setPlayerPaused(true);
            setIsAnimating(false);
            setIsPlayerVisible(false);
            handleFeedback(answer);
          });
        }, 2000);
      });

      return;
    } else if (answer === "Stop where you are right now.") {
      setPlayerPaused(true);
      setIsAnimating(false);
      
      setTimeout(() => {
        setIsPlayerVisible(false);
        handleFeedback(answer);
      }, 1500);

      return;
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setPlayerFrame(0);

    const startX = width * 0.50 - spriteWidth / 2;
    playerXAnim.setValue(startX);
    setPlayerDirection("NORTH");
    setIsPlayerVisible(true);
    setPlayerPaused(false);
    setIsAnimating(false);
    setTrafficLightState('green');

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario >= 10) {
      try {
        const sessionResults = await completeSession();

        if (!sessionResults) {
          Alert.alert('Error', 'Failed to complete session');
          return;
        }

        router.push({
          pathname: '/result-page',
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
             const nextScreen = `S${currentScenario + 1}P1`;
             router.push(`/scenarios/pedestrian/phase1/${nextScreen}`);
    }
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Use the center island to wait for the traffic light to turn green and avoid accidents."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  const currentPlayerSprite = maleSprites[playerDirection] && maleSprites[playerDirection][playerFrame]
    ? maleSprites[playerDirection][playerFrame]
    : maleSprites["NORTH"][0];

  return (
    <View style={{ flex: 1, backgroundColor: "#2a2a2a" }}>
      {/* Map */}
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: scaledMapHeight,
          left: 0,
          transform: [{ translateY: scrollY }],
          zIndex: 1,
        }}
      >
        <Image
          source={mapImage}
          style={{
            width: width,
            height: scaledMapHeight,
          }}
          resizeMode="stretch"
        />

        {/* Render multiple streetlights - they stay in their positions */}
        {streetLights.map((light, index) => {
          const lightLeft = light.col * tileSize + light.xOffset;
          const lightTop = light.row * tileSize;

          return (
            <Image
              key={`streetlight-${index}`}
              source={light.image}
              style={{
                width: tileSize * 3,
                height: tileSize * 3,
                position: "absolute",
                top: lightTop,
                left: lightLeft,
                zIndex: 11,
              }}
              resizeMode="contain"
            />
          );
        })}
      </Animated.View>

      {/* Player sprite */}
      {isPlayerVisible && (
        <Animated.Image
          source={currentPlayerSprite}
          style={{
            width: spriteWidth * 1.5,
            height: spriteHeight * 1.5,
            position: "absolute",
            bottom: 80,
            transform: [{ translateX: playerXAnim }],
            zIndex: 8,
          }}
        />
      )}

      {/* Question overlay */}
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
          {questions[questionIndex].options.map((answer) => (
            <TouchableOpacity
              key={answer}
              style={styles.answerButton}
              onPress={() => handleAnswer(answer)}
            >
              <Text style={styles.answerText}>{answer}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Feedback */}
      {animationType === "correct" && (
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </View>
      )}

      {animationType === "wrong" && (
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>
                {feedbackMessage}
            </Text>
          </View>
        </View>
      )}

      {/* Next button */}
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
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.16,
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
    fontSize: Math.min(width * 0.06, 24),
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