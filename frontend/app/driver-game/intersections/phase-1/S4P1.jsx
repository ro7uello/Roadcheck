import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { router } from 'expo-router';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

const roadTiles = {
  road1: require("../../../../assets/road/road1.png"),
  road2: require("../../../../assets/road/road2.png"),
  road3: require("../../../../assets/road/road3.png"),
  road4: require("../../../../assets/road/road4.png"),
  road17: require("../../../../assets/road/road17.png"),
  road18: require("../../../../assets/road/road18.png"),
  road20: require("../../../../assets/road/road20.png"),
  road48: require("../../../../assets/road/road48.png"),
  road70: require("../../../../assets/road/road70.png"),
  road87: require("../../../../assets/road/road87.png"),
  road88: require("../../../../assets/road/road88.png"),
  road89: require("../../../../assets/road/road89.png"),
  road90: require("../../../../assets/road/road90.png"),
  road91: require("../../../../assets/road/road91.png"),
};

const mapLayout = [
  ["road3", "road90", "road91", "road4", "road3"],
  ["road3", "road90", "road91", "road4", "road3"],
  ["road3", "road90", "road91", "road4", "road3"],
  ["road3", "road90", "road91", "road4", "road3"],
  ["road3", "road90", "road91", "road4", "road3"],
  ["road48", "road88", "road89", "road48", "road70"],
  ["road87", "road48", "road48", "road70", "road20"],
  ["road18", "road1", "road1", "road17", "road20"],
  ["road18", "road1", "road1", "road17", "road20"],
  ["road18", "road1", "road1", "road17", "road20"],
  ["road18", "road1", "road1", "road17", "road20"],
  ["road18", "road1", "road1", "road17", "road20"],
  ["road18", "road1", "road1", "road17", "road20"],
];

const carSprites = {
  NORTH: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHWEST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_001.png"),
  ],
  WEST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_001.png"),
  ],
  SOUTH: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTH/SEPARATED/Blue_CIVIC_CLEAN_SOUTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTH/SEPARATED/Blue_CIVIC_CLEAN_SOUTH_001.png"),
  ],
  SOUTHWEST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTHWEST/SEPARATED/Blue_CIVIC_CLEAN_SOUTHWEST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTHWEST/SEPARATED/Blue_CIVIC_CLEAN_SOUTHWEST_001.png"),
  ],
};

const busSprites = {
  SOUTH: [
    require("../../../../assets/car/BUS TOPDOWN/Yellow/MOVE/SOUTH/SEPARATED/Yellow_BUS_CLEAN_SOUTH_000.png"),
    require("../../../../assets/car/BUS TOPDOWN/Yellow/MOVE/SOUTH/SEPARATED/Yellow_BUS_CLEAN_SOUTH_001.png"),
  ],
  SOUTHWEST: [
    require("../../../../assets/car/BUS TOPDOWN/Yellow/MOVE/SOUTHWEST/SEPARATED/Yellow_BUS_CLEAN_SOUTHWEST_000.png"),
    require("../../../../assets/car/BUS TOPDOWN/Yellow/MOVE/SOUTHWEST/SEPARATED/Yellow_BUS_CLEAN_SOUTHWEST_001.png"),
  ],
};

const treeSprites = {
  tree1: require("../../../../assets/tree/Tree3_idle_s.png"),
};

const treePositions = [
  // right side trees
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
];

const questions = [
  {
    question: "While driving up to Baguio, you encounter a Y-Junction ahead warning sign. The road splits with signs showing Session Road ⬅ and Burnham Park ➡. You're heading to Session Road, and there's a bus coming from the opposite direction.",
    options: ["Take the left fork immediately without signaling", "Signal left, slow down, and yield to oncoming traffic before turning", "Follow the bus since it's bigger and knows the way"],
    correct: "Signal left, slow down, and yield to oncoming traffic before turning",
    wrongExplanation: {
      "Take the left fork immediately without signaling": "Wrong! Not signaling is dangerous. Other drivers need to know your intentions.",
      "Follow the bus since it's bigger and knows the way": "Wrong! Following another vehicle without making your own traffic safety decisions is dangerous and may lead you to the wrong destination."
    }
  },
  // Add more questions here as needed
];

