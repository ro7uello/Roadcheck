import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, } from "react-native";
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

// Map setup
const mapImage = require("../../../../../assets/map/map2.png");
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
  west: require("../../../../../assets/traffic light/street_light2.png"),
  east: require("../../../../../assets/traffic light/street_light3.png"),
};

// Multiple streetlight positions (row, column, xOffset, direction)
const streetLights = [
  { row: 3, col: 4, xOffset: -50, direction: 'west' },
  { row: 6, col: 4, xOffset: -50, direction: 'west' },
  { row: 9, col: 4, xOffset: -50, direction: 'west' },
  { row: 12, col: 4, xOffset: -50, direction: 'west' },
  { row: 15, col: 4, xOffset: -50, direction: 'west' },
  { row: 4, col: 2, xOffset: -50, direction: 'east' },
  { row: 5, col: 2, xOffset: -50, direction: 'east' },
  { row: 8, col: 2, xOffset: -50, direction: 'east' },
  { row: 11, col: 2, xOffset: -50, direction: 'east' },
  { row: 14, col: 2, xOffset: -50, direction: 'east' },
];

const questions = [
  {
    question: "You need to walk about 100 meters to reach the jeepney terminal. There are no sidewalks available but the street is well lit. You are currently on the side of the road where you are not facing traffic.",
    options: [
      "Walk on the right side of the road facing the same direction as traffic",
      "Check if the road is clear and cross the street to walk on the left side facing oncoming traffic.",
      "Walk in the middle of the road where street lights are brightest"
    ],
    correct: "Check if the road is clear and cross the street to walk on the left side facing oncoming traffic.",
    wrongExplanation: {
      "Walk on the right side of the road facing the same direction as traffic": "Accident prone! Walking with traffic means you can't see approaching vehicles. You won't know if a car is coming too close until it's too late.",
      "Walk in the middle of the road where street lights are brightest": "Accident Prone! Walking in the roadway is extremely dangerous."
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
  const rightX = width * 0.56 - spriteWidth / 2; // Adjusted to right side by half
  const playerXAnim = useRef(new Animated.Value(rightX)).current;

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopDistance = scaledMapHeight * 0.2;
    const stopOffset = startOffset + stopDistance;

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

  // Player sprite frame loop
  useEffect(() => {
    let iv;
    if (!playerPaused && maleSprites[playerDirection]) {
      iv = setInterval(() => {
        setPlayerFrame((p) => (p + 1) % maleSprites[playerDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [playerPaused, playerDirection]);

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

    if (answer === "Walk in the middle of the road where street lights are brightest") {
      // Face west and walk to middle
      setPlayerDirection("WEST");
      setPlayerFrame(0);
      
      const middleX = width * 0.35 - spriteWidth / 2;
      
      Animated.timing(playerXAnim, {
        toValue: middleX,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        // After reaching middle, face north and walk
        setPlayerDirection("NORTH");
        setPlayerFrame(0);
        
        Animated.timing(scrollY, {
          toValue: currentScroll.current + scaledMapHeight * 0.15,
          duration: 3000,
          useNativeDriver: true,
        }).start(() => {
          setIsPlayerVisible(false);
          handleFeedback(answer);
        });
      });
      
      return;
    } else if (answer === "Walk on the right side of the road facing the same direction as traffic") {
      // Just walk straight north
      setPlayerDirection("NORTH");
      setPlayerFrame(0);
      
      Animated.timing(scrollY, {
        toValue: currentScroll.current + scaledMapHeight * 0.25,
        duration: 4500,
        useNativeDriver: true,
      }).start(() => {
        setIsPlayerVisible(false);
        handleFeedback(answer);
      });
      return;
    } else if (answer === "Check if the road is clear and cross the street to walk on the left side facing oncoming traffic.") {
      // Face west and walk to cross the road
      setPlayerDirection("WEST");
      setPlayerFrame(0);
      
      const leftX = width * 0.20 - spriteWidth / 2;
      
      Animated.timing(playerXAnim, {
        toValue: leftX,
        duration: 2500,
        useNativeDriver: true,
      }).start(() => {
        // After crossing, face north and walk
        setPlayerDirection("NORTH");
        setPlayerFrame(0);
        
        Animated.timing(scrollY, {
          toValue: currentScroll.current + scaledMapHeight * 0.2,
          duration: 3500,
          useNativeDriver: true,
        }).start(() => {
          setIsPlayerVisible(false);
          handleFeedback(answer);
        });
      });
      
      return;
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setPlayerFrame(0);
    
    const rightX = width * 0.65 - spriteWidth / 2;
    playerXAnim.setValue(rightX);
    setPlayerDirection("NORTH");
    setIsPlayerVisible(true);
    setPlayerPaused(false);
    
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
          // Move to next scenario
          moveToNextScenario();
          const nextScreen = `S${currentScenario + 1}P1`;
          router.push(`/scenarios/pedestrian/phase1/${nextScreen}`);
        }
      };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Always walk facing traffic when there are no sidewalks. This allows you to see vehicles approaching and react accordingly for your safety."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  const currentPlayerSprite = maleSprites[playerDirection] && maleSprites[playerDirection][playerFrame] 
    ? maleSprites[playerDirection][playerFrame] 
    : maleSprites["NORTH"][0];

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
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
        
        {/* Render multiple streetlights with correct directions */}
        {streetLights.map((light, index) => {
          const lightLeft = light.col * tileSize + light.xOffset;
          const lightTop = light.row * tileSize;
          
          return (
            <Image
              key={`streetlight-${index}`}
              source={light.direction === 'west' ? trafficSign.west : trafficSign.east}
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