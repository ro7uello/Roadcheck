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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

// Debug API_URL at module level
console.log('S9P1 Module loaded. API_URL from env:', API_URL);

const { width, height } = Dimensions.get("window");

// Responsive calculations
const playerCarWidth = Math.min(width * 0.25, 280); // Renamed for clarity
const playerCarHeight = playerCarWidth * (350/280);
const busWidth = Math.min(width * 0.28, 300); // Slightly wider, renamed for clarity
const busHeight = busWidth * (350/280);
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

const busSprites ={
    NORTH: [
        require("../../../../../assets/car/BUS TOPDOWN/White/MOVE/NORTH/SEPARATED/White_BUS_CLEAN_NORTH_000.png"),
        require("../../../../../assets/car/BUS TOPDOWN/White/MOVE/NORTH/SEPARATED/White_BUS_CLEAN_NORTH_001.png"),
    ]
}

// Fallback questions - keep your original questions as backup
const fallbackQuestions = [
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

  // ✅ DATABASE INTEGRATION - Added these 3 state variables
  const [questions, setQuestions] = useState(fallbackQuestions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isPlayerCarVisible, setIsPlayerCarVisible] = useState(true); // Renamed for clarity
  const [isBusVisible, setIsBusVisible] = useState(true); // State for bus visibility

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
  const [busFrame, setBusFrame] = useState(0); // Renamed for clarity

  const playerCarXAnim = useRef(new Animated.Value(width / 2 - playerCarWidth / 2)).current;

  // Bus's X position: middle of the 'road5' tile (index 2 in the previous map, adjusted for new map if needed)
  // Assuming the bus will still be in a central lane, let's pick lane index 2 (road67) for now.
  const busInitialX = 2 * tileSize + (tileSize / 2 - busWidth / 2); // Center of the 3rd column (index 2)
  // Bus's Y position: dynamically set based on scroll and its row
  // Starts off-screen TOP
  const busYAnim = useRef(new Animated.Value(-busHeight)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // ✅ DATABASE INTEGRATION - Added this useEffect to fetch data
  useEffect(() => {
    const fetchScenarioData = async () => {
      try {
        console.log('S9P1: Fetching scenario data...');
        console.log('S9P1: API_URL value:', API_URL);
        
        const token = await AsyncStorage.getItem('access_token');
        console.log('S9P1: Token retrieved:', token ? 'Yes' : 'No');
        
        const url = `${API_URL}/scenarios/9`;
        console.log('S9P1: Fetching from URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('S9P1: Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('S9P1: Data received:', data);
        
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
          console.log('S9P1: ✅ Database questions loaded successfully');
        } else {
          console.log('S9P1: ⚠️ Invalid data structure, using fallback');
          setQuestions(fallbackQuestions);
        }
      } catch (error) {
        console.log('S9P1: ❌ Database error, using fallback questions:', error.message);
        setQuestions(fallbackQuestions);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarioData();
  }, []);

  // ✅ DATABASE INTEGRATION - Added updateProgress function
  const updateProgress = async (scenarioId, selectedOption, isCorrect) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userId = await AsyncStorage.getItem('user_id');
      
      if (!token || !userId) {
        console.log('S9P1: No token or user_id found for progress update');
        return;
      }

      // Record the attempt
      const attemptResponse = await fetch(`${API_URL}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: parseInt(userId),
          scenario_id: scenarioId,
          selected_option: selectedOption,
          is_correct: isCorrect,
          completed_at: new Date().toISOString()
        })
      });

      if (attemptResponse.ok) {
        console.log('S9P1: ✅ Progress updated successfully');
      } else {
        console.log('S9P1: ⚠️ Failed to update progress:', attemptResponse.status);
      }
    } catch (error) {
      console.log('S9P1: ❌ Error updating progress:', error.message);
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

  // Animation for bus's sprite
  useEffect(() => {
    if (!showQuestion && isBusVisible) {
      const interval = setInterval(() => {
        setBusFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 250);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isBusVisible]);

  const scrollAnimationRef = useRef(null);
  const busAnimationRef = useRef(null); // Ref to hold the bus's entry animation

  function startScrollAnimation() {
    scrollY.setValue(0);
    busYAnim.setValue(-busHeight); // Reset bus to off-screen top

    // Ensure player car is centered at the start
    playerCarXAnim.setValue(width / 2 - playerCarWidth / 2);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsBusVisible(true);

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

    // Animate bus into view from the top, stopping it at a position relative to the player
    // This example stops it a bit above the player to simulate being "in front"
    busAnimationRef.current = Animated.timing(busYAnim, {
      toValue: -height * 0.2, // Stop bus at this Y position (relative to its initial off-screen start)
      duration: 3000, // Duration for bus to move into position
      easing: Easing.linear,
      useNativeDriver: true,
    });

    busAnimationRef.current.start(() => {
      // After bus is in position, set a timeout to stop scrolling and show question
      setTimeout(() => {
        if (scrollAnimationRef.current) {
          scrollAnimationRef.current.stop(); // Stop the continuous scroll
        }
        // Freeze car and bus sprite animations
        setIsPlayerCarVisible(true);
        setIsBusVisible(true);
        setPlayerCarFrame(0);
        setBusFrame(0);

        setShowQuestion(true);
        setTimeout(() => {
          setShowAnswers(true);
        }, 1000);
      }, 2000); // Time to drive before the question appears after bus is in view
    });
  }

  // ✅ DATABASE INTEGRATION - Modified useEffect to wait for data
  useEffect(() => {
    if (!loading) {
      startScrollAnimation();
    }
    return () => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (busAnimationRef.current) {
          busAnimationRef.current.stop();
      }
    };
  }, [loading]); // Added loading dependency

  // Updated handleFeedback function from S2P1
  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    const isCorrect = answerGiven === currentQuestion.correct;
    
    // ✅ DATABASE INTEGRATION - Update progress when feedback is shown
    updateProgress(9, answerGiven, isCorrect); // scenario_id = 9 for S9P1
    
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

  // NEW ANIMATION: Player stays in lane, bus remains in front
  const animateStayInLane = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop(); // Stop for a moment
    if (busAnimationRef.current) busAnimationRef.current.stop();

    setPlayerCarDirection("NORTH");
    setPlayerCarFrame(0);
    setBusFrame(0);
    setIsPlayerCarVisible(true);
    setIsBusVisible(true); // Ensure bus remains visible

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

  // NEW ANIMATION: Sudden Overtake (for "Change lanes without signaling")
  const animateSuddenOvertake = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (busAnimationRef.current) busAnimationRef.current.stop();

    setPlayerCarFrame(0);
    setBusFrame(0);
    setIsPlayerCarVisible(true);
    setIsBusVisible(true); // Start with bus visible

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

    // 2. Car faces North, continues forward rapidly, and bus falls behind
    await new Promise(resolve => {
        setPlayerCarDirection("NORTH"); // Face North
        Animated.parallel([
            Animated.timing(busYAnim, {
                toValue: height + busHeight, // Move the bus off-screen bottom
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
    setIsBusVisible(false); // Hide bus after it's out of view

    // Player car stays in the left lane
    setPlayerCarDirection("NORTH"); // Keep facing North in new lane

    // Pause briefly before showing feedback
    await new Promise(resolve => setTimeout(resolve, 1000));

    handleFeedback(selectedAnswer); // Pass the selected wrong answer to feedback
  };

  // NEW ANIMATION: Careful Overtake (for "Signal, check mirrors...")
  const animateCarefulOvertake = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (busAnimationRef.current) busAnimationRef.current.stop();

    setPlayerCarFrame(0);
    setBusFrame(0);
    setIsPlayerCarVisible(true);
    setIsBusVisible(true); // Start with bus visible

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

    // 3. Car faces North, continues forward, and bus falls behind
    await new Promise(resolve => {
        setPlayerCarDirection("NORTH"); // Face North
        Animated.parallel([
            Animated.timing(busYAnim, {
                toValue: height + busHeight, // Move the bus off-screen bottom
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
    setIsBusVisible(false); // Hide bus after it's out of view

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

    // Stop continuous scroll and sprite animations immediately
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (busAnimationRef.current) busAnimationRef.current.stop();
    setIsPlayerCarVisible(true);
    setIsBusVisible(true); // Ensure both are visible before animating
    setPlayerCarFrame(0);
    setBusFrame(0);

    // Determine which animation to play based on the selected answer
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
      handleFeedback(option);
    } else {
        // Fallback for any other answer (e.g., the other wrong answer from the example)
        // For now, just show feedback after a small delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        handleFeedback(option);
    }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null); // Reset feedback state from S2P1
    setPlayerCarFrame(0);
    setBusFrame(0);

    const centerX = width / 2 - playerCarWidth / 2;
    playerCarXAnim.setValue(centerX);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsBusVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      navigation.navigate('S10P1');
      setShowQuestion(false);
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (busAnimationRef.current) {
          busAnimationRef.current.stop();
      }
    }
  };

  // ✅ DATABASE INTEGRATION - Show loading screen while fetching data
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: 'black' }]}>
        <Text style={styles.loadingText}>Loading scenario...</Text>
      </View>
    );
  }

  // Determine the feedback message based on whether the answer was correct or wrong (from S2P1)
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct. Even if it's permitted, always practice defensive driving for your safety and other drivers' safety as well."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

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

      {/* Responsive Bus */}
      {isBusVisible && (
        <Animated.Image
          source={busSprites.NORTH[busFrame]}
          style={{
            width: busWidth,
            height: busHeight,
            position: "absolute",
            left: busInitialX, // Keep it in its lane
            transform: [{ translateY: busYAnim }],
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
  // No intro styles (responsive)
  // In-game responsive styles
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
  },
  questionTextContainer: {
    padding: -height * 0.04,
    maxWidth: width * 0.6,
  },
  questionText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 28),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.4,
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