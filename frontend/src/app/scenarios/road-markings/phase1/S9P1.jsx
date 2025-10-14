import { useSession } from '../../../../contexts/SessionManager';
import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { scale, fontSize, wp, hp } from '../../../../contexts/ResponsiveHelper';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const playerCarWidth = Math.min(width * 0.25, 280);
const playerCarHeight = playerCarWidth * (350/280);
const busWidth = Math.min(width * 0.28, 300);
const busHeight = busWidth * (350/280);
const npcCarWidth = Math.min(width * 0.25, 280);
const npcCarHeight = npcCarWidth * (350/280);
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Road tiles
const roadTiles = {
    road2: require("../../../../../assets/road/road2.png"),
    road17: require("../../../../../assets/road/road17.png"),
    road20: require("../../../../../assets/road/road20.png"),
    road72: require("../../../../../assets/road/road72.png"),
    road74: require("../../../../../assets/road/road74.png"),
};

// Map layout
const mapLayout = [
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
  ["road2", "road74", "road72", "road17", "road20"],
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

const busSprites = {
    NORTH: [
        require("../../../../../assets/car/BUS TOPDOWN/White/MOVE/NORTH/SEPARATED/White_BUS_CLEAN_NORTH_000.png"),
        require("../../../../../assets/car/BUS TOPDOWN/White/MOVE/NORTH/SEPARATED/White_BUS_CLEAN_NORTH_001.png"),
    ]
};

// NPC car sprites - all facing NORTH (same direction as player)
const npcCarSprites = {
  NORTH: [
    require("../../../../../assets/car/SEDAN TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SEDAN_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/SEDAN TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SEDAN_CLEAN_NORTH_001.png"),
  ],
};

const taxiSprites = {
  NORTH: [
    require("../../../../../assets/car/TAXI TOPDOWN/MOVE/NORTH/SEPARATED/TAXI_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/TAXI TOPDOWN/MOVE/NORTH/SEPARATED/TAXI_CLEAN_NORTH_001.png"),
  ],
};

const jeepneySprites = {
  NORTH: [
    require("../../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
  ],
};

const questions = [
  {
    question: "You encounter broken yellow lines in the center of the road. You want to overtake a slow-moving bus.",
    options: ["Overtake without additional precautions since lines are broken", "Don't overtake since yellow lines indicate opposite traffic", "Check for oncoming traffic, signal, and overtake when safe"],
    correct: "Check for oncoming traffic, signal, and overtake when safe",
    wrongExplanation: {
      "Overtake without additional precautions since lines are broken": "Accident prone! When overtaking, always practice defensive driving. Check if the other lane is clear and make proper signals.",
      "Don't overtake since yellow lines indicate opposite traffic": "Wrong! Broken yellow lines specifically allow crossing and overtaking when safe, unlike solid yellow lines."
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

  const currentScenario = 9; 

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
  const [isBusVisible, setIsBusVisible] = useState(true);
  const [npcCars, setNpcCars] = useState([]);

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
  const [busFrame, setBusFrame] = useState(0);

  const playerCarXAnim = useRef(new Animated.Value(width / 2 - playerCarWidth / 2)).current;
  const busInitialX = 2 * tileSize + (tileSize / 2 - busWidth / 2);
  const busYAnim = useRef(new Animated.Value(-busHeight)).current;

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

  // Animation for bus's sprite
  useEffect(() => {
    if (!showQuestion && isBusVisible) {
      const interval = setInterval(() => {
        setBusFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 250);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isBusVisible]);

  // Animation for NPC cars' sprites
  useEffect(() => {
    if (!showQuestion && npcCars.length > 0) {
      const interval = setInterval(() => {
        setNpcCars(prevCars => 
          prevCars.map(car => ({
            ...car,
            frame: car.frame === 0 ? 1 : 0
          }))
        );
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showQuestion, npcCars.length]);

  const scrollAnimationRef = useRef(null);
  const busAnimationRef = useRef(null);
  const npcAnimationsRef = useRef([]);

  // Function to spawn NPC cars on opposite lanes
  const spawnNpcCars = () => {
    const lanes = [0, 1]; // Left two lanes (opposite direction)
    const carTypes = [
      { sprites: npcCarSprites, width: npcCarWidth, height: npcCarHeight },
      { sprites: taxiSprites, width: npcCarWidth, height: npcCarHeight },
      { sprites: jeepneySprites, width: npcCarWidth, height: npcCarHeight }
    ];

    const newCars = lanes.map((laneIndex, idx) => {
      const carType = carTypes[idx % carTypes.length];
      const xPos = laneIndex * tileSize + (tileSize / 2 - carType.width / 2);
      const yAnim = new Animated.Value(height + carType.height); // Start from bottom
      
      return {
        id: `npc-${Date.now()}-${idx}`,
        type: carType,
        xPos,
        yAnim,
        frame: 0,
        visible: true
      };
    });

    setNpcCars(newCars);

    // Animate NPC cars moving up (same direction as player - NORTH)
    newCars.forEach((car, idx) => {
      const anim = Animated.timing(car.yAnim, {
        toValue: -car.type.height, // Move to top of screen
        duration: 6000 + (idx * 800), // Slower for more visibility
        easing: Easing.linear,
        useNativeDriver: true,
      });
      npcAnimationsRef.current[idx] = anim;
      anim.start(() => {
        // Remove car after it passes
        setNpcCars(prev => prev.filter(c => c.id !== car.id));
      });
    });
  };

  function startScrollAnimation() {
    scrollY.setValue(0);
    busYAnim.setValue(-busHeight);
    playerCarXAnim.setValue(width / 2 - playerCarWidth / 2);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsBusVisible(true);

    // Spawn NPC cars
    spawnNpcCars();

    scrollAnimationRef.current = Animated.loop(
      Animated.timing(scrollY, {
        toValue: -mapHeight,
        duration: mapHeight * 10,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    scrollAnimationRef.current.start();

    busAnimationRef.current = Animated.timing(busYAnim, {
      toValue: -height * 0.2,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    busAnimationRef.current.start(() => {
      setTimeout(() => {
        if (scrollAnimationRef.current) {
          scrollAnimationRef.current.stop();
        }
        // Stop NPC animations
        npcAnimationsRef.current.forEach(anim => anim && anim.stop());
        
        setIsPlayerCarVisible(true);
        setIsBusVisible(true);
        setPlayerCarFrame(0);
        setBusFrame(0);

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
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (busAnimationRef.current) {
        busAnimationRef.current.stop();
      }
      npcAnimationsRef.current.forEach(anim => anim && anim.stop());
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
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (busAnimationRef.current) busAnimationRef.current.stop();
    npcAnimationsRef.current.forEach(anim => anim && anim.stop());

    setPlayerCarDirection("NORTH");
    setPlayerCarFrame(0);
    setBusFrame(0);
    setIsPlayerCarVisible(true);
    setIsBusVisible(true);

    await new Promise(resolve => {
        Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 2),
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(resolve);
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    handleFeedback(selectedAnswer);
  };

  const animateSuddenOvertake = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (busAnimationRef.current) busAnimationRef.current.stop();
    npcAnimationsRef.current.forEach(anim => anim && anim.stop());

    setPlayerCarFrame(0);
    setBusFrame(0);
    setIsPlayerCarVisible(true);
    setIsBusVisible(true);

    const targetXLeftLane = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2);

    await new Promise(resolve => {
        setPlayerCarDirection("NORTHWEST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: targetXLeftLane,
                duration: 400,
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 0.8),
                duration: 400,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    await new Promise(resolve => {
        setPlayerCarDirection("NORTH");
        Animated.parallel([
            Animated.timing(busYAnim, {
                toValue: height + busHeight,
                duration: 800,
                easing: Easing.easeIn,
                useNativeDriver: true,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 4),
                duration: 800,
                easing: Easing.easeOut,
                useNativeDriver: true,
            }),
        ]).start(resolve);
    });
    setIsBusVisible(false);
    setPlayerCarDirection("NORTH");

    await new Promise(resolve => setTimeout(resolve, 1000));
    handleFeedback(selectedAnswer);
  };

  // NEW ANIMATION: Careful Overtake (for "Signal, check mirrors...")
  const animateCarefulOvertake = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (busAnimationRef.current) busAnimationRef.current.stop();
    npcAnimationsRef.current.forEach(anim => anim && anim.stop());

    setPlayerCarFrame(0);
    setBusFrame(0);
    setIsPlayerCarVisible(true);
    setIsBusVisible(true);

    const targetXLeftLane = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2);

    // 1. Scroll for 3 seconds first (simulating careful approach)
    await new Promise(resolve => {
        Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 3),
            duration: 4500,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(resolve);
    });

    // 2. Spawn NPC cars again at slower speed (checking for oncoming traffic)
    const lanes = [0, 1];
    const carTypes = [
      { sprites: npcCarSprites, width: npcCarWidth, height: npcCarHeight },
      { sprites: taxiSprites, width: npcCarWidth, height: npcCarHeight },
    ];

    const newSlowCars = lanes.map((laneIndex, idx) => {
      const carType = carTypes[idx % carTypes.length];
      const xPos = laneIndex * tileSize + (tileSize / 2 - carType.width / 2);
      const yAnim = new Animated.Value(height + carType.height);
      
      return {
        id: `npc-slow-${Date.now()}-${idx}`,
        type: carType,
        xPos,
        yAnim,
        frame: 0,
        visible: true
      };
    });

    setNpcCars(newSlowCars);

    // Animate slow NPC cars
    const slowNpcAnims = newSlowCars.map((car, idx) => {
      const anim = Animated.timing(car.yAnim, {
        toValue: -car.type.height,
        duration: 2700, // Much slower to show checking for traffic
        easing: Easing.linear,
        useNativeDriver: true,
      });
      npcAnimationsRef.current[idx] = anim;
      anim.start();
      return anim;
    });

    // Wait a bit to "check" for traffic
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 3. Car faces Northwest and moves smoothly left (after checking traffic is clear)
    await new Promise(resolve => {
        setPlayerCarDirection("NORTHWEST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: targetXLeftLane,
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
        ]).start(resolve);
    });

    // 4. Car faces North, continues forward, and bus falls behind
    await new Promise(resolve => {
        setPlayerCarDirection("NORTH");
        Animated.parallel([
            Animated.timing(busYAnim, {
                toValue: height + busHeight,
                duration: 1200,
                easing: Easing.easeIn,
                useNativeDriver: true,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 5),
                duration: 1200,
                easing: Easing.easeOut,
                useNativeDriver: true,
            }),
        ]).start(resolve);
    });
    
    setIsBusVisible(false);
    setPlayerCarDirection("NORTH");

    // Stop slow NPC animations
    slowNpcAnims.forEach(anim => anim.stop());
    setNpcCars([]);

    // Pause briefly before showing feedback
    await new Promise(resolve => setTimeout(resolve, 1000));

    handleFeedback(selectedAnswer);
  };

  const handleAnswer = async (option) => {
    setSelectedAnswer(option);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = option === currentQuestion.correct;
    updateProgress(option, isCorrect);
    
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (busAnimationRef.current) busAnimationRef.current.stop();
    npcAnimationsRef.current.forEach(anim => anim && anim.stop());
    
    setIsPlayerCarVisible(true);
    setIsBusVisible(true);
    setPlayerCarFrame(0);
    setBusFrame(0);

    const actualCorrectAnswer = questions[questionIndex].correct;

    if (option === actualCorrectAnswer) {
      if (option === "Check for oncoming traffic, signal, and overtake when safe") {
        await animateCarefulOvertake();
      } else if (option === "Don't overtake since yellow lines indicate opposite traffic") {
        await animateStayInLane();
      }
      handleFeedback(option);
    } else if (option === "Overtake without additional precautions since lines are broken") {
      await animateSuddenOvertake();
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
    setBusFrame(0);
    setNpcCars([]);

    const centerX = width / 2 - playerCarWidth / 2;
    playerCarXAnim.setValue(centerX);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsBusVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      const currentFileScenario = 9;

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
        const nextScenarioNumber = currentFileScenario + 1;
        const nextScreen = `S${nextScenarioNumber}P1`;
        router.push(`/scenarios/road-markings/phase1/${nextScreen}`);
      }

      setShowQuestion(false);
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (busAnimationRef.current) {
        busAnimationRef.current.stop();
      }
      npcAnimationsRef.current.forEach(anim => anim && anim.stop());
    }
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct. Even if it's permitted, always practice defensive driving for your safety and other drivers' safety as well."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

  return (
    <View style={{ flex: 1, backgroundColor: "black", overflow: 'hidden' }}>
      {/* Map */}
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

      {/* NPC Cars (Oncoming Traffic) */}
      {npcCars.map((car) => (
        car.visible && (
          <Animated.Image
            key={car.id}
            source={car.type.sprites.NORTH[car.frame]}
            style={{
              width: car.type.width,
              height: car.type.height,
              position: "absolute",
              left: car.xPos,
              transform: [{ translateY: car.yAnim }],
              zIndex: 3,
            }}
          />
        )
      ))}

      {/* Bus */}
      {isBusVisible && (
        <Animated.Image
          source={busSprites.NORTH[busFrame]}
          style={{
            width: busWidth,
            height: busHeight,
            position: "absolute",
            left: busInitialX,
            transform: [{ translateY: busYAnim }],
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
            bottom: height * 0.1,
            left: playerCarXAnim,
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
    fontSize: fontSize(18),
    marginTop: scale(20),
  },
introContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  introLTOImage: {
    width: wp(60),
    height: hp(25),
    resizeMode: "contain",
    marginBottom: scale(20),
  },
  introTextBox: {
    backgroundColor: "rgba(8, 8, 8, 0.7)",
    padding: scale(24),
    borderRadius: scale(15),
    alignItems: "center",
    maxWidth: wp(85),
    minHeight: hp(30),
    justifyContent: "center",
  },
  introTitle: {
    color: "white",
    fontSize: fontSize(28),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: scale(15),
  },
  introText: {
    color: "white",
    fontSize: fontSize(16),
    textAlign: "center",
    marginBottom: scale(25),
    lineHeight: fontSize(22),
    paddingHorizontal: scale(10),
  },
  startButton: {
    backgroundColor: "#007bff",
    paddingVertical: scale(15),
    paddingHorizontal: scale(40),
    borderRadius: scale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    minWidth: wp(40),
    alignItems: "center",
  },
  startButtonText: {
    color: "white",
    fontSize: fontSize(20),
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
    fontSize: Math.min(width * 0.04, 18),
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