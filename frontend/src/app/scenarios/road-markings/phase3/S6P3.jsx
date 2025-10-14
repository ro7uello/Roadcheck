import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../../../config/api';
import { useSession } from '../../../../contexts/SessionManager';
import { scale, fontSize, wp, hp } from '../../../../contexts/ResponsiveHelper';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// --- assets and tiles ---
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
  ["road62", "road4", "road2", "road3", "road17"],
  ["road62", "road4", "road2", "road3", "road17"],
  ["road62", "road4", "road2", "road3", "road17"],
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

// Fallback questions
const fallbackQuestions = [
  {
    question: "You're approaching an intersection in BGC and see white pavement arrows pointing in different directions accompanied by white broken lane lines. You want to turn left, but your lane's arrow points straight.",
    options: ["Follow the pavement arrow direction and go straight", "Turn left anyway since you need to reach your destination", "Change lanes to follow a left-turn arrow if available"],
    correct: "Change lanes to follow a left-turn arrow if available",
    wrongExplanation: {
      "Follow the pavement arrow direction and go straight": "Wrong! If you need to turn left, you should change lanes (when safe) to follow the appropriate directional arrow for your intended turn.",
      "Turn left anyway since you need to reach your destination": "Wrong! Violating lane control arrows is illegal and creates dangerous conflicts with other traffic. You must obey pavement markings."
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

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const scenarioId = 20 + currentScenario;
      await updateScenarioProgress(scenarioId, selectedOption, isCorrect);
    } catch (error) {
      console.error('Error updating scenario progress:', error);
    }
  };

  // Database integration state
  const [questions, setQuestions] = useState(fallbackQuestions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Responsive car positioning
  const centerX = width / 2 - carWidth / 2;
  const carXAnim = useRef(new Animated.Value(centerX)).current;

  const carXCurrent = useRef(centerX);

  useEffect(() => {
    const id = carXAnim.addListener(({ value }) => {
      carXCurrent.current = value;
    });
    return () => carXAnim.removeListener(id);
  }, [carXAnim]);

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Fetch scenario data from database
  useEffect(() => {
    const fetchScenarioData = async () => {
      try {
        console.log('S6P3: Fetching scenario data...');
        console.log('S6P3: API_URL value:', API_URL);

        const token = await AsyncStorage.getItem('access_token');
        console.log('S6P3: Token retrieved:', token ? 'Yes' : 'No');

        const url = `${API_URL}/scenarios/10`;
        console.log('S6P3: Fetching from URL:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('S6P3: Response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('S6P3: Data received:', data);

        if (data && data.scenario) {
          // Transform database response to match frontend format
          const transformedQuestion = {
            question: data.scenario.question_text,
            options: data.choices.map(choice => choice.choice_text),
            correct: data.choices.find(choice => choice.choice_id === data.scenario.correct_choice_id)?.choice_text,
            wrongExplanation: {}
          };

          // Build wrong explanations
          data.choices.forEach(choice => {
            if (choice.choice_id !== data.scenario.correct_choice_id && choice.explanation) {
              transformedQuestion.wrongExplanation[choice.choice_text] = choice.explanation;
            }
          });

          setQuestions([transformedQuestion]);
          console.log('S6P3: ✅ Database questions loaded successfully');
        } else {
          console.log('S6P3: ⚠️ Invalid data structure, using fallback');
          setQuestions(fallbackQuestions);
        }
      } catch (error) {
        console.log('S6P3: ❌ Database error, using fallback questions:', error.message);
        setQuestions(fallbackQuestions);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarioData();
  }, []);

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
    if (!loading) {
      startScrollAnimation();
    }
  }, [loading]);

  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    const isCorrect = answerGiven === currentQuestion.correct;

    updateProgress(answerGiven, isCorrect);

    if (isCorrect) {
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

    const currentRow = Math.abs(currentScroll.current - startOffset) / tileSize;

    // Option A: Follow the pavement arrow direction and go straight (WRONG)
    if (answer === "Follow the pavement arrow direction and go straight") {
      const targetRow = 17;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      
      setCarDirection("NORTH");
      setCarFrame(0);
      
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => handleFeedback(answer));
      
    // Option B: Turn left anyway since you need to reach your destination (WRONG)
    } else if (answer === "Turn left anyway since you need to reach your destination") {
      // FIXED: Smooth 3-phase turn animation with proper sprite transitions
      const centerLane = width / 2 - carWidth / 2;
      const leftLane = width * 0.29 - carWidth / 2;

      console.log('Illegal left turn - Current X:', carXCurrent.current, 'Target left lane:', leftLane);

      const performIllegalLeftTurn = async () => {
        setCarFrame(0);

        // Phase 1: Move NORTH straight to approach intersection (2 tiles)
        setCarDirection("NORTH");
        await new Promise(resolve => {
          Animated.timing(scrollY, {
            toValue: currentScroll.current + (tileSize * 2),
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start(resolve);
        });

        // Phase 2: Transition to NORTHWEST while starting the turn
        setCarDirection("NORTHWEST");
        setCarFrame(0);
        await new Promise(resolve => {
          Animated.parallel([
            Animated.timing(carXAnim, {
              toValue: leftLane,
              duration: 1200,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
              toValue: currentScroll.current + (tileSize * 1.5),
              duration: 1200,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            })
          ]).start(resolve);
        });

        // Phase 3: Complete turn to WEST and exit westward
        setCarDirection("WEST");
        setCarFrame(0);
        await new Promise(resolve => {
          Animated.timing(carXAnim, {
            toValue: -carWidth, // Exit off-screen to the left (west)
            duration: 1200,
            easing: Easing.linear,
            useNativeDriver: false,
          }).start(resolve);
        });

        // Show feedback after complete animation
        handleFeedback(answer);
      };

      performIllegalLeftTurn();
      return;

    // Option C: Change lanes to follow a left-turn arrow if available (CORRECT)
    } else if (answer === "Change lanes to follow a left-turn arrow if available") {
      // Calculate proper lane positions based on road layout
      const centerLane = width / 2 - carWidth / 2;
      const leftLane = width * 0.29 - carWidth / 2;

      console.log('Lane change - Current X:', carXCurrent.current, 'Target left lane:', leftLane);

      // Stop any ongoing animations
      setCarFrame(0);

      // 1. Change lanes to the left lane
      setCarDirection("NORTHWEST");
      Animated.parallel([
        Animated.timing(carXAnim, {
          toValue: leftLane,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(scrollY, {
          toValue: scrollY._value + (tileSize * 0.5),
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      ]).start(async () => {
        // 2. Straighten car in new lane briefly and move north
        setCarDirection("NORTH");
        setCarFrame(0);
        
        await new Promise(resolve => {
          Animated.timing(scrollY, {
            toValue: scrollY._value + (tileSize * 3.5),
            duration: 800,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start(resolve);
        });

        // 3. Turn west
        setCarDirection("WEST");
        setCarFrame(0);
        
        handleFeedback(answer);
      });
    }
  }

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);

    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else if (currentScenario >= 10) {
      const sessionResults = await completeSession();
      navigation.navigate('/result-page', {
        ...sessionResults,
        userAttempts: JSON.stringify(sessionResults.attempts)
      });
    } else {
      moveToNextScenario();
      router.navigate(`/scenarios/road-markings/phase3/S${currentScenario + 1}P3`);
    }
  };

  // Determine feedback message
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! You should change lanes (when safe) to follow the appropriate directional arrow for your intended turn."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

  // Main game rendering
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

      {/* Car */}
      {isCarVisible && (
        <Animated.Image
          source={carSprites[carDirection][carFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: height * 0.1,
            left: carXAnim,
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
    fontSize: Math.min(width * 0.045, 21),
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