// frontend\src\app\scenarios\road-markings\phase1\S1P1.jsx
import { useSession } from '../../../../contexts/SessionManager';
import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import Tts from 'react-native-tts';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const playerCarWidth = Math.min(width * 0.25, 280); // Renamed for clarity
const playerCarHeight = playerCarWidth * (350/280);
const jeepWidth = Math.min(width * 0.28, 300); // Slightly wider
const jeepHeight = jeepWidth * (350/280); // Maintain aspect ratio
const npcCarWidth = Math.min(width * 0.24, 260); // Define NPC car width
const npcCarHeight = npcCarWidth * (350/280); // Maintain aspect ratio
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
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
  ["road2", "road2", "road5", "road2", "road3"],
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
  // Add other directions if needed for specific overtaking maneuvers
};

const jeepneySprites = {
  NORTH: [
    require("../../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
  ],
};

const npcCarSprites = {
  NORTH: [
    require("../../../../../assets/car/SEDAN TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SEDAN_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/SEDAN TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SEDAN_CLEAN_NORTH_001.png"),
  ],
  SOUTH: [
    require("../../../../../assets/car/TAXI TOPDOWN/MOVE/SOUTH/SEPARATED/TAXI_CLEAN_SOUTH_000.png"),
    require("../../../../../assets/car/TAXI TOPDOWN/MOVE/SOUTH/SEPARATED/TAXI_CLEAN_SOUTH_001.png"),
    // Add more SOUTH-facing cars if you have them, e.g.,
    // require(".././../../..assets/car/TAXI TOPDOWN/MOVE/SOUTH/SEPARATED/TAXI_CLEAN_SOUTH_000.png"),
    // require(".././../../..assets/car/TAXI TOPDOWN/MOVE/SOUTH/SEPARATED/TAXI_CLEAN_SOUTH_001.png"),
  ]
};

const questions = [
  {
    question: "You're driving on a major national highway and encounter a single solid yellow line on your side with a broken line on the opposite side. You want to overtake a slow jeepney.",
    options: [" Don't overtake at all", "Overtake immediately since there's only one solid line", "Wait for a safe opportunity, then overtake if the opposite lane is clear"],
    correct: " Don't overtake at all",
    wrongExplanation: {
      "Overtake immediately since there's only one solid line": "Violation! The solid line on your side means you cannot overtake, regardless of what's on the opposite side.",
      "Wait for a safe opportunity, then overtake if the opposite lane is clear": "Violation! Even if the opposite lane is clear, the solid line on your side prohibits overtaking."
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
    sessionData,
    speakQuestion,        // ADD THIS
    stopSpeaking         // ADD THIS
  } = useSession();

  const currentScenario = 1; 

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const scenarioId = currentScenario; // For Phase 1: S1P1 = scenario 1, S2P1 = scenario 2, etc.
      await updateScenarioProgress(scenarioId, selectedOption, isCorrect);
    } catch (error) {
      console.error('Error updating scenario progress:', error);
    }
  };

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [showIntro, setShowIntro] = useState(true);
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

  useEffect(() => {
    if (showQuestion && questions[questionIndex]) {
      // Auto-play question after 1 second delay (gives time for animation)
      const timer = setTimeout(() => {
        speakQuestion(questions[questionIndex].question);
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        stopSpeaking(); // Stop speaking when question disappears
      };
    }
  }, [showQuestion, questionIndex]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null); // New state to track if the answer was correct
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [playerCarDirection, setPlayerCarDirection] = useState("NORTH"); // Renamed for clarity
  const [playerCarFrame, setPlayerCarFrame] = useState(0);
  const [jeepneyFrame, setJeepneyFrame] = useState(0);
  const [npcCarFrames, setNpcCarFrames] = useState({}); // To manage individual NPC car sprite frames

  const playerCarXAnim = useRef(new Animated.Value(width / 2 - playerCarWidth / 2)).current;

  // Jeepney's X position: middle of the 'road5' tile (index 2)
  const jeepneyInitialX = 2 * tileSize + (tileSize / 2 - jeepWidth / 2);
  // Jeepney's Y position: dynamically set based on scroll and its row
  // Starts off-screen TOP
  const jeepneyYAnim = useRef(new Animated.Value(-jeepHeight)).current;

  // --- NPC Car Animations ---
  const npcCars = useRef([
    {
      id: 'npc1',
      direction: 'SOUTH', // Coming from the top
      lane: 0, // Leftmost lane
      yAnim: new Animated.Value(-npcCarHeight),
      frame: 0,
    },
    {
      id: 'npc2',
      direction: 'NORTH', // Going towards the top
      lane: 4, // Rightmost lane
      yAnim: new Animated.Value(height), // Starts off-screen bottom
      frame: 0,
    },
     {
      id: 'npc3',
      direction: 'SOUTH', // Coming from the top
      lane: 1, // Another lane for SOUTH cars
      yAnim: new Animated.Value(-npcCarHeight * 2), // Staggered start
      frame: 0,
       speed: 3,
    },
    {
      id: 'npc4',
      direction: 'NORTH', // Going towards the top
      lane: 3, // Another lane for NORTH cars
      yAnim: new Animated.Value(height + npcCarHeight), // Staggered start
      frame: 0,
    },
  ]).current;

// Function to start a single NPC car animation (non-looping)
const startNpcCarAnimation = (npcCar, shouldLoop = false) => {
  const { direction, yAnim, speed = 1 } = npcCar; // Add speed with default value 1
  const isNorth = direction === 'NORTH';
  const startValue = isNorth ? height : -npcCarHeight;
  const endValue = isNorth ? -npcCarHeight : height;
  const baseDuration = 7000 + Math.random() * 7000;
  
  // Don't reset position - continue from current position
  const currentValue = yAnim._value;
  
  const animation = Animated.timing(yAnim, {
    toValue: endValue,
    duration: (baseDuration / speed) * Math.abs((endValue - currentValue) / (endValue - startValue)), // Divide by speed
    easing: Easing.linear,
    useNativeDriver: true,
  });

  return shouldLoop ? Animated.loop(animation) : animation;
};

  const npcCarAnimationsRef = useRef([]); // To hold individual NPC car animation loops

  useEffect(() => {
    if (!showIntro) {
      // Start NPC car animations
      npcCarAnimationsRef.current = npcCars.map(car => {
        const animation = startNpcCarAnimation(car);
        animation.start();
        return animation;
      });

      // Sprite animation for NPC cars
      const npcSpriteInterval = setInterval(() => {
        setNpcCarFrames(prevFrames => {
          const newFrames = {};
          npcCars.forEach(car => {
            newFrames[car.id] = (prevFrames[car.id] === 0 ? 1 : 0);
          });
          return newFrames;
        });
      }, 250); // Faster sprite animation for NPC cars

      return () => {
        npcCarAnimationsRef.current.forEach(anim => anim.stop());
        clearInterval(npcSpriteInterval);
      };
    }
  }, [showIntro, npcCars]);
  // --- End NPC Car Animations ---


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

    // Stop all existing NPC car animations before starting new ones for the scenario
    npcCarAnimationsRef.current.forEach(anim => anim.stop());
    // Immediately restart NPC car animations
    npcCarAnimationsRef.current = npcCars.map(car => {
      const animation = startNpcCarAnimation(car);
      animation.start();
      return animation;
    });

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
      toValue: -height * 0.2, // <--- **THIS IS THE KEY CHANGE**
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
        // Stop NPC car animations when the question appears
        npcCarAnimationsRef.current.forEach(anim => anim.stop());


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
      npcCarAnimationsRef.current.forEach(anim => anim.stop()); // Clean up NPC car animations
    };
  }, [showIntro]);

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

