import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
  Easing, // <-- import Easing correctly
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { useSession } from '../../../../contexts/SessionManager';

// Debug API_URL at module level
console.log('S10P1 Module loaded. API_URL from env:', API_URL);

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// --- assets and tiles (same as yours) ---
const roadTiles = {
  // ... (keep as you had it) ...
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

// Fallback questions - keep your original questions as backup
const fallbackQuestions = [
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
      currentScenario,
      getScenarioProgress,
      sessionData
    } = useSession();

  // ✅ DATABASE INTEGRATION - Added these 3 state variables
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
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null); // NEW STATE from S9P1 for correct/wrong feedback
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [carDirection, setCarDirection] = useState("NORTH");
  const [carFrame, setCarFrame] = useState(0);

  // Responsive car positioning
  const centerX = width / 2 - carWidth / 2;
  const carXAnim = useRef(new Animated.Value(centerX)).current;

  // keep a reliable ref of current car X without touching private fields
  const carXCurrent = useRef(centerX);

  useEffect(() => {
    const id = carXAnim.addListener(({ value }) => {
      carXCurrent.current = value;
    });
    return () => carXAnim.removeListener(id);
  }, [carXAnim]);

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // ✅ DATABASE INTEGRATION - Added this useEffect to fetch data
  useEffect(() => {
    const fetchScenarioData = async () => {
      try {
        console.log('S10P1: Fetching scenario data...');
        console.log('S10P1: API_URL value:', API_URL);

        const token = await AsyncStorage.getItem('access_token');
        console.log('S10P1: Token retrieved:', token ? 'Yes' : 'No');

        const url = `${API_URL}/scenarios/10`;
        console.log('S10P1: Fetching from URL:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('S10P1: Response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('S10P1: Data received:', data);

        if (data && data.scenario) {
          // Transform database response to match your frontend format
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
          console.log('S10P1: ✅ Database questions loaded successfully');
        } else {
          console.log('S10P1: ⚠️ Invalid data structure, using fallback');
          setQuestions(fallbackQuestions);
        }
      } catch (error) {
        console.log('S10P1: ❌ Database error, using fallback questions:', error.message);
        setQuestions(fallbackQuestions);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarioData();
  }, []);

  // ✅ DATABASE INTEGRATION - Added updateProgress function
  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      if (!sessionData) {
        console.log('No session data available');
        return;
      }

      // Calculate the correct scenario ID for this phase and scenario number
      const scenarioId = ((sessionData.phase_id - 1) * 10) + currentScenario;

      await updateScenarioProgress(scenarioId, selectedOption, isCorrect);
      console.log(`Scenario ${currentScenario} progress updated successfully`);
    } catch (error) {
      console.log('Error updating progress:', error.message);
    }
  };

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
    scrollY.setValue(startOffset); // Ensure scroll starts from bottom for each game start

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

  // ✅ DATABASE INTEGRATION - Modified useEffect to wait for data
  useEffect(() => {
    if (!loading) {
      startScrollAnimation();
    }
  }, [loading]); // Added loading dependency

  // Updated handleFeedback function from S9P1
  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    const isCorrect = answerGiven === currentQuestion.correct;

    // ✅ DATABASE INTEGRATION - Update progress when feedback is shown
    updateProgress(answerGiven, isCorrect); // scenario_id = 10 for S10P1

    if (isCorrect) {
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

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentRow = Math.abs(currentScroll.current - startOffset) / tileSize;

    if (answer === "Continue straight and find another route to your destination") {
      const targetRow = 17;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 3000,
        useNativeDriver: true,
      }).start(() => handleFeedback(answer));
    } else if (answer === "Quickly change lanes before the intersection despite the solid lines") {
      // FIXED lane change animation
      const currentCarX = carXCurrent.current;

      // Calculate proper lane positions based on road layout
      const centerLane = width / 2 - carWidth / 2;  // Current center position
      const leftLane = width * 0.29 - carWidth / 2;  // Left lane position
      const rightLane = width * 0.75 - carWidth / 2; // Right lane position

      console.log('Lane change - Current X:', currentCarX, 'Left lane:', leftLane, 'Right lane:', rightLane);

      const performLaneChange = async () => {
        // Stop any ongoing animations
        setCarFrame(0);

        // 1. Quick lane change to left lane (dangerous move)
        await new Promise(resolve => {
          setCarDirection("NORTHWEST");
          Animated.parallel([
            Animated.timing(carXAnim, {
              toValue: leftLane,
              duration: 600, // Quick but not too fast to be visible
              easing: Easing.out(Easing.cubic), // Sharp easing for sudden movement
              useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
              toValue: currentScroll.current + (tileSize * 0.8), // Move forward during lane change
              duration: 1000,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            })
          ]).start(resolve);
        });

        // 2. Straighten car in new lane briefly
        await new Promise(resolve => {
          setCarDirection("NORTH");
          setCarFrame(0);

          Animated.timing(scrollY, {
            toValue: currentScroll.current + (tileSize * 1.2),
            duration: 800,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start(resolve);
        });



        // Show feedback after animation completes
        handleFeedback(answer);
      };

      performLaneChange();
      return;
    } else if (answer === "Stop and reverse to get in the correct lane") {
      const turnStartRow = 6.5;
      const reverseAmount = tileSize * 2;

      const initialScrollTarget =
        currentScroll.current + (turnStartRow - currentRow) * tileSize;

      Animated.timing(scrollY, {
        toValue: initialScrollTarget,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        setCarDirection("NORTH");
        setCarFrame(0);

        Animated.timing(scrollY, {
          toValue: currentScroll.current - reverseAmount, // Scroll down to simulate car moving back
          duration: 1500, // Duration for reversing
          useNativeDriver: true,
        }).start(() => {handleFeedback(answer);});
      });
    }
  };

  const handleNext = async () => {

    console.log('=== S10P1 HANDLE NEXT DEBUG ===');
      console.log('Current scenario from session:', currentScenario);
      console.log('Question index:', questionIndex);
      console.log('Questions length:', questions.length);
      console.log('Session data:', sessionData);
      console.log('================================');
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setPlayerCarFrame(0);
    setBusFrame(0);

    const centerX = width / 2 - playerCarWidth / 2;
    playerCarXAnim.setValue(centerX);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsBusVisible(true);

    busYAnim.setValue(-busHeight);

    if (currentScenario >= 10 || true) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      // This is the last scenario (S10P1)
      try {
        const sessionResults = await completeSession();

        if (sessionResults) {
          console.log('Session results to pass:', sessionResults);

          navigation.navigate('ResultPage', {
            sessionId: sessionResults.sessionId,
            categoryId: sessionResults.categoryId,
            phaseId: sessionResults.phaseId,
            categoryName: sessionResults.categoryName,
            totalTime: sessionResults.totalTime,
            userAttempts: JSON.stringify(sessionResults.attempts),
            scenarioProgress: JSON.stringify(sessionResults.scenarioProgress),
            scenarioCount: '10'
          });
        } else {
          console.error('No session results received');
          // Fallback navigation
          navigation.navigate('ResultPage', {
            categoryId: sessionData?.category_id || '1',
            phaseId: sessionData?.phase_id || '1',
            categoryName: categoryName || 'Road Markings',
            scenarioCount: '10'
          });
        }
      } catch (error) {
        console.error('Error completing session:', error);
        // Fallback navigation
        navigation.navigate('ResultPage', {
          categoryId: sessionData?.category_id || '1',
          phaseId: sessionData?.phase_id || '1',
          categoryName: categoryName || 'Road Markings',
          scenarioCount: '10'
        });
      }

      setShowQuestion(false);

      // Cleanup animations
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (busAnimationRef.current) {
        busAnimationRef.current.stop();
      }
    }
  };

  // Determine the feedback message based on whether the answer was correct or wrong (from S9P1)
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! You made the right choice."
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

      {/* Responsive Car */}
      {isCarVisible && (
        <Animated.Image
          source={carSprites[carDirection][carFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: height * 0.1, // Responsive bottom positioning
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

      {/* Responsive Feedback - Updated to use S9P1 format */}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Responsive styles for in-game elements
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
    paddingBottom: height * 0.05,
  },
  questionTextContainer: {
    maxWidth: width * 0.6,
  },
  questionText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * .10,
    right: sideMargin,
    width: width * 0.35,
    zIndex: 11,
  },
  answerButton: {
    backgroundColor: "#333",
    padding: height * 0.02,
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