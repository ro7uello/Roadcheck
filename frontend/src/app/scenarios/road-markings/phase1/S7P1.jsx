// S7P1.jsx
import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing } from "react-native";
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

// Debug API_URL at module level
console.log('S7P1 Module loaded. API_URL from env:', API_URL);

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
  road1: require("../../../../../assets/road/road1.png"),
  road3: require("../../../../../assets/road/road3.png"),
  road4: require("../../../../../assets/road/road4.png"),
  road17: require("../../../../../assets/road/road17.png"),
  road62: require("../../../../../assets/road/road62.png"),
  road70: require("../../../../../assets/road/road70.png"),
};

const mapLayout = [
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road4", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
  ["road1", "road62", "road1", "road1", "road17"],
];

// Separated sprites (unchanged)
const playerCarSprites = {
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

const ambulanceSprites = {
  NORTH: [
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/NORTH/SEPARATED/AMBULANCE_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/NORTH/SEPARATED/AMBULANCE_CLEAN_NORTH_001.png"),
  ],
};

// NEW: NPC Car Sprites
const npcCarSprites = {
  NORTH: [
    require("../../../../../assets/car/SUV TOPDOWN/Green/MOVE/NORTH/SEPARATED/Green_SUV_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/SUV TOPDOWN/Green/MOVE/NORTH/SEPARATED/Green_SUV_CLEAN_NORTH_001.png"),
  ],
};

// Fallback questions - keep your original questions as backup
const fallbackQuestions = [
  {
    question: "You're in heavy traffic with solid white lines between lanes. An ambulance is approaching from behind with sirens on.",
    options: ["Stay in your lane since crossing solid white lines is discouraged", "Speed up to clear the way without changing lanes", "Carefully move to give way to the ambulance, crossing the solid white line if necessary"],
    correct: "Carefully move to give way to the ambulance, crossing the solid white line if necessary",
    wrongExplanation: {
      "Stay in your lane since crossing solid white lines is discouraged": "Wrong! Emergency vehicles have priority, and giving way overrides lane marking restrictions.",
      "Speed up to clear the way without changing lanes": "Accident prone! Speeding up might not provide adequate clearance and could be dangerous in heavy traffic."
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

  const [isCarVisible, setIsCarVisible] = useState(true);
  const [isAmbulanceVisible, setIsAmbulanceVisible] = useState(false); // New state for ambulance visibility
  const [isNpcCarVisible, setIsNpcCarVisible] = useState(true); // NEW: State for NPC car visibility

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
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null); // NEW STATE from S2P1 for correct/wrong feedback
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [carDirection, setCarDirection] = useState("NORTH");
  const [carFrame, setCarFrame] = useState(0);

  // Responsive car positioning
  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current; // Player car starts centered
  const AmbulanceYAnim = useRef(new Animated.Value(height * 3)).current; // Start well below the screen
  const AmbulanceXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2 - tileSize)).current; // Default lane to the left of player
  
  // UPDATED: NPC Car Y position, set to the very edge of the screen (negative value to ensure top edge)
  const NpcCarYAnim = useRef(new Animated.Value(-30)).current;
  const NpcCarXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2 + tileSize)).current; // Position NPC car in the right lane

  const AmbulanceEntryAnim = useRef(new Animated.Value(0)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // ✅ DATABASE INTEGRATION - Added this useEffect to fetch data
  useEffect(() => {
    const fetchScenarioData = async () => {
      try {
        console.log('S7P1: Fetching scenario data...');
        console.log('S7P1: API_URL value:', API_URL);
        
        const token = await AsyncStorage.getItem('access_token');
        console.log('S7P1: Token retrieved:', token ? 'Yes' : 'No');
        
        const url = `${API_URL}/scenarios/7`;
        console.log('S7P1: Fetching from URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('S7P1: Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('S7P1: Data received:', data);
        
        if (data && data.success && data.data) {
          const transformedQuestion = {
            question: data.data.question,
            options: data.data.options,
            correct: data.data.correct_answer,
            wrongExplanation: data.data.wrong_explanations || {}
          };
          
          setQuestions([transformedQuestion]);
          console.log('S7P1: ✅ Database questions loaded successfully');
        } else {
          console.log('S7P1: ⚠️ Invalid data structure, using fallback');
          setQuestions(fallbackQuestions);
        }
      } catch (error) {
        console.log('S7P1: ❌ Database error, using fallback questions:', error.message);
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
        console.log('S7P1: No token or user_id found for progress update');
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
        console.log('S7P1: ✅ Progress updated successfully');
      } else {
        console.log('S7P1: ⚠️ Failed to update progress:', attemptResponse.status);
      }
    } catch (error) {
      console.log('S7P1: ❌ Error updating progress:', error.message);
    }
  };

  // Car animation frame cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
    }, 200); // Adjust speed of car animation
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('S7P1: Animation useEffect triggered. Loading:', loading, 'Questions length:', questions.length);

    if (!loading && questions.length > 0) {
      console.log('S7P1: Starting scroll animation');
      startScrollAnimation();
    }
  }, [loading, questions]);

  function startScrollAnimation() {
    console.log('S7P1: startScrollAnimation called');
    scrollY.setValue(startOffset); // Ensure scroll starts from bottom for each game start
    carXAnim.setValue(width / 2 - carWidth / 2); // Reset car position to center lane
    setCarDirection("NORTH"); // Reset car direction
    setIsCarVisible(true); // Ensure car is visible
    setIsNpcCarVisible(true); // NEW: Ensure NPC car is visible at the start of each animation cycle
    NpcCarYAnim.setValue(-30); // UPDATED: Reset NPC car Y position to the very edge of the screen (-30)

    const stopRow = 6.5; // Row where the question appears
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

  // Updated handleFeedback function from S2P1
  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    const isCorrect = answerGiven === currentQuestion.correct;
    
    // ✅ DATABASE INTEGRATION - Update progress when feedback is shown
    updateProgress(7, answerGiven, isCorrect); // scenario_id = 7 for S7P1
    
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

  const getCarCurrentRow = () => {
    const currentY = currentScroll.current - startOffset;
    return Math.floor(currentY / tileSize);
  };

  const animateCarToTargetRow = (targetRow, duration, callback) => {
    const currentRow = getCarCurrentRow();
    const rowsToMove = targetRow - currentRow;
    const nextTarget = currentScroll.current + rowsToMove * tileSize;

    Animated.timing(scrollY, {
      toValue: nextTarget,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(callback);
  };

  const handleAnswer = (option) => {
    setSelectedAnswer(option);
    setShowQuestion(false);
    setShowAnswers(false);

    const actualCorrectAnswer = questions[questionIndex].correct;
    const originalLaneX = width / 2 - carWidth / 2; // Original lane center
    const rightLaneX = width / 2 - carWidth / 2 + tileSize; // One lane to the right
    const leftLaneX = width / 2 - carWidth / 2 - tileSize; // One lane to the left

    if (option === actualCorrectAnswer) {
      // Correct Answer: Player moves right, Ambulance passes on left
      setIsCarVisible(true);
      setIsAmbulanceVisible(true); // Show ambulance for this scenario
      setIsNpcCarVisible(true); // Keep NPC car visible

      Animated.sequence([
        // 1. Player car moves to the right lane
        Animated.parallel([
          Animated.timing(carXAnim, {
            toValue: rightLaneX, // Move to the right lane
            duration: 500,
            easing: Easing.easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 0.5, // Small forward movement
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
        // 2. Ambulance passes on the left
        Animated.parallel([
          Animated.timing(AmbulanceYAnim, {
            toValue: -carHeight, // Move off-screen to the top
            duration: 2000, // Speed of ambulance passing
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(AmbulanceXAnim, {
            toValue: originalLaneX, // Ensure ambulance is in the left lane (player's original lane)
            duration: 1, // Instantly set position
            useNativeDriver: false,
          }),
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 3, // Player car scrolls slowly
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        handleFeedback(option); // Show feedback after animation
      });

    } else if (option === "Stay in your lane since crossing solid white lines is discouraged") {
      // WRONG Answer: Ambulance follows closely behind player
      setIsAmbulanceVisible(true); // Show ambulance
      setIsNpcCarVisible(true); // Keep NPC car visible
    
      // Ensure ambulance starts from behind the player in the same lane
      const playerCarBottom = height * 0.1; // Player car's bottom edge
      const playerCarVisualTop = height - playerCarBottom - carHeight; // Player car's visual top edge on screen

      AmbulanceXAnim.setValue(originalLaneX); // Ambulance in player's lane (center lane)
      // Start ambulance visually behind the player, just touching or slightly below
      AmbulanceYAnim.setValue(playerCarVisualTop + carHeight * 0.5); // Start position, adjust multiplier as needed
    
      Animated.sequence([
        // Player and Ambulance continue moving forward together, ambulance remains behind
        Animated.parallel([
          Animated.timing(scrollY, {
            toValue: currentScroll.current + tileSize * 5, // Scroll for 5 tiles
            duration: 3000, // Duration for cars to move forward
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          // Ambulance maintains position relative to the player by effectively standing still on screen
          // Its Y position remains constant because the whole map is scrolling
          // We only need to set its initial Y and it will look like it's following due to map scroll
          // (Unless we want it to drift closer/further, but "following closely" implies stable distance)
        ])
      ]).start(() => handleFeedback(option));

    } else if (option === "Speed up to clear the way without changing lanes") {
      // Wrong Answer: Player car speeds up (scrolls faster and further)
      setIsNpcCarVisible(false); // Hide NPC car for this sequence as requested
      Animated.timing(scrollY, {
        toValue: currentScroll.current + tileSize * 14, // Target row 18 (relative to current position)
        duration: 4000, // Speed of 4 seconds
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        handleFeedback(option);
      });
      // Car stays NORTH, in its original lane.
    }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null); // Reset feedback state from S2P1
    setCarFrame(0);

    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setIsAmbulanceVisible(false); // Hide ambulance for next question
    setIsNpcCarVisible(true); // NEW: Show NPC car for next question start
    AmbulanceYAnim.setValue(height * 1.5); // Reset ambulance position off-screen bottom
    AmbulanceXAnim.setValue(width / 2 - carWidth / 2 - tileSize); // Reset ambulance X to left lane for next potential pass
    NpcCarYAnim.setValue(-30); // UPDATED: Reset NPC car Y position to the very edge of the screen (-30)

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      navigation.navigate('S8P1');
      setShowQuestion(false);
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
    ? "Correct! You must give way to emergency vehicles, even if it requires crossing solid white lines."
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
          source={playerCarSprites[carDirection][carFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: height * 0.1, // Responsive bottom positioning
            transform: [
              { translateX: carXAnim }
            ],
            zIndex: 5,
          }}
        />
      )}

      {/* UPDATED: Responsive NPC Car - Now positioned at the very top of the screen */}
      {isNpcCarVisible && (
        <Animated.Image
          source={npcCarSprites["NORTH"][carFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            top: NpcCarYAnim, // Position controlled by animation, now set to 0 (top of screen)
            left: NpcCarXAnim, // Position in the right lane
            zIndex: 4, // Always behind player car
          }}
        />
      )}

      {/* Responsive Ambulance */}
      {isAmbulanceVisible && (
        <Animated.Image
          source={ambulanceSprites["NORTH"][carFrame]} // Ambulance always faces NORTH
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            top: AmbulanceYAnim, // Position controlled by animation
            left: AmbulanceXAnim, // Position in the lane (left or right of player)
            zIndex: 4, // Always behind player car
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
  // Responsive styles for in-game elements
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
    top: height * 0.1,
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