// Modified animateOvertake function with speed control
const animateOvertake = async (targetX, speed = 'normal') => {
    // Stop continuous scroll and sprite animations for a moment
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    npcCarAnimationsRef.current.forEach(anim => anim.stop());

    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    // Speed configurations
    const speedConfig = {
        reckless: { lane: 300, main: 1000, return: 400 },  // Fast/immediate
        cautious: { lane: 800, main: 2500, return: 800 }   // Slower/gradual
    };

    const durations = speedConfig[speed] || speedConfig.cautious;

    // 1. Car faces Northwest and moves slightly to the left (initial lane change)
    await new Promise(resolve => {
        setPlayerCarDirection("NORTHWEST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: targetX,
                duration: durations.lane,
                easing: speed === 'reckless' ? Easing.easeOut : Easing.ease,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 0.5),
                duration: durations.lane,
                easing: speed === 'reckless' ? Easing.easeOut : Easing.ease,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // 2. Car faces North and moves further forward (main overtaking acceleration)
    await new Promise(resolve => {
        setPlayerCarDirection("NORTH");
        Animated.parallel([
            Animated.timing(jeepneyYAnim, {
                toValue: height + jeepHeight,
                duration: durations.main,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 3),
                duration: durations.main,
                easing: speed === 'reckless' ? Easing.easeOut : Easing.ease,
                useNativeDriver: true,
            }),
        ]).start(resolve);
    });
    setIsJeepneyVisible(false);

    // 3. Car faces Northeast and moves back towards the right (returning to lane)
    await new Promise(resolve => {
        setPlayerCarDirection("NORTHEAST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: width / 2 - playerCarWidth / 2,
                duration: durations.return,
                easing: speed === 'reckless' ? Easing.easeOut : Easing.ease,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 0.5),
                duration: durations.return,
                easing: speed === 'reckless' ? Easing.easeOut : Easing.ease,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // 4. Car faces North again
    setPlayerCarDirection("NORTH");

    // Restart animations
    if (scrollAnimationRef.current) scrollAnimationRef.current.start();
    npcCarAnimationsRef.current = npcCars.map(car => {
      const animation = startNpcCarAnimation(car);
      animation.start();
      return animation;
    });
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(false);
};
  // Adjust handleAnswer to call animateOvertake without turnDirection parameters
  const handleAnswer = (option) => {
    setSelectedAnswer(option);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = option === currentQuestion.correct;
    updateProgress(option, isCorrect);

    // If scrollAnimationRef.current exists, restart it for continuous movement after answering
    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.start();
    }
    // Restart NPC car animations
    npcCarAnimationsRef.current = npcCars.map(car => {
      const animation = startNpcCarAnimation(car);
      animation.start();
      return animation;
    });

    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);


    if (option === questions[questionIndex].correct) {
      // Correct answer, no overtake action if it's "Don't overtake at all"
      handleFeedback(option); // Call feedback directly
    } else if (option === "Overtake immediately since there's only one solid line") {
        // RECKLESS overtake - fast and immediate
        const targetX = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2);
        animateOvertake(targetX, 'reckless'); // Pass 'reckless' speed
        handleFeedback(option);
    } else if (option === "Wait for a safe opportunity, then overtake if the opposite lane is clear") {
        setTimeout(() => {
            // CAUTIOUS overtake - slower and more gradual (but still wrong!)
            const targetX = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2);
            animateOvertake(targetX, 'cautious'); // Pass 'cautious' speed
            handleFeedback(option);
        }, 3000);
    }
  };

  const handleNext = async () => {
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
    // Get current scenario number from file name
    const currentFileScenario = 1; // For S1P1, this is 1; for S2P1 it would be 2, etc.
    
    if (currentFileScenario >= 10) {
      // Last scenario of phase 1 - complete session and go to results
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
      // Move to next scenario in phase 1
    moveToNextScenario();
      
      const nextScenarioNumber = currentFileScenario + 1;
      const nextScreen = `S${nextScenarioNumber}P1`;
      router.push(`/scenarios/road-markings/phase1/${nextScreen}`);
     

    }

    setShowQuestion(false);
    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.stop();
    }
    if (jeepneyAnimationRef.current) {
      jeepneyAnimationRef.current.stop();
    }
    npcCarAnimationsRef.current.forEach(anim => anim.stop());
  }
};

  const handleStartGame = () => {
    setShowIntro(false);
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Single solid yellow line on your side means you can cross but no overtaking is allowed from your direction."
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

      {/* NPC Cars */}
      {npcCars.map(car => {
        const xPos = car.lane * tileSize + (tileSize / 2 - npcCarWidth / 2);
        const sourceSprites = npcCarSprites[car.direction];
        const currentFrame = npcCarFrames[car.id] || 0; // Default to 0 if not yet set

        // Determine which sprite to use based on direction and frame
        const spriteSource = sourceSprites && sourceSprites[currentFrame] ? sourceSprites[currentFrame] : null;

        if (!spriteSource) return null; // Don't render if no sprite is found

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
              zIndex: 3, // Lower zIndex than player car and jeepney
            }}
          />
        );
      })}

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
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
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
  // ✅ DATABASE INTEGRATION - Added loading styles
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

  // ADDED: Intro styles (responsive)
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
