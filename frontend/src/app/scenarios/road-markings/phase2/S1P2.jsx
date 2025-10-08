// frontend/src/app/scenarios/road-markings/phase2/S1P2.jsx -- MERGED VERSION
import { useSession, SessionProvider } from '../../../../contexts/SessionManager';
import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { router } from 'expo-router';

const { width, height } = Dimensions.get("window");

// Responsive calculations - FIXED VARIABLE NAMES
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const jeepWidth = Math.min(width * 0.28, 300);
const jeepHeight = jeepWidth * (350/280);
const npcCarWidth = Math.min(width * 0.24, 260);
const npcCarHeight = npcCarWidth * (350/280);
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
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

// Separated sprites for clarity and easier management
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
    require("../../../../../assets/car/CIVIC TOPDOWN/Black/MOVE/SOUTH/SEPARATED/Black_CIVIC_CLEAN_SOUTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Black/MOVE/SOUTH/SEPARATED/Black_CIVIC_CLEAN_SOUTH_001.png"),
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

function DrivingGameContent() {
  // Session Management
  const {
    updateScenarioProgress,
    moveToNextScenario,
    completeSession,
    currentScenario: sessionCurrentScenario,
    sessionData
  } = useSession();

  const currentScenario = 1;

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const scenarioId = 10 + currentScenario;
      console.log('🔍 SCENARIO DEBUG:', {
        currentScenario,
        calculatedScenarioId: scenarioId,
        selectedOption,
        isCorrect
      });

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
  const [showCollision, setShowCollision] = useState(false);

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

  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;

  const jeepneyLane = 1;
  const jeepneyInitialX = jeepneyLane * tileSize + (tileSize / 2 - jeepWidth / 2);
  const jeepneyYAnim = useRef(new Animated.Value(-jeepHeight)).current;

  const npcCarXAnim = useRef(new Animated.Value(2 * tileSize + (tileSize / 2 - npcCarWidth / 2))).current;
  const npcCarYAnim = useRef(new Animated.Value(-height)).current;

  // FIXED: Reduced traffic cars to 3 to prevent overlap
  const trafficCars = useRef([
    {
      id: 'traffic1',
      type: 'RED_SEDAN',
      lane: 0,
      yAnim: new Animated.Value(height * 0.2),
      frame: 0,
    },
    {
      id: 'traffic2',
      type: 'BLACK_CIVIC',
      lane: 2,
      yAnim: new Animated.Value(height * 0.5),
      frame: 0,
    },
    {
      id: 'traffic3',
      type: 'TAXI',
      lane: 0,
      yAnim: new Animated.Value(height * 0.8),
      frame: 0,
    },
  ]).current;

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

  // Animation for NPC car's sprite
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
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
          jeepneyAnimationRef.current.stop();
      }
    };
  }, [showIntro]);

  const handleFeedback = (answerGiven) => {
    console.log('📝 handleFeedback called with:', answerGiven);

    const currentQuestion = questions[questionIndex];
    if (answerGiven === currentQuestion.correct) {
      console.log('✅ Correct answer path');
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
      console.log('❌ Wrong answer path');
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

  // FIXED: Collision animation - proper positioning to lane 2
  const animateCollision = async () => {
    console.log('💥 animateCollision: Starting');
    return new Promise(async (resolve) => {
      try {
        if (scrollAnimationRef.current) {
          scrollAnimationRef.current.stop();
          console.log('💥 Scroll animation stopped');
        }

        setIsNpcCarVisible(true);
        npcCarYAnim.setValue(-height * 0.3);
        console.log('💥 NPC car visible and positioned');

        const npcMovement = Animated.timing(npcCarYAnim, {
          toValue: height * 0.6,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        });
        npcMovement.start();
        console.log('💥 NPC movement started');

        console.log('💥 Starting player move to collision point');
        await new Promise(res => {
            setPlayerCarDirection("EAST");
            Animated.parallel([
                Animated.timing(carXAnim, {
                    toValue: 2 * tileSize + (tileSize / 2 - carWidth / 2),
                    duration: 800,
                    easing: Easing.easeOut,
                    useNativeDriver: false,
                }),
                Animated.timing(scrollY, {
                    toValue: scrollY._value - (tileSize * 1),
                    duration: 800,
                    easing: Easing.easeOut,
                    useNativeDriver: true,
                })
            ]).start(res);
        });
        console.log('💥 Player moved to collision point');

        setShowCollision(true);
        setPlayerCarDirection("NORTH");
        console.log('💥 Showing collision effect');

        const shakePlayer = Animated.sequence([
          Animated.timing(carXAnim, { toValue: carXAnim._value + 20, duration: 50, useNativeDriver: false }),
          Animated.timing(carXAnim, { toValue: carXAnim._value - 40, duration: 50, useNativeDriver: false }),
          Animated.timing(carXAnim, { toValue: carXAnim._value + 40, duration: 50, useNativeDriver: false }),
          Animated.timing(carXAnim, { toValue: carXAnim._value - 20, duration: 50, useNativeDriver: false }),
        ]);

        const shakeNpc = Animated.sequence([
          Animated.timing(npcCarXAnim, { toValue: npcCarXAnim._value - 20, duration: 50, useNativeDriver: false }),
          Animated.timing(npcCarXAnim, { toValue: npcCarXAnim._value + 40, duration: 50, useNativeDriver: false }),
          Animated.timing(npcCarXAnim, { toValue: npcCarXAnim._value - 40, duration: 50, useNativeDriver: false }),
          Animated.timing(npcCarXAnim, { toValue: npcCarXAnim._value + 20, duration: 50, useNativeDriver: false }),
        ]);

        npcMovement.stop();
        console.log('💥 Starting shake animations');

        await Promise.all([
          new Promise(res => shakePlayer.start(res)),
          new Promise(res => shakeNpc.start(res))
        ]);
        console.log('💥 Shake animations complete');

        console.log('💥 Waiting 800ms');
        await new Promise(res => setTimeout(res, 800));
        console.log('💥 Wait complete');

        setShowCollision(false);
        setIsNpcCarVisible(false);
        console.log('💥 Collision hidden');

        const centerX = width / 2 - carWidth / 2;
        carXAnim.setValue(centerX);
        npcCarXAnim.setValue(2 * tileSize + (tileSize / 2 - npcCarWidth / 2));
        console.log('💥 Cars reset to position');

        await new Promise(res => setTimeout(res, 200));
        console.log('💥 Final delay complete, resolving');

        resolve();
      } catch (error) {
        console.error('💥 ERROR in animateCollision:', error);
        resolve();
      }
    });
  };

  // FIXED: Safe overtake animation
  const animateSafeOvertake = async () => {
    return new Promise(async (resolve) => {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

      setPlayerCarDirection("NORTH");
      await new Promise(res => setTimeout(res, 1500));

      await new Promise(res => {
          setPlayerCarDirection("EAST");
          Animated.parallel([
              Animated.timing(carXAnim, {
                  toValue: 2 * tileSize + (tileSize / 2 - carWidth / 2),
                  duration: 1200,
                  easing: Easing.easeOut,
                  useNativeDriver: false,
              }),
              Animated.timing(scrollY, {
                  toValue: scrollY._value - (tileSize * 1),
                  duration: 1200,
                  easing: Easing.easeOut,
                  useNativeDriver: true,
              })
          ]).start(res);
      });

      await new Promise(res => {
          setPlayerCarDirection("NORTH");
          Animated.parallel([
              Animated.timing(jeepneyYAnim, {
                  toValue: height + jeepHeight,
                  duration: 1500,
                  easing: Easing.linear,
                  useNativeDriver: true,
              }),
              Animated.timing(scrollY, {
                  toValue: scrollY._value - (tileSize * 2),
                  duration: 1500,
                  easing: Easing.easeOut,
                  useNativeDriver: true,
              })
          ]).start(res);
      });

      setIsJeepneyVisible(false);

      await new Promise(res => {
          setPlayerCarDirection("WEST");
          Animated.parallel([
              Animated.timing(carXAnim, {
                  toValue: width / 2 - carWidth / 2,
                  duration: 1000,
                  easing: Easing.easeOut,
                  useNativeDriver: false,
              }),
              Animated.timing(scrollY, {
                  toValue: scrollY._value - (tileSize * 0.5),
                  duration: 1000,
                  easing: Easing.easeOut,
                  useNativeDriver: true,
              })
          ]).start(res);
      });

      setPlayerCarDirection("NORTH");

      if (scrollAnimationRef.current) scrollAnimationRef.current.start();
      setIsPlayerCarVisible(true);
      resolve();
    });
  };

  const animateTrafficJam = async () => {
    try {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

      setShowTrafficJam(true);

      trafficCars.forEach((car, index) => {
        const xPos = car.lane * tileSize + (tileSize / 2 - npcCarWidth / 2);
        car.yAnim.setValue(height * (0.2 + index * 0.3));
      });

      const crawlAnimations = trafficCars.map(car =>
        Animated.timing(car.yAnim, {
          toValue: car.yAnim._value + 50,
          duration: 5000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      crawlAnimations.forEach(anim => anim.start());

      await new Promise(resolve => setTimeout(resolve, 2000));

      setShowHonking(true);

      const honkingSequence = async () => {
        for (let i = 0; i < 5; i++) {
          const playerShake = Animated.sequence([
            Animated.timing(carXAnim, { toValue: carXAnim._value + 10, duration: 100, useNativeDriver: false }),
            Animated.timing(carXAnim, { toValue: carXAnim._value - 10, duration: 100, useNativeDriver: false }),
          ]);

          await new Promise(resolve => playerShake.start(resolve));

          const trafficShakes = trafficCars.map(car =>
            Animated.sequence([
              Animated.timing(car.yAnim, { toValue: car.yAnim._value + 15, duration: 120, useNativeDriver: true }),
              Animated.timing(car.yAnim, { toValue: car.yAnim._value - 15, duration: 120, useNativeDriver: true }),
            ])
          );

          await Promise.all(trafficShakes.map(shake => new Promise(resolve => shake.start(resolve))));

          await new Promise(resolve => setTimeout(resolve, 800));
        }
      };

      await honkingSequence();

      await new Promise(resolve => setTimeout(resolve, 2000));

      crawlAnimations.forEach(anim => anim.stop());

      setShowHonking(false);
      setShowTrafficJam(false);

      const centerX = width / 2 - carWidth / 2;
      carXAnim.setValue(centerX);
    } catch (error) {
      console.error('Error in animateTrafficJam:', error);
      setShowHonking(false);
      setShowTrafficJam(false);
    }
  };

  // FIXED: handleAnswer function with proper async/await and sequencing
  const handleAnswer = async (answer) => {
    console.log('🎯 handleAnswer START:', answer);
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    await updateProgress(answer, isCorrect);
    console.log('✅ Progress updated');

    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.stop();
    }

    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

    console.log('🎬 About to start animation for answer:', answer);

    try {
      if (answer === questions[questionIndex].correct) {
        console.log('🟢 Starting safe overtake animation');
        await animateSafeOvertake();
        console.log('🟢 Safe overtake complete');
      } else if (answer === "Overtake immediately since you have a broken white line on your side") {
        console.log('🔴 Starting collision animation');
        await animateCollision();
        console.log('🔴 Collision complete');
      } else if (answer === "Don't overtake since there's a yellow line present") {
        console.log('🟡 Starting traffic jam animation');
        await animateTrafficJam();
        console.log('🟡 Traffic jam complete');
      }

      console.log('🎬 Animation complete, calling handleFeedback');
      handleFeedback(answer);
      console.log('📝 handleFeedback called');
    } catch (error) {
      console.error('❌ Error in animation:', error);
    }
  };

  // FIXED: handleNext function with proper navigation
  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

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
          console.log('🔍 NAVIGATION: About to call moveToNextScenario');
          console.log('🔍 NAVIGATION: currentScenario before:', currentScenario);

          moveToNextScenario();

          console.log('🔍 NAVIGATION: currentScenario after:', currentScenario);

          const nextScreen = `S${currentScenario + 1}P2`;
          console.log('🔍 NAVIGATION: nextScreen:', nextScreen);

          router.push(`/scenarios/road-markings/phase2/${nextScreen}`);
    }

    setShowQuestion(false);
    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.stop();
    }
    if (jeepneyAnimationRef.current) {
        jeepneyAnimationRef.current.stop();
    }
  };

  const handleStartGame = () => {
    setShowIntro(false);
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! When you're on the side with the broken white line, you CAN overtake after checking for oncoming traffic and ensuring it's safe to do so."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  if (showIntro) {
    return (
      <View style={styles.introContainer}>
        <Image
          source={require("../../../../../assets/dialog/LTO.png")}
          style={styles.introLTOImage}
        />
        <View style={styles.introTextBox}>
          <Text style={styles.introTitle}>Welcome to ROADCHECK!</Text>
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

      {/* NPC Car (Black car for collision) */}
      {isNpcCarVisible && (
        <Animated.Image
          source={npcCarSprites.SOUTH[npcCarFrame]}
          style={{
            width: npcCarWidth,
            height: npcCarHeight,
            position: "absolute",
            left: 0,
            transform: [
              { translateX: npcCarXAnim },
              { translateY: npcCarYAnim }
            ],
            zIndex: 3,
          }}
        />
      )}

      {/* Traffic Cars (for road rage scenario) - FIXED: Only 3 cars to prevent overlap */}
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

      {/* Honking Effect */}
      {showHonking && (
        <View style={{
          position: "absolute",
          width: width,
          height: height,
          zIndex: 9,
          pointerEvents: "none",
        }}>
          {/* Honking indicators around cars */}
          <View style={{
            position: "absolute",
            left: carXAnim._value - 30,
            bottom: height * 0.05,
            width: 60,
            height: 30,
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Text style={{
              color: "yellow",
              fontSize: 20,
              fontWeight: "bold",
              textShadowColor: "black",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 3,
            }}>
              HONK!
            </Text>
          </View>

          {/* Multiple honking sounds from other cars */}
          <View style={{
            position: "absolute",
            left: width * 0.1,
            top: height * 0.3,
            width: 60,
            height: 30,
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Text style={{
              color: "orange",
              fontSize: 16,
              fontWeight: "bold",
              textShadowColor: "black",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 3,
            }}>
              BEEP!
            </Text>
          </View>

          <View style={{
            position: "absolute",
            right: width * 0.1,
            top: height * 0.5,
            width: 60,
            height: 30,
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Text style={{
              color: "red",
              fontSize: 18,
              fontWeight: "bold",
              textShadowColor: "black",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 3,
            }}>
              HONK!
            </Text>
          </View>

          {/* Central message about road rage */}
          <View style={{
            position: "absolute",
            top: height * 0.15,
            left: width * 0.1,
            right: width * 0.1,
            backgroundColor: "rgba(255, 100, 100, 0.8)",
            padding: 15,
            borderRadius: 10,
            alignItems: "center",
          }}>
            <Text style={{
              color: "white",
              fontSize: 16,
              fontWeight: "bold",
              textAlign: "center",
            }}>
              Traffic is NOT moving faster!
            </Text>
            <Text style={{
              color: "white",
              fontSize: 14,
              textAlign: "center",
              marginTop: 5,
            }}>
              Honking causes road rage!
            </Text>
          </View>
        </View>
      )}

      {/* Collision Effect */}
      {showCollision && (
        <View style={{
          position: "absolute",
          width: width,
          height: height,
          backgroundColor: "rgba(255, 0, 0, 0.3)", // Red flash for collision
          zIndex: 8,
          justifyContent: "center",
          alignItems: "center",
        }}>
          <Text style={{
            color: "white",
            fontSize: 40,
            fontWeight: "bold",
            textShadowColor: "black",
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 5,
          }}>
            CRASH!
          </Text>
        </View>
      )}

      {/* Responsive Player Car */}
      {isPlayerCarVisible && (
        <Animated.Image
          source={playerCarSprites[playerCarDirection][playerCarFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: height * 0.1,
            transform: [{ translateX: carXAnim }],
            zIndex: 5,
          }}
        />
      )}

      {/* Responsive Question Overlay - FIXED: Larger text for scenario description */}
      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image
            source={require("../../../../../assets/dialog/Dialog.png")}
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

      {/* Responsive Answers - FIXED: Larger text for choice options */}
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
          <Image source={require("../../../../../assets/dialog/Dialog w answer.png")} style={styles.ltoImage} />
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

export default function DrivingGame() {
  return (
    <SessionProvider
      categoryId={1}
      phaseId={2}
      categoryName="Road Markings"
    >
      <DrivingGameContent />
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  // Intro styles (responsive)
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

  // In-game responsive styles - FIXED: Larger text sizes
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
  // FIXED: Increased font size for scenario description (was 18, now 22)
  questionText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 22), // Increased from 18 to 22
    fontWeight: "bold",
    textAlign: "center",
    flexWrap: "wrap",
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
  // FIXED: Increased font size for choice options (was 11, now 18)
  answerText: {
    color: "white",
    fontSize: Math.min(width * 0.04, 18), // Increased from 11 to 18
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