import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, } from "react-native";
import { router } from 'expo-router';
import { useSession } from '../../../../contexts/SessionManager';


const { width, height } = Dimensions.get("window");


// Responsive calculations
const spriteWidth = Math.min(width * 0.08, 64);
const spriteHeight = spriteWidth * 1.5;
const carWidth = spriteWidth * 5;
const carHeight = spriteHeight * 5;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;


// Map setup
const mapImage = require("../../../../../assets/map/map4.png");
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
  EAST: [
    require("../../../../../assets/character/sprites/west/west_walk1.png"),
    require("../../../../../assets/character/sprites/west/west_walk2.png"),
    require("../../../../../assets/character/sprites/west/west_walk3.png"),


  ],
  NORTH: [
    require("../../../../../assets/character/sprites/north/north_walk1.png"),
    require("../../../../../assets/character/sprites/north/north_walk2.png"),
    require("../../../../../assets/character/sprites/north/north_walk3.png"),
    require("../../../../../assets/character/sprites/north/north_walk4.png"),
  ],
};


// NPC sprites
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
  NPC3: [
    require("../../../../../assets/character/sprites/north/npc2_north_walk1.png"),
    require("../../../../../assets/character/sprites/north/npc2_north_walk2.png"),
    require("../../../../../assets/character/sprites/north/npc2_north_walk3.png"),
    require("../../../../../assets/character/sprites/north/npc2_north_walk4.png"),
  ],
};


// Multiple car colors - EAST direction
const npcCarSprites = {
  blue: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
  red: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/EAST/SEPARATED/Red_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/EAST/SEPARATED/Red_CIVIC_CLEAN_EAST_001.png"),
  ],
  green: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Green/MOVE/EAST/SEPARATED/Green_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Green/MOVE/EAST/SEPARATED/Green_CIVIC_CLEAN_EAST_001.png"),
  ],
  yellow: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/EAST/SEPARATED/Yellow_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/EAST/SEPARATED/Yellow_CIVIC_CLEAN_EAST_001.png"),
  ],
};


