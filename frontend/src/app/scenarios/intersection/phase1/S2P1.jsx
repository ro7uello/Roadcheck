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
    road17: require("../../../../../assets/road/road17.png"),
    road18: require("../../../../../assets/road/road18.png"),
    road19: require("../../../../../assets/road/road19.png"), 
    road20: require("../../../../../assets/road/road20.png"),
    road50: require("../../../../../assets/road/road50.png"),
    road65: require("../../../../../assets/road/road65.png"),
    road76: require("../../../../../assets/road/road76.png"),
    road84: require("../../../../../assets/road/road84.png"),
    road86: require("../../../../../assets/road/road86.png"),
    int1: require("../../../../../assets/road/int1.png"),
    int2: require("../../../../../assets/road/int2.png"),
    int3: require("../../../../../assets/road/int3.png"),
    int4: require("../../../../../assets/road/int4.png"),
};

const mapLayout = [
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],  
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road86", "road1", "road17", "road20"],
  ["road65", "int3", "int4", "road17", "road20"],
  ["road84", "int2", "int1", "road17", "road20"],
  ["road19", "road1", "road76", "road17", "road20"],
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
  NORTHWEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_001.png"),
  ],
  WEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_001.png"),
  ],
};

const jeepSprites = {
    NORTH: [
        require("../../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
        require("../../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
    ],
    EAST: [
        require("../../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/EAST/SEPARATED/Brown_JEEP_CLEAN_EAST_000.png"),
        require("../../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/EAST/SEPARATED/Brown_JEEP_CLEAN_EAST_001.png"),
    ],
    NORTHEAST: [
        require("../../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTHEAST/SEPARATED/Brown_JEEP_CLEAN_NORTHEAST_000.png"),
        require("../../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTHEAST/SEPARATED/Brown_JEEP_CLEAN_NORTHEAST_001.png"),
    ],
};

const treeSprites = {
  tree1: require("../../../../../assets/tree/Tree3_idle_s.png"),
};

const treePositions = [
  // Left side trees (column -1, outside the road)
    { row: 1, col: 0, type: 'tree1' },
    { row: 2, col: 0, type: 'tree1' },
    { row: 3, col: 0, type: 'tree1' },
    { row: 4, col: 0, type: 'tree1' },
    { row: 5, col: 0, type: 'tree1' },
    { row: 8, col: 0, type: 'tree1' },
    { row: 9, col: 0, type: 'tree1' },
    { row: 10, col: 0, type: 'tree1' },
    { row: 11, col: 0, type: 'tree1' },
    { row: 12, col: 0, type: 'tree1' },
    { row: 13, col: 0, type: 'tree1' },
    { row: 14, col: 0, type: 'tree1' },
    { row: 15, col: 0, type: 'tree1' },
    { row: 16, col: 0, type: 'tree1' },
    
  // right side trees
    { row: 1, col: 3.5, type: 'tree1' },
    { row: 2, col: 3.5, type: 'tree1' },
    { row: 3, col: 3.5, type: 'tree1' },
    { row: 4, col: 3.5, type: 'tree1' },
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
    { row: 15, col: 3.5, type: 'tree1' },
    { row: 16, col: 3.5, type: 'tree1' },
// scattered trees right side
    { row: 1.5, col: 4, type: 'tree1' },
    { row: 2.5, col: 4, type: 'tree1' },
    { row: 3.5, col: 4, type: 'tree1' },
    { row: 4.5, col: 4, type: 'tree1' },
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
    { row: 15.5, col: 4, type: 'tree1' },
    { row: 16.5, col: 4, type: 'tree1' },
];

const questions = [
  {
    question: "You're driving along Commonwealth Avenue when you see a Side road junction ahead warning sign. As you approach the junction, you notice a jeepney from the side road is already halfway into the main road, blocking part of your lane while waiting for a gap in oncoming traffic.",
    options: ["Slow down and give a brief courtesy honk to alert the jeepney of your presence", "Change lanes to the left if clear, while reducing speed as you pass", "Stop completely and wait for the jeepney to finish its maneuver before proceeding"],
    correct: "Stop completely and wait for the jeepney to finish its maneuver before proceeding",
    wrongExplanation: {
      "Slow down and give a brief courtesy honk to alert the jeepney of your presence": "Wrong!  While a brief honk isn't inherently dangerous, slowing down without stopping when the jeepney is blocking your lane could still result in a collision if it moves unpredictably.",
      "Change lanes to the left if clear, while reducing speed as you pass": "Wrong! Changing lanes near an intersection with a vehicle blocking traffic creates additional hazards. Other drivers may not expect the lane change, and you're moving into a potentially unsafe situation."
    }
  },
];

const trafficSign = {
  sign: require("../../../../../assets/signs/t_junction3.png"),
};

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

  // Traffic Sign position
  const trafficSignRowIndex = 9;
  const trafficSignColIndex = 3;
  const trafficSignXOffset = -30;

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

  // Jeepney states and animations
  const [showJeepney, setShowJeepney] = useState(false);
  const [jeepneyFrame, setJeepneyFrame] = useState(0);
  const [jeepneyDirection, setJeepneyDirection] = useState("EAST");
  const jeepneyXAnim = useRef(new Animated.Value(-carWidth)).current;
  const jeepneyYAnim = useRef(new Animated.Value(0)).current;

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

  // Car sprite frame loop
  useEffect(() => {
    let iv;
    if (!carPaused && carSprites[carDirection]) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites[carDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused, carDirection]);

  // Jeepney sprite frame loop
  useEffect(() => {
    let iv;
    if (showJeepney && jeepSprites[jeepneyDirection]) {
      iv = setInterval(() => {
        setJeepneyFrame((p) => (p + 1) % jeepSprites[jeepneyDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [showJeepney, jeepneyDirection]);

  // Feedback animations
  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);

  const animateJeepney = (scenario) => {
    setShowJeepney(true);
    
    // Calculate jeepney's starting position relative to the screen
    const jeepneyStartRow = 7.8; // Position at intersection
    const jeepneyRowPosition = jeepneyStartRow * tileSize;
    const mapTopPosition = Math.abs(currentScroll.current - startOffset);
    const jeepneyScreenY = jeepneyRowPosition - mapTopPosition;
    
    // Start from left side, off-screen
    jeepneyYAnim.setValue(jeepneyScreenY);
    jeepneyXAnim.setValue(-carWidth * 0.5); // Start slightly visible from left
    setJeepneyDirection("EAST");

    if (scenario === "courtesy_honk" || scenario === "change_lanes") {
      // Jeepney partially blocks the intersection
      Animated.sequence([
        // Phase 1: Move into intersection and stop (blocking position)
        Animated.timing(jeepneyXAnim, {
          toValue: tileSize * 1.8, // Stop in middle of intersection
          duration: 1800,
          useNativeDriver: true,
        }),
        // Phase 2: Wait briefly, then start turning northeast
        Animated.delay(300),
      ]).start(() => {
        setJeepneyDirection("NORTHEAST");
        
        // Phase 3: Continue turning and moving
        Animated.parallel([
          Animated.timing(jeepneyXAnim, {
            toValue: tileSize * 2.3,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(jeepneyYAnim, {
            toValue: jeepneyScreenY - tileSize * 1.5,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setJeepneyDirection("NORTH");
          
          // Phase 4: Continue moving north
          Animated.parallel([
            Animated.timing(jeepneyXAnim, {
              toValue: tileSize * 2.2,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(jeepneyYAnim, {
              toValue: jeepneyScreenY - tileSize * 4,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]).start();
        });
      });
      
    } else if (scenario === "stop_and_wait") {
      // Jeepney completes full turn smoothly and exits
      Animated.sequence([
        // Phase 1: Move east into intersection
        Animated.timing(jeepneyXAnim, {
          toValue: tileSize * 1.8,
          duration: 1500,
          useNativeDriver: true,
        }),
        // Phase 2: Brief pause at intersection
        Animated.delay(200),
      ]).start(() => {
        setJeepneyDirection("NORTHEAST");
        
        // Phase 3: Start turning northeast
        Animated.parallel([
          Animated.timing(jeepneyXAnim, {
            toValue: tileSize * 2.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(jeepneyYAnim, {
            toValue: jeepneyScreenY - tileSize * 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setJeepneyDirection("NORTH");
          
          // Phase 4: Complete turn and exit northward
          Animated.parallel([
            Animated.timing(jeepneyXAnim, {
              toValue: tileSize * 2.2,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(jeepneyYAnim, {
              toValue: jeepneyScreenY - tileSize * 6, // Move far away
              duration: 2000,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Fade out and hide
            setTimeout(() => setShowJeepney(false), 500);
          });
        });
      });
    }
  };

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

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    await updateProgress(answer, isCorrect);

    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);

    if (answer === "Slow down and give a brief courtesy honk to alert the jeepney of your presence") {
        // Start jeepney animation immediately
        animateJeepney("courtesy_honk");
        
        // Wait a moment for jeepney to appear, then car starts moving slowly
        setTimeout(() => {
            const targetRow = 11;
            const rowsToMove = targetRow - currentRow;
            const nextTarget = currentScroll.current + rowsToMove * tileSize;

            // Car slows down but continues moving
            Animated.timing(scrollY, {
                toValue: nextTarget,
                duration: 4500, // Slower movement to show dangerous situation
                useNativeDriver: true,
            }).start(() => {
                handleFeedback(answer);
            });
        }, 800); // Small delay so jeepney is visible first
        
    } else if (answer === "Change lanes to the left if clear, while reducing speed as you pass") {
        // Start jeepney animation
        animateJeepney("change_lanes");
        
        // Car begins lane change after brief moment
        setTimeout(() => {
            setCarDirection("NORTHWEST");
            
            // Move car to left lane
            Animated.timing(carXAnim, {
                toValue: width / 2 - carWidth / 2 - tileSize * 0.8,
                duration: 1200,
                useNativeDriver: true,
            }).start(() => {
                // Straighten out and continue forward
                setCarDirection("NORTH");
                
                const targetRow = 10.5;
                const rowsToMove = targetRow - currentRow;
                const nextTarget = currentScroll.current + rowsToMove * tileSize;
                
                Animated.timing(scrollY, {
                    toValue: nextTarget,
                    duration: 3000,
                    useNativeDriver: true,
                }).start(() => {
                    handleFeedback(answer);
                });
            });
        }, 1000);
        
    } else if(answer === "Stop completely and wait for the jeepney to finish its maneuver before proceeding"){
        // Car stops immediately
        setCarPaused(true);
        
        // Start jeepney animation - it will complete its turn
        animateJeepney("stop_and_wait");
        
        // Wait for jeepney to complete maneuver and clear the area
        setTimeout(() => {
            setCarPaused(false);
            
            const targetRow = 10;
            const rowsToMove = targetRow - currentRow;
            const nextTarget = currentScroll.current + rowsToMove * tileSize;
            
            // Car resumes after jeepney is clear
            Animated.timing(scrollY, {
                toValue: nextTarget,
                duration: 2000,
                useNativeDriver: true,
            }).start(() => {
                handleFeedback(answer);
            });
        }, 5500); // Wait for jeepney to fully clear (5.5 seconds)
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    setShowJeepney(false);
    
    // Reset car position and visibility
    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setCarPaused(false);
    
    // Reset jeepney
    jeepneyXAnim.setValue(-carWidth);
    jeepneyYAnim.setValue(0);
    setJeepneyDirection("EAST");
    setJeepneyFrame(0);
    
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
      // Move to next scenario
      moveToNextScenario();
      const nextScreen = `S${currentScenario + 1}P1`;
      router.push(`/scenarios/intersection/phase1/${nextScreen}`);
    }
  };

  // Calculate traffic Sign position
  const trafficSignLeft = trafficSignColIndex * tileSize + trafficSignXOffset;
  const trafficSignTop = trafficSignRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct!  When a vehicle is already occupying part of your travel path at an intersection, the safest action is to stop and allow it to complete its maneuver. This prevents accidents and follows proper defensive driving principles."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  // Ensure car sprite exists for current direction
  const currentCarSprite = carSprites[carDirection] && carSprites[carDirection][carFrame] 
    ? carSprites[carDirection][carFrame] 
    : carSprites["NORTH"][0];

  // Ensure jeepney sprite exists for current direction
  const currentJeepneySprite = jeepSprites[jeepneyDirection] && jeepSprites[jeepneyDirection][jeepneyFrame]
    ? jeepSprites[jeepneyDirection][jeepneyFrame]
    : jeepSprites["EAST"][0];

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
        
        {/* Traffic Sign */}
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

        {/* Trees */}
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
      </Animated.View>

      {/* Jeepney - positioned relative to map */}
      {showJeepney && (
        <Animated.Image
          source={currentJeepneySprite}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            left: jeepneyXAnim,
            top: jeepneyYAnim,
            zIndex: 7,
          }}
        />
      )}

      {/* Car - fixed */}
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
    fontSize: Math.min(width * 0.04, 18),
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