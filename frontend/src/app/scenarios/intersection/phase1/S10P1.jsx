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

const sideNpcSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHEAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTHEAST/SEPARATED/Red_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTHEAST/SEPARATED/Red_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/EAST/SEPARATED/Red_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/EAST/SEPARATED/Red_CIVIC_CLEAN_EAST_001.png"),
  ],
};

const treeSprites = {
  tree1: require("../../../../../assets/tree/Tree3_idle_s.png"),
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
    question: "You're approaching a busy roundabout in Makati during lunch time. There's a Roundabout ahead sign, and you can see the circular intersection has continuous traffic. You need to take the second exit, and there's a car beside you also approaching the roundabout.",
    options: ["Race the car to enter the roundabout first", "Yield to traffic in the roundabout, coordinate with the car, and enter when both can safely do so", "Stop and wait for traffic to completely clear"],
    correct: "Yield to traffic in the roundabout, coordinate with the car, and enter when both can safely do so",
    wrongExplanation: {
      "Race the car to enter the roundabout first": "Accident Prone! Racing other vehicles is dangerous and illegal, especially near intersections and roundabouts.",
      "Stop and wait for traffic to completely clear": "Wrong! Waiting for complete clearance in heavy traffic areas like Makati would create massive traffic jams. Enter when there's a reasonable safe gap."
    }
  },
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
  const [isSideNpcVisible, setIsSideNpcVisible] = useState(true);

  const startOffset = -(mapHeight - height);
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
  const [carDirection, setCarDirection] = useState("NORTH");

  // Car
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 0.8)).current;

  // Side NPC Car (beside player)
  const [sideNpcFrame, setSideNpcFrame] = useState(0);
  const [sideNpcDirection, setSideNpcDirection] = useState("NORTH");
  const [sideNpcPaused, setSideNpcPaused] = useState(false);
  const sideNpcXAnim = useRef(new Animated.Value(width / 2 - carWidth * 0.5)).current;

  // NPC Cars state - NEW: Add refs to store animation controllers
  const npcAnimationRefs = useRef([]);
  
  // Store initial positions
  const initialNpcPositions = useRef([
    -carWidth,
    -carWidth * 5,
    -carWidth * 1.5,
    -carWidth * 6
  ]);

  const [npcCars, setNpcCars] = useState([
    { id: 1, row: 2.5, color: 'red', xAnim: new Animated.Value(-carWidth), frame: 0 },
    { id: 2, row: 2.5, color: 'blue', xAnim: new Animated.Value(-carWidth * 5), frame: 0 },
    { id: 3, row: 3.5, color: 'green', xAnim: new Animated.Value(-carWidth * 1.5), frame: 0 },
    { id: 4, row: 3.5, color: 'yellow', xAnim: new Animated.Value(-carWidth * 6), frame: 0 },
  ]);

  // NEW: Function to start NPC animations
  const startNPCAnimations = () => {
    // Stop any existing animations first
    npcAnimationRefs.current.forEach(anim => {
      if (anim) anim.stop();
    });
    npcAnimationRefs.current = [];

    npcCars.forEach((car, index) => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(car.xAnim, {
            toValue: width + carWidth,
            duration: 17000,
            useNativeDriver: false,
          }),
          Animated.timing(car.xAnim, {
            toValue: -carWidth,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      );
      
      npcAnimationRefs.current[index] = animation;
      animation.start();
    });
  };

  // NEW: Function to reset NPC animations
  const resetNPCAnimations = () => {
    console.log('Resetting NPC animations...');
    
    // Stop all animations
    npcAnimationRefs.current.forEach(anim => {
      if (anim) anim.stop();
    });
    npcAnimationRefs.current = [];

    // Reset positions to initial values immediately
    npcCars.forEach((car, index) => {
      car.xAnim.setValue(initialNpcPositions.current[index]);
    });
    
    // Force frame reset
    setNpcCars(prev => prev.map((car, index) => ({
      ...car,
      frame: 0
    })));

    console.log('NPC positions reset to:', initialNpcPositions.current);

    // Restart animations after a brief delay
    setTimeout(() => {
      startNPCAnimations();
      console.log('NPC animations restarted');
    }, 100);
  };

  // Start animations on mount
  useEffect(() => {
    startNPCAnimations();
    
    // Cleanup on unmount
    return () => {
      npcAnimationRefs.current.forEach(anim => {
        if (anim) anim.stop();
      });
    };
  }, []);

  // NPC car sprite animation
  useEffect(() => {
    const interval = setInterval(() => {
      setNpcCars(prev => prev.map(car => ({
        ...car,
        frame: (car.frame + 1) % 2
      })));
    }, 200);

    return () => clearInterval(interval);
  }, []);

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

  // Car sprite frame loop (stops when carPaused=true)
  useEffect(() => {
    let iv;
    if (!carPaused && carSprites[carDirection]) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites[carDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused, carDirection]);

  // Side NPC sprite frame loop
  useEffect(() => {
    let iv;
    if (!sideNpcPaused && sideNpcSprites[sideNpcDirection]) {
      iv = setInterval(() => {
        setSideNpcFrame((p) => (p + 1) % sideNpcSprites[sideNpcDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [sideNpcPaused, sideNpcDirection]);

  // feedback anims
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

    // NEW: Reset NPC car animations when player selects an answer
    resetNPCAnimations();

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    await updateProgress(answer, isCorrect);

    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);

    if (answer === "Race the car to enter the roundabout first") {
      // Both cars race quickly to the roundabout
      const turnStartRow = 9;
      const initialScrollTarget = currentScroll.current + (turnStartRow - currentRow) * tileSize;

      // Quick aggressive movement to roundabout
      Animated.timing(scrollY, {
        toValue: initialScrollTarget,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        const turnSequence = ["NORTH", "NORTHEAST", "EAST"];
        let currentTurnStep = 0;

        const animateBothCarsRacing = () => {
          if (currentTurnStep < turnSequence.length) {
            setCarDirection(turnSequence[currentTurnStep]);
            setSideNpcDirection(turnSequence[currentTurnStep]);
            setCarFrame(0);
            setSideNpcFrame(0);

            let deltaX = 0;
            let deltaYScroll = 0;

            if (turnSequence[currentTurnStep] === "NORTHEAST") {
              deltaX = tileSize / 6;
              deltaYScroll = tileSize / 6;
            } else if (turnSequence[currentTurnStep] === "EAST") {
              deltaX = tileSize / 2;
              deltaYScroll = tileSize / 2;
            }

            const currentCarX = carXAnim._value;
            const currentSideNpcX = sideNpcXAnim._value;
            const currentScrollY = scrollY._value;

            // Both cars turn simultaneously - racing
            Animated.parallel([
              Animated.timing(carXAnim, {
                toValue: currentCarX + deltaX,
                duration: 250,
                useNativeDriver: false,
              }),
              Animated.timing(sideNpcXAnim, {
                toValue: currentSideNpcX + deltaX,
                duration: 250,
                useNativeDriver: false,
              }),
              Animated.timing(scrollY, {
                toValue: currentScrollY + deltaYScroll,
                duration: 250,
                useNativeDriver: true,
              }),
            ]).start(() => {
              currentTurnStep++;
              animateBothCarsRacing();
            });
          } else {
            // Both cars speed off screen
            Animated.parallel([
              Animated.timing(carXAnim, {
                toValue: width * 2,
                duration: 2000,
                useNativeDriver: false,
              }),
              Animated.timing(sideNpcXAnim, {
                toValue: width * 2 + carWidth * 0.6,
                duration: 2000,
                useNativeDriver: false,
              }),
            ]).start(() => {
              setIsCarVisible(false);
              setIsSideNpcVisible(false);
              handleFeedback(answer);
            });
          }
        };
        animateBothCarsRacing();
      });
      return;
    } else if (answer === "Stop and wait for traffic to completely clear") {
      // Both cars stop and remain stationary
      const targetRow = 8;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;

      setCarPaused(true);
      setSideNpcPaused(true);
      
      setTimeout(() => {
        setCarPaused(false);
        setSideNpcPaused(false);
        Animated.timing(scrollY, {
          toValue: nextTarget,
          duration: 2000,
          useNativeDriver: true,
        }).start(() => {
          handleFeedback(answer);
        });
      }, 2500);
    } else if(answer === "Yield to traffic in the roundabout, coordinate with the car, and enter when both can safely do so"){
      // FIXED: Coordinated movement - side NPC goes first, THEN player moves after NPC completely exits
      const turnStartRow = 9;
      const initialScrollTarget = currentScroll.current + (turnStartRow - currentRow) * tileSize;

      // Pause player car movement
      setCarPaused(true);

      // Move both cars to the roundabout entrance
      Animated.timing(scrollY, {
        toValue: initialScrollTarget,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        // Brief pause to show coordination
        setTimeout(() => {
          // First, move NPC car forward (NORTH) before turning
          const currentSideNpcY = scrollY._value;
          
          Animated.timing(scrollY, {
            toValue: currentSideNpcY + tileSize * 0.6,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            // Now NPC car goes through the roundabout turn
            const turnSequence = ["NORTH", "NORTHEAST", "EAST"];
            let currentTurnStep = 0;

            const animateSideNpcFirst = () => {
              if (currentTurnStep < turnSequence.length) {
                setSideNpcDirection(turnSequence[currentTurnStep]);
                setSideNpcFrame(0);

                let deltaX = 0;

                if (turnSequence[currentTurnStep] === "NORTHEAST") {
                  deltaX = tileSize / 3;
                } else if (turnSequence[currentTurnStep] === "EAST") {
                  deltaX = tileSize / 2;
                }

                const currentSideNpcX = sideNpcXAnim._value;

                // Only animate NPC car horizontally, NO scroll (player stays in place)
                Animated.timing(sideNpcXAnim, {
                  toValue: currentSideNpcX + deltaX,
                  duration: 500,
                  useNativeDriver: false,
                }).start(() => {
                  currentTurnStep++;
                  animateSideNpcFirst();
                });
              } else {
                // Side NPC exits the screen completely
                Animated.timing(sideNpcXAnim, {
                  toValue: width * 2,
                  duration: 500,
                  useNativeDriver: false,
                }).start(() => {
                  setIsSideNpcVisible(false);
                  
                  // NOW player car goes through the roundabout AFTER NPC has exited
                  setTimeout(() => {
                    setCarPaused(false); // Resume player car animation
                    let playerTurnStep = 0;
                    
                    const animatePlayerCar = () => {
                      if (playerTurnStep < turnSequence.length) {
                        setCarDirection(turnSequence[playerTurnStep]);
                        setCarFrame(0);

                        let deltaX = 0;
                        let deltaYScroll = 0;

                        if (turnSequence[playerTurnStep] === "NORTHEAST") {
                          deltaX = tileSize / 3;
                          deltaYScroll = tileSize / 3;
                        } else if (turnSequence[playerTurnStep] === "EAST") {
                          deltaX = tileSize / 2;
                          deltaYScroll = tileSize / 2;
                        }

                        const currentCarX = carXAnim._value;
                        const currentScrollY = scrollY._value;

                        // Animate player car turn with scroll
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
                          playerTurnStep++;
                          animatePlayerCar();
                        });
                      } else {
                        // Player exits the screen
                        Animated.timing(carXAnim, {
                          toValue: width * 2,
                          duration: 500,
                          useNativeDriver: false,
                        }).start(() => {
                          setIsCarVisible(false);
                          handleFeedback(answer);
                        });
                      }
                    };
                    animatePlayerCar();
                  });
                });
              }
            };
            animateSideNpcFirst();
          });
        });
      });
      return;
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    setSideNpcFrame(0);
    
    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    sideNpcXAnim.setValue(width / 2 - carWidth * 1.5);
    setCarDirection("NORTH");
    setSideNpcDirection("NORTH");
    setIsCarVisible(true);
    setIsSideNpcVisible(true);
    setCarPaused(false);
    setSideNpcPaused(false);
    
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario >= 10) {
      try {
        const sessionResults = await completeSession();
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
      router.push(`/scenarios/intersection/phase1/${nextScreen}`);
    }
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Safe roundabout navigation requires yielding to circulating traffic and being aware of adjacent vehicles. Coordination prevents conflicts."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  const currentCarSprite = carSprites[carDirection] && carSprites[carDirection][carFrame] 
    ? carSprites[carDirection][carFrame] 
    : carSprites["NORTH"][0];

  const currentSideNpcSprite = sideNpcSprites[sideNpcDirection] && sideNpcSprites[sideNpcDirection][sideNpcFrame]
    ? sideNpcSprites[sideNpcDirection][sideNpcFrame]
    : sideNpcSprites["NORTH"][0];

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
        {npcCars.map((car) => (
          <Animated.Image
            key={car.id}
            source={npcCarSprites[car.color][car.frame]}
            style={{
              position: "absolute",
              width: carWidth,
              height: carHeight,
              top: car.row * tileSize,
              left: car.xAnim,
              zIndex: 5,
            }}
          />
        ))}
      </Animated.View>

      {/* Side NPC Car */}
      {isSideNpcVisible && (
        <Animated.Image
          source={currentSideNpcSprite}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: 80,
            left: sideNpcXAnim,
            zIndex: 7,
          }}
        />
      )}

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
    fontSize: Math.min(width * 0.045, 18),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.2,
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