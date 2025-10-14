import { useSession } from '../../../../contexts/SessionManager';
import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// --- ../../../assets and tiles (same as yours) ---
const roadTiles = {
    road1: require("../../../../../assets/road/road1.png"),
    road2: require("../../../../../assets/road/road2.png"),
    road3: require("../../../../../assets/road/road3.png"),
    road4: require("../../../../../assets/road/road4.png"),
    road9: require("../../../../../assets/road/road9.png"),
    road10: require("../../../../../assets/road/road10.png"),
    road11: require("../../../../../assets/road/road11.png"),
    road13: require("../../../../../assets/road/road13.png"),
    road15: require("../../../../../assets/road/road15.png"),
    road16: require("../../../../../assets/road/road16.png"),
    road17: require("../../../../../assets/road/road17.png"),
    road20: require("../../../../../assets/road/road20.png"),
    road22: require("../../../../../assets/road/road22.png"),
    road23: require("../../../../../assets/road/road23.png"),
    road24: require("../../../../../assets/road/road24.png"),
    road31: require("../../../../../assets/road/road31.png"),
    road37: require("../../../../../assets/road/road37.png"),
    road43: require("../../../../../assets/road/road43.png"),
    road47: require("../../../../../assets/road/road47.png"),
    road48: require("../../../../../assets/road/road48.png"),
    road50: require("../../../../../assets/road/road50.png"),
    road51: require("../../../../../assets/road/road51.png"),
    road52: require("../../../../../assets/road/road52.png"),
    road53: require("../../../../../assets/road/road52.png"),
    road54: require("../../../../../assets/road/road54.png"),
    road55: require("../../../../../assets/road/road54.png"),
    road56: require("../../../../../assets/road/road56.png"),
    road61: require("../../../../../assets/road/road61.png"),
    road62: require("../../../../../assets/road/road62.png"),
    road63: require("../../../../../assets/road/road63.png"),
    int1: require("../../../../../assets/road/int1.png"),
    int4: require("../../../../../assets/road/int4.png"),
    int9: require("../../../../../assets/road/int9.png"),
    int10: require("../../../../../assets/road/int10.png"),
    int12: require("../../../../../assets/road/int12.png"),
    int13: require("../../../../../assets/road/int13.png"),
    int14: require("../../../../../assets/road/int14.png"),
    int15: require("../../../../../assets/road/int15.png"),
};

const mapLayout = [
  ["road62", "road4", "road2", "road3", "road17"],
  ["road62", "road4", "road2", "road3", "road17"],
  ["road62", "road4", "road2", "road3", "road17"],
  ["road62", "road4", "road2", "road3", "road17"],
  ["road62", "road4", "road2", "road3", "road17"],
  ["road63", "road4", "road2", "road3", "road17"],
  ["road15", "road15", "road15", "road56", "road50"],
  ["int12", "int12", "int12", "int4", "road55"],
  ["road48", "road48", "int14", "int13", "road54"],
  ["int15", "int14", "road48", "int13", "road54"],
  ["int14", "int15", "road48", "int13", "road54"],
  ["road48", "road48", "int15", "int13", "road54"],
  ["int10", "int10", "int10", "int1", "road47"],
  ["road15", "road15", "road15", "road56", "road16"],
  ["road61", "road9", "road13", "road11", "road17"],
  ["road62", "road1", "road1", "road1", "road17"],
  ["road62", "road1", "road1", "road1", "road17"],
  ["road62", "road1", "road1", "road1", "road17"],
  ["road62", "road4", "road2", "road3", "road17"],
  ["road62", "road4", "road2", "road3", "road17"],
  ["road62", "road4", "road2", "road3", "road17"],
  ["road62", "road4", "road2", "road3", "road17"],
  ["road62", "road4", "road2", "road3", "road17"],
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
  NORTH: [
    require("../../../../../assets/car/SEDAN TOPDOWN/Magenta/MOVE/NORTH/SEPARATED/Magenta_SEDAN_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/SEDAN TOPDOWN/Magenta/MOVE/NORTH/SEPARATED/Magenta_SEDAN_CLEAN_NORTH_001.png"),
  ],
};

