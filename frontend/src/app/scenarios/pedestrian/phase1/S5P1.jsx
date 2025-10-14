import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, } from "react-native";
import { router } from 'expo-router';
import { useSession } from '../../../../contexts/SessionManager';
import { scale, fontSize, wp, hp } from '../../../../contexts/ResponsiveHelper';

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
  NORTH_REFLECTIVE: [
    require("../../../../../assets/character/sprites/north/north_walk_reflective1.png"),
    require("../../../../../assets/character/sprites/north/north_walk_reflective2.png"),
    require("../../../../../assets/character/sprites/north/north_walk_reflective3.png"),
    require("../../../../../assets/character/sprites/north/north_walk_reflective4.png"),
  ],
};

const npcSprites = {
  NPC1: [
    require("../../../../../assets/character/sprites/north/npc_north_walk1.png"),
    require("../../../../../assets/character/sprites/north/npc_north_walk2.png"),
    require("../../../../../assets/character/sprites/north/npc_north_walk3.png"),
    require("../../../../../assets/character/sprites/north/npc_north_walk4.png"),
  ],
  NPC2: [
    require("../../../../../assets/character/sprites/north/npc2_north_walk1.png"),
    require("../../../../../assets/character/sprites/north/npc2_north_walk2.png"),
    require("../../../../../assets/character/sprites/north/npc2_north_walk3.png"),
    require("../../../../../assets/character/sprites/north/npc2_north_walk4.png"),
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
    question: "You're walking along the road at midnight for exercise. It's still dim, and there's no sidewalk.",
    options: [
      "Wear dark clothes to blend in and walk quietly",
      "Use your phone's flashlight and wear bright/reflective clothing",
      "Walk in groups and make noise so drivers can hear you"
    ],
    correct: "Use your phone's flashlight and wear bright/reflective clothing",
    wrongExplanation: {
      "Wear dark clothes to blend in and walk quietly": "Wrong! Dark clothes make you hard to see for drivers in dim/misty conditions",
      "Walk in groups and make noise so drivers can hear you": "Wrong! Group noises won't guarantee that drivers can hear you, and groups can block more roadway space unsafely."
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
  const [showNPCs, setShowNPCs] = useState(false);

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
  const [npcFrame, setNpcFrame] = useState(0);
  const [playerPaused, setPlayerPaused] = useState(false);
  const rightX = width * 0.56 - spriteWidth / 2;
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
    if (!playerPaused) {
      const spriteArray = playerDirection === "NORTH_REFLECTIVE" 
        ? maleSprites.NORTH_REFLECTIVE 
        : maleSprites[playerDirection];
      
      if (spriteArray) {
        iv = setInterval(() => {
          setPlayerFrame((p) => (p + 1) % spriteArray.length);
        }, 200);
      }
    }
    return () => clearInterval(iv);
  }, [playerPaused, playerDirection]);

  // NPC sprite frame loop
  useEffect(() => {
    let iv;
    if (showNPCs) {
      iv = setInterval(() => {
        setNpcFrame((p) => (p + 1) % npcSprites.NPC1.length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [showNPCs]);

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

    if (answer === "Wear dark clothes to blend in and walk quietly") {
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
    } else if (answer === "Use your phone's flashlight and wear bright/reflective clothing") {
      // Change to reflective sprite and walk straight north
      setPlayerDirection("NORTH_REFLECTIVE");
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
    } else if (answer === "Walk in groups and make noise so drivers can hear you") {
      // Show NPCs and walk straight north
      setShowNPCs(true);
      setPlayerDirection("NORTH");
      setPlayerFrame(0);
      setNpcFrame(0);
      
      Animated.timing(scrollY, {
        toValue: currentScroll.current + scaledMapHeight * 0.25,
        duration: 4500,
        useNativeDriver: true,
      }).start(() => {
        setIsPlayerVisible(false);
        setShowNPCs(false);
        handleFeedback(answer);
      });
      
      return;
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setPlayerFrame(0);
    setShowNPCs(false);
    
    const rightX = width * 0.65 - spriteWidth / 2;
    playerXAnim.setValue(rightX);
    setPlayerDirection("NORTH");
    setIsPlayerVisible(true);
    setPlayerPaused(false);
    
    if (questionIndex < questions.length - 1) {
        setQuestionIndex(questionIndex + 1);
        startScrollAnimation();
      } else if (currentScenario >= 10) {
        console.log('Completing session...');
        // Complete session
      } else {
        console.log('Moving to next scenario...');
        moveToNextScenario();
        const nextScreen = `S${currentScenario + 1}P1`;
        console.log('Next screen:', nextScreen);
        console.log('Full path:', `/scenarios/pedestrian/phase1/${nextScreen}`);
        router.push(`/scenarios/pedestrian/phase1/${nextScreen}`);
      }
    };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Use flashlight and bright/reflective clothing for maximum visibility in low-light conditions."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  const getCurrentPlayerSprite = () => {
    if (playerDirection === "NORTH_REFLECTIVE") {
      return maleSprites.NORTH_REFLECTIVE[playerFrame];
    } else if (maleSprites[playerDirection]) {
      return maleSprites[playerDirection][playerFrame];
    }
    return maleSprites.NORTH[0];
  };

  const currentPlayerSprite = getCurrentPlayerSprite();

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

      {/* NPC 1 - Left side */}
      {showNPCs && (
        <Animated.Image
          source={npcSprites.NPC1[npcFrame]}
          style={{
            width: spriteWidth * 1.5,
            height: spriteHeight * 1.5,
            position: "absolute",
            bottom: 80,
            transform: [{ translateX: playerXAnim.interpolate({
              inputRange: [0, width],
              outputRange: [-spriteWidth * 2, width - spriteWidth * 2]
            }) }],
            zIndex: 7,
          }}
        />
      )}

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

      {/* NPC 2 - Right side */}
      {showNPCs && (
        <Animated.Image
          source={npcSprites.NPC2[npcFrame]}
          style={{
            width: spriteWidth * 1.5,
            height: spriteHeight * 1.5,
            position: "absolute",
            bottom: 80,
            transform: [{ translateX: playerXAnim.interpolate({
              inputRange: [0, width],
              outputRange: [-spriteWidth * 3, width - spriteWidth * 3]
            }) }],
            zIndex: 7,
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
    fontSize: fontSize(16),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.16,
    right: sideMargin,
    width: wp(30),
    height: height * 0.21,
    zIndex: 11,
  },
  answerButton: {
    backgroundColor: "#333",
    padding: height * 0.015,
    borderRadius: scale(8),
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
    width: wp(100),
    height: hp(35),
    backgroundColor: "rgba(8, 8, 8, 0.43)",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: scale(10),
    zIndex: 10,
  },
  feedbackBox: {
    flex: 1,
    bottom: hp(10),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(15),
  },
  feedbackText: {
    color: "white",
    fontSize: fontSize(16),
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: fontSize(22),
  },
  nextButtonContainer: {
    position: "absolute",
    top: hp(50),
    right: wp(5),
    width: wp(20),
    alignItems: "center",
    zIndex: 11,
  },
  nextButton: {
    backgroundColor: "#007bff",
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: wp(15),
    alignItems: "center",
  },
  nextButtonText: {
    color: "white",
    fontSize: fontSize(16),
    fontWeight: "bold",
  },
});