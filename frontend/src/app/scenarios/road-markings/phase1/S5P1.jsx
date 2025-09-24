import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
  Easing,
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { useSession } from '../../../SessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const playerCarWidth = Math.min(width * 0.25, 280); // Renamed for clarity
const playerCarHeight = playerCarWidth * (350/280);
const jeepWidth = Math.min(width * 0.28, 300); // Slightly wider
const jeepHeight = jeepWidth * (350/280); // Maintain aspect ratio
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Road tiles
const roadTiles = {
    road6: require("../../../../../assets/road/road6.png"),
    road8: require("../../../../../assets/road/road8.png"),
    road17: require("../../../../../assets/road/road17.png"),
    road18: require("../../../../../assets/road/road18.png"),
    road20: require("../../../../../assets/road/road20.png"),
};

// Map layout
const mapLayout = [
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
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
    require("../../../../../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
  ],
};

// Updated question structure following S2P1 format - FALLBACK QUESTIONS
const fallbackQuestions = [
  {
    question: "You encounter double solid yellow lines but traffic on your side has completely stopped. You're tempted to use the opposite lane to bypass the jam.",
    options: ["Move to the opposite lane to bypass the traffic jam.", "Check if the opposite lane is clear and overtake to move further on the road.", "Stay on your lane."],
    correct: "Stay on your lane.",
    wrongExplanation: {
      "Move to the opposite lane to bypass the traffic jam.": "Violation! Double solid yellow lines prohibit crossing regardless of traffic conditions on either side.",
      "Check if the opposite lane is clear and overtake to move further on the road.": "Violation! Even if the opposite lane is clear, double solid yellow lines prohibit overtaking and crossing."
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

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  // Database integration state
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState(fallbackQuestions);
  const [error, setError] = useState(null);

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

  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null); // NEW STATE from S2P1 for correct/wrong feedback
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [playerCarDirection, setPlayerCarDirection] = useState("NORTH"); // Renamed for clarity
  const [playerCarFrame, setPlayerCarFrame] = useState(0);
  const [jeepneyFrame, setJeepneyFrame] = useState(0);

  const playerCarXAnim = useRef(new Animated.Value(width / 2 - playerCarWidth / 2)).current;

  // Jeepney's X position: middle of the 'road5' tile (index 2 in the previous map, adjusted for new map if needed)
  // Assuming the jeepney will still be in a central lane, let's pick lane index 2 (road67) for now.
  const jeepneyInitialX = 2 * tileSize + (tileSize / 2 - jeepWidth / 2); // Center of the 3rd column (index 2)
  // Jeepney's Y position: dynamically set based on scroll and its row
  // Starts off-screen TOP
  const jeepneyYAnim = useRef(new Animated.Value(-jeepHeight)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Database integration: Fetch scenario data
  useEffect(() => {
      const fetchScenarioData = async () => {
        try {
          console.log('S5P1: Fetching scenario data...');
          console.log('S5P1: API_URL value:', API_URL);

          const token = await AsyncStorage.getItem('access_token');
          console.log('S5P1: Token retrieved:', token ? 'Yes' : 'No');

          const url = `${API_URL}/scenarios/5`;
          console.log('S5P1: Fetching from URL:', url);

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          console.log('S5P1: Response status:', response.status);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('S5P1: Data received:', data);

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
            console.log('S5P1: ✅ Database questions loaded successfully');
          } else {
            console.log('S5P1: ⚠️ Invalid data structure, using fallback');
            setQuestions(fallbackQuestions);
          }
        } catch (error) {
          console.log('S5P1: ❌ Database error, using fallback questions:', error.message);
          setQuestions(fallbackQuestions);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchScenarioData();
    }, []);

  // Function to update user progress
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

    // Ensure player car is centered at the start
    playerCarXAnim.setValue(width / 2 - playerCarWidth / 2);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

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

    // Animate jeepney into view from the top, stopping it at a position relative to the player
    // This example stops it a bit above the player to simulate being "in front"
    jeepneyAnimationRef.current = Animated.timing(jeepneyYAnim, {
      toValue: -height * 0.2, // Stop jeepney at this Y position (relative to its initial off-screen start)
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
    if (!loading) {
      console.log('Loading complete, starting scroll animation');
      startScrollAnimation();
    }
    return () => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
          jeepneyAnimationRef.current.stop();
      }
    };
  }, [loading]);

  // Updated handleFeedback function from S2P1
  const handleFeedback = (answerGiven) => {
      const currentQuestion = questions[questionIndex];
      const isCorrect = answerGiven === currentQuestion.correct;
      
      // ✅ DATABASE INTEGRATION - Update progress when feedback is shown
      updateProgress(answerGiven, isCorrect); // scenario_id = 3 for S3P1
      
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

  // NEW ANIMATION: Player stays in lane, jeepney remains in front
  const animateStayInLane = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop(); // Stop for a moment
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();

    setPlayerCarDirection("NORTH");
    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true); // Ensure jeepney remains visible

    // Simply restart the continuous scroll for a short duration
    // Both cars will appear to scroll forward together
    await new Promise(resolve => {
        Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 2), // Move forward slightly more
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(resolve);
    });

    // Optionally, pause briefly before showing feedback
    await new Promise(resolve => setTimeout(resolve, 500));

    // Then handle feedback
    handleFeedback(selectedAnswer);
  };

  // NEW ANIMATION: Sudden Overtake (for wrong answers)
  const animateSuddenOvertake = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();

    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true); // Start with jeepney visible

    const targetXLeftLane = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2); // Left lane (index 1)

    // 1. Car faces Northwest and moves quickly left
    await new Promise(resolve => {
        setPlayerCarDirection("NORTHWEST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: targetXLeftLane, // Move to left lane
                duration: 400, // Fast
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 0.8), // Move forward a bit
                duration: 400,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // 2. Car faces North, continues forward rapidly, and jeepney falls behind
    await new Promise(resolve => {
        setPlayerCarDirection("NORTH"); // Face North
        Animated.parallel([
            Animated.timing(jeepneyYAnim, {
                toValue: height + jeepHeight, // Move the jeepney off-screen bottom
                duration: 800, // Quickly disappear
                easing: Easing.easeIn, // Faster exit
                useNativeDriver: true,
            }),
            Animated.timing(scrollY, { // Player car moves significantly forward
                toValue: scrollY._value - (tileSize * 4), // More forward movement
                duration: 800,
                easing: Easing.easeOut,
                useNativeDriver: true,
            }),
        ]).start(resolve);
    });
    setIsJeepneyVisible(false); // Hide jeepney after it's out of view

    // Player car stays in the left lane
    setPlayerCarDirection("NORTH"); // Keep facing North in new lane

    // Pause briefly before showing feedback
    await new Promise(resolve => setTimeout(resolve, 1000));

    handleFeedback(selectedAnswer); // Pass the selected wrong answer to feedback
  };

  // NEW ANIMATION: Careful Overtake (for "Signal, check mirrors...")
  const animateCarefulOvertake = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();

    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true); // Start with jeepney visible

    const targetXLeftLane = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2); // Left lane (index 1)

    // 1. Scroll for 3 seconds first (simulating careful approach)
    await new Promise(resolve => {
        Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 3), // Move forward for 3 seconds
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(resolve);
    });

    // 2. Car faces Northwest and moves smoothly left
    await new Promise(resolve => {
        setPlayerCarDirection("NORTHWEST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: targetXLeftLane, // Move to left lane
                duration: 800, // Smooth duration
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 1), // Move forward a bit during change
                duration: 800,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // 3. Car faces North, continues forward, and jeepney falls behind
    await new Promise(resolve => {
        setPlayerCarDirection("NORTH"); // Face North
        Animated.parallel([
            Animated.timing(jeepneyYAnim, {
                toValue: height + jeepHeight, // Move the jeepney off-screen bottom
                duration: 1200, // Smoothly disappear
                easing: Easing.easeIn,
                useNativeDriver: true,
            }),
            Animated.timing(scrollY, { // Player car moves significantly forward
                toValue: scrollY._value - (tileSize * 5), // More forward movement
                duration: 1200,
                easing: Easing.easeOut,
                useNativeDriver: true,
            }),
        ]).start(resolve);
    });
    setIsJeepneyVisible(false); // Hide jeepney after it's out of view

    // Player car stays in the left lane
    setPlayerCarDirection("NORTH"); // Keep facing North in new lane

    // Pause briefly before showing feedback
    await new Promise(resolve => setTimeout(resolve, 1000));

    handleFeedback(selectedAnswer); // Pass the selected correct answer to feedback
  };

  const handleAnswer = async (option) => {
    setSelectedAnswer(option);
    setShowQuestion(false);
    setShowAnswers(false);

    // Update progress in database
    const isCorrect = option === questions[questionIndex].correct;
    await updateProgress(option, isCorrect);

    // Stop continuous scroll and sprite animations immediately
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true); // Ensure both are visible before animating
    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    // Determine which animation to play based on the selected answer
    const actualCorrectAnswer = questions[questionIndex].correct;

    if (option === actualCorrectAnswer) {
      if (option === "Stay on your lane.") {
        await animateStayInLane();
      }
      // If there were other correct answers with specific animations, add them here
      // For this specific question, 'Stay on your lane' is the only correct answer.
    } else {
        // This block handles all wrong answers
        if (option === "Move to the opposite lane to bypass the traffic jam.") {
            await animateSuddenOvertake();
        } else if (option === "Check if the opposite lane is clear and overtake to move further on the road.") {
            // This is also a wrong answer for this scenario (due to 'opposite lane' implying violation).
            // So, we'll use an animation that shows a wrong/unsafe maneuver.
            await animateSuddenOvertake();
        } else {
            // Fallback for any other answer (if you add more wrong options later)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    // After animation, always handle feedback
    handleFeedback(option);
  };

  // Update handleNext in ALL scenario files
  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
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
      // FIXED: Use the next scenario number based on current file, not session context

      // Get current scenario number from file name (S1P1 = 1, S2P1 = 2, etc.)
      const currentFileScenario = getCurrentScenarioNumber(); // Helper function

      if (currentFileScenario >= 10) {
        // Last scenario - complete session and go to results
        const sessionResults = await completeSession();
        if (sessionResults) {
          navigation.navigate('ResultPage', {
            ...sessionResults,
            userAttempts: JSON.stringify(sessionResults.attempts),
            scenarioProgress: JSON.stringify(sessionResults.scenarioProgress)
          });
        }
      } else {
        // Move to next scenario
        moveToNextScenario();

        // Navigate to next scenario using file-based numbering
        const nextScenarioNumber = currentFileScenario + 1;
        const phaseId = sessionData?.phase_id || 1;
        const nextScreen = `S${nextScenarioNumber}P${phaseId}`;

        navigation.navigate(nextScreen);
      }

      setShowQuestion(false);
      // ... cleanup code
    }
  };

  // Add this helper function to each scenario file
  const getCurrentScenarioNumber = () => {
    // Return the scenario number based on the current file
    // For S1P1, return 1
    // For S2P1, return 2
    // For S3P1, return 3
    // etc.

    // You can hardcode this in each file:
    return 5; // For S2P1.jsx
    // return 3; // For S3P1.jsx
    // return 4; // For S4P1.jsx
    // etc.
  };

  // Determine the feedback message based on whether the answer was correct or wrong (from S2P1)
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Solid yellow double lines means that you cannot overtake or cross. Respecting the road markings will help you avoid violations, accidents, and potential road rage."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

  // Show loading screen while fetching data
  if (loading) {
    console.log('Showing loading screen. Loading:', loading, 'Questions length:', questions.length);
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading scenario...</Text>
      </View>
    );
  }

  console.log('Rendering main game. Loading:', loading, 'Questions length:', questions.length);

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

      {/* Responsive Jeepney */}
      {isJeepneyVisible && (
        <Animated.Image
          source={jeepneySprites.NORTH[jeepneyFrame]}
          style={{
            width: jeepWidth,
            height: jeepHeight,
            position: "absolute",
            left: jeepneyInitialX, // Keep it in its lane
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

      {/* Responsive Feedback - Updated to use S2P1 format */}
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
  // Loading screen styles
  loadingContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  // No intro styles (responsive)
  // In-game responsive styles
 questionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: overlayHeight, // Corrected line: use the variable directly
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
    fontSize: Math.min(width * 0.04, 18),
    textAlign: "center",
  },
  feedbackOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: overlayHeight, // Corrected line: use the variable directly
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