const trafficSign = {
  sign: require("../../../../assets/signs/dir_sign_2.png"),
};

export default function DrivingGame() {

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isCarVisible, setIsCarVisible] = useState(true);

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  // Traffic Sign position
  const trafficSignRowIndex = 7;
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
  
  // Bus
  const [busVisible, setBusVisible] = useState(false);
  const [busDirection, setBusDirection] = useState("SOUTH");
  const [busFrame, setBusFrame] = useState(0);
  const busXAnim = useRef(new Animated.Value(width / 2 + carWidth / 2)).current;
  const busYAnim = useRef(new Animated.Value(-carHeight)).current;

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopRow = 4.5;
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

  // Bus sprite frame loop
  useEffect(() => {
    let iv;
    if (busVisible && busSprites[busDirection]) {
      iv = setInterval(() => {
        setBusFrame((p) => (p + 1) % busSprites[busDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [busVisible, busDirection]);

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

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);

    // Answer 1: Take the left fork immediately without signaling
    if (answer === "Take the left fork immediately without signaling") {
      const turnStartRow = 5;
      const initialScrollTarget = currentScroll.current + (turnStartRow - currentRow) * tileSize;

      Animated.timing(scrollY, {
        toValue: initialScrollTarget,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        const turnSequence = ["NORTHWEST", "NORTH"];
        let currentTurnStep = 0;

        const animateTurnAndMove = () => {
          if (currentTurnStep < turnSequence.length) {
            setCarDirection(turnSequence[currentTurnStep]);
            setCarFrame(0);

            let deltaX = 0;
            let deltaYScroll = 0;

            if (turnSequence[currentTurnStep] === "NORTHWEST") {
              deltaX = -tileSize / .5;
              deltaYScroll = tileSize / 1;
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
            const finalScrollTarget = scrollY._value + tileSize * 3;
            Animated.timing(scrollY, {
              toValue: finalScrollTarget,
              duration: 2000,
              useNativeDriver: true,
            }).start(() => {
              handleFeedback(answer);
            });
          }
        };
        animateTurnAndMove();
      });
      return;
    }

    // Answer 2: Signal left, slow down, and yield to oncoming traffic before turning
    else if (answer === "Signal left, slow down, and yield to oncoming traffic before turning") {
      const busStartRow = 7;
      const busAppearTarget = currentScroll.current + (busStartRow - currentRow - 2) * tileSize;

      Animated.timing(scrollY, {
        toValue: busAppearTarget,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        // Show bus
        setBusVisible(true);
        setBusDirection("SOUTH");
        const busStartX = width / 3 + carWidth / 3;
        const busStartY = -height * 1;
        busXAnim.setValue(busStartX);
        busYAnim.setValue(busStartY);

        // Bus lane change animation
        setTimeout(() => {
          const busLaneChangeSequence = ["SOUTHWEST", "SOUTH"];
          let busStep = 0;

          const animateBusLaneChange = () => {
            if (busStep < busLaneChangeSequence.length) {
              setBusDirection(busLaneChangeSequence[busStep]);
              setBusFrame(0);

              let busDeltaX = 0;
              let busDeltaY = 0;

              if (busLaneChangeSequence[busStep] === "SOUTHWEST") {
                busDeltaX = -tileSize / .5;
                busDeltaY = tileSize / 2;
              } else if (busLaneChangeSequence[busStep] === "SOUTH") {
                busDeltaY = tileSize;
              }

              Animated.parallel([
                Animated.timing(busXAnim, {
                  toValue: busXAnim._value + busDeltaX,
                  duration: 400,
                  useNativeDriver: false,
                }),
                Animated.timing(busYAnim, {
                  toValue: busYAnim._value + busDeltaY,
                  duration: 400,
                  useNativeDriver: false,
                }),
              ]).start(() => {
                busStep++;
                animateBusLaneChange();
              });
            } else {
              // Bus continues down and disappears
              Animated.timing(busYAnim, {
                toValue: height + carHeight,
                duration: 1500,
                useNativeDriver: false,
              }).start(() => {
                setBusVisible(false);
                
                // Car's turn - slow and safe
                const carTurnStartRow = 5;
                const carTurnTarget = currentScroll.current + (carTurnStartRow - currentRow) * tileSize;
                
                Animated.timing(scrollY, {
                  toValue: carTurnTarget,
                  duration: 1000,
                  useNativeDriver: true,
                }).start(() => {
                  const carTurnSequence = ["NORTHWEST", "NORTH"];
                  let carTurnStep = 0;

                  const animateCarTurn = () => {
                    if (carTurnStep < carTurnSequence.length) {
                      setCarDirection(carTurnSequence[carTurnStep]);
                      setCarFrame(0);

                      let deltaX = 0;
                      let deltaYScroll = 0;

                      if (carTurnSequence[carTurnStep] === "NORTHWEST") {
                        deltaX = -tileSize / .5;
                        deltaYScroll = tileSize / 1;
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
                        carTurnStep++;
                        animateCarTurn();
                      });
                    } else {
                      const finalScrollTarget = scrollY._value + tileSize * 2;
                      Animated.timing(scrollY, {
                        toValue: finalScrollTarget,
                        duration: 1500,
                        useNativeDriver: true,
                      }).start(() => {
                        handleFeedback(answer);
                      });
                    }
                  };
                  animateCarTurn();
                });
              });
            }
          };
          animateBusLaneChange();
        }, 500);
      });
      return;
    }

    // Answer 3: Follow the bus since it's bigger and knows the way
    else if (answer === "Follow the bus since it's bigger and knows the way") {
      const busStartRow = 7;
      const busAppearTarget = currentScroll.current + (busStartRow - currentRow - 2) * tileSize;

      Animated.timing(scrollY, {
        toValue: busAppearTarget,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        // Show bus
        setBusVisible(true);
        setBusDirection("SOUTH");
        const busStartX = width / 3 + carWidth / 3;
        const busStartY = -height * 1;
        busXAnim.setValue(busStartX);
        busYAnim.setValue(busStartY);

        // Bus lane change animation
        setTimeout(() => {
          const busLaneChangeSequence = ["SOUTHWEST", "SOUTH"];
          let busStep = 0;

          const animateBusLaneChange = () => {
            if (busStep < busLaneChangeSequence.length) {
              setBusDirection(busLaneChangeSequence[busStep]);
              setBusFrame(0);

              let busDeltaX = 0;
              let busDeltaY = 0;

              if (busLaneChangeSequence[busStep] === "SOUTHWEST") {
                busDeltaX = -tileSize / .5;
                busDeltaY = tileSize / 1;
              } else if (busLaneChangeSequence[busStep] === "SOUTH") {
                busDeltaY = tileSize;
              }

              Animated.parallel([
                Animated.timing(busXAnim, {
                  toValue: busXAnim._value + busDeltaX,
                  duration: 400,
                  useNativeDriver: false,
                }),
                Animated.timing(busYAnim, {
                  toValue: busYAnim._value + busDeltaY,
                  duration: 400,
                  useNativeDriver: false,
                }),
              ]).start(() => {
                busStep++;
                animateBusLaneChange();
              });
            } else {
              // Bus continues down and disappears
              Animated.timing(busYAnim, {
                toValue: height + carHeight,
                duration: 1500,
                useNativeDriver: false,
              }).start(() => {
                setBusVisible(false);
                
                // Car makes inverted U-turn
                const uTurnStartRow = 6;
                const uTurnTarget = currentScroll.current + (uTurnStartRow - currentRow) * tileSize;
                
                Animated.timing(scrollY, {
                  toValue: uTurnTarget,
                  duration: 1000,
                  useNativeDriver: true,
                }).start(() => {
                  const uTurnSequence = ["NORTH", "NORTHWEST", "WEST", "SOUTHWEST", "SOUTH"];
                  let uTurnStep = 0;

                  const animateUTurn = () => {
                    if (uTurnStep < uTurnSequence.length) {
                      setCarDirection(uTurnSequence[uTurnStep]);
                      setCarFrame(0);

                      let deltaX = 0;
                      let deltaYScroll = 0;

                      if (uTurnSequence[uTurnStep] === "NORTHWEST") {
                        deltaX = -tileSize / 4;
                        deltaYScroll = tileSize / 4;
                      } else if (uTurnSequence[uTurnStep] === "WEST") {
                        deltaX = -tileSize / 3;
                      } else if (uTurnSequence[uTurnStep] === "SOUTHWEST") {
                        deltaX = -tileSize / 4;
                        deltaYScroll = -tileSize / 4;
                      } else if (uTurnSequence[uTurnStep] === "SOUTH") {
                        deltaYScroll = -tileSize / 3;
                      }

                      const currentCarX = carXAnim._value;
                      const currentScrollY = scrollY._value;

                      Animated.parallel([
                        Animated.timing(carXAnim, {
                          toValue: currentCarX + deltaX,
                          duration: 400,
                          useNativeDriver: false,
                        }),
                        Animated.timing(scrollY, {
                          toValue: currentScrollY + deltaYScroll,
                          duration: 400,
                          useNativeDriver: true,
                        }),
                      ]).start(() => {
                        uTurnStep++;
                        animateUTurn();
                      });
                    } else {
                      // Car drives off into wrong direction
                      Animated.timing(carXAnim, {
                        toValue: -width,
                        duration: 2000,
                        useNativeDriver: false,
                      }).start(() => {
                        setIsCarVisible(false);
                        handleFeedback(answer);
                      });
                    }
                  };
                  animateUTurn();
                });
              });
            }
          };
          animateBusLaneChange();
        }, 500);
      });
      return;
    }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    
    // Reset car position and visibility
    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setCarPaused(false);
    
    // Reset bus
    setBusVisible(false);
    setBusDirection("SOUTH");
    setBusFrame(0);
    
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      router.push('/driver-game/intersections/phase-1/S5P1');
      setQuestionIndex(0);
      setShowQuestion(false);
    }
  };

  // Calculate traffic Sign position
  const trafficSignLeft = trafficSignColIndex * tileSize + trafficSignXOffset;
  const trafficSignTop = trafficSignRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! This follows proper intersection protocol - reduce speed when approaching intersections, signal your intention, check for oncoming traffic, and proceed when safe."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  // Ensure car sprite exists for current direction
  const currentCarSprite = carSprites[carDirection] && carSprites[carDirection][carFrame] 
    ? carSprites[carDirection][carFrame] 
    : carSprites["NORTH"][0];

  const currentBusSprite = busSprites[busDirection] && busSprites[busDirection][busFrame]
    ? busSprites[busDirection][busFrame]
    : busSprites["SOUTH"][0];

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

      {/* Bus - animated */}
      {busVisible && (
        <Animated.Image
          source={currentBusSprite}
          style={{
            width: carWidth * 2,
            height: carHeight * 2,
            position: "absolute",
            top: busYAnim,
            left: busXAnim,
            zIndex: 9,
          }}
        />
      )}

      {/* Question overlay */}
      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image
            source={require("../../../../assets/dialog/LTO.png")}
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
          <Image source={require("../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </View>
      )}

      {animationType === "wrong" && (
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
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
    fontSize: Math.min(width * 0.06, 20),
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