// Updated question structure following S9P1 format
const questions = [
  {
    question: "You're approaching an intersection with solid white lines leading to the junction. You realize you're in the wrong lane for your intended direction.",
    options: ["Quickly change lanes before the intersection despite the solid lines", "Stop and reverse to get in the correct lane", "Continue straight and find another route to your destination"],
    correct: "Continue straight and find another route to your destination",
    wrongExplanation: {
      "Quickly change lanes before the intersection despite the solid lines": "Accident prone! Quickly changing lanes may surprise drivers on the other lane and may cause accidents due to unexpected change of lanes.",
      "Stop and reverse to get in the correct lane": "Accident prone! Reversing may surprise drivers behind you and on the other lane. This may cause accidents due to unexpected driving behavior."
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

  const currentScenario = 10; 

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

  const [isCarVisible, setIsCarVisible] = useState(true);

  const startOffset = -(mapHeight - height);

  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

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
  const [carDirection, setCarDirection] = useState("NORTH");
  const [carFrame, setCarFrame] = useState(0);
  
  // NPC frozen state
  const [npcFrozen, setNpcFrozen] = useState(false);

  // NPC cars state - Initialize with refs for animation
  const npc1YAnim = useRef(new Animated.Value(height * 0.8)).current;
  const npc2YAnim = useRef(new Animated.Value(height * 0.8)).current;
  const [npc1Frame, setNpc1Frame] = useState(0);
  const [npc2Frame, setNpc2Frame] = useState(0);
  const npcAnimationRef = useRef(null);

  // Responsive car positioning
  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;
  const carYAnim = useRef(new Animated.Value(height * 0.1)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // NPC car frame animation
  useEffect(() => {
    if (npcFrozen) return;
    
    const interval = setInterval(() => {
      setNpc1Frame((prev) => (prev + 1) % 2);
      setNpc2Frame((prev) => (prev + 1) % 2);
    }, 500);
    return () => clearInterval(interval);
  }, [npcFrozen]);

  // Animate NPC cars moving forward continuously
  useEffect(() => {
    if (npcFrozen) return;

    const animateNPCs = () => {
      npcAnimationRef.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(npc1YAnim, {
              toValue: height * 0.7,
              duration: 7000,
              useNativeDriver: false,
            }),
            Animated.timing(npc1YAnim, {
              toValue: height * 0.8,
              duration: 0,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(npc2YAnim, {
              toValue: height * 0.7,
              duration: 7000,
              useNativeDriver: false,
            }),
            Animated.timing(npc2YAnim, {
              toValue: height * 0.8,
              duration: 0,
              useNativeDriver: false,
            }),
          ]),
        ])
      );
      npcAnimationRef.current.start();
    };

    animateNPCs();

    return () => {
      if (npcAnimationRef.current) {
        npcAnimationRef.current.stop();
      }
    };
  }, [npcFrozen, npc1YAnim, npc2YAnim]);

  // Car animation frame cycling
  function animateTurnLeft(onComplete) {
    const sequence = ["NORTH", "NORTHWEST", "WEST"];
    let step = 0;
    const interval = setInterval(() => {
      setCarDirection(sequence[step]);
      setCarFrame(0);
      step++;
      if (step >= sequence.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 300);
  }

  function animateTurnRight(onComplete) {
    const sequence = ["NORTH", "NORTHEAST", "EAST"];
    let step = 0;
    const interval = setInterval(() => {
      setCarDirection(sequence[step]);
      setCarFrame(0);
      step++;
      if (step >= sequence.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 300);
  }

  function startScrollAnimation() {
    scrollY.setValue(startOffset);

    const stopRow = 6.5;
    const stopOffset = startOffset + stopRow * tileSize;

    Animated.timing(scrollY, {
      toValue: stopOffset,
      duration: 4000,
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

    // Freeze NPC animations when answer is selected
    setNpcFrozen(true);
    if (npcAnimationRef.current) {
      npcAnimationRef.current.stop();
    }

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    updateProgress(answer, isCorrect);
    
    const currentRow = Math.abs(currentScroll.current - startOffset) / tileSize;

    if (answer === "Continue straight and find another route to your destination") {
      setNpcFrozen(true);
      const targetRow = 17;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 3000,
        useNativeDriver: true,
      }).start(() => handleFeedback(answer));

    } else if (answer === "Quickly change lanes before the intersection despite the solid lines") {
        setNpcFrozen(true);

      const turnStartRow = 6.5;
      const initialScrollTarget =
        currentScroll.current + (turnStartRow - currentRow) * tileSize;

      Animated.timing(scrollY, {
        toValue: initialScrollTarget,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setCarDirection("NORTHWEST");
        
        Animated.parallel([
          Animated.timing(carXAnim, {
            toValue: (width / 2 - carWidth / 2) - tileSize,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ]).start(() => {
          setCarDirection("NORTH");
          
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 3,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            setCarDirection("WEST");
            setTimeout(() => {
              Animated.timing(carXAnim, {
                toValue: (width / 2 - carWidth / 2) - tileSize * 2,
                duration: 1000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: false,
              }).start(() => {
                Animated.timing(carXAnim, {
                  toValue: -width,
                  duration: 1500,
                  easing: Easing.inOut(Easing.ease),
                  useNativeDriver: false,
                }).start(() => {
                  setIsCarVisible(false);
                  handleFeedback(answer);
                });
              });
            }, 200);
          });
        });
      });
    } else if (answer === "Stop and reverse to get in the correct lane") {
      const turnStartRow = 6.5;
      const initialScrollTarget =
        currentScroll.current + (turnStartRow - currentRow) * tileSize;

      Animated.timing(scrollY, {
        toValue: initialScrollTarget,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        setCarDirection("NORTH");
        setCarFrame(0);

        // Only blue car reverses, NPC cars stay frozen
        Animated.timing(carYAnim, {
          toValue: carYAnim.__getValue() - height * 0.1,
          duration: 2000,
          useNativeDriver: false,
        }).start(() => {
          handleFeedback(answer);
        });
      });
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setCarFrame(0);

    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    carYAnim.setValue(height * 0.1);
    npc1YAnim.setValue(height * 0.8);
    npc2YAnim.setValue(height * 0.8);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setNpcFrozen(false);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      const currentFileScenario = 10;
      
      if (currentFileScenario >= 10) {
        try {
          const sessionResults = await completeSession();
          if (sessionResults) {
            router.push({
              pathname: '/result-page',
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
    }
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Solid white lines discourage crossing, you may even get a violation ticket if you did this near an intersection. It is safer to just continue and find another route towards your destination"
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

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
      </Animated.View>

      {/* NPC Car 1 - Behind player, same lane */}
      <Animated.Image
        source={npcCarSprites.NORTH[npc1Frame]}
        style={{
          width: carWidth,
          height: carHeight,
          position: "absolute",
          top: npc1YAnim,
          left: width / 2 - carWidth / 2,
          zIndex: 4,
        }}
      />

      {/* NPC Car 2 - Behind player, right lane */}
      <Animated.Image
        source={npcCarSprites.NORTH[npc2Frame]}
        style={{
          width: carWidth,
          height: carHeight,
          position: "absolute",
          top: npc2YAnim,
          left: (width / 2 - carWidth / 2) + tileSize,
          zIndex: 4,
        }}
      />

      {/* Responsive Car */}
      {isCarVisible && (
        <Animated.Image
          source={carSprites[carDirection][carFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: carYAnim,
            left: carXAnim,
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

      {/* Responsive Feedback */}
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