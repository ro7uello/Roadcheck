import { useSession } from '../../../../contexts/SessionManager';
import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { router } from 'expo-router';
import { scale, fontSize, wp, hp } from '../../../../contexts/ResponsiveHelper';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const jeepWidth = Math.min(width * 0.28, 300);
const jeepHeight = jeepWidth * (350/280);
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Road tiles
const roadTiles = {
    road20: require("../../../../../assets/road/road20.png"),
    road8: require("../../../../../assets/road/road8.png"),
    road69: require("../../../../../assets/road/road69.png"),
    road73: require("../../../../../assets/road/road73.png"),
    road6: require("../../../../../assets/road/road6.png"),
};

// Map layout
const mapLayout = [
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
  ["road20", "road8", "road73", "road20", "road20"],
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

const questions = [
  {
    question: "You're on a winding provincial road with broken yellow lines in the center. You want to overtake a jeepney, but there's a curve ahead limiting visibility.",
    options: [
      "Overtake quickly before the curve since broken lines allow it",
      "Wait until after the curve when you have clear visibility",
      "Follow closely behind the jeepney to overtake at the first opportunity"
    ],
    correct: "Wait until after the curve when you have clear visibility",
    wrongExplanation: {
      "Overtake quickly before the curve since broken lines allow it": "Accident Prone! Broken lines allow overtaking but don't override the need for adequate visibility and safety.",
      "Follow closely behind the jeepney to overtake at the first opportunity": "Accident Prone! Following too closely is dangerous and doesn't improve overtaking opportunities safely."
    }
  },
  // Add more questions here
];

export default function DrivingGame() {

  const {
  updateScenarioProgress,
  moveToNextScenario,
  completeSession,
  currentScenario,
  sessionData
} = useSession();

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

  const [isPlayerCarVisible, setIsPlayerCarVisible] = useState(true);
  const [isJeepneyVisible, setIsJeepneyVisible] = useState(true);
  const [showTrafficJam, setShowTrafficJam] = useState(false);
  const [showHonking, setShowHonking] = useState(false);
  const [showCurveWarning, setShowCurveWarning] = useState(false);
  const [showDangerWarning, setShowDangerWarning] = useState(false);
  const [showTailgatingWarning, setShowTailgatingWarning] = useState(false);
  const [showClearVisibility, setShowClearVisibility] = useState(false);

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

  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;
  const carYAnim = useRef(new Animated.Value(height * 0.1)).current;

  // Jeepney's X position
  const jeepneyLane = 2;
  const jeepneyInitialX = jeepneyLane * tileSize + (tileSize / 2 - jeepWidth / 2);
  const jeepneyYAnim = useRef(new Animated.Value(-jeepHeight)).current;

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
  const jeepneyAnimationRef = useRef(null);

  function startScrollAnimation() {
    scrollY.setValue(0);
    jeepneyYAnim.setValue(-jeepHeight);

    // Continuous looping background scroll
    scrollAnimationRef.current = Animated.loop(
      Animated.timing(scrollY, {
        toValue: -mapHeight,
        duration: mapHeight * 10,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    scrollAnimationRef.current.start();

    // Animate jeepney into view from the top
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
    startScrollAnimation();
    return () => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
          jeepneyAnimationRef.current.stop();
      }
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

  // Reckless overtake before curve animation - purely educational demonstration
  const animateRecklessOvertakeBeforeCurve = async () => {
    try {
      // Stop continuous scroll
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

      setPlayerCarFrame(0);
      setJeepneyFrame(0);

      // 1. Show curve warning first
      setShowCurveWarning(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2. Player car starts aggressive overtaking maneuver
      await new Promise(resolve => {
          setPlayerCarDirection("NORTHWEST");
          Animated.parallel([
              Animated.timing(carXAnim, {
                  toValue: 1 * tileSize + (tileSize / 2 - carWidth / 2),
                  duration: 400,
                  easing: Easing.easeOut,
                  useNativeDriver: false,
              }),
              Animated.timing(scrollY, {
                  toValue: scrollY._value - (tileSize * 2),
                  duration: 800,
                  easing: Easing.easeOut,
                  useNativeDriver: true,
              })
          ]).start(resolve);
      });

      // 3. Continue moving forward in opposite lane (dangerous position)
      await new Promise(resolve => {
          setPlayerCarDirection("NORTH");
          Animated.parallel([
              Animated.timing(scrollY, {
                  toValue: scrollY._value - (tileSize * 2),
                  duration: 600,
                  easing: Easing.linear,
                  useNativeDriver: true,
              }),
              Animated.timing(jeepneyYAnim, {
                  toValue: height * 1,
                  duration: 800,
                  easing: Easing.linear,
                  useNativeDriver: true,
              })
          ]).start(resolve);
      });

      // 4. Show warning about dangerous visibility
      setShowDangerWarning(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      setShowDangerWarning(false);

      // 5. Hide curve warning
      setShowCurveWarning(false);
    setShowDangerWarning(false);
    setShowTailgatingWarning(false);
    setShowClearVisibility(false);

      // 6. Return to proper lane after completing unsafe maneuver
      await new Promise(resolve => {
          setPlayerCarDirection("NORTHEAST");
          Animated.timing(carXAnim, {
              toValue: width / 2 - carWidth / 2,
              duration: 400,
              easing: Easing.easeOut,
              useNativeDriver: false,
          }).start(resolve);
      });

      // 7. Reset everything
      setPlayerCarDirection("NORTH");

    } catch (error) {
      console.error('Error in animateRecklessOvertakeBeforeCurve:', error);
      setShowCurveWarning(false);
    }
  };

  // Simplified collision animation (without NPC car)
  const animateCollision = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

    // First animation: Move to side lane
    await new Promise(resolve => {
        setPlayerCarDirection("NORTH");
        Animated.parallel([
            Animated.timing(carXAnim, {
                toValue: 2 * tileSize + (tileSize / 2 - carWidth / 2),
                duration: 1500,
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * .3),
                duration: 1500,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // Second animation: Move forward to close distance with jeepney
    await new Promise(resolve => {
        const moveDistance = tileSize * 0.1;
        Animated.parallel([
            Animated.timing(carYAnim, {
                toValue: carYAnim._value + moveDistance, // Move car up (closing distance)
                duration: 800,
                easing: Easing.easeInOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - moveDistance,
                duration: 800,
                easing: Easing.easeInOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    setPlayerCarDirection("NORTH");

    // Show tailgating warning
    setShowTailgatingWarning(true);
    setTimeout(() => setShowTailgatingWarning(false), 2000);

    // Shake player car to simulate dangerous tailgating
    const currentCarX = carXAnim._value;
    const shakePlayer = Animated.sequence([
      Animated.timing(carXAnim, { toValue: currentCarX + 20, duration: 50, useNativeDriver: false }),
      Animated.timing(carXAnim, { toValue: currentCarX - 20, duration: 50, useNativeDriver: false }),
      Animated.timing(carXAnim, { toValue: currentCarX + 20, duration: 50, useNativeDriver: false }),
      Animated.timing(carXAnim, { toValue: currentCarX, duration: 50, useNativeDriver: false }),
    ]);

    await new Promise(resolve => shakePlayer.start(resolve));
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Reset positions
    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    carYAnim.setValue(height * 0.1);
  };

  const animateSafeOvertake = async () => {
    try {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

      // 1. Show curve warning to establish the hazard
      setShowCurveWarning(true);
      setPlayerCarDirection("NORTH");

      // Player car maintains safe following distance behind jeepney
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Player demonstrates patience - stays behind jeepney through the curve
      await new Promise(resolve => {
        Animated.parallel([
          // Both vehicles move together through the curve
          Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 0.3),
            duration: 2000,
            easing: Easing.easeInOut,
            useNativeDriver: true,
          }),
          Animated.timing(jeepneyYAnim, {
            toValue: jeepneyYAnim._value + (tileSize * 0.1),
            duration: 2000,
            easing: Easing.easeInOut,
            useNativeDriver: true,
          })
        ]).start(resolve);
      });

      // 3. Clear the curve - visibility improves
      setShowCurveWarning(false);

      // Show "Clear Road Ahead" indicator
      setShowClearVisibility(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowClearVisibility(false);

      // 4. Signal and move to passing lane safely
      await new Promise(resolve => {
        setPlayerCarDirection("NORTHWEST");
        Animated.timing(carXAnim, {
          toValue: 1 * tileSize + (tileSize / 2 - carWidth / 2),
          duration: 1500, // Slower, more deliberate lane change
          easing: Easing.easeInOut,
          useNativeDriver: false,
        }).start(resolve);
      });

      // 5. Accelerate past the jeepney with clear visibility ahead
      await new Promise(resolve => {
        setPlayerCarDirection("NORTH");
        Animated.parallel([
          Animated.timing(jeepneyYAnim, {
            toValue: height + jeepHeight,
            duration: 2000,
            easing: Easing.easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 2.5),
            duration: 2000,
            easing: Easing.easeOut,
            useNativeDriver: true,
          })
        ]).start(resolve);
      });

      setIsJeepneyVisible(false);

      // 6. Return to proper lane after safe distance
      await new Promise(resolve => {
        setPlayerCarDirection("NORTHEAST");
        Animated.parallel([
          Animated.timing(carXAnim, {
            toValue: width / 2 - carWidth / 2,
            duration: 1200,
            easing: Easing.easeInOut,
            useNativeDriver: false,
          }),
          Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 0.8),
            duration: 1200,
            easing: Easing.easeOut,
            useNativeDriver: true,
          })
        ]).start(resolve);
      });

      // 7. Continue normal driving
      setPlayerCarDirection("NORTH");

      // Resume normal scroll animation
      if (scrollAnimationRef.current) scrollAnimationRef.current.start();
      setIsPlayerCarVisible(true);

    } catch (error) {
      console.error('Error in animateSafeOvertake:', error);
      setShowCurveWarning(false);
      setPlayerCarDirection("NORTH");
      const centerX = width / 2 - carWidth / 2;
      carXAnim.setValue(centerX);
    }
  };

  const handleAnswer = async (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    await updateProgress(answer, isCorrect);

    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.start();
    }

    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

    if (answer === questions[questionIndex].correct) {
      animateSafeOvertake();
      handleFeedback(answer);
    } else if (answer === "Overtake quickly before the curve since broken lines allow it") {
      animateRecklessOvertakeBeforeCurve();
      handleFeedback(answer);
    } else if (answer === "Follow closely behind the jeepney to overtake at the first opportunity") {
      animateCollision();
      handleFeedback(answer);
    }
  };

const handleNext = async () => {
  setAnimationType(null);
  setShowNext(false);
  setSelectedAnswer(null);
  setIsCorrectAnswer(null);
  setPlayerCarFrame(0);
  setJeepneyFrame(0);
  setShowCurveWarning(false);

  const centerX = width / 2 - carWidth / 2;
  carXAnim.setValue(centerX);
  carYAnim.setValue(height * 0.1);
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
    

  setShowQuestion(false);
  if (scrollAnimationRef.current) {
    scrollAnimationRef.current.stop();
  }
  if (jeepneyAnimationRef.current) {
    jeepneyAnimationRef.current.stop();
  }
};

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Even with broken yellow lines permitting overtaking, you must have clear visibility of oncoming traffic."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

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

      {/* Curve Warning Effect */}
      {showCurveWarning && (
        <View style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: width,
          height: height * 0.4,
          backgroundColor: "rgba(255, 200, 0, 0.3)",
          zIndex: 8,
          justifyContent: "center",
          alignItems: "center",
        }}>
          <View style={{
            backgroundColor: "rgba(255, 255, 0, 0.9)",
            padding: 15,
            borderRadius: 10,
            borderWidth: 3,
            borderColor: "orange",
            alignItems: "center",
          }}>
            <Text style={{
              color: "black",
              fontSize: 20,
              fontWeight: "bold",
              textAlign: "center",
            }}>
              ⚠️ CURVE AHEAD ⚠️
            </Text>
            <Text style={{
              color: "black",
              fontSize: 16,
              textAlign: "center",
              marginTop: 5,
            }}>
              Limited Visibility!
            </Text>
            <Text style={{
              color: "red",
              fontSize: 14,
              textAlign: "center",
              marginTop: 5,
              fontWeight: "bold",
            }}>
              Cannot see oncoming traffic
            </Text>
          </View>
        </View>
      )}

      {/* Tailgating Warning */}
      {showTailgatingWarning && (
        <View style={{
          position: "absolute",
          top: "15%",
          left: 0,
          width: width,
          alignItems: "center",
          zIndex: 15,
        }}>
          <View style={{
            backgroundColor: "rgba(255, 100, 0, 0.9)",
            padding: 15,
            borderRadius: 10,
            borderWidth: 3,
            borderColor: "orange",
            alignItems: "center",
          }}>
            <Text style={{
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              textAlign: "center",
            }}>
              ⚠️ TOO CLOSE!
            </Text>
            <Text style={{
              color: "white",
              fontSize: 14,
              textAlign: "center",
              marginTop: 5,
            }}>
              Dangerous tailgating!
            </Text>
          </View>
        </View>
      )}

      {/* Clear Visibility Warning */}
      {showClearVisibility && (
        <View style={{
          position: "absolute",
          top: "20%",
          left: 0,
          width: width,
          alignItems: "center",
          zIndex: 15,
        }}>
          <View style={{
            backgroundColor: "rgba(0, 255, 0, 0.9)",
            padding: 15,
            borderRadius: 10,
            borderWidth: 3,
            borderColor: "green",
            alignItems: "center",
          }}>
            <Text style={{
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              textAlign: "center",
            }}>
              ✓ CLEAR VISIBILITY
            </Text>
            <Text style={{
              color: "white",
              fontSize: 14,
              textAlign: "center",
              marginTop: 5,
            }}>
              Safe to overtake
            </Text>
          </View>
        </View>
      )}

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

      {/* Responsive Player Car */}
      {isPlayerCarVisible && (
        <Animated.Image
          source={playerCarSprites[playerCarDirection][playerCarFrame]}
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
  introSubtitle: {
    color: "#aaa",
    fontSize: Math.min(width * 0.05, 22),
    textAlign: "center",
    marginBottom: height * 0.02,
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
    width: wp(100),
    height: hp(35),
    backgroundColor: "rgba(8, 8, 8, 0.43)",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: 0,
    zIndex: 10,
  },
  ltoImage: {
    width: wp(30),
    height: hp(25),
    resizeMode: "contain",
    marginLeft: scale(-15),
    marginBottom: scale(-50),
  },
  questionBox: {
    flex: 1,
    bottom: hp(10),
    alignItems: "center",
    justifyContent: "center",
  },
  questionTextContainer: {
    padding: scale(10),
    maxWidth: wp(70),
  },
  questionText: {
    flexWrap: "wrap",
    color: "white",
    fontSize: fontSize(18),
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: fontSize(24),
  },
  answersContainer: {
    position: "absolute",
    top: hp(15),
    right: wp(5),
    width: wp(35),
    height: hp(21),
    zIndex: 11,
  },
  answerButton: {
    backgroundColor: "#333",
    padding: scale(12),
    borderRadius: scale(8),
    marginBottom: scale(10),
    borderWidth: 1,
    borderColor: "#555",
    minHeight: scale(50),
    justifyContent: "center",
  },
  answerText: {
    color: "white",
    fontSize: fontSize(14),
    textAlign: "center",
    lineHeight: fontSize(18),
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