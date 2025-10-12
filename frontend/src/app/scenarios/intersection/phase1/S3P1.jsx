import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { router } from 'expo-router';
import { useSession } from '../../../../contexts/SessionManager';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

const roadTiles = {
    road1: require("../../../../../assets/road/road1.png"),
    road3: require("../../../../../assets/road/road3.png"),
    road4: require("../../../../../assets/road/road4.png"),
    road16: require("../../../../../assets/road/road16.png"),
    road17: require("../../../../../assets/road/road17.png"),
    road18: require("../../../../../assets/road/road18.png"),
    road19: require("../../../../../assets/road/road19.png"),
    road20: require("../../../../../assets/road/road20.png"),
    road22: require("../../../../../assets/road/road22.png"),
    road23: require("../../../../../assets/road/road23.png"),
    road24: require("../../../../../assets/road/road24.png"),
    road51: require("../../../../../assets/road/road51.png"),
    road52: require("../../../../../assets/road/road52.png"),
    road76: require("../../../../../assets/road/road76.png"),
};

const mapLayout = [
  ["road20", "road20", "road20", "road20", "road20"],
  ["road20", "road20", "road20", "road20", "road20"],
  ["road52", "road52", "road52", "road52", "road52"],
  ["road24", "road22", "road22", "road22", "road24"],
  ["road23", "road22", "road22", "road23", "road23"],
  ["road19", "road1", "road1", "road16", "road51"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
];

const carSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
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

const treeSprites = {
  tree1: require("../../../../../assets/tree/Tree3_idle_s.png"),
};

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

const treePositions = [
  // Left side trees (column -1, outside the road)
    { row: 5, col: 0, type: 'tree1' },
    { row: 6, col: 0, type: 'tree1' },
    { row: 7, col: 0, type: 'tree1' },
    { row: 8, col: 0, type: 'tree1' },
    { row: 9, col: 0, type: 'tree1' },
    { row: 10, col: 0, type: 'tree1' },
    { row: 11, col: 0, type: 'tree1' },
    { row: 12, col: 0, type: 'tree1' },
    { row: 13, col: 0, type: 'tree1' },
    { row: 14, col: 0, type: 'tree1' },
  // right side trees
    { row: 5, col: 3.5, type: 'tree1' },
    { row: 6, col: 3.5, type: 'tree1' },
    { row: 7, col: 3.5, type: 'tree1' },
    { row: 8, col: 3.5, type: 'tree1' },
    { row: 9, col: 3.5, type: 'tree1' },
    { row: 10, col: 3.5, type: 'tree1' },
    { row: 11, col: 3.5, type: 'tree1' },
    { row: 12, col: 3.5, type: 'tree1' },
    { row: 13, col: 3.5, type: 'tree1' },
    { row: 14, col: 3.5, type: 'tree1' },
// scattered trees right side
    { row: 5.5, col: 4, type: 'tree1' },
    { row: 6.5, col: 4, type: 'tree1' },
    { row: 7.5, col: 4, type: 'tree1' },
    { row: 8.5, col: 4, type: 'tree1' },
    { row: 9.5, col: 4, type: 'tree1' },
    { row: 10.5, col: 4, type: 'tree1' },
    { row: 11.5, col: 4, type: 'tree1' },
    { row: 12.5, col: 4, type: 'tree1' },
    { row: 13.5, col: 4, type: 'tree1' },
    { row: 14.5, col: 4, type: 'tree1' },
    //top side trees
    { row: 1.4, col: 0, type: 'tree1' },
    { row: 1.4, col: 1, type: 'tree1' },
    { row: 1.4, col: 2, type: 'tree1' },
    { row: 1.4, col: 3, type: 'tree1' },
    { row: 1.4, col: 4, type: 'tree1' },
    { row: 1, col: 0.5, type: 'tree1' },
    { row: 1, col: 1.5, type: 'tree1' },
    { row: 1, col: 2.5, type: 'tree1' },
    { row: 1, col: 3.5, type: 'tree1' },
    { row: 1, col: 4.5, type: 'tree1' },
];

const questions = [
  {
    question: "You're approaching a Roundabout (Rotunda) in Iloilo City. There's moderate traffic, and you need to take the third exit. A motorcycle is already in the roundabout to your left.",
    options: ["Enter the roundabout immediately since you have the right of way", "Yield to traffic already in the roundabout, then enter when safe", "Stop and wait for the roundabout to be completely empty"],
    correct: "Yield to traffic already in the roundabout, then enter when safe",
    wrongExplanation: {
      "Enter the roundabout immediately since you have the right of way": "Accident Prone! Vehicles already in the roundabout have the right of way. Entering without yielding can cause accidents.",
      "Stop and wait for the roundabout to be completely empty": "Wrong! Waiting for complete emptiness is unnecessary and creates traffic backup. Enter when there's a reasonable safe gap."
    }
  },
];

const trafficSign = {
  sign: require("../../../../../assets/signs/intersection ahead.png"),
};

// NPC car configuration
const initialNpcCars = [
  { id: 1, row: 2.5, color: 'red', startDelay: 0, speed: 9800 },
  { id: 2, row: 2.5, color: 'green', startDelay: 1500, speed: 10000 },
  { id: 3, row: 3.5, color: 'yellow', startDelay: 0, speed: 10000 },
  { id: 4, row: 3.5, color: 'blue', startDelay: 1500, speed: 9000 },
];

export default function DrivingGame() {
  
  const {
    updateScenarioProgress,
    moveToNextScenario,
    completeSession,
    currentScenario,
    sessionData
  } = useSession();

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isCarVisible, setIsCarVisible] = useState(true);

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  const trafficSignRowIndex = 6;
  const trafficSignColIndex = 3;
  const trafficSignXOffset = -30;

  // NPC Cars State
  const [npcCars, setNpcCars] = useState(initialNpcCars);
  const npcCarAnims = useRef({});
  const [npcCarFrames, setNpcCarFrames] = useState({});
  
  // Store animation timeouts and running animations
  const npcAnimationTimeouts = useRef({});
  const npcRunningAnimations = useRef({});

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
  const [carDirection, setCarDirection] = useState("NORTH");

  // Car
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;

  // Initialize NPC car animations
  useEffect(() => {
    npcCars.forEach(car => {
      if (!npcCarAnims.current[car.id]) {
        npcCarAnims.current[car.id] = new Animated.Value(-carWidth);
      }
    });
  }, [npcCars]);

  // Function to completely stop an NPC animation
  const stopNPCAnimation = (carId) => {
    // Clear timeout if exists
    if (npcAnimationTimeouts.current[carId]) {
      clearTimeout(npcAnimationTimeouts.current[carId]);
      npcAnimationTimeouts.current[carId] = null;
    }
    
    // Stop the running animation if exists
    if (npcRunningAnimations.current[carId]) {
      npcCarAnims.current[carId]?.stopAnimation();
      npcRunningAnimations.current[carId] = false;
    }
  };

  // Function to start a single NPC animation
  const startNPCAnimation = (car) => {
    const anim = npcCarAnims.current[car.id];
    
    const timeout = setTimeout(() => {
      npcRunningAnimations.current[car.id] = true;
      
      const loopAnimation = () => {
        // Check if animation should still be running
        if (!npcRunningAnimations.current[car.id]) {
          return;
        }
        
        anim.setValue(-carWidth);
        Animated.timing(anim, {
          toValue: width + carWidth,
          duration: car.speed,
          useNativeDriver: false,
        }).start(({ finished }) => {
          // Only continue loop if animation finished naturally and should still be running
          if (finished && npcRunningAnimations.current[car.id]) {
            loopAnimation();
          }
        });
      };
      
      loopAnimation();
    }, car.startDelay);
    
    npcAnimationTimeouts.current[car.id] = timeout;
  };

  // Function to start all NPC animations
  const startNPCAnimations = () => {
    console.log('Starting NPC animations...');
    npcCars.forEach(car => {
      startNPCAnimation(car);
    });
  };

  // Function to reset NPC animations
  const resetNPCAnimations = () => {
    console.log('Resetting NPC animations...');
    
    // Stop all animations first
    npcCars.forEach(car => {
      stopNPCAnimation(car.id);
    });
    
    // Wait for all animations to stop, then reset positions
    setTimeout(() => {
      npcCars.forEach(car => {
        npcCarAnims.current[car.id]?.setValue(-carWidth);
      });
      
      // Reset frames
      setNpcCarFrames({});
      
      console.log('NPC positions reset, restarting...');
      
      // Restart animations after positions are reset
      setTimeout(() => {
        startNPCAnimations();
        console.log('NPC animations restarted');
      }, 50);
    }, 100);
  };

  // Animate NPC cars on mount
  useEffect(() => {
    startNPCAnimations();

    return () => {
      // Cleanup on unmount
      npcCars.forEach(car => {
        stopNPCAnimation(car.id);
      });
    };
  }, []);

  // Animate NPC car sprite frames
  useEffect(() => {
    const interval = setInterval(() => {
      setNpcCarFrames(prev => {
        const newFrames = { ...prev };
        npcCars.forEach(car => {
          const currentFrame = newFrames[car.id] || 0;
          newFrames[car.id] = (currentFrame + 1) % npcCarSprites[car.color].length;
        });
        return newFrames;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [npcCars]);

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const scenarioId = 60 + currentScenario;
      
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

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopRow = 8.5;
    const stopOffset = startOffset + stopRow * tileSize;

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

  useEffect(() => {
    let iv;
    if (!carPaused && carSprites[carDirection]) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites[carDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused, carDirection]);

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);

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
  

  const handleAnswer = async (answer) => {  
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    // Reset NPC animations when answer is selected
    resetNPCAnimations();

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    await updateProgress(answer, isCorrect);

    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);

    if (answer === "Enter the roundabout immediately since you have the right of way") {
      const turnStartRow = 10;

      const initialScrollTarget = currentScroll.current + (turnStartRow - currentRow) * tileSize;

      Animated.timing(scrollY, {
        toValue: initialScrollTarget,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        const turnSequence = ["NORTH", "NORTHEAST", "EAST"];
        let currentTurnStep = 0;

        const animateTurnAndMove = () => {
          if (currentTurnStep < turnSequence.length) {
            setCarDirection(turnSequence[currentTurnStep]);
            setCarFrame(0);

            let deltaX = 0;
            let deltaYScroll = 0;

            if (turnSequence[currentTurnStep] === "NORTHEAST") {
              deltaX = tileSize / 4;
              deltaYScroll = tileSize / 4;
            } else if (turnSequence[currentTurnStep] === "EAST") {
              deltaX = tileSize / 2;
              deltaYScroll = tileSize / 2;
            }

            const currentCarX = carXAnim._value;
            const currentScrollY = scrollY._value;

            Animated.parallel([
              Animated.timing(carXAnim, {
                toValue: currentCarX + deltaX,
                duration: 300,
                useNativeDriver: false,
              }),
              Animated.timing(scrollY, {
                toValue: currentScrollY + deltaYScroll,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start(() => {
              currentTurnStep++;
              animateTurnAndMove();
            });
          } else {
            Animated.timing(carXAnim, {
              toValue: width * 2,
              duration: 2500,
              useNativeDriver: false,
            }).start(() => {
              setIsCarVisible(false);
              handleFeedback(answer);
            });
          }
        };
        animateTurnAndMove();
      });
      return;
    } else if (answer === "Stop and wait for the roundabout to be completely empty") {
        const targetRow = 8.5;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;

        setCarPaused(true);
        setTimeout(() => {
            setCarPaused(false);
            Animated.timing(scrollY, {
                toValue: nextTarget,
                duration: 2000,
                useNativeDriver: true,
            }).start(() => {
                handleFeedback(answer);
            });
        }, 1500);
    } else if(answer === "Yield to traffic already in the roundabout, then enter when safe"){
        const turnStartRow = 10;

        const initialScrollTarget = currentScroll.current + (turnStartRow - currentRow) * tileSize;

        Animated.timing(scrollY, {
          toValue: initialScrollTarget,
          duration: 2000,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(() => {
            const turnSequence = ["NORTH", "NORTHEAST", "EAST"];
            let currentTurnStep = 0;

            const animateTurnAndMove = () => {
              if (currentTurnStep < turnSequence.length) {
                setCarDirection(turnSequence[currentTurnStep]);
                setCarFrame(0);

                let deltaX = 0;
                let deltaYScroll = 0;

                if (turnSequence[currentTurnStep] === "NORTHEAST") {
                  deltaX = tileSize / 4;
                  deltaYScroll = tileSize / 4;
                } else if (turnSequence[currentTurnStep] === "EAST") {
                  deltaX = tileSize / 2;
                  deltaYScroll = tileSize / 2;
                }

                const currentCarX = carXAnim._value;
                const currentScrollY = scrollY._value;

                Animated.parallel([
                  Animated.timing(carXAnim, {
                    toValue: currentCarX + deltaX,
                    duration: 500,
                    useNativeDriver: false,
                  }),
                  Animated.timing(scrollY, {
                    toValue: currentScrollY + deltaYScroll,
                    duration: 500,
                    useNativeDriver: true,
                  }),
                ]).start(() => {
                  currentTurnStep++;
                  animateTurnAndMove();
                });
              } else {
                Animated.timing(carXAnim, {
                  toValue: width * 2,
                  duration: 1000,
                  useNativeDriver: false,
                }).start(() => {
                  setIsCarVisible(false);
                  handleFeedback(answer);
                });
              }
            };
            animateTurnAndMove();
          }, 800);
        });
      return;
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    
    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setCarPaused(false);
    
  if (questionIndex < questions.length - 1) {
    setQuestionIndex(questionIndex + 1);
    startScrollAnimation();
  } else if (currentScenario === 10) {
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
    moveToNextScenario();
    const nextScreen = `S${currentScenario + 1}P1`;
    router.push(`/scenarios/intersection/phase1/${nextScreen}`);
  }
};

  const trafficSignLeft = trafficSignColIndex * tileSize + trafficSignXOffset;
  const trafficSignTop = trafficSignRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! This is the fundamental roundabout rule - yield to traffic already circulating, then enter when there's a safe gap."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  const currentCarSprite = carSprites[carDirection] && carSprites[carDirection][carFrame] 
    ? carSprites[carDirection][carFrame] 
    : carSprites["NORTH"][0];

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* Map */}
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: mapHeight,
          left: 0,
          transform: [{ translateY: scrollY }],
          zIndex: 1,
        }}
      >
        {mapLayout.map((row, rowIndex) =>
          row.map((tile, colIndex) => (
            <Image
              key={`${rowIndex}-${colIndex}`}
              source={roadTiles[tile]}
              style={{
                position: "absolute",
                width: tileSize,
                height: tileSize,
                left: colIndex * tileSize,
                top: rowIndex * tileSize,
              }}
              resizeMode="stretch"
            />
          ))
        )}
        
        <Image
          source={trafficSign.sign}
          style={{
            width: tileSize * .8,
            height: tileSize *.8,
            position: "absolute",
            top: trafficSignTop,
            left: trafficSignLeft,
            zIndex: 11,
          }}
          resizeMode="contain"
        />

        {treePositions.map((tree, index) => (
          <Image
            key={`tree-${index}`}
            source={treeSprites[tree.type]}
            style={{
              position: "absolute",
              width: tileSize * 0.8,
              height: tileSize * 1.2,
              left: tree.col * tileSize,
              top: tree.row * tileSize,
              zIndex: 2,
            }}
            resizeMode="contain"
          />
        ))}

        {/* NPC Cars */}
        {npcCars.map(car => (
          <Animated.Image
            key={car.id}
            source={npcCarSprites[car.color][npcCarFrames[car.id] || 0]}
            style={{
              position: "absolute",
              width: carWidth * 1.2,
              height: carHeight * 1.2,
              top: car.row * tileSize,
              left: npcCarAnims.current[car.id],
              zIndex: 5,
            }}
            resizeMode="contain"
          />
        ))}
      </Animated.View>

      {/* Player Car */}
      {isCarVisible && (
        <Animated.Image
          source={currentCarSprite}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: 80,
            left: carXAnim,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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