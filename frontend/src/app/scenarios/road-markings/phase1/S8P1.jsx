import { useSession } from '../../../../contexts/SessionManager';
import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const playerCarWidth = Math.min(width * 0.25, 280);
const playerCarHeight = playerCarWidth * (350/280);
const jeepWidth = Math.min(width * 0.28, 300);
const jeepHeight = jeepWidth * (350/280);
const npcCarWidth = Math.min(width * 0.25, 280);
const npcCarHeight = npcCarWidth * (350/280);
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Road tiles and map layout
const roadTiles = {
    road2: require("../../../../../assets/road/road2.png"),
    road5: require("../../../../../assets/road/road5.png"),
    road7: require("../../../../../assets/road/road7.png"),
};

const mapLayout = [
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
];

// Separated sprites
const playerCarSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHWEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_001.png"),
  ],
  WEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_001.png"),
  ],
  NORTHEAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
};

const jeepneySprites = {
  NORTH: [
    require("../../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
  ],
};

const npcCar1 = {
    NORTH: [
        require("../../../../../assets/car/SPORT TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_SPORT_CLEAN_NORTH_000.png"),
        require("../../../../../assets/car/SPORT TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_SPORT_CLEAN_NORTH_001.png"),
    ],
};
const npcCar2 = {
    NORTH: [
        require("../../../../../assets/car/SUV TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SUV_CLEAN_NORTH_000.png"),
        require("../../../../../assets/car/SUV TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SUV_CLEAN_NORTH_001.png"),
    ],
};
const npcCar3 = {
    SOUTH: [
        require("../../../../../assets/car/SPORT TOPDOWN/Green/MOVE/SOUTH/SEPARATED/Green_SPORT_CLEAN_SOUTH_000.png"),
        require("../../../../../assets/car/SPORT TOPDOWN/Green/MOVE/SOUTH/SEPARATED/Green_SPORT_CLEAN_SOUTH_001.png"),
    ],
};
const npcCar4 = {
    SOUTH: [
        require("../../../../../assets/car/SUV TOPDOWN/Magenta/MOVE/SOUTH/SEPARATED/Magenta_SUV_CLEAN_SOUTH_000.png"),
        require("../../../../../assets/car/SUV TOPDOWN/Magenta/MOVE/SOUTH/SEPARATED/Magenta_SUV_CLEAN_SOUTH_001.png"),
    ],
};

const questions = [
  {
    question: "You see double solid yellow lines but notice other drivers frequently crossing them. You're running late for an important meeting.",
    options: ["Follow other drivers and cross the lines since everyone is doing it", "Cross only if no traffic enforcers are visible", "Respect the double solid yellow lines regardless of others' behavior"],
    correct: "Respect the double solid yellow lines regardless of others' behavior",
    wrongExplanation: {
      "Follow other drivers and cross the lines since everyone is doing it": "Accident prone! Always follow the road markings to avoid violations and accidents. Following others' bad habits is dangerous.",
      "Cross only if no traffic enforcers are visible": "Accident prone! Even if there are no traffic enforcers, road markings are there to guide other motorists as well. Following them will help avoid violations and accidents."
    }
  },
];

export default function DrivingGame() {
  const navigation = useNavigation();

  const {
    updateScenarioProgress,
    moveToNextScenario,
    completeSession,
    currentScenario: sessionCurrentScenario,
    sessionData
  } = useSession();

  const currentScenario = 8;

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const scenarioId = currentScenario;
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
  const [isNpcCar1Visible, setIsNpcCar1Visible] = useState(true);
  const [isNpcCar2Visible, setIsNpcCar2Visible] = useState(true);
  const [isNpcCar3Visible, setIsNpcCar3Visible] = useState(true);
  const [isNpcCar4Visible, setIsNpcCar4Visible] = useState(true);

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
  const [npcCar1Frame, setNpcCar1Frame] = useState(0);
  const [npcCar2Frame, setNpcCar2Frame] = useState(0);
  const [npcCar3Frame, setNpcCar3Frame] = useState(0);
  const [npcCar4Frame, setNpcCar4Frame] = useState(0);

  const playerCarXAnim = useRef(new Animated.Value(width / 2 - playerCarWidth / 2)).current;
  const playerCarYOffset = useRef(new Animated.Value(0)).current;

  const jeepneyInitialX = 2 * tileSize + (tileSize / 2 - jeepWidth / 2);
  const jeepneyYAnim = useRef(new Animated.Value(-jeepHeight)).current;

  // NPC Car initial X positions (center of their respective lanes)
  const npcCar1InitialX = 0 * tileSize + (tileSize / 2 - npcCarWidth / 2); // Lane 0
  const npcCar2InitialX = 3 * tileSize + (tileSize / 2 - npcCarWidth / 2); // Lane 3
  const npcCar3InitialX = 4 * tileSize + (tileSize / 2 - npcCarWidth / 2); // Lane 4
  const npcCar4InitialX = 1 * tileSize + (tileSize / 2 - npcCarWidth / 2); // Lane 1

  // NPC Car Y position offsets (they will move with scrollY)
  const npcCar1Offset = -npcCarHeight * 2;
  const npcCar2Offset = -npcCarHeight * 4;
  const npcCar3Offset = height * 0.3;
  const npcCar4Offset = height * 0.5;

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

  // NPC Car sprite animations
  useEffect(() => {
    if (showQuestion || showAnswers) return;
    const npc1Interval = setInterval(() => {
      setNpcCar1Frame((prevFrame) => (prevFrame === 0 ? 1 : 0));
    }, 280);
    return () => clearInterval(npc1Interval);
  }, [showQuestion, showAnswers]);

  useEffect(() => {
    if (showQuestion || showAnswers) return;
    const npc2Interval = setInterval(() => {
      setNpcCar2Frame((prevFrame) => (prevFrame === 0 ? 1 : 0));
    }, 220);
    return () => clearInterval(npc2Interval);
  }, [showQuestion, showAnswers]);

  useEffect(() => {
    if (showQuestion || showAnswers) return;
    const npc3Interval = setInterval(() => {
      setNpcCar3Frame((prevFrame) => (prevFrame === 0 ? 1 : 0));
    }, 270);
    return () => clearInterval(npc3Interval);
  }, [showQuestion, showAnswers]);

  useEffect(() => {
    if (showQuestion || showAnswers) return;
    const npc4Interval = setInterval(() => {
      setNpcCar4Frame((prevFrame) => (prevFrame === 0 ? 1 : 0));
    }, 230);
    return () => clearInterval(npc4Interval);
  }, [showQuestion, showAnswers]);

  const scrollAnimationRef = useRef(null);
  const jeepneyAnimationRef = useRef(null);

  function startScrollAnimation() {
    scrollY.setValue(0);
    jeepneyYAnim.setValue(-jeepHeight);

    playerCarXAnim.setValue(width / 2 - playerCarWidth / 2);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);
    setIsNpcCar1Visible(true);
    setIsNpcCar2Visible(true);
    setIsNpcCar3Visible(true);
    setIsNpcCar4Visible(true);

    scrollAnimationRef.current = Animated.loop(
      Animated.timing(scrollY, {
        toValue: -mapHeight,
        duration: mapHeight * 10,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    scrollAnimationRef.current.start();

    jeepneyAnimationRef.current = Animated.timing(jeepneyYAnim, {
      toValue: -height * 0.2,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    jeepneyAnimationRef.current.start(() => {
      setTimeout(() => {
        if (scrollAnimationRef.current) {
          scrollAnimationRef.current.stop();
        }

        setIsPlayerCarVisible(true);
        setIsJeepneyVisible(true);
        setIsNpcCar1Visible(true);
        setIsNpcCar2Visible(true);
        setIsNpcCar3Visible(true);
        setIsNpcCar4Visible(true);

        setPlayerCarFrame(0);
        setJeepneyFrame(0);
        setNpcCar1Frame(0);
        setNpcCar2Frame(0);
        setNpcCar3Frame(0);
        setNpcCar4Frame(0);

        setShowQuestion(true);
        setTimeout(() => {
          setShowAnswers(true);
        }, 1000);
      }, 2000);
    });
  }

  useEffect(() => {
    startScrollAnimation();
    return () => {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
      if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();
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

  const animateStayInLane = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.start();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();

    setPlayerCarDirection("NORTH");
    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);
    setIsNpcCar1Visible(true); setNpcCar1Frame(0);
    setIsNpcCar2Visible(true); setNpcCar2Frame(0);
    setIsNpcCar3Visible(true); setNpcCar3Frame(0);
    setIsNpcCar4Visible(true); setNpcCar4Frame(0);

    await new Promise(resolve => setTimeout(resolve, 500));
    handleFeedback(selectedAnswer);
  };

  const animateSuddenOvertake = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.start();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();

    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);
    setIsNpcCar1Visible(true);
    setIsNpcCar2Visible(true);
    setIsNpcCar3Visible(true);
    setIsNpcCar4Visible(true);

    const targetXSouthboundLane = 1 * tileSize + (tileSize / 2 - npcCarWidth / 2); // Lane 1

    // Lane change animation
    await new Promise(resolve => {
      setPlayerCarDirection("NORTHWEST");
      Animated.timing(playerCarXAnim, {
        toValue: targetXSouthboundLane,
        duration: 400,
        easing: Easing.easeOut,
        useNativeDriver: false,
      }).start(resolve);
    });

    // Set direction to north after lane change
    setPlayerCarDirection("NORTH");

    // Accelerate forward - move player car up relative to its current position
    await new Promise(resolve => {
      Animated.timing(playerCarYOffset, {
        toValue: -height * 8, // Move up significantly
        duration: 1500,
        easing: Easing.inOut,
        useNativeDriver: false,
      }).start(resolve);
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    handleFeedback(selectedAnswer);
  };

  const animateCarefulOvertake = async () => {
if (scrollAnimationRef.current) scrollAnimationRef.current.start();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();

    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);
    setIsNpcCar1Visible(true);
    setIsNpcCar2Visible(true);
    setIsNpcCar3Visible(true);
    setIsNpcCar4Visible(true);

    const targetXSouthboundLane = 1 * tileSize + (tileSize / 2 - npcCarWidth / 2); // Lane 1

    // Lane change animation
    await new Promise(resolve => {
      setPlayerCarDirection("NORTHWEST");
      Animated.timing(playerCarXAnim, {
        toValue: targetXSouthboundLane,
        duration: 400,
        easing: Easing.easeOut,
        useNativeDriver: false,
      }).start(resolve);
    });

    // Set direction to north after lane change
    setPlayerCarDirection("NORTH");

    // Accelerate forward - move player car up relative to its current position
    await new Promise(resolve => {
      Animated.timing(playerCarYOffset, {
        toValue: -height * 6, // Move up significantly
        duration: 1500,
        easing: Easing.inOut,
        useNativeDriver: false,
      }).start(resolve);
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    handleFeedback(selectedAnswer);
  };

  const handleAnswer = async (option) => {
    setSelectedAnswer(option);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = option === currentQuestion.correct;
    updateProgress(option, isCorrect);

    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();

    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);
    setIsNpcCar1Visible(true);
    setIsNpcCar2Visible(true);
    setIsNpcCar3Visible(true);
    setIsNpcCar4Visible(true);

    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setNpcCar1Frame(0);
    setNpcCar2Frame(0);
    setNpcCar3Frame(0);
    setNpcCar4Frame(0);

    const actualCorrectAnswer = questions[questionIndex].correct;

    if (option === actualCorrectAnswer) {
      await animateStayInLane();
      handleFeedback(option);
    } else if (option === "Follow other drivers and cross the lines since everyone is doing it") {
      await animateSuddenOvertake();
      handleFeedback(option);
    } else if (option === "Cross only if no traffic enforcers are visible") {
      await animateCarefulOvertake();
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
      handleFeedback(option);
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setNpcCar1Frame(0);
    setNpcCar2Frame(0);
    setNpcCar3Frame(0);
    setNpcCar4Frame(0);

    const centerX = width / 2 - playerCarWidth / 2;
    playerCarXAnim.setValue(centerX);
    playerCarYOffset.setValue(0); // Reset Y offset
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);
    setIsNpcCar1Visible(true);
    setIsNpcCar2Visible(true);
    setIsNpcCar3Visible(true);
    setIsNpcCar4Visible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      const currentFileScenario = 8;

      if (currentFileScenario >= 10) {
        try {
          const sessionResults = await completeSession();
          if (sessionResults) {
            router.push({
              pathname: '/result',
              params: {
                ...sessionResults,
                userAttempts: JSON.stringify(sessionResults.attempts),
                scenarioProgress: JSON.stringify(sessionResults.scenarioProgress)
              }
            });
          }
        } catch (error) {
          console.error('Error completing session:', error);
          Alert.alert('Error', 'Failed to save session results');
        }
      } else {
        moveToNextScenario();

        const nextScenarioNumber = currentFileScenario + 1;
        const nextScreen = `S${nextScenarioNumber}P1`;
        router.push(`/scenarios/road-markings/phase1/${nextScreen}`);

      }

      setShowQuestion(false);
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
      if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();
    }
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! You must follow traffic rules regardless of others' behavior or your personal circumstances."
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

      {/* Jeepney */}
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

      {/* Player Car */}
      {isPlayerCarVisible && (
        <Animated.Image
          source={playerCarSprites[playerCarDirection][playerCarFrame]}
          style={{
            width: playerCarWidth,
            height: playerCarHeight,
            position: "absolute",
            bottom: Animated.add(height * 0.1, playerCarYOffset),
            left: playerCarXAnim,
            zIndex: 5,
          }}
        />
      )}

      {/* NPC Car 1 - Northbound */}
      {isNpcCar1Visible && (
        <Animated.Image
          source={npcCar1.NORTH[npcCar1Frame]}
          style={{
            width: npcCarWidth,
            height: npcCarHeight,
            position: "absolute",
            left: npcCar1InitialX,
            transform: [{
              translateY: Animated.add(scrollY, npcCar1Offset)
            }],
            zIndex: 3,
          }}
        />
      )}

      {/* NPC Car 2 - Northbound */}
      {isNpcCar2Visible && (
        <Animated.Image
          source={npcCar2.NORTH[npcCar2Frame]}
          style={{
            width: npcCarWidth,
            height: npcCarHeight,
            position: "absolute",
            left: npcCar2InitialX,
            transform: [{
              translateY: Animated.add(scrollY, npcCar2Offset)
            }],
            zIndex: 3,
          }}
        />
      )}

      {/* NPC Car 3 - Southbound */}
      {isNpcCar3Visible && (
        <Animated.Image
          source={npcCar3.SOUTH[npcCar3Frame]}
          style={{
            width: npcCarWidth,
            height: npcCarHeight,
            position: "absolute",
            left: npcCar3InitialX,
            transform: [{
              translateY: Animated.subtract(npcCar3Offset, Animated.multiply(scrollY, 0.5))
            }],
            zIndex: 5,
          }}
        />
      )}

      {/* NPC Car 4 - Southbound */}
      {isNpcCar4Visible && (
        <Animated.Image
          source={npcCar4.SOUTH[npcCar4Frame]}
          style={{
            width: npcCarWidth,
            height: npcCarHeight,
            position: "absolute",
            left: npcCar4InitialX,
            transform: [{
              translateY: Animated.subtract(npcCar4Offset, Animated.multiply(scrollY, 0.5))
            }],
            zIndex: 3,
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

  {/* Feedback */}
  {(animationType === "correct" || animationType === "wrong") && (
    <Animated.View style={styles.feedbackOverlay}>
      <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
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
loadingContainer: {
flex: 1,
backgroundColor: "black",
justifyContent: "center",
alignItems: "center",
},
loadingText: {
color: "white",
fontSize: 18,
marginTop: 20,
},
introContainer: {
flex: 1,
backgroundColor: "black",
justifyContent: "center",
alignItems: "center",
padding: width * 0.05,
},
introLTOImage: {
width: width * 0.6,
height: height * 0.25,
resizeMode: "contain",
marginBottom: height * 0.03,
},
introTextBox: {
backgroundColor: "rgba(8, 8, 8, 0.7)",
padding: width * 0.06,
borderRadius: 15,
alignItems: "center",
maxWidth: width * 0.85,
minHeight: height * 0.3,
justifyContent: "center",
},
introTitle: {
color: "white",
fontSize: Math.min(width * 0.07, 32),
fontWeight: "bold",
textAlign: "center",
marginBottom: height * 0.02,
},
introText: {
color: "white",
fontSize: Math.min(width * 0.045, 20),
textAlign: "center",
marginBottom: height * 0.04,
lineHeight: Math.min(width * 0.06, 26),
paddingHorizontal: width * 0.02,
},
startButton: {
backgroundColor: "#007bff",
paddingVertical: height * 0.02,
paddingHorizontal: width * 0.08,
borderRadius: 10,
shadowColor: "#000",
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.3,
shadowRadius: 5,
elevation: 8,
minWidth: width * 0.4,
alignItems: "center",
},
startButtonText: {
color: "white",
fontSize: Math.min(width * 0.055, 24),
fontWeight: "bold",
},
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
fontSize: Math.min(width * 0.045, 24),
fontWeight: "bold",
textAlign: "center",
},
answersContainer: {
position: "absolute",
top: height * 0.15,
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