const questions = [
  {
    question: "There's an event and many people are crossing the street. Some traffic enforcers are present directing traffic. You need to cross to reach the other side.",
    options: [
      "Cross anywhere since there's an event and rules are relaxed",
      "Look for the traffic enforcers and cross where they're directing traffic",
      "Follow the crowd. If others are crossing, it must be safe"
    ],
    correct: "Look for the traffic enforcers and cross where they're directing traffic",
    wrongExplanation: {
      "Cross anywhere since there's an event and rules are relaxed": "Accident Prone! Events don't suspend traffic safety rules. Increased chaos means increased danger.",
      "Follow the crowd. If others are crossing, it must be safe": "Wrong! Crowd behavior doesn't guarantee safety. Many people can make poor decisions simultaneously."
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
  const centerX = width * 0.5 - spriteWidth / 2;
  const playerXAnim = useRef(new Animated.Value(centerX)).current;


  // NPC Cars
  const carsRef = useRef([
    { id: 1, color: 'blue', row: 7, xOffset: -200, frame: 0 },
    { id: 2, color: 'red', row: 7, xOffset: -600, frame: 0 },
    { id: 3, color: 'green', row: 7, xOffset: -1000, frame: 0 },
  ]);


  const [npcCars, setNpcCars] = useState(carsRef.current);


  // NPCs waiting to cross
  const [npcFrame, setNpcFrame] = useState(0);
  const [npcsMoving, setNpcsMoving] = useState(false);
  const npcScrollY = useRef(new Animated.Value(0)).current;
 
  const npcsRef = useRef([
    { id: 1, type: 'NPC1', xOffset: -spriteWidth * 2, idle: true },
    { id: 2, type: 'NPC2', xOffset: -spriteWidth * 1, idle: true },
    { id: 3, type: 'NPC3', xOffset: -spriteWidth * 3, idle: true },
  ]);


  // Animate NPC cars moving EAST
  useEffect(() => {
    const carUpdateInterval = setInterval(() => {
      carsRef.current = carsRef.current.map(car => {
        let newXOffset = car.xOffset + 3;
       
        if (newXOffset > width + 200) {
          newXOffset = -200;
        }
       
        return {
          ...car,
          xOffset: newXOffset,
          frame: (car.frame + 1) % 2
        };
      });
     
      setNpcCars([...carsRef.current]);
    }, 50);


    return () => clearInterval(carUpdateInterval);
  }, []);


  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopDistance = scaledMapHeight * .35;
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


  // NPC sprite frame loop
  useEffect(() => {
    const iv = setInterval(() => {
      setNpcFrame((p) => (p + 1) % 4);
    }, 300);
    return () => clearInterval(iv);
  }, []);


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


  const moveNPCsNorth = () => {
    setNpcsMoving(true);
    Animated.timing(npcScrollY, {
      toValue: scaledMapHeight * 0.25,
      duration: 3500,
      useNativeDriver: true,
    }).start();
  };


  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    updateProgress(answer, isCorrect);

    if (answer === "Cross anywhere since there's an event and rules are relaxed") {
      // Option A: NPCs walk north, player goes east (right)
      moveNPCsNorth();
     
      setPlayerDirection("EAST");
      setPlayerFrame(0);
     
      // Move player to the right
      Animated.timing(playerXAnim, {
        toValue: width + spriteWidth,
        duration: 3000,
        useNativeDriver: true,
      }).start(() => {
        setIsPlayerVisible(false);
        handleFeedback(answer);
      });
     
      return;
    } else if (answer === "Look for the traffic enforcers and cross where they're directing traffic") {
      // Option B: Player stops, then both player and NPCs walk north together
      setPlayerDirection("NORTH");
      setPlayerFrame(0);
      setPlayerPaused(true);
     
      // Wait 2 seconds, then move both player and NPCs
      setTimeout(() => {
        setPlayerPaused(false);
        moveNPCsNorth();
       
        Animated.timing(scrollY, {
          toValue: currentScroll.current + scaledMapHeight * 0.25,
          duration: 3500,
          useNativeDriver: true,
        }).start(() => {
          setIsPlayerVisible(false);
          handleFeedback(answer);
        });
      }, 2000);
     
      return;
    } else if (answer === "Follow the crowd. If others are crossing, it must be safe") {
      // Option C: NPCs walk first, then player follows
      setPlayerDirection("NORTH");
      setPlayerFrame(0);
      setPlayerPaused(true);
     
      // NPCs start walking immediately
      moveNPCsNorth();
     
      // Wait 1.5 seconds, then player follows
      setTimeout(() => {
        setPlayerPaused(false);
        Animated.timing(scrollY, {
          toValue: currentScroll.current + scaledMapHeight * 0.25,
          duration: 3000,
          useNativeDriver: true,
        }).start(() => {
          setIsPlayerVisible(false);
          handleFeedback(answer);
        });
      }, 1500);
     
      return;
    }
  };


  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setPlayerFrame(0);
    setNpcsMoving(false);
    npcScrollY.setValue(0);
   
    const centerX = width * 0.5 - spriteWidth / 2;
    playerXAnim.setValue(centerX);
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
    ? "Correct! Always look for traffic enforcers during events - they're there to ensure your safety and manage the chaos."
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
      </Animated.View>


      {/* NPC Cars - Moving EAST on row 7 */}
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: scaledMapHeight,
          left: 0,
          transform: [{ translateY: scrollY }],
          zIndex: 5,
        }}
      >
        {npcCars.map(car => (
          <View
            key={car.id}
            style={{
              position: "absolute",
              left: car.xOffset,
              top: scaledMapHeight * 0.35,
              width: carWidth,
              height: carHeight,
            }}
          >
            <Image
              source={npcCarSprites[car.color][car.frame]}
              style={{
                width: carWidth,
                height: carHeight,
              }}
              resizeMode="contain"
            />
          </View>
        ))}
      </Animated.View>


      {/* NPCs waiting to cross */}
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: scaledMapHeight,
          left: 0,
          transform: [
            { translateY: scrollY },
            { translateY: Animated.multiply(npcScrollY, -1) }
          ],
          zIndex: 6,
        }}
      >
        {npcsRef.current.map(npc => (
          <View
            key={npc.id}
            style={{
              position: "absolute",
              left: centerX + npc.xOffset,
              top: scaledMapHeight * 0.48,
            }}
          >
            <Image
              source={npcSprites[npc.type][npcFrame]}
              style={{
                width: spriteWidth * 1.5,
                height: spriteHeight * 1.5,
              }}
              resizeMode="contain"
            />
          </View>
        ))}
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

