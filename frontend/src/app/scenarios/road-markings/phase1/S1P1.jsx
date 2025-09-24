import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  Animated,
  ActivityIndicator,
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
console.log('S1P1 Module loaded. API_URL from env:', API_URL);

const { width, height } = Dimensions.get("window");

// Responsive calculations
const playerCarWidth = Math.min(width * 0.25, 280); // Renamed for clarity
const playerCarHeight = playerCarWidth * (350/280);
const jeepWidth = Math.min(width * 0.28, 300); // Slightly wider
const jeepHeight = jeepWidth * (350/280); // Maintain aspect ratio
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.25, 200); // ADDED: LTO size for intro
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Road tiles
const roadTiles = {
    road17: require("../../../../../assets/road/road17.png"),
    road18: require("../../../../../assets/road/road18.png"),
    road20: require("../../../../../assets/road/road20.png"),
    road66: require("../../../../../assets/road/road66.png"),
    road67: require("../../../../../assets/road/road67.png"),
};

// Map layout
const mapLayout = [
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
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

// Fallback questions - keep your original questions as backup
const fallbackQuestions = [
  {
    question: "You're driving on a highway and see a single solid yellow lines in the center. Traffic is heavy, and you notice a faster-moving lane to your left.",
    options: ["Overtake by crossing the solid yellow lines to reach the faster lane", "Stay in your current lane", "Honk for a long time to make the cars move faster."],
    correct: "Stay in your current lane",
    wrongExplanation: {
      "Overtake by crossing the solid yellow lines to reach the faster lane": "Violation. Solid yellow lane means overtaking is not allowed. You can only make a left turn to another street or an establishment.",
      "Honk for a long time to make the cars move faster.": "Road rage prone! In a situation where the area is experiencing traffic, honking a lot can only make other drivers mad and wouldn't make the cars move faster."
    }
  },
];

export default function DrivingGame() {
  const navigation = useNavigation();

  // ✅ DATABASE INTEGRATION - Added these state variables
  const [questions, setQuestions] = useState(fallbackQuestions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ADDED: Intro state
  const [showIntro, setShowIntro] = useState(true);

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

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
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null); // NEW STATE for correct/wrong feedback
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [playerCarDirection, setPlayerCarDirection] = useState("NORTH"); // Renamed for clarity
  const [playerCarFrame, setPlayerCarFrame] = useState(0);
  const [jeepneyFrame, setJeepneyFrame] = useState(0);

  const playerCarXAnim = useRef(new Animated.Value(width / 2 - playerCarWidth / 2)).current;

  // Jeepney's X position: middle of the 'road5' tile (index 2 in the previous map, adjusted for new map if needed)
  // Assuming the jeepney will still be in a central lane, let's pick lane index 2 (road67) for now.
  const jeepneyInitialX = 2 * tileSize + (tileSize / 2 - jeepWidth / 2);
  // Jeepney's Y position: dynamically set based on scroll and its row
  // Starts off-screen TOP
  const jeepneyYAnim = useRef(new Animated.Value(-jeepHeight)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // ✅ DATABASE INTEGRATION - Added this useEffect to fetch data
  useEffect(() => {
    const fetchScenarioData = async () => {
      try {
        console.log('S1P1: Fetching scenario data...');
        console.log('S1P1: API_URL value:', API_URL);
        
        const token = await AsyncStorage.getItem('access_token');
        console.log('S1P1: Token retrieved:', token ? 'Yes' : 'No');
        
        const url = `${API_URL}/scenarios/1`;
        console.log('S1P1: Fetching from URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('S1P1: Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('S1P1: Data received:', data);
        
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
          console.log('S1P1: ✅ Database questions loaded successfully');
        } else {
          console.log('S1P1: ⚠️ Invalid data structure, using fallback');
          setQuestions(fallbackQuestions);
        }
      } catch (error) {
        console.log('S1P1: ❌ Database error, using fallback questions:', error.message);
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
        console.log('S1P1: No token or user_id found for progress update');
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
        console.log('S1P1: ✅ Progress updated successfully');
      } else {
        console.log('S1P1: ⚠️ Failed to update progress:', attemptResponse.status);
      }
    } catch (error) {
      console.log('S1P1: ❌ Error updating progress:', error.message);
    }
  };

  // Animation for player's car sprite
  useEffect(() => {
    if (!showQuestion && isPlayerCarVisible && !showIntro) {
      const interval = setInterval(() => {
        setPlayerCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isPlayerCarVisible, showIntro]);

  // Animation for jeepney's sprite
  useEffect(() => {
    if (!showQuestion && isJeepneyVisible && !showIntro) {
      const interval = setInterval(() => {
        setJeepneyFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 250);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isJeepneyVisible, showIntro]);

  const scrollAnimationRef = useRef(null);
  const jeepneyAnimationRef = useRef(null); // Ref to hold the jeepney's entry animation

  function startScrollAnimation() {
    scrollY.setValue(0);
    jeepneyYAnim.setValue(-jeepHeight); // Reset jeepney to off-screen top

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

    // Animate jeepney into view from the top
    jeepneyAnimationRef.current = Animated.timing(jeepneyYAnim, {
      toValue: -height * 0.2,
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

  // ✅ DATABASE INTEGRATION - Modified useEffect to wait for data
  useEffect(() => {
    if (!showIntro && !loading) {
      startScrollAnimation();
    }
    return () => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
          jeepneyAnimationRef.current.stop();
      } // Clean up animations
    };
  }, [showIntro, loading]); // Added showIntro and loading dependencies

  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    const isCorrect = answerGiven === currentQuestion.correct;
    
    // ✅ DATABASE INTEGRATION - Update progress when feedback is shown
    updateProgress(1, answerGiven, isCorrect); // scenario_id = 1 for S1P1
    
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

const animateOvertake = async (targetX) => {
    // Stop continuous scroll and sprite animations for a moment
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    // 1. Car faces Northwest and moves slightly to the left (initial lane change)
    await new Promise(resolve => {
        setPlayerCarDirection("NORTHWEST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: targetX, // Move left towards the target lane
                duration: 300,
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 0.5), // Move forward slightly
                duration: 300,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // 2. Car faces North and moves further forward (main overtaking acceleration)
    await new Promise(resolve => {
        setPlayerCarDirection("NORTH"); // Face North
        Animated.parallel([
            Animated.timing(jeepneyYAnim, { // <--- ADD THIS ANIMATION FOR JEEPNEY
                toValue: height + jeepHeight, // Move the jeepney off-screen bottom
                duration: 1000, // Duration for jeepney to disappear
                easing: Easing.linear,
                useNativeDriver: true,
            }),
            Animated.timing(scrollY, { // Player car continues to move significantly forward
                toValue: scrollY._value - (tileSize * 3), // More forward movement
                duration: 1000,
                easing: Easing.easeOut,
                useNativeDriver: true,
            }),
        ]).start(resolve);
    });
    setIsJeepneyVisible(false); // Hide jeepney after it's out of view

    // 3. Car faces Northeast and moves back towards the right (returning to lane)
    await new Promise(resolve => {
        setPlayerCarDirection("NORTHEAST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: width / 2 - playerCarWidth / 2, // Move back to center X
                duration: 400,
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, { // Still moving forward slightly during lane change
                toValue: scrollY._value - (tileSize * 0.5),
                duration: 400,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // 4. Car faces North again
    setPlayerCarDirection("NORTH");

    // Restart continuous scroll and sprite animations
    if (scrollAnimationRef.current) scrollAnimationRef.current.start();
    
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(false); // Reset for next scenario, if needed
  };
  // Adjust handleAnswer to call animateOvertake without turnDirection parameters
  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    // If scrollAnimationRef.current exists, restart it for continuous movement after answering
    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.start();
    }
    // Restart player car animations
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

    if (answer === questions[questionIndex].correct) {
      // Correct answer, no overtake action if it's "Don't overtake at all"
      handleFeedback(answer); // Call feedback directly
    } else if (answer === "Overtake by crossing the solid yellow lines to reach the faster lane") { // Adjusted option text
      // Overtake to the left lane (column 1) if this was a wrong answer
      const targetX = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2);
      animateOvertake(targetX); // Call without turn directions, as they are now internal
      handleFeedback(answer); // Call feedback here, or after animateOvertake completes
    } else if (answer === "Honk for a long time to make the cars move faster.") { // Adjusted option text
        setTimeout(() => {
            // No specific car animation for this wrong answer, just feedback
            handleFeedback(answer);
        }, 1000); // A small delay before showing feedback
      } else {
        // Fallback for any other answer (e.g., if there were more options)
        handleFeedback(answer);
      }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null); // Reset feedback state
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
      navigation.navigate('S7P1');
      setShowQuestion(false);
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
          jeepneyAnimationRef.current.stop();
      }
    }
  };

  // ADDED: Handle start game
  const handleStartGame = () => {
    setShowIntro(false);
  };

  // ✅ DATABASE INTEGRATION - Show loading screen while fetching data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#26a69a" />
        <Text style={styles.loadingText}>Loading scenario...</Text>
      </View>
    );
  }

  // Determine the feedback message based on whether the answer was correct or wrong
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Solid yellow lane means you cannot overtake. Stay in your lane to avoid unnecessary accidents."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

  // ADDED: Intro screen
  if (showIntro) {
    return (
      <View style={styles.introContainer}>
        <Image
          source={require("../../../../../assets/dialog/LTO.png")}
          style={[styles.introLTOImage, { width: ltoWidth, height: ltoHeight * 0.5 }]}
        />
        <View style={styles.introTextBox}>
          <Text style={styles.introTitle}>Welcome to ROADCHECK!</Text>
          <Text style={styles.introText}>
            Test your knowledge of road rules and signs.
            Choose the correct option to proceed safely.
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
  // ✅ DATABASE INTEGRATION - Added loading styles
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

  // ADDED: Intro styles (responsive)
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