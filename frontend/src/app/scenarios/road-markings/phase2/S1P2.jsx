// frontend\src\app\scenarios\road-markings\phase2\S1P2.jsx
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
const npcCarWidth = Math.min(width * 0.24, 260);
const npcCarHeight = npcCarWidth * (350/280);
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.25, 200);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Road tiles
const roadTiles = {
  road2: require("../../../../../assets/road/road2.png"),
  road3: require("../../../../../assets/road/road3.png"),
  road5: require("../../../../../assets/road/road5.png"),
};

// Map layout
const mapLayout = [
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
];

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
    require("../../../../../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
  ],
};

const npcCarSprites = {
  SOUTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Black/MOVE/NORTH/SEPARATED/Black_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Black/MOVE/NORTH/SEPARATED/Black_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

const trafficCarSprites = {
  RED_SEDAN: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_001.png"),
  ],
  TAXI: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_CIVIC_CLEAN_NORTH_001.png"),
  ],
  BLACK_CIVIC: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Black/MOVE/NORTH/SEPARATED/Black_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Black/MOVE/NORTH/SEPARATED/Black_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

const questions = [
  {
    question: "You're driving on NLEX and encounter a single yellow line with broken white line combination. You're on the side with the broken white line and want to overtake a truck blocking your view ahead.",
    options: ["Overtake immediately since you have a broken white line on your side", "Check for oncoming traffic first, then overtake safely when clear", "Don't overtake since there's a yellow line present"],
    correct: "Check for oncoming traffic first, then overtake safely when clear",
    wrongExplanation: {
      "Overtake immediately since you have a broken white line on your side": "Violation! Reckless overtaking without checking for oncoming traffic can result in serious accidents!",
      "Don't overtake since there's a yellow line present": "Road rage prone! In a situation where the area is experiencing traffic, honking a lot can only make other drivers mad and wouldn't make the cars move faster."
    }
  },
];

export default function DrivingGame() {
  const {
    updateScenarioProgress,
    moveToNextScenario,
    completeSession,
    currentScenario:
    sessionData
  } = useSession();

  const currentScenario = 1;

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

  const [showIntro, setShowIntro] = useState(true);
  const [isPlayerCarVisible, setIsPlayerCarVisible] = useState(true);
  const [isJeepneyVisible, setIsJeepneyVisible] = useState(true);
  const [isNpcCarVisible, setIsNpcCarVisible] = useState(false);
  const [showTrafficJam, setShowTrafficJam] = useState(false);
  const [showHonking, setShowHonking] = useState(false);

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
  const [npcCarFrame, setNpcCarFrame] = useState(0);

  // Lane calculations
  const lane0X = 0 * tileSize + (tileSize / 2 - carWidth / 2);
  const lane1X = 1 * tileSize + (tileSize / 2 - carWidth / 2);
  const lane2X = 2 * tileSize + (tileSize / 2 - carWidth / 2);

  const carXAnim = useRef(new Animated.Value(0)).current;
  const jeepneyLane = 1;
  const jeepneyInitialX = jeepneyLane * tileSize + (tileSize / 2 - jeepWidth / 2);
  const jeepneyYAnim = useRef(new Animated.Value(-jeepHeight)).current;
  const npcCarXAnim = useRef(new Animated.Value(2 * tileSize + (tileSize / 2 - npcCarWidth / 2))).current;
  const npcCarYAnim = useRef(new Animated.Value(-height)).current;

const trafficCars = useRef([
    { id: 'traffic1', type: 'RED_SEDAN', lane: 0, yAnim: new Animated.Value(height * 0.3), frame: 0 },
    { id: 'traffic3', type: 'BLACK_CIVIC', lane: 2, yAnim: new Animated.Value(height * 0.1), frame: 0 },
    { id: 'traffic5', type: 'TAXI', lane: 2, yAnim: new Animated.Value(height * 4), frame: 0 },
    { id: 'traffic4', type: 'RED_SEDAN', lane: 0, yAnim: new Animated.Value(height * 0.6), frame: 0 },
  ]).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showQuestion && isPlayerCarVisible) {
      const interval = setInterval(() => {
        setPlayerCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isPlayerCarVisible]);

  useEffect(() => {
    if (!showQuestion && isJeepneyVisible) {
      const interval = setInterval(() => {
        setJeepneyFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 250);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isJeepneyVisible]);

  useEffect(() => {
    if (!showQuestion && isNpcCarVisible) {
      const interval = setInterval(() => {
        setNpcCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isNpcCarVisible]);

  const scrollAnimationRef = useRef(null);
  const jeepneyAnimationRef = useRef(null);

  function startScrollAnimation() {
    scrollY.setValue(0);
    jeepneyYAnim.setValue(-jeepHeight);
    npcCarYAnim.setValue(-height);
    setIsNpcCarVisible(false);

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
        setPlayerCarFrame(0);
        setJeepneyFrame(0);
        setShowQuestion(true);
        setTimeout(() => {
          setShowAnswers(true);
        }, 1000);
      }, 2000);
    });
  }

  useEffect(() => {
    if (!showIntro) {
      startScrollAnimation();
    }
    return () => {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
      if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();
    };
  }, [showIntro]);

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

  const animateCollision = async () => {
    return new Promise(async (resolve) => {
      try {
        console.log('Collision animation started');

        if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

        setIsNpcCarVisible(true);
        npcCarYAnim.setValue(-height * 0.3);

        const npcMovement = Animated.timing(npcCarYAnim, {
          toValue: height * 0.3,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        });
        npcMovement.start();

        await new Promise(res => {
          setPlayerCarDirection("NORTHEAST");
          Animated.parallel([
            Animated.timing(carXAnim, {
              toValue: tileSize + (tileSize / 2 - carWidth / 2),
              duration: 800,
              easing: Easing.easeOut,
              useNativeDriver: true,
            }),
            Animated.timing(scrollY, {
              toValue: scrollY._value - (tileSize * 1),
              duration: 1000,
              easing: Easing.easeOut,
              useNativeDriver: true,
            })
          ]).start(res);
        });

        setPlayerCarDirection("NORTH");

        const shakePlayer = Animated.sequence([
          Animated.timing(carXAnim, { toValue: carXAnim._value + 20, duration: 50, useNativeDriver: true }),
          Animated.timing(carXAnim, { toValue: carXAnim._value - 40, duration: 50, useNativeDriver: true }),
          Animated.timing(carXAnim, { toValue: carXAnim._value + 40, duration: 50, useNativeDriver: true }),
          Animated.timing(carXAnim, { toValue: carXAnim._value - 20, duration: 50, useNativeDriver: true }),
        ]);

        const shakeNpc = Animated.sequence([
          Animated.timing(npcCarXAnim, { toValue: npcCarXAnim._value - 20, duration: 50, useNativeDriver: true }),
          Animated.timing(npcCarXAnim, { toValue: npcCarXAnim._value + 40, duration: 50, useNativeDriver: true }),
          Animated.timing(npcCarXAnim, { toValue: npcCarXAnim._value - 40, duration: 50, useNativeDriver: true }),
          Animated.timing(npcCarXAnim, { toValue: npcCarXAnim._value + 20, duration: 50, useNativeDriver: true }),
        ]);

        npcMovement.stop();
        await Promise.all([
          new Promise(res => shakePlayer.start(res)),
          new Promise(res => shakeNpc.start(res))
        ]);

        await new Promise(res => setTimeout(res, 500));

        // Keep NPC car visible after collision
        // setIsNpcCarVisible(false); // REMOVED - car stays visible

        const centerX = width / 2 - carWidth / 2;
        carXAnim.setValue(centerX);
        // npcCarXAnim.setValue(2 * tileSize + (tileSize / 2 - npcCarWidth / 2)); // REMOVED - car stays in place

        console.log('Collision animation completed');
        resolve();
      } catch (error) {
        console.error('Error in animateCollision:', error);
        resolve();
      }
    });
  };

const animateSafeOvertake = async () => {
  return new Promise(async (resolve) => {
    try {
      console.log('Safe overtake animation started');
      
      // Stop the scroll animation before overtaking
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      
      // Stop the initial jeepney animation to take control
      if (jeepneyAnimationRef.current) {
        jeepneyAnimationRef.current.stop();
      }

      setPlayerCarDirection("NORTH");
      
      // New: Animate both cars moving forward for 7 seconds
      await new Promise(res => {
        Animated.parallel([
          Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * .7),  // Move forward by 7 tiles
            duration: 800,  // 7 seconds
            easing: Easing.linear,  // Smooth, constant speed
            useNativeDriver: true,
          }),
          Animated.timing(jeepneyYAnim, {
            toValue: jeepneyYAnim._value + (tileSize * 0.1),  // Jeepney moves slightly slower relative to player
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ]).start(res);
      });
      
      // Shorter pause to avoid feeling stuck
      await new Promise(res => setTimeout(res, 500));

      // Move to right lane
      await new Promise(res => {
        setPlayerCarDirection("NORTHEAST");
        Animated.timing(carXAnim, {
          toValue: tileSize + (tileSize / 2 - carWidth / 2),
          duration: 800,
          easing: Easing.easeInOut,
          useNativeDriver: false,
        }).start(res);
      });

      // Continue forward in right lane, passing the jeepney
      await new Promise(res => {
        setPlayerCarDirection("NORTH");
        Animated.timing(jeepneyYAnim, {
          toValue: height + jeepHeight,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(res);
      });

      setIsJeepneyVisible(false);

      // Return to left lane
      await new Promise(res => {
        setPlayerCarDirection("NORTHWEST");
        Animated.timing(carXAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.easeInOut,
          useNativeDriver: false,
        }).start(res);
      });

      setPlayerCarDirection("NORTH");
      setIsPlayerCarVisible(true);

      await new Promise(res => setTimeout(res, 500));

      console.log('Safe overtake animation completed');
      resolve();
    } catch (error) {
      console.error('Error in animateSafeOvertake:', error);
      resolve();
    }
  });
};
const animateTrafficJam = async () => {
    return new Promise(async (resolve) => {
      try {
        // DON'T stop scroll - keep road moving during traffic jam
        // if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

        setShowTrafficJam(true);

        trafficCars.forEach((car, index) => {
          car.yAnim.setValue(height * (0.1 + index * 0.30));
        });

        // Slow continuous crawl for traffic cars
        const crawlAnimations = trafficCars.map(car =>
          Animated.loop(
            Animated.timing(car.yAnim, {
              toValue: car.yAnim._value - 400,
              duration: 10000,
              easing: Easing.linear,
              useNativeDriver: true,
            })
          )
        );

        crawlAnimations.forEach(anim => anim.start());

        await new Promise(res => setTimeout(res, 2000));

        setShowHonking(true);

        // Show honking for a period
        await new Promise(res => setTimeout(res, 5000));

        // Stop all animations before finishing
        crawlAnimations.forEach(anim => anim.stop());
        
        setShowHonking(false);
        setShowTrafficJam(false);

        const currentX = carXAnim._value;
        carXAnim.setValue(currentX);

        resolve();
      } catch (error) {
        console.error('Error in animateTrafficJam:', error);
        setShowHonking(false);
        setShowTrafficJam(false);
        resolve();
      }
    });
  };

  const handleAnswer = async (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    await updateProgress(answer, isCorrect);

    // Only stop scroll for collision (option A), not for B and C
    if (answer === "Overtake immediately since you have a broken white line on your side") {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    }

    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

    if (answer === questions[questionIndex].correct) {
      console.log('Starting safe overtake animation');
      await animateSafeOvertake();
    } else if (answer === "Overtake immediately since you have a broken white line on your side") {
      console.log('Starting collision animation');
      await animateCollision();
      console.log('Collision animation completed');
    } else if (answer === "Don't overtake since there's a yellow line present") {
      console.log('Starting traffic jam animation');
      await animateTrafficJam();
    }

    console.log('Calling handleFeedback with:', answer);
    handleFeedback(answer);
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setIsCorrectAnswer(null);

    // Reset car position and visibility
    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

    if (questionIndex < questions.length - 1) {
      // Next question in current scenario
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario === 10) {
      // Last scenario - complete session
      try {
        console.log('🔍 Completing session for scenario 10...');
        const sessionResults = await completeSession();

        if (!sessionResults) {
          Alert.alert('Error', 'Failed to complete session.');
          return;
        }

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
      // Move to next scenario (S1P2 → S2P2 → ... → S10P2)
      moveToNextScenario();
      const nextScreen = `S${currentScenario + 1}P2`;
      router.push(`/scenarios/road-markings/phase2/${nextScreen}`);
    
    }

    // Cleanup
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();
  };

  const handleStartGame = () => {
    setShowIntro(false);
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! When you're on the side with the broken white line, you CAN overtake after checking for oncoming traffic and ensuring it's safe to do so."
    : (selectedAnswer && currentQuestionData.wrongExplanation[selectedAnswer]) || "Wrong answer!";

  if (showIntro) {
    return (
      <View style={styles.introContainer}>
        <Image
          source={require("../../../../../assets/dialog/LTO.png")}
          style={styles.introLTOImage}
        />
        <View style={styles.introTextBox}>
          <Text style={styles.introTitle}>Road Markings</Text>
          <Text style={styles.introText}>
            Test your knowledge of road rules and signs.
            Choose the correct option to proceed safely.
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black", overflow: 'hidden' }}>
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

      {isNpcCarVisible && (
        <Animated.Image
          source={npcCarSprites.SOUTH[npcCarFrame]}
          style={{
            width: npcCarWidth,
            height: npcCarHeight,
            position: "absolute",
            transform: [
              { translateX: npcCarXAnim },
              { translateY: npcCarYAnim }
            ],
            zIndex: 3,
          }}
        />
      )}

      {showTrafficJam && trafficCars.map(car => {
        const xPos = car.lane * tileSize + (tileSize / 2 - npcCarWidth / 2);
        const spriteSource = trafficCarSprites[car.type][car.frame];
        return (
          <Animated.Image
            key={car.id}
            source={spriteSource}
            style={{
              width: npcCarWidth,
              height: npcCarHeight,
              position: "absolute",
              left: xPos,
              transform: [{ translateY: car.yAnim }],
              zIndex: 3,
            }}
          />
        );
      })}

      {showHonking && (        <View style={{ position: "absolute", width: width, height: height, zIndex: 9, pointerEvents: "none" }}>
          <View style={{ position: "absolute", left: carXAnim._value - 30, bottom: height * 0.05, width: 60, height: 30, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "yellow", fontSize: 20, fontWeight: "bold", textShadowColor: "black", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }}></Text>
          </View>
          <View style={{ position: "absolute", left: width * 0.1, top: height * 0.3, width: 60, height: 30, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "orange", fontSize: 16, fontWeight: "bold", textShadowColor: "black", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }}></Text>
          </View>
          <View style={{ position: "absolute", right: width * 0.1, top: height * 0.5, width: 60, height: 30, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "red", fontSize: 18, fontWeight: "bold", textShadowColor: "black", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }}></Text>
          </View>
          <View style={{ position: "absolute", top: height * 0.15, left: width * 0.1, right: width * 0.1, backgroundColor: "rgba(255, 100, 100, 0.8)", padding: 15, borderRadius: 10, alignItems: "center" }}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "bold", textAlign: "center" }}>Traffic is not moving faster!</Text>
            <Text style={{ color: "white", fontSize:14, textAlign: "center", marginTop: 5 }}>Honking causes road rage!</Text>
          </View>
        </View>
      )}

      {isPlayerCarVisible && (
        <View style={{
          position: "absolute",
          bottom: height * 0.05,
          left: lane1X,
          zIndex: 5
        }}>
          <Animated.Image
            source={playerCarSprites[playerCarDirection][playerCarFrame]}
            style={{
              width: carWidth,
              height: carHeight,
              transform: [{ translateX: carXAnim }]
            }}
          />
        </View>
      )}

      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.questionBox}>
            <View style={styles.questionTextContainer}>
              <Text style={styles.questionText}>{questions[questionIndex].question}</Text>
            </View>
          </View>
        </View>
      )}

      {showAnswers && (
        <View style={styles.answersContainer}>
          {questions[questionIndex].options.map((option) => (
            <TouchableOpacity key={option} style={styles.answerButton} onPress={() => handleAnswer(option)}>
              <Text style={styles.answerText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {(animationType === "correct" || animationType === "wrong") && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </Animated.View>
      )}

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
  introSubtitle: {
    color: "#aaa",
    fontSize: Math.min(width * 0.05, 22),
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
    fontSize: Math.min(width * 0.045, 22),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.